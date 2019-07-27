var auth = require("./auth.js");
var inquirer = require("inquirer");
var moment = require("moment");

auth.connection.connect(function(err) {
  if (err) throw err;
});
//the welcome function prompts the user to log in or sign up
function welcome() {
  inquirer
    .prompt({
      type: "list",
      message: "Welcome to the store. If you have an account, please log in. Otherwise, choose sign up to create an account.",
      choices: ["log in", "sign up", "quit"],
      name: "option"
    })
    .then(res => {
      console.log(res.option + " time?");
      switch (res.option) {
        case "log in":
          login();
          break;
        case "sign up":
          signup();
          break;
        case "quit":
          auth.connection.end();
          process.exit(0);
      }
    });
}

function login() {
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
      auth.connection.query("SELECT * FROM users WHERE name = ?", res.username, (err, data) => {
        if (err) throw err;
        if (data.length === 0) {
          console.log("**\tinvalid user name\t**");
          welcome();
        } else {
          auth.getToken(res.username, res.password).then(token => {
            if (token === data[0].token) {
              //the passwords match
              //update the user object
              auth.connection.query(
                "UPDATE users SET ? WHERE ?",
                [{ lastlogin: moment().format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS), login: true, message: "login successful" }, { name: res.username }],
                function(err) {
                  if (err) throw err;
                  console.log("user profile updated");

                  //call the next function according to permission level
                }
              );
              switch (parseInt(data[0].permissions)) {
                case 0: //customer level permissions
                  shop();
                  break;
                case 1: //manager level permissions
                  manage();
                  break;
                case 2: //supervisor level permissions
                  supervise();
                  break;
              }
            } else {
              //the passwords don't match
              console.log("**\tinvalid password\t**");
              inquirer
                .prompt({
                  type: "select",
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
                      auth.connection.end();
                      process.exit(0);
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
}
function signup() {
  //prompt for username and check that it is unique
  inquirer
    .prompt({
      type: "input",
      message: "enter a user name",
      name: "username"
    })
    .then(res => {
      var username = res.username;
      auth.connection.query("SELECT * FROM users WHERE name = ?", username, (err, data) => {
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
              auth.getToken(username, res.password).then(token => {
                var userObject = {
                  name: username,
                  token: token,
                  joindate: moment().format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS),
                  lastlogin: moment().format(moment.HTML5_FMT.DATETIME_LOCAL_SECONDS),
                  login: true,
                  message: "thank you for signing up",
                  permissions: 0
                };

                auth.connection.query("INSERT INTO users SET ?", userObject, err => {
                  if (err) throw err;

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
}

function shop() {
  //customer level actions
  console.log("shopping...");
  auth.connection.end();
}
function manage() {
  //manager level actions
  console.log("managing...");
  auth.connection.end();
}
function supervise() {
  //supervisor level actions
  console.log("supervising...");
  auth.connection.end();
}

welcome();
