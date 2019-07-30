const mysql = require("mysql");
require("dotenv").config();
const inquirer = require("inquirer");
const cTable = require("console.table");
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: process.env.MYSQL_NAME,
  password: process.env.MYSQL_PASS,
  database: "imsProducts_db"
});

connection.connect(err => {
  if (err) throw err;
});

var getItems = function(searchObject, orderBy = "") {
  return new Promise(resolve => {
    //search object will contain a single key-value pair for use in a WHERE clause
    //if search object is empty (no keys), return all items in the database
    var querystring = "SELECT * FROM products ";
    if (Object.keys(searchObject).length > 0) {
      querystring += "WHERE ? ";
    }

    if (orderBy.length > 0) {
      querystring += "ORDER BY " + orderBy;
    } else {
      querystring += "ORDER BY products.id";
    }
    connection.query(querystring, searchObject, (err, data) => {
      if (err) throw err;
      //construct an array of objects to pre-format the data
      var results = [];
      data.forEach(entry => {
        results.push({
          id: entry.id,
          name: entry.name,
          department: entry.department,
          price: entry.price,
          stock: entry.stock
        });
      });
      resolve(results);
    });
  });
};

var purchase = function(item, quanitity) {
  return new Promise(resolve => {
    //determine the quantity of the product and compare it to the order
    connection.query("SELECT stock, product_sales, price FROM products WHERE id = ?", item, (err, data) => {
      if (err) throw err;
      var remain = parseInt(data[0].stock) - quanitity;
      var sale = parseFloat(data[0].product_sales) + parseFloat(data[0].price) * quanitity;
      if (remain < 0) {
        //there is not sufficient stock to fulfill the order.
        resolve([false, "insufficient quantity"]);
      } else {
        connection.query("UPDATE products SET ? WHERE ?", [{ stock: remain, product_sales: sale }, { id: item }], err => {
          if (err) throw err;
          resolve([true, "transaction completed successfully"]);
        });
      }
    });
  });
};

function shop() {
  //customer level actions
  //print the product list
  var rows = [["Product ID", "Product Name", "Product Price"]];
  getItems({}, "").then(data => {
    console.log("-------------------------PRODUCTS-------------------------");
    data.forEach(entry => {
      var arry = [entry.id, entry.name, "$" + entry.price];
      rows.push(arry);
    });
    console.log("Product Catalog");
    console.log("---------------");
    console.table(rows[0], rows.slice(1));
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
            connection.end();
            process.exit(0);
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
      purchase(res.id, res.quantity)
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

module.exports = {
  shop
};
