var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('data.db');
db.serialize(function() {
  // db.run("drop table if exists users");
  // db.run("drop table if exists decaminutes");
  db.run("create table if not exists decaminutes (time integer primary key not null, value integer not null, description text, userId integer not null, foreign key(userId) references users(id))");
  db.run("create table if not exists users (id integer primary key autoincrement not null, worked integer default 0, postWorkedEnabled integer default 0, total integer default 0, timezoneOffset integer default 0, username text unique not null, password text not null)");
});

const express = require('express');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.use("/public", express.static('public'));

const isLoggedIn = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    jwt.verify(token, 'Ln2121809', (err, decoded) => {
      if (!err) {
        db.get("select * from users where id = ?", decoded.id, function(err, row) {
          if (!err && row) {
            req.id = row.id;
            next();
          } else { res.redirect('/login'); }
        });
      } else { res.redirect('/login'); }
    });
  } else { res.redirect('/login'); }
};

const isNotLoggedIn = (req, res, next) => {
  const token = req.cookies.token;
  if (token) {
    jwt.verify(token, 'Ln2121809', (err, decoded) => {
      if (!err) {
        db.get("select * from users where id = ?", decoded.id, function(err, row) {
          if (!err && row) {
            req.id = row.id;
            res.redirect('/');
          } else { next(); }
        });
      } else { next(); }
    });
  } else { next(); }
};

setInterval(async function() {
  let epochTime = Math.floor(Date.now() / 1000)
  db.all("select id, timezoneOffset from users", function(err, rows) {
    rows.forEach(row => {
      let userId = row.id;
      let offsetEpochTime = epochTime - row.timezoneOffset * 60
      let offsetDate = new Date(offsetEpochTime * 1000)
      let seconds = offsetDate.getSeconds()
      let minutes = offsetDate.getMinutes()
      if (minutes % 10 === 0 && seconds === 0) {
        db.run(`update users set postWorkedEnabled = 1 where id = ${userId}`)
      } else if (minutes % 10 === 0 && seconds === 10) {
        db.run(`update users set postWorkedEnabled = 0 where id = ${userId}`)
        db.get(`select worked from users where id = ${userId}`, function(err, row) {
          db.serialize(() => {
            if (row.worked === 0) {
              db.run(`update users set total = total - 1 where id = ${userId}`)
            } else {
              db.run(`update users set worked = 0 where id = ${userId}`)
            }
            db.get(`select total from users where id = ${userId}`, function(err, row) {
              db.run("insert into decaminutes (time, value, userId) values (?, ?, ?)", epochTime, row.total, userId)
            })
          })
        })
      }
    })
  });
}, 1000)

const router = express.Router();

router.get('/decaminutes', isLoggedIn, function(req, res) {
  db.all("select * from decaminutes where userId = ? order by time asc", req.id, function(err, rows) {
    if (!rows) {
      res.send([]);
    } else {
      res.send(rows)
    }
  })
})
 
router.get('/stream', isLoggedIn, function (req, res) {
  db.run("update users set timezoneOffset = ? where id = ?", req.query.timezoneOffset, req.id);
  res.setHeader('Content-Type', 'text/event-stream')
  setInterval(function() {
    let epochTime = Math.floor(Date.now() / 1000)
    let date = new Date()
    let seconds = date.getSeconds()
    let minutes = date.getMinutes()
    if (minutes % 10 === 0 && seconds === 11) {
      // db.get("select total from users where id = ?", req.id, function(err, row) {
      //   res.write(`data: ${JSON.stringify({time: epochTime, value: row.total})}\n\n`)
      // });
      db.get("select * from decaminutes where userId = ? order by time desc limit 1", req.id, function(err, row) {
        res.write(`data: ${JSON.stringify(row)}\n\n`)
      });
    }
  }, 1000)
})

router.post('/worked', isLoggedIn, function (req, res) {
  db.get("select postWorkedEnabled from users where id = ?", req.id, function(err, row) {
    if (row.postWorkedEnabled === 1) {
      db.run("update users set worked = 1, total = total + 2, postWorkedEnabled = 0 where id = ?", req.id);
      res.send({ message: 'OK' })
    } else {
      res.send({ error: 'Not OK' })
    }
  })
});

router.get('/lastDecaminute', isLoggedIn, function (req, res) {
  db.get("select time, value from decaminutes where userId = ? order by time desc limit 1", req.id, function(err, row) {
    res.send(row)
  })
});

