import fetch from 'node-fetch';

// (async () => {
//   // let test = await fetch('http://localhost:3000/', {
//   //   method: 'GET',
//   //   headers: {
//   //     'Content-Type': 'application/json',
//   //   },
//   // }).then(res => res.json());
//   // test.forEach(item => {
//   //   console.log(item);
//   //   let offsetEpochTime = item.time + (-5 * 60 * 60)
//   //   let formattedOffsetEpochTime = new Date(offsetEpochTime * 1000).toISOString().replace(/T/, ' ').replace(/\..+/, '')
//   //   console.log(offsetEpochTime, formattedOffsetEpochTime, '\n')
//   // });
//   fetch('http://localhost:3000/', { method: 'POST' });
// })();

// fetch('http://localhost:3000/timezone-offset', {
//   method: 'POST',
//   headers: { 'Content-Type': 'application/json' },
//   body: JSON.stringify({timezoneOffset: 300}),
// }).then(res => res.text()).then(console.log);

fetch('http://localhost:3000/worked', {
  method: 'POST'
}).then(res => res.text()).then(console.log);