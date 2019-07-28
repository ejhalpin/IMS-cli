var auth = require("./auth.js");
var inquirer = require("inquirer");
var moment = require("moment");
var customer = require("./customer.js");

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
                  auth.currentUser = res.username;
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
                  auth.currentUser = username;
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

function logout() {
  auth.connection.query("UPDATE users SET ? WHERE ?", [{ login: false }, { name: auth.currentUser }], err => {
    if (err) throw err;
    console.log("you have been looged out. Goodbye.");
    auth.connection.end();
    customer.connection.end();
  });
}

function shop() {
  //customer level actions
  //print the product list
  customer.getItems({}, "").then(data => {
    console.log("-------------------------PRODUCTS-------------------------");
    data.forEach(entry => {
      var itemString = `ID: ${entry.id}, NAME: ${entry.name}, DEPARTMENT: ${entry.department}, PRICE: ${entry.price}, QUANTITY: ${entry.stock}`;
      console.log(itemString);
      console.log("----------------------------------------------------------");
    });
    inquirer
      .prompt({
        type: "list",
        message: "Welcome to the store. What would you like to do?",
        choices: ["make a purchase", "quit"],
        name: "choice"
      })
      .then(res => {
        switch (res.choice) {
          case "make a purchase":
            buy();
            break;
          case "quit":
            console.log("Thanks for shopping with us.");
            logout();
        }
      });
  });
}

function buy() {
  inquirer
    .prompt([
      {
        type: "input",
        message: "Enter the product id number",
        name: "id"
        //add some validation
      },
      {
        type: "input",
        message: "Enter the quantity",
        name: "quantity"
        //add some validation
      }
    ])
    .then(res => {
      customer
        .purchase(res.id, res.quantity)
        .then(res => {
          console.log(res[1]);
          shop();
        })
        .catch(err => {
          throw err;
        });
    })
    .catch(err => {
      throw err;
    });
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

shop();
//welcome();
