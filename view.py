import sqlite3
con = sqlite3.connect('data.db')
cur = con.cursor()

for row in cur.execute('select time, value from decaminutes where userId = 1 order by time asc'):
  print(row)