let timerID
let interval = 100

self.onmessage = function (e) {
  if (e.data == 'start') {
    console.log('starting')
    timerID = self.setInterval(function () {
      postMessage('tick')
    }, interval)
  } else if (e.data.interval) {
    console.log('setting interval')
    interval = e.data.interval
    console.log('interval=' + interval)
    if (timerID) {
      clearInterval(timerID)
      timerID = self.setInterval(function () {
        postMessage('tick')
      }, interval)
    }
  } else if (e.data == 'stop') {
    console.log('stopping')
    clearInterval(timerID)
    timerID = 0
  }
}
