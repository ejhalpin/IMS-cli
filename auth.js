var crypto = require("crypto");
require("dotenv").config();
var mysql = require("mysql");
var inquirer = require("inquirer");
var moment = require("moment");
var manager = require("./manager.js");
var supervisor = require("./supervisor");
var customer = require("./customer.js");

var uname = process.env.MYSQL_NAME;
var pword = process.env.MYSQL_PASS;

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: uname,
  password: pword,
  database: "pmsUsers_db"
});

connection.connect(function(err) {
  if (err) throw err;
});

var currentUser = "";

//getToken uses password based key derivation function 2 to generate a hex key from a user password. The salt, which is static for the
//software, is protected two-fold through storage in .env and, if deployed, would be in a restricted directory inaccessible by endpoint.
//The user, upon creating an account, will provide a passphrase which will be used to generate an auth token of 32 bytes. This token is
//stored in the user account table in the database. When a user logs back in, they must provied the identical passphrase used to create the token.
var getToken = function(salt, passphrase) {
  return new Promise(resolve => {
    crypto.pbkdf2(passphrase, salt, 100000, 32, "sha512", (err, derivedKey) => {
      if (err) throw err;
      resolve(derivedKey.toString("hex"));
    });
  });
};

//A function to return the name of all registerd users
//specifying a permission level (String) will return only users with that level
var getUsersByName = function(level) {
  return new Promise(resolve => {
    var queryString = "SELECT name FROM users";
    if (level) {
      queryString += " WHERE permissions = " + level;
    }
    connection.query(queryString, (err, data) => {
      if (err) throw err;
      var users = [];
      data.forEach(entry => {
        users.push(entry.name);
      });
      resolve(users);
    });
  });
};

//a private method for logging a user in
var login = function() {
  inquirer
    .prompt([
      {
        type: "input",
        message: "user name: >>",
        name: "username"
      },
      {
        type: "password",
        message: "password: >>",
        name: "password"
      }
    ])
    .then(res => {
      connection.query("SELECT * FROM users WHERE name = ?", res.username, (err, data) => {
        if (err) throw err;
        if (data.length === 0) {
          console.log("**\tinvalid user name\t**");
          welcome();
        } else {
          getToken(res.username, res.password).then(token => {
            if (token === data[0].token) {
              //the passwords match
              //update the user object
              connection.query(
                "UPDATE users SET ? WHERE ?",
                [{ lastlogin: moment().format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS), login: true }, { name: res.username }],
                function(err) {
                  if (err) throw err;
                  currentUser = res.username;
                  //call the next function according to permission level
                  console.log("user profile updated");
                  switch (parseInt(data[0].permissions)) {
                    case 0: //customer level permissions
                      customer.shop();
                      break;
                    case 1: //manager level permissions
                      manager.manage();
                      break;
                    case 2: //supervisor level permissions
                      supervisor.supervise();
                      break;
                  }
                }
              );
            } else {
              //the passwords don't match
              console.log("**\tinvalid password\t**");
              inquirer
                .prompt({
                  type: "list",
                  message: "",
                  choices: ["try again", "go back", "quit"],
                  name: "choice"
                })
                .then(res => {
                  switch (res.choice) {
                    case "try again":
                      login();
                      break;
                    case "go back":
                      welcome();
                      break;
                    case "quit":
                      logout();
                      break;
                  }
                })
                .catch(err => {
                  throw err;
                });
            }
          });
        }
      });
    })
    .catch(err => {
      throw err;
    });
};

//a private method for signing a user up
var signup = function() {
  //prompt for username and check that it is unique
  inquirer
    .prompt({
      type: "input",
      message: "enter a user name",
      name: "username"
    })
    .then(res => {
      var username = res.username;
      connection.query("SELECT * FROM users WHERE name = ?", username, (err, data) => {
        if (err) throw err;
        if (data.length === 0) {
          //the user name is not in use
          inquirer
            .prompt({
              type: "password",
              message: "enter a password",
              name: "password"
            })
            .then(res => {
              getToken(username, res.password).then(token => {
                var userObject = {
                  name: username,
                  token: token,
                  joindate: moment().format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS),
                  lastlogin: moment().format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS),
                  login: true,
                  permissions: 0
                };

                connection.query("INSERT INTO users SET ?", userObject, err => {
                  if (err) throw err;
                  currentUser = username;
                  shop();
                });
              });
            });
        } else {
          console.log("That user name is taken.");
          welcome();
        }
      });
    });
};

//a function for logging a user out. This function is called when the
//program is terminated by the user.
var logout = function() {
  connection.query("UPDATE users SET ? WHERE ?", [{ login: false }, { name: currentUser }], err => {
    if (err) throw err;
    connection.end();
    console.log("you have been looged out. Goodbye.");
    process.exit(0);
  });
};

function welcome() {
  inquirer
    .prompt({
      type: "list",
      message: "Welcome to the store. If you have an account, please log in. Otherwise, choose sign up to create an account.",
      choices: ["log in", "sign up", "quit"],
      name: "option"
    })
    .then(res => {
      switch (res.option) {
        case "log in":
          login();
          break;
        case "sign up":
          signup();
          break;
        case "quit":
          connection.end();
          process.exit(0);
      }
    });
}
module.exports = {
  welcome,
  logout,
  getUsersByName
};
