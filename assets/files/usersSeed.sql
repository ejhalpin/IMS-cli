drop database if exists imsUsers_db;
create database imsUsers_db;

use imsUsers_db;

create table users
(
  name varchar(50) not null,
  token varchar(255) not null,
  joindate varchar (50),
  lastlogin varchar (50),
  login boolean not null,
  message varchar(255),
  permissions integer(11) not null
);

