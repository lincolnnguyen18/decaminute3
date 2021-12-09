var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');
var db2 = new sqlite3.Database('data2.db');

db.serialize(function() {
  // db2.run("drop table if exists users");
  // db2.run("drop table if exists decaminutes");
  // db2.run("create table if not exists decaminutes (time integer primary key not null, value integer not null, description text, userId integer not null, foreign key(userId) references users(id))");
  // db2.run("create table if not exists users (id integer primary key autoincrement not null, worked integer, postWorkedEnabled integer, total integer, timezoneOffset integer, username text, password text)");
  // db.all('select * from decaminutes', function(err, rows) {
  //   rows.forEach(function(row) {
  //     // console.log(row);
  //     db2.run("insert into decaminutes (time, value, userId, description) values (?, ?, ?, ?)", row.time, row.value, 1, null);
  //   });
  // });
  db.all('select * from users', function(err, rows) {
    rows.forEach(function(row) {
      // console.log(row);
      db2.run("insert into users (id, worked, postWorkedEnabled, total, timezoneOffset, username, password) values (?, ?, ?, ?, ?, ?, ?)", row.id, row.worked, row.postWorkedEnabled, row.total, row.timezoneOffset, 'lincolnnguyen', 'Ln2121809');
    });
  });
}, function() {
  db.close();
  db2.close();
});