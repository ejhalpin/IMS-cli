# IMS-cli

A three-facing product management system for buyers, managers, and supervisors packed into a powerful node cli

## ABOUT

**IMS**, or Inventory Management System, is a node command line tool for managing inventory in a retail setting. The CLI utilizes the _node crypto_ module for user authentication. For more, see the **authentiation** secion below. The CLI is backed by mySQL databases which are accesed using the _mysql_ package. The user flow is managed through the _inquirer_ package and the _moment_ and _console.table_ packages are used for formatting date/time strings and table data, respectively.

## The Code

**IMS** is broken into four javascript packages and two SQL databases. Check out [this diagram](./assets/images/IMS-cli-dependencies.png) for an outline of the file dependencies and SQL connections.

### auth.js

The _auth.js_ file containes a collection of methods which manipulate data in the _imsUsers_db_ database. This file is the gateway to the CLI and handles user logins and account creation and also directs the user to the appropriate code depending on their permissions. For a detailed map of how _auth.js_ handles the user login/signup process, you can check out [this diagram](./assets/images/ims-welcome.png).

### customer.js

The _customer.js_ file contains a collection of methods which manipulate data in the _imsProducts_db_ database. Base level users, or "customers", have a permission level of `0`. Upon logging in, the "customer" is provided with a list of all available products, shown [here](./assets/images/product-catalog.png). (_it should be stated that this is not a useful or effective way to present the product catalog, but given that the database only contains mock data and a very short list of products, it works. If the database were ever scaled, a new product display method would be needed - in addition to search and filter functionality_) They then have the option to by a product by entering in the id and quantity. Enterting a quantity that is greater than the stock quanitity will result in a failed transaction. Otherwise the producty quantity is decreased and the sale is logged in the database.

### manager.js

The _manager.js_ file contains a collection of methods which manipulate data in the _imsProducts_db_ database. "Managers" have a permission level of `1`. Upon logging in, the "manager" is provided with a list of actions they can perform:

1. **view all inventory**

   - this option will query the _imsProducts_db_ and return all entries in the `producs` table. The data is then formatted using the _console.table_ package and printed to the console. [here is a screenshot](./assets/images/manager-product-catalog.png)

2. **view low inventory**

   - this option will query the _imsProducts_db_ and return all entries in the `producs` table with a quantity less than 11. The data is then formatted using the _console.table_ package and printed to the console. [here is a screenshot](./assets/images/manager-product-catalog-low.png)

3. **increase inventory for exisiting products**

   - this option will prompt the "manager" for the product id and quanitity to add. The new quanity is added to the exisiting stock in the `products` table.

4. **add new product**

   - this option will prompt the "manager" for the product name, depatment, price, and quanitity and append it to the `products` table.

5. **Quit**

   - this option logs the "manager" out and exits the cli.

### supervisor.js

The _supervisor.js_ file contains a collection of methods which manipulate data in the _imsProducts_db_ database and the _imsUsers_db_ database. "supervisors" have a permission level of `2`. Upon logging in, the "supervisor" is provided with a list of actions they can perform:

1. **View Sales Data**

   - this option will query the `products` table and gather data on product sales by department. The `department` table is queried to get the overhead of each depatemnt. A **Total Profit** value is generated on the fly for each department. A summary table including sales and overhead data for each department is formatted using the _console.table_ package and printed to the console. [here is a screenshot](./assets/images/supervisor-total-sales.png)

2. **Create a New Department**

   - this option allows the "supervisor" to add a depatment to the `departments` table and populate the name and overhead costs of the depatment. Once this action is completed, managers can add products to the new department.

3. **Set User Permissions**

   - this option was born out of my own laziness. Rather than updating the permissions of a user through an SQL script, I gave "supervisors" the ability to update the permissions of a user. When this option is selected, the "supervisor" is presented with a selectable list of user names from the `users` table of the _imsUsers_db_ database. Once a user is selected, the "supervisor" can increase or decrease a user permission level. Setting the level to higher than 2 or less than 0 will result in the user being disabled.

4. **Quit**
   - this option logs the "supervisor" out and exits the cli.

## Authentication

The _IMS-cli_ uses a token-based authentication. When a user signs up for an account, they are asked for a user name and password. Both values are passed to a function which generates a hex token by leveraging the password based key derrivation function encryption algorithm that is packaged within the _node crypto_ module. Specifically, `pbkdf2` is utilized with a key length equivalent to `sha512`, an iteration count of 100000, a `salt` which is the user name, and the password that the user provided. The resulting string is then formatted to hex and stored in the token column of the user table.

Because the token can never be predictably decripted, and for an additional layer of security, the user must log in with the (case sensative) user name that they initially provided along with the correct password. If either are incorrect, `pbkdf2` will return a hex token that will not match the user token stored in the database, causing the login to fail. Using this token-based authentication system also ensures that senstivie user data is never stored by the software.
