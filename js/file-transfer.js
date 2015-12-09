/*  MIT License: https://webrtc-experiment.appspot.com/licence/
 *	2013, Muaz Khan<muazkh>--[ github.com/muaz-khan ]
 */
/* For documentation and examples: http://bit.ly/RTCDataConnection */

window.moz = !! navigator.mozGetUserMedia

var RTCMultiSession = function (options) {
  return {
    send: function (message) {
      if (moz && message.file)
        data = message.file
      else
        data = JSON.stringify(message)

      activedc.send(data)
    }
  }
}

var FileSender = {
  send: function (config) {
    var channel = config.channel || new RTCMultiSession()
    var file = config.file

    /* if firefox nightly: share file blob directly */
    if (moz) {
      /* used on the receiver side to set received file name */
      channel.send({
        fileName: file.name,
        type: 'file'
      })

      /* sending the entire file at once */
      channel.send({
        file: file
      })

      if (config.onFileSent) config.onFileSent(file)
    }

    /* if chrome */
    if (!moz) {
      var reader = new window.FileReader()
      reader.readAsDataURL(file)
      reader.onload = onReadAsDataURL
    }

    var packetSize = 1000 /* chars */ ,
      textToTransfer = '',
      numberOfPackets = 0,
      packets = 0

    function onReadAsDataURL (event, text) {
      var data = {
        type: 'file'
      }

      if (event) {
        text = event.target.result
        numberOfPackets = packets = data.packets = parseInt(text.length / packetSize)
      }

      if (config.onFileProgress)
        config.onFileProgress({
          remaining: packets--,
          length: numberOfPackets,
          sent: numberOfPackets - packets
        })

      if (text.length > packetSize) {
        data.message = text.slice(0, packetSize)
      } else {
        data.message = text
        data.last = true
        data.name = file.name

        if (config.onFileSent) config.onFileSent(file)
      }

      channel.send(data)

      textToTransfer = text.slice(data.message.length)

      if (textToTransfer.length)
        setTimeout(function () {
          onReadAsDataURL(null, textToTransfer)
        }, 500)
    }
  }
}

function FileReceiver () {
  var content = [],
    fileName = '',
    packets = 0,
    numberOfPackets = 0

  function receive (data, config) {
    /* if firefox nightly & file blob shared */
    if (moz) {
      if (!data.size) {
        var parsedData = JSON.parse(data)
        if (parsedData.fileName) {
          fileName = parsedData.fileName
        }
      } else {
        var reader = new window.FileReader()
        reader.readAsDataURL(data)
        reader.onload = function (event) {
          FileSaver.SaveToDisk(event.target.result, fileName)
          if (config.onFileReceived) config.onFileReceived(fileName)
        }
      }
    }

    if (!moz) {
      if (data.packets)
        numberOfPackets = packets = parseInt(data.packets)

      if (config.onFileProgress)
        config.onFileProgress({
          remaining: packets--,
          length: numberOfPackets,
          received: numberOfPackets - packets
        })

      content.push(data.message)

      if (data.last) {
        FileSaver.SaveToDisk(content.join(''), data.name)
        if (config.onFileReceived)
          config.onFileReceived(data.name)
        content = []
      }
    }
  }

  return {
    receive: receive
  }
}

var FileSaver = {
  SaveToDisk: function (fileUrl, fileName) {
    var save = document.createElement('a')
    save.href = fileUrl
    save.target = '_blank'
    save.download = fileName || fileUrl

    var evt = new MouseEvent('click', {
      view: window,
      bubbles: true,
      cancelable: true
    })

    save.dispatchEvent(evt)

    ;(window.URL || window.webkitURL).revokeObjectURL(save.href)
  }
}
