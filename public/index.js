let date = new Date();
let minutes = date.getMinutes();
let seconds = date.getSeconds();

if (typeof(w) == "undefined") {
  w = new Worker("worker.js");
}
w.onmessage = async function(e) {
  let date2 = e.data;
  let minutes2 = date2.getMinutes();
  let seconds2 = date2.getSeconds();
  if (minutes2 != minutes || seconds2 != seconds) {
    console.log(`${minutes}:${seconds}`);
    if (minutes % 10 === 0 && seconds === 0) {
      notify();
    } else if (minutes % 10 === 0 && seconds <= 10 && !submitted) {
      workedButton.disabled = false;
    } else {
      workedButton.disabled = true;
    }
    minutes = minutes2;
    seconds = seconds2;
  }
}

let workedButton = document.querySelector('#workedButton');
let enableAudioButton = document.querySelector('#enableAudioButton');
let beep = new Audio('beep.mp3');
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
  timeChartSeries.setData(decaminutes);
});

let submitted = false;

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

const notify = async () => {
  beep.play();
  const notification = new Notification("Decaminute", {
    body: "Did you work for the past 10 minutes?"
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
  }
}

let sse = new EventSource('/stream?timezoneOffset=' + new Date().getTimezoneOffset());
sse.onmessage = async function(e) {
  console.log('RECEIVED MESSAGE SO UPDATE THE CHART');
  submitted = false;
  let json = JSON.parse(e.data);
  console.log(json)
  json.time = json.time - new Date().getTimezoneOffset() * 60;
  decaminutes.push(json);
  timeChartSeries.setData(decaminutes);
}

let crosshair = {}
window.proxy = new Proxy(crosshair, {
  set: function(target, prop, value) {
    if (crosshair[prop] !== value) {
      // console.log(`${prop}: ${value}`);
      crosshair[prop] = value;
    }
    return true;
  }
});