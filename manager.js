const mysql = require("mysql");
require("dotenv").config();
const auth = require("./auth.js");
const inquirer = require("inquirer");
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: process.env.MYSQL_NAME,
  password: process.env.MYSQL_PASS,
  database: "pmsProducts_db"
});

connection.connect(err => {
  if (err) throw err;
});

var viewInventory = function(low = false) {
  return new Promise(resolve => {
    var queryString = "SELECT * FROM products";
    if (low) {
      queryString += " WHERE stock <= 10";
    }
    connection.query(queryString, (err, data) => {
      if (err) throw err;
      console.log("-------------------------PRODUCTS-------------------------");
      data.forEach(entry => {
        var itemString = `ID: ${entry.id}, NAME: ${entry.name}, DEPARTMENT: ${entry.department}, PRICE: ${entry.price}, QUANTITY: ${entry.stock}`;
        console.log(itemString);
        console.log("----------------------------------------------------------");
      });
      resolve();
    });
  });
};

var addInventory = function(id, quantity) {
  return new Promise(resolve => {
    connection.query("SELECT stock FROM products WHERE ?", { id: id }, (err, data) => {
      if (err) throw err;
      var currentLevel = parseInt(data[0].stock);
      var newLevel = currentLevel + quantity;
      connection.query("UPDATE products SET ? WHERE ?", [{ stock: newLevel }, { id: id }], err => {
        if (err) throw err;
        console.log("inventory updated successfully.");
        resolve();
      });
    });
  });
};

var addProduct = function(productObject) {
  return new Promise(resolve => {
    connection.query("INSERT INTO products SET ?", productObject, err => {
      if (err) throw err;
      console.log("product added successfully.");
      resolve();
    });
  });
};

var getDepartments = function() {
  return new Promise(resolve => {
    connection.query("SELECT * FROM departments", (err, data) => {
      if (err) throw err;
      var results = [];
      data.forEach(entry => {
        results.push(entry.name);
      });
      resolve(results);
    });
  });
};

function manage() {
  //manager level actions
  inquirer
    .prompt({
      type: "list",
      message: "What would you like to do?",
      choices: ["View All Inventory", "View Low Inventory", "Increase Inventory For Existing Product", "Add New Product", "Quit"],
      name: "choice"
    })
    .then(res => {
      switch (res.choice) {
        case "View All Inventory":
          viewInventory(false).then(manage);
          break;
        case "View Low Inventory":
          viewInventory(true).then(manage);
          break;
        case "Increase Inventory For Existing Product":
          inquirer
            .prompt([
              {
                type: "input",
                message: "Enter the product id >>",
                name: "id"
              },
              {
                type: "input",
                message: "Enter the amount to add to inventory >> ",
                name: "quantity"
              }
            ])
            .then(res => {
              addInventory(res.id, res.quantity).then(manage);
            });
          break;
        case "Add New Product":
          getDepartments().then(res => {
            inquirer
              .prompt([
                {
                  type: "input",
                  message: "product name >> ",
                  name: "name"
                },
                {
                  type: "list",
                  message: "select the department",
                  name: "department",
                  choices: res
                },
                {
                  type: "input",
                  message: "product price >> ",
                  name: "price"
                },
                {
                  type: "input",
                  message: "product quantity >> ",
                  name: "stock"
                }
              ])
              .then(answers => {
                addProduct(answers).then(manage);
              })
              .catch(err => {
                throw err;
              });
          });
          break;
        case "Quit":
          auth.logout();
          break;
      }
    });
}
module.exports = {
  manage
};
