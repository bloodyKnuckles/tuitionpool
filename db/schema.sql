create table requests (
  pool text,
  email text,
  date_time DATETIME DEFAULT CURRENT_TIMESTAMP
);

create table pools (
  pool text,
  date_time DATETIME DEFAULT CURRENT_TIMESTAMP
); 
