create table if not exists decaminutes (time integer primary key not null, value integer not null)

insert into decaminutes (time, value) VALUES ((select max(time) from decaminutes)+600, (select max(value) from decaminutes)+2);
delete from decaminutes order by time desc limit 1;

-- insert new decaminute with time = max(time) + 600 and value = value of row with max(time) + 2
insert into decaminutes (time, value) VALUES ((select max(time) from decaminutes)+600, (select value from decaminutes order by time desc limit 1) + 2);

insert into decaminutes (time, value) VALUES ((select max(time) from decaminutes)+600, (select value from decaminutes order by time desc limit 1) - 1);

select * from decaminutes;