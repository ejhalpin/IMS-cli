//import npm packages
const mysql = require("mysql");
require("dotenv").config();
const cTable = require("console.table");
const inquirer = require("inquirer");
//establish a connection to the products database
const connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: process.env.MYSQL_NAME,
  password: process.env.MYSQL_PASS,
  database: "imsProducts_db"
});
//establish a connection to the users database
const authConnect = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: process.env.MYSQL_NAME,
  password: process.env.MYSQL_PASS,
  database: "imsUsers_db"
});
//connect to each database
connection.connect(err => {
  if (err) throw err;
});
authConnect.connect(err => {
  if (err) throw err;
});

//a function to return user names in an array
var getUsersByName = function(level) {
  return new Promise(resolve => {
    var queryString = "SELECT name FROM users";
    if (level) {
      queryString += " WHERE permissions = " + level;
    }
    authConnect.query(queryString, (err, data) => {
      if (err) throw err;
      var users = [];
      data.forEach(entry => {
        users.push(entry.name);
      });
      resolve(users);
    });
  });
};

var viewSales = function() {
  //get a list of department names
  connection.query("SELECT * FROM departments", (err, data) => {
    if (err) throw err;
    //get the product sales and depatment values for every product
    connection.query("SELECT product_sales, department FROM products", (err, salesData) => {
      if (err) throw err;
      var rows = [];
      rows.push(["department_id", "department_name", "overhead", "product_sales", "total_profit"]);
      //loop through the data
      for (var i = 0; i < data.length; i++) {
        var department = data[i].name;
        var total = 0;
        var temp = [];

        while (salesData.length > 0) {
          var object = salesData.shift();
          if (object.department === department) {
            var psales = parseFloat(object.product_sales);
            total = total + psales;
          } else {
            temp.push(object);
          }
        }
        while (temp.length > 0) {
          salesData.push(temp.shift());
        }
        var idString = "";
        var id = parseInt(data[i].id);
        if (id < 10) {
          idString = "0" + id;
        } else idString = id.toString();
        rows.push([idString, department, data[i].overhead, total.toFixed(2), (total - parseFloat(data[i].overhead)).toFixed(2)]);
      }

      console.log("\nDepartment Sales");
      console.log("----------------");
      console.table(rows[0], rows.slice(1));
      console.log("\n");
      supervise();
    });
  });
};

var createDepartment = function() {
  inquirer
    .prompt([
      {
        type: "input",
        message: "department name >>",
        name: "name"
      },
      {
        type: "input",
        message: "department overhead",
        name: "overhead"
      }
    ])
    .then(answers => {
      var departmentObject = {
        name: answers.name,
        overhead: answers.overhead
      };
      connection.query("INSERT INTO departments SET ?", departmentObject, err => {
        if (err) throw err;
        console.log("new department added");
        supervise();
      });
    });
};

var setUserPermissions = async function() {
  var users = await getUsersByName();
  inquirer
    .prompt([
      {
        type: "list",
        choices: users,
        message: "select a user",
        name: "user"
      },
      {
        type: "input",
        message: "set new permission level >>",
        name: "permission"
      }
    ])
    .then(res => {
      authConnect.query("UPDATE users SET ? WHERE ?", [{ permissions: res.permission }, { name: res.user }], err => {
        if (err) throw err;
        console.log("user permissions updated successfully.");
        supervise();
      });
    });
};

var supervise = function() {
  inquirer
    .prompt({
      type: "list",
      message: "what would you like to do?",
      choices: ["View Sales Data", "Create a New Department", "Set User Permissions", "Quit"],
      name: "choice"
    })
    .then(answer => {
      switch (answer.choice) {
        case "View Sales Data":
          viewSales();
          break;
        case "Create a New Department":
          createDepartment();
          break;
        case "Set User Permissions":
          setUserPermissions();
          break;
        case "Quit":
          connection.end();
          authConnect.end();
          process.exit(0);
          break;
      }
    })
    .catch(err => {
      if (err) throw err;
    });
};

module.exports = {
  supervise
};
