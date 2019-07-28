var crypto = require("crypto");
require("dotenv").config();
var mysql = require("mysql");
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

var uname = process.env.MYSQL_NAME;
var pword = process.env.MYSQL_PASS;

var connection = mysql.createConnection({
  host: "localhost",
  port: 3306,
  user: uname,
  password: pword,
  database: "pmsUsers_db"
});

module.exports = {
  getToken,
  connection,
  currentUser
};