router.post('/addDescription', isLoggedIn, function (req, res) {
  let { time, description } = req.body;
  if (!time || !description) {
    res.send({ error: 'Not OK' })
  } else {
    db.run("update decaminutes set description = ? where time = ? and userId = ?", description, time, req.id, function(err) {
      if (err) {
        res.send({ error: 'Not OK' })
      } else {
        res.send({ message: 'OK' })
      }
    })
  }
});

router.post('/login', function (req, res) {
  let { username, password } = req.body
  db.get("select * from users where username = ?", username, function(err, row) {
    if (!err && row) {
      bcrypt.compare(password, row.password, function(err, result) {
        if (!err && result) {
          let token = jwt.sign({ id: row.id }, 'Ln2121809');
          res.cookie('token', token, { httpOnly: true, sameSite: 'strict', expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) });
          res.send({ message: 'OK' })
        } else {
          res.send({ error: 'Incorrect username or password.' })
        }
      })
    } else {
      res.send({ error: 'Incorrect username or password.' })
    }
  })
});

router.post('/register', function (req, res) {
  let { username, password } = req.body
  const salt = bcrypt.genSaltSync(10);
  const hash = bcrypt.hashSync(password, salt);
  db.run("insert into users (username, password) values (?, ?)", username, hash, function(err) {
    if (err) {
      res.status(500).send({ error: 'Username already exists' });
    } else {
      let token = jwt.sign({ id: this.lastID }, 'Ln2121809');
      res.cookie('token', token, { httpOnly: true, sameSite: 'strict', expires: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365) });
      res.send({ message: 'OK' })
    }
  });
});

router.get('/logout', function (req, res) {
  res.clearCookie('token');
  res.redirect('/login');
});

router.post('/deleteLast', isLoggedIn, function (req, res) {
  db.get("select * from decaminutes where userId = ? order by time desc limit 1", req.id, function(err, row) {
    if (row) {
      db.run("delete from decaminutes where time = ? and userId = ?", row.time, req.id, function(err) {
        if (err) {
          res.send({ error: 'Not OK' })
        } else {
          db.run("update users set total = (select value from decaminutes where userId = ? order by time desc limit 1)", req.id, function(err) {
            if (err) {
              res.send({ error: 'Not OK' })
            } else {
              res.send({ message: 'OK' })
            }
          });
        }
      })
    } else {
      res.send({ error: 'Not OK' })
    }
  })
});

router.post('/addGreen', isLoggedIn, function (req, res) {
  db.get("select * from decaminutes where userId = ? order by time desc limit 1", req.id, function(err, lastDecaminute) {
    if (lastDecaminute) {
      db.run("insert into decaminutes (time, value, userId) VALUES (?, ?, ?)", lastDecaminute.time + 600, lastDecaminute.value + 2, req.id, function(err) {
        if (err) {
          res.send({ error: 'Not OK' })
        } else {
          db.run("update users set total = ? where id = ?", lastDecaminute.value + 2, req.id, function(err) {
            if (err) {
              res.send({ error: 'Not OK' })
            } else {
              res.send({ message: 'OK', value: lastDecaminute.value + 2, time: lastDecaminute.time + 600 })
            }
          });
        }
      });
    } else {
      res.send({ error: 'Not OK' })
    }
  });
});

router.post('/addRed', isLoggedIn, function (req, res) {
  db.get("select * from decaminutes where userId = ? order by time desc limit 1", req.id, function(err, lastDecaminute) {
    if (lastDecaminute) {
      db.run("insert into decaminutes (time, value, userId) VALUES (?, ?, ?)", lastDecaminute.time + 600, lastDecaminute.value - 1, req.id, function(err) {
        if (err) {
          res.send({ error: 'Not OK' })
        } else {
          db.run("update users set total = ? where id = ?", lastDecaminute.value - 1, req.id, function(err) {
            if (err) {
              res.send({ error: 'Not OK' })
            } else {
              res.send({ message: 'OK', value: lastDecaminute.value - 1, time: lastDecaminute.time + 600 })
            }
          });
        }
      });
    } else {
      res.send({ error: 'Not OK' })
    }
  });
});

app.use('/api', router);

app.get('/login', isNotLoggedIn, function (req, res) {
  res.sendFile(__dirname + '/html/login.html')
});

app.get('/register', isNotLoggedIn, function (req, res) {
  res.sendFile(__dirname + '/html/register.html')
});

app.get("/", isLoggedIn, (req, res, next) => {
  res.sendFile(__dirname + '/html/index.html');
});

app.get("*", (req, res, next) => {
  res.sendFile(__dirname + '/html/notFound.html');
});

// const port = process.env.decaminute_port;
const port = 7003;
app.listen(port, () => console.log(`Listening on port ${port}`));