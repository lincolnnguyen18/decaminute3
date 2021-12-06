let workedButton = document.querySelector('#workedButton');
let enableAudioButton = document.querySelector('#enableAudioButton');
let beep = new Audio('beep.mp3');
let submitted = false;
let decaminutes = [];
let timeChart =  window.LightweightCharts.createChart(document.querySelector('#timeChart'), {
  width: 800,
  height: 400,
  timeScale: {
    timeVisible: true,
    secondsVisible: false
  }
});
let timeChartSeries = timeChart.addLineSeries();

fetch('/decaminutes', {
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}).then(response => response.json()).then(data => {
  data = data.map(d => {
    let timezoneOffset = new Date().getTimezoneOffset()
    let offsetEpochTime = d.time - timezoneOffset * 60
    return {
      time: offsetEpochTime,
      value: d.value
    }
  })
  decaminutes = data;
  console.log(decaminutes);
  timeChartSeries.setData(decaminutes);
});

workedButton.addEventListener('click', function() {
  workedButton.disabled = true;
  submitted = true;
  fetch('/worked', {
    method: 'POST'
  }).then(response => {
    return response.text();
  }).then(data => {
    console.log(data);
  });
});

enableAudioButton.addEventListener('click', function() {
  enableAudioButton.style.display = 'none';
});

if (Notification.permission !== "granted") { Notification.requestPermission(); }

setInterval(() => {
  let date = new Date();
  let hours = date.getHours();
  let minutes = date.getMinutes();
  let seconds = date.getSeconds();
  console.log(`${hours}:${minutes}:${seconds}`);
  if (minutes % 10 === 0 && seconds <= 10 && !submitted) {
    if (seconds === 0) {
      console.log('notify');
      const notification = new Notification("Decaminute", {
        body: "Are you working?"
      });
      notification.onclick = () => {
        window.focus();
        notification.close();
      }
      notification.onshow = () => {
        beep.play();
      }
    }
    workedButton.disabled = false;
  } else {
    submitted = false;
    workedButton.disabled = true;
  }
}, 1000);

let sse = new EventSource('http://localhost:3000/stream?timezoneOffset=' + new Date().getTimezoneOffset());
sse.onmessage = async function(e) {
  let json = JSON.parse(e.data);
  console.log(json)
  json.time = json.time - new Date().getTimezoneOffset() * 60;
  decaminutes.push(json);
  timeChartSeries.setData(decaminutes);
}