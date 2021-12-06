function timedCount() {
  postMessage(new Date());
  setTimeout("timedCount()",200);
}

timedCount();