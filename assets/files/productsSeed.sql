create database pmsProducts_db;

use pmsProducts_db;

create table products
(
  id int not null
  auto_increment,
  name varchar
  (255) not null,
  department varchar
  (255),
  price double,
  stock int,
);

