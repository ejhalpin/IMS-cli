const mysql = require("mysql");
require("dotenv").config();

const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: process.env.MYSQL_NAME,
  password: process.env.MYSQL_PASS,
  database: "pmsUsers_db"
});

connection.connect(err => {
  if (err) throw err;
});

var getItems = function(searchObject, orderBy = "") {
  return new Promise(resolve => {
    //search object will contain a single key-value pair for use in a WHERE clause
    //if search object is empty (no keys), return all items in the database
    var querystring = "SELECT * FROM products";
    if (Object.keys(searchObject).length > 0) {
      querystring += " WHERE ?";
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
    connection.query("SELECT stock FROM products WHERE id = ?", item, (err, data) => {
      if (err) throw err;
      var remain = parseInt(data.stock) - quanitity;
      if (remain < 0) {
        //there is not sufficient stock to fulfill the order.
        resolve([false, "insufficient quantity"]);
      } else {
        connection.query("UPDATE products SET ? where ?", { stock: remain }, { id: item }, err => {
          if (err) throw err;
          resolve([true, "transaction completed successfully"]);
        });
      }
    });
  });
};

module.exports = {
  connection,
  getItems,
  purchase
};
