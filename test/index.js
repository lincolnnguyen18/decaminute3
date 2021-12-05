import fetch from 'node-fetch';
import EventSource from 'eventsource';

(async () => {
  setInterval(() => {
    let date = new Date(new Date().getTime() - (300 * 60 * 1000)); 
    console.log(`${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`);
  }, 1000);
  let sse = new EventSource('http://localhost:3000/stream?timezoneOffset=300');
  sse.onmessage = function(e) {
    // get type of e.data
    let json = JSON.parse(e.data);
    console.log(json)
  }
})();