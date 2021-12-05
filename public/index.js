let workedButton = document.querySelector('#workedButton');
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

if (Notification.permission !== "granted") { Notification.requestPermission(); }

(async () => {
  setInterval(() => {
    let date = new Date();
    let hours = date.getHours();
    let minutes = date.getMinutes();
    let seconds = date.getSeconds();
    console.log(`${hours}:${minutes}:${seconds}`);
    if (minutes % 10 === 0 && seconds <= 10 && !submitted) {
      if (seconds === 0) {
        const notification = new Notification("Hello", {
          body: "Are you working?"
        });
        notification.onclick = () => {
          window.focus();
          notification.close();
        };
      }
      workedButton.disabled = false;
    } else {
      submitted = false;
      workedButton.disabled = true;
    }
  }, 1000);
  let sse = new EventSource('http://localhost:3000/stream?timezoneOffset=' + new Date().getTimezoneOffset());
  sse.onmessage = function(e) {
    let json = JSON.parse(e.data);
    console.log(json)
    json.time = json.time - new Date().getTimezoneOffset() * 60;
    decaminutes.push(json);
    timeChartSeries.setData(decaminutes);
  }
})();