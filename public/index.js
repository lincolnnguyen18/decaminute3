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

(async () => {
  setInterval(() => {
    let date = new Date(new Date().getTime() - (300 * 60 * 1000)); 
    console.log(`${date.getUTCHours()}:${date.getUTCMinutes()}:${date.getUTCSeconds()}`);
    let seconds = date.getUTCSeconds();
    if (seconds % 10 >= 1 && seconds % 10 <= 5 && !submitted) {
      workedButton.disabled = false;
    } else if (seconds % 10 >= 6) {
      submitted = false;
      workedButton.disabled = true;
    }
  }, 1000);
  let sse = new EventSource('http://localhost:3000/stream?timezoneOffset=' + new Date().getTimezoneOffset());
  sse.onmessage = function(e) {
    // get type of e.data
    let json = JSON.parse(e.data);
    console.log(json)
    if (new Date().getSeconds() % 10 === 8) {
      json.time = json.time - new Date().getTimezoneOffset() * 60;
      decaminutes.push(json);
      timeChartSeries.setData(decaminutes);
    }
  }
})();