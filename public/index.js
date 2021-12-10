let date = new Date();
let minutes = date.getMinutes();
let seconds = date.getSeconds();

if (typeof(w) == "undefined") {
  w = new Worker("/public/worker.js");
}
w.onmessage = async function(e) {
  let date2 = e.data;
  let minutes2 = date2.getMinutes();
  let seconds2 = date2.getSeconds();
  if (minutes2 != minutes || seconds2 != seconds) {
    console.log(`${minutes}:${seconds}`);
    if (minutes % 10 === 0 && seconds === 0) {
      console.log("WORKER NOTIFY");
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
let logoutButton = document.querySelector('#logoutButton');
let beep = new Audio('/public/beep.mp3');
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
let timeChartDiv = document.querySelector('#timeChart')
let descriptionLabel = document.querySelector('#descriptionLabel');

// single click
timeChartDiv.onclick = async function(e) {
  // console.log(window.proxy);
  let { timeStamp } = window.proxy;
  oldTimestamp = timeStamp;
  timeStamp = timeStamp + new Date().getTimezoneOffset() * 60;
  console.log(timeStamp);
  let description = prompt("Set Description", "");
  if (description) {
    fetch('/api/addDescription', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ time: timeStamp, description })
    }).then(res => res.json()).then(res => {
      if (!res.error) {
        decaminutes.find(d => d.time === oldTimestamp).description = description;
        descriptionLabel.innerHTML = `${window.proxy.time}: ${description}`;
      }
    });
  }
}

let lastMouseMoveTimestamp = 0;
timeChartDiv.onmousemove = async function(e) {
  let { timeStamp } = window.proxy;
  if (timeStamp !== lastMouseMoveTimestamp) {
    lastMouseMoveTimestamp = timeStamp;
    let decaminute = decaminutes.find(d => d.time === timeStamp);
    if (decaminute && decaminute.description) {
      descriptionLabel.innerHTML = `${window.proxy.time}: ${decaminute.description}`;
    } else {
      descriptionLabel.innerHTML = `${window.proxy.time}: No description`;
    }
  }
}

logoutButton.onclick = async function() {
  window.location.href = '/api/logout';
}

fetch('/api/decaminutes', {
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
      value: d.value,
      description: d.description
    }
  })
  decaminutes = data;
  timeChartSeries.setData(decaminutes);
});

let submitted = false;

workedButton.addEventListener('click', function() {
  workedButton.disabled = true;
  submitted = true;
  fetch('/api/worked', {
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

// const notify = async () => {
//   beep.play();
//   const notification = new Notification("Decaminute", {
//     body: "Did you work for the past 10 minutes?"
//   });
//   notification.onclick = () => {
//     window.focus();
//     notification.close();
//   }
//   console.log(notification);
// }

const notify = async () => {
  beep.play();
  let notification = new Notification("Decaminute", {
    body: "Did you work for the past 10 minutes?"
  });
  notification.onclick = () => {
    window.focus();
    notification.close();
  }
}

// document.body.onclick = () => {
//   notify();
// }

let sse = new EventSource('/api/stream?timezoneOffset=' + new Date().getTimezoneOffset());
sse.onmessage = async function(e) {
  submitted = false;
  let json = JSON.parse(e.data);
  console.log(json)
  if (json.time > -1 && json.value > -1) {
    console.log('RECEIVED MESSAGE SO UPDATE THE CHART');
    json.time = json.time - new Date().getTimezoneOffset() * 60;
    decaminutes.push(json);
    timeChartSeries.setData(decaminutes);
  } else {
    console.log('RECEIVED MESSAGE TO SHOW NOTIFICATION!!!!');
    notify();
  }
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