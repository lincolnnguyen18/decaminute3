var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');
db.serialize(function() {
  // db.run("drop table if exists users");
  // db.run("drop table if exists decaminutes");
  db.run("create table if not exists decaminutes (time integer primary key not null, value integer not null)");
  db.run("create table if not exists users (id integer primary key autoincrement not null, worked integer, postWorkedEnabled integer, total integer, timezoneOffset integer)");
  db.run("insert or ignore into users (id, worked, postWorkedEnabled, total, timezoneOffset) values (1, 0, 0, 0, 0)");
});

const express = require('express');
const app = express()
app.use(express.json());
app.use(express.static('public'));

setInterval(function() {
  let epochTime = Math.floor(Date.now() / 1000)
  db.get("select timezoneOffset from users where id = 1", function(err, row) {
    let offsetEpochTime = epochTime - row.timezoneOffset * 60
    let offsetDate = new Date(offsetEpochTime * 1000)
    let seconds = offsetDate.getSeconds();
    if (seconds % 10 === 1) {
      db.run("update users set postWorkedEnabled = 1 where id = 1")
    } else if (seconds % 10 === 7) {
      db.run("update users set postWorkedEnabled = 0 where id = 1")
      db.get("select worked from users where id = 1", function(err, row) {
        db.serialize(() => {
          if (row.worked === 0) {
            db.run("update users set total = total - 1 where id = 1")
          } else {
            db.run("update users set worked = 0 where id = 1")
          }
          db.get("select total from users where id = 1", function(err, row) {
            db.run("insert into decaminutes (time, value) values (?, ?)", epochTime, row.total)
          })
        })
      })
    }
  });
}, 1000)

app.get('/decaminutes', function(req, res) {
  db.all("select * from decaminutes order by time asc", function(err, rows) {
    res.send(rows)
  })
})
 
app.get('/stream', function (req, res) {
  db.run("update users set timezoneOffset = ? where id = 1", req.query.timezoneOffset)
  res.setHeader('Content-Type', 'text/event-stream')
  setInterval(function() {
    let epochTime = Math.floor(Date.now() / 1000)
    db.get("select total from users where id = 1", function(err, row) {
      res.write(`data: ${JSON.stringify({time: epochTime, value: row.total})}\n\n`)
    });
  }, 1000)
})

app.post('/worked', function (req, res) {
  db.get("select postWorkedEnabled from users where id = 1", function(err, row) {
    if (row.postWorkedEnabled === 1) {
      db.run("update users set worked = 1, total = total + 2, postWorkedEnabled = 0 where id = 1")
      return res.send('ok')
    } else {
      return res.send('not ok')
    }
  })
});

app.listen(3000)