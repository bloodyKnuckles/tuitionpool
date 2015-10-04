create table users (
  id integer primary key autoincrement,
  name text,
  email text,
  salt text, -- unique for each user to protect against rainbow tables
  hash text -- hash of (salt + password)
);

create table committees (
  id integer primary key,
  region text
);

create table supervision (
  id integer primary key,
  user integer,
  supervisor integer
);

create table committeeMember (
  id integer primary key,
  user integer,
  committee integer
);

create table plans (
  id integer primary key autoincrement,
  user integer,
  description text
);

create table implementation (
  id integer primary key autoincrement,
  plan integer,
  description text
);

create table evidence (
  id integer primary key autoincrement,
  implementation integer,
  type text,
  data text
);

create table approvals (
  id integer primary key autoincrement,
  
  plan integer
);

create table comments (
  id integer primary key autoincrement,
  plan integer,
  comment text
);

create table updates (
  id integer primary key autoincrement,
  tableId integer,
  table text,
  time date 
);

create table notifications (
  id integer primary key autoincrement,
  user integer,
  read boolean,
  time date
);
