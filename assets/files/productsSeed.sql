drop database if exists imsProducts_db;
create database imsProducts_db;

use imsProducts_db;

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
  product_sales double,
  sale BOOLEAN default FALSE,
  primary key
  (id)
);



  create table departments
  (
    name varchar(255) not null,
    id int not null
    auto_increment,
    overhead double,
    primary key
    (id)
);

    insert into departments
      (name,overhead)
    values
      ("Electronics", 12142.22),
      ("Appliances", 10234.41),
      ("Personal Protective Equipment", 8672.81);
