var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database(':memory:');

const express = require('express');
const app = express()
app.use(express.json());

let worked = false
let timeOffset = 0

db.serialize(function() {
  db.run("create table test (id integer primary key autoincrement not null, epochTime integer, formattedEpochTime text, value integer)");
});
 
app.get('/stream', function (req, res) {
  res.setHeader('Content-Type', 'text/event-stream')
  setInterval(function() {
    db.all("select id, epochTime as time, value from test", function(err, rows) {
      if (err) {
        console.log(err)
        res.end()
      } else {
        res.write('data: ' + JSON.stringify(rows) + '\n\n')
      }
    }
  )}, 1000)
})

app.post('/worked', function (req, res) {
  worked = true
  res.send('ok')
});

app.post('/timezone-offset', function (req, res) {
  setInterval(() => {
    let epochDate = new Date()
    let epochTime = Math.floor(Date.now() / 1000)
    let formattedEpochTime = new Date(epochTime * 1000).toISOString().replace(/T/, ' ').replace(/\..+/, '')
    console.log('old: ', epochDate, epochTime, formattedEpochTime)
    // let offsetEpochTime = epochTime + (new Date().getTimezoneOffset() * 60)
    let offsetEpochTime = epochTime - req.body.timezoneOffset * 60
    let formattedOffsetEpochTime = new Date(offsetEpochTime * 1000).toISOString().replace(/T/, ' ').replace(/\..+/, '')
    console.log('new: ', offsetEpochTime, formattedOffsetEpochTime, '\n')
  
  //   if (epochDate.getSeconds() % 7 === 0) {
  //     console.log(epochDate, epochTime, formattedEpochTime)
  //     worked = false;
  //     setTimeout(() => {
  //       console.log(`worked: ${worked}`)
  //       if (!worked) {
  //         db.get("select * from test order by id desc limit 1", [], (err, row) => {
  //           if (row) {
  //             db.run("update test set value = ? where id = ?", [row.value - 1, row.id])
  //           } else {
  //             db.run("insert into test (epochTime, formattedEpochTime, value) values (?, ?, ?)", [epochTime, formattedEpochTime, -1]);
  //           }
  //         });
  //       } else {
  //         db.get("select * from test order by id desc limit 1", [], (err, row) => {
  //           let newValue = 2
  //           if (row) {
  //             newValue = row.value + 2
  //           }
  //           db.run("insert into test (epochTime, formattedEpochTime, value) values (?, ?, ?)", [epochTime, formattedEpochTime, newValue]);
  //         });
  //       }
  //     }, 3000);
  //   }
  }, 1000);
  res.send('ok')
});
  
app.listen(3000)