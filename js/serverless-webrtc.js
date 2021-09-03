/* See also:
    http://www.html5rocks.com/en/tutorials/webrtc/basics/
    https://code.google.com/p/webrtc-samples/source/browse/trunk/apprtc/index.html

    https://webrtc-demos.appspot.com/html/pc1.html
*/

// Attach a media stream to an element.
attachMediaStream = function (element, stream) {
  console.log('Attaching media stream')
  element.srcObject = stream
  element.play()
}

reattachMediaStream = function (to, from) {
  console.log('Reattaching media stream')
  to.srcObject = from.srcObject
  to.play()
}

var cfg = {'iceServers': [{urls: 'stun:23.21.150.121'}]},
  con = { 'optional': [{'DtlsSrtpKeyAgreement': true}] }

/* THIS IS ALICE, THE CALLER/SENDER */

var pc1 = new RTCPeerConnection(cfg, con),
  dc1 = null, tn1 = null

// Since the same JS file contains code for both sides of the connection,
// activedc tracks which of the two possible datachannel variables we're using.
var activedc

var pc1icedone = false

var sdpConstraints = {
  optional: [],
  mandatory: {
    OfferToReceiveAudio: true,
    OfferToReceiveVideo: true
  }
}

$('#showLocalOffer').modal('hide')
$('#getRemoteAnswer').modal('hide')
$('#waitForConnection').modal('hide')
$('#createOrJoin').modal('show')

$('#createBtn').click(function () {
  $('#createOrJoin').modal('hide')
  $('#showLocalOffer').modal('show')
  createLocalOffer()
})

$('#joinBtn').click(function () {
  navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(function (stream) {
    var video = document.getElementById('localVideo')
    video.srcObject = stream;
    video.play()
    pc2.addStream(stream)
}).catch(function (error) {
    console.log('Error adding stream to pc2: ' + error)
});
  $('#createOrJoin').modal('hide')
  $('#getRemoteOffer').modal('show')
})

$('#offerSentBtn').click(function () {
  $('#showLocalOffer').modal('hide')
  $('#getRemoteAnswer').modal('show')
})

$('#offerRecdBtn').click(function () {
  var offer = $('#remoteOffer').val()
  var offerDesc = new RTCSessionDescription(JSON.parse(offer))
  console.log('Received remote offer', offerDesc)
  writeToChatLog('Received remote offer', 'text-success')
  handleOfferFromPC1(offerDesc)
  $('#getRemoteOffer').modal('hide')
  $('#showLocalAnswer').modal('show')
})

$('#answerSentBtn').click(function () {
  $('#showLocalAnswer').modal('hide')
  $('#waitForConnection').modal('show')
})

$('#answerRecdBtn').click(function () {
  var answer = $('#remoteAnswer').val()
  var answerDesc = new RTCSessionDescription(JSON.parse(answer))
  handleAnswerFromPC2(answerDesc)
  $('#getRemoteAnswer').modal('hide')
  $('#waitForConnection').modal('show')
})

$('#fileBtn').change(function () {
  var file = this.files[0]
  console.log(file)

  sendFile(file)
})

function fileSent (file) {
  console.log(file + ' sent')
}

function fileProgress (file) {
  console.log(file + ' progress')
}

function sendFile (data) {
  if (data.size) {
    FileSender.send({
      file: data,
      onFileSent: fileSent,
      onFileProgress: fileProgress,
    })
  }
}

function sendMessage () {
  if ($('#messageTextBox').val()) {
    var channel = new RTCMultiSession()
    writeToChatLog($('#messageTextBox').val(), 'text-success')
    channel.send({message: $('#messageTextBox').val()})
    $('#messageTextBox').val('')

    // Scroll chat text area to the bottom on new input.
    $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight)
  }

  return false
}

function setupDC1 () {
  try {
    var fileReceiver1 = new FileReceiver()
    dc1 = pc1.createDataChannel('test', {reliable: true})
    activedc = dc1
    console.log('Created datachannel (pc1)')
    dc1.onopen = function (e) {
      console.log('data channel connect')
      $('#waitForConnection').modal('hide')
      $('#waitForConnection').remove()
    }
    dc1.onmessage = function (e) {
      console.log('Got message (pc1)', e.data)
      if (e.data.size) {
        fileReceiver1.receive(e.data, {})
      } else {
        if (e.data.charCodeAt(0) == 2) {
          // The first message we get from Firefox (but not Chrome)
          // is literal ASCII 2 and I don't understand why -- if we
          // leave it in, JSON.parse() will barf.
          return
        }
        console.log(e)
        var data = JSON.parse(e.data)
        if (data.type === 'file') {
          fileReceiver1.receive(e.data, {})
        } else {
          writeToChatLog(data.message, 'text-info')
          // Scroll chat text area to the bottom on new input.
          $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight)
        }
      }
    }
  } catch (e) { console.warn('No data channel (pc1)', e); }
}

