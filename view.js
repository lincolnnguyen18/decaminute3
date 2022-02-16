var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');

db.serialize(function() {
  db.each("select time, value from decaminutes where userId = 1 order by time asc", function(err, row) {
    if (err) {
      console.log(err);
    } else {
      console.log(row.time + ' ' + row.value);
    }
  });
});