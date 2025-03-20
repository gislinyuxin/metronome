let timerID: number
let interval = 100

self.onmessage = function (e) {
  if (e.data == 'start') {
    console.log('starting')
    timerID = window.setInterval(function () {
      postMessage('tick')
    }, interval)
  } else if (e.data.interval) {
    console.log('setting interval')
    interval = e.data.interval
    console.log('interval=' + interval)
    if (timerID) {
      clearInterval(timerID)
      timerID = window.setInterval(function () {
        postMessage('tick')
      }, interval)
    }
  } else if (e.data == 'stop') {
    console.log('stopping')
    clearInterval(timerID)
    timerID = 0
  }
}

postMessage('hi there')