function createLocalOffer () {
  console.log('video1')
  navigator.mediaDevices.getUserMedia({video: true, audio: true}).then(function (stream) {
    var video = document.getElementById('localVideo')
    video.srcObject = stream;
    video.play()
    pc1.addStream(stream)
    console.log(stream)
    console.log('adding stream to pc1')
    setupDC1()
    pc1.createOffer(function (desc) {
      pc1.setLocalDescription(desc, function () {}, function () {})
      console.log('created local offer', desc)
    },
    function () { console.warn("Couldn't create offer") },
    sdpConstraints)
}).catch(function (error) {
  console.log('Error adding stream to pc1: ' + error)
});
}

pc1.onicecandidate = function (e) {
  console.log('ICE candidate (pc1)', e)
  if (e.candidate == null) {
    $('#localOffer').html(JSON.stringify(pc1.localDescription))
  }
}

function handleOnaddstream (e) {
  console.log('Got remote stream', e.streams[0])
  var el = document.getElementById('remoteVideo')
  el.autoplay = true
  attachMediaStream(el, e.streams[0])
}

pc1.ontrack = handleOnaddstream

function handleOnconnection () {
  console.log('Datachannel connected')
  writeToChatLog('Datachannel connected', 'text-success')
  $('#waitForConnection').modal('hide')
  // If we didn't call remove() here, there would be a race on pc2:
  //   - first onconnection() hides the dialog, then someone clicks
  //     on answerSentBtn which shows it, and it stays shown forever.
  $('#waitForConnection').remove()
  $('#showLocalAnswer').modal('hide')
  $('#messageTextBox').focus()
}

pc1.onconnection = handleOnconnection

function onsignalingstatechange (state) {
  console.info('signaling state change:', state)
}

function oniceconnectionstatechange (state) {
  console.info('ice connection state change:', state)
}

function onicegatheringstatechange (state) {
  console.info('ice gathering state change:', state)
}

pc1.onsignalingstatechange = onsignalingstatechange
pc1.oniceconnectionstatechange = oniceconnectionstatechange
pc1.onicegatheringstatechange = onicegatheringstatechange

function handleAnswerFromPC2 (answerDesc) {
  console.log('Received remote answer: ', answerDesc)
  writeToChatLog('Received remote answer', 'text-success')
  pc1.setRemoteDescription(answerDesc)
}

function handleCandidateFromPC2 (iceCandidate) {
  pc1.addIceCandidate(iceCandidate)
}

/* THIS IS BOB, THE ANSWERER/RECEIVER */

var pc2 = new RTCPeerConnection(cfg, con),
  dc2 = null

var pc2icedone = false

pc2.ondatachannel = function (e) {
  var fileReceiver2 = new FileReceiver()
  var datachannel = e.channel || e; // Chrome sends event, FF sends raw channel
  console.log('Received datachannel (pc2)', arguments)
  dc2 = datachannel
  activedc = dc2
  dc2.onopen = function (e) {
    console.log('data channel connect')
    $('#waitForConnection').modal('hide')
    $('#waitForConnection').remove()
  }
  dc2.onmessage = function (e) {
    console.log('Got message (pc2)', e.data)
    if (e.data.size) {
      fileReceiver2.receive(e.data, {})
    } else {
      var data = JSON.parse(e.data)
      if (data.type === 'file') {
        fileReceiver2.receive(e.data, {})
      } else {
        writeToChatLog(data.message, 'text-info')
        // Scroll chat text area to the bottom on new input.
        $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight)
      }
    }
  }
}

function handleOfferFromPC1 (offerDesc) {
  pc2.setRemoteDescription(offerDesc)
  pc2.createAnswer(function (answerDesc) {
    writeToChatLog('Created local answer', 'text-success')
    console.log('Created local answer: ', answerDesc)
    pc2.setLocalDescription(answerDesc)
  },
  function () { console.warn("Couldn't create offer") },
  sdpConstraints)
}

pc2.onicecandidate = function (e) {
  console.log('ICE candidate (pc2)', e)
  if (e.candidate == null) {
    $('#localAnswer').html(JSON.stringify(pc2.localDescription))
  }
}

pc2.onsignalingstatechange = onsignalingstatechange
pc2.oniceconnectionstatechange = oniceconnectionstatechange
pc2.onicegatheringstatechange = onicegatheringstatechange

function handleCandidateFromPC1 (iceCandidate) {
  pc2.addIceCandidate(iceCandidate)
}

pc2.ontrack = handleOnaddstream
pc2.onconnection = handleOnconnection

function getTimestamp () {
  var totalSec = new Date().getTime() / 1000
  var hours = parseInt(totalSec / 3600) % 24
  var minutes = parseInt(totalSec / 60) % 60
  var seconds = parseInt(totalSec % 60)

  var result = (hours < 10 ? '0' + hours : hours) + ':' +
    (minutes < 10 ? '0' + minutes : minutes) + ':' +
    (seconds < 10 ? '0' + seconds : seconds)

  return result
}

function escapeHTML (unsafe_str) {
  return unsafe_str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\"/g, '&quot;')
    .replace(/\'/g, '&#39;')
    .replace(/\//g, '&#x2F;')
}

function writeToChatLog (message, message_type) {
  document.getElementById('chatlog').innerHTML += '<p class="' + message_type + '">' + '[' + getTimestamp() + '] ' + escapeHTML(message) + '</p>'
}
