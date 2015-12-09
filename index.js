var electron = require('electron')
var app = electron.app

app.on('ready', function () {
  var win = new electron.BrowserWindow({width: 1000, height:700})
  win.loadURL('file://' + __dirname + '/serverless-webrtc.html')
})
