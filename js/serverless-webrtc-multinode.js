/* See also:
    http://www.html5rocks.com/en/tutorials/webrtc/basics/
    https://code.google.com/p/webrtc-samples/source/browse/trunk/apprtc/index.html

    https://webrtc-demos.appspot.com/html/pc1.html
*/

$('#sendMessageBtn').click(function() { return sendMessage(); });

var cfg = {"iceServers":[{"url":"stun:23.21.150.121"}]},
    con = { 'optional': [{'DtlsSrtpKeyAgreement': true}] };

// Since the same JS file contains code for both sides of the connection,
// activedc tracks which of the two possible datachannel variables we're using.
var activedc;

$('#showLocalOffer').modal('hide');
$('#getRemoteAnswer').modal('hide');
$('#waitForConnection').modal('hide');
$('#createOrJoin').modal('hide');

$('#addPeer').click(function() {
	$('#createOrJoin').modal('show');
});

var hostConnections=[];
$('#createBtn').click(function() {
	hostConnections.push(SWHostConnection());
	hostConnections[hostConnections.length-1].init($('#usernameInput').val());

    $('#showLocalOffer').modal('show');
    hostConnections[hostConnections.length-1].createLocalOffer();
});

var guestConnections=[];
$('#joinBtn').click(function() {
	guestConnections.push(SWGuestConnection());
	guestConnections[guestConnections.length-1].init($('#usernameInput').val());
    $('#getRemoteOffer').modal('show');
});

$('#offerSentBtn').click(function() {
    $('#localOffer').html('');
    $('#getRemoteAnswer').modal('show');
});

function handleOfferFromPC1(offerDesc,pc2i) {
    pc2i.handleOfferFromPC1(offerDesc);
        writeToChatLog("Created local answer", "text-success");
        console.log("Created local answer: ", offerDesc);
}

$('#offerRecdBtn').click(function() {
    var offer = $('#remoteOffer').val();
    var offerDesc = new RTCSessionDescription(JSON.parse(offer));
    console.log("Received remote offer", offerDesc);
    writeToChatLog("Received remote offer", "text-success");
    handleOfferFromPC1(offerDesc,guestConnections[guestConnections.length-1]);
    $('#remoteOffer').val('');
    $('#showLocalAnswer').modal('show');
});

$('#answerSentBtn').click(function() {
    $('#localAnswer').html('');
    $('#waitForConnection').modal('show');
});

function handleAnswerFromPC2(answerDesc,pci) {
    console.log("Received remote answer: ", answerDesc);
    writeToChatLog("Received remote answer", "text-success");
    pci.setRemoteDescription(answerDesc);
}

$('#answerRecdBtn').click(function() {
    var answer = $('#remoteAnswer').val();
    var answerDesc = new RTCSessionDescription(JSON.parse(answer));
    handleAnswerFromPC2(answerDesc,hostConnections[hostConnections.length-1].pc1);
    $('#remoteAnswer').val('');
    $('#waitForConnection').modal('show');
});

$('#fileBtn').change(function() {
    var file = this.files[0];
    console.log(file);

    sendFile(file);
});

function fileSent(file) {
    console.log(file + " sent");
}

function fileProgress(file) {
    console.log(file + " progress");
}

function sendFile(data) {
    if (data.size) {
        FileSender.send({
          file: data,
          onFileSent: fileSent,
          onFileProgress: fileProgress,
        });
    }
}

function sendMessage() {
    if ($('#messageTextBox').val()) {
       /*var channel = new RTCMultiSession();
       channel.send({message: $('#messageTextBox').val()});*/
	for(var i=0;i<hostConnections.length;i++) {
		hostConnections[i].send($('#messageTextBox').val());
	}
	for(var i=0;i<guestConnections.length;i++) {
		guestConnections[i].send($('#messageTextBox').val());
	}

	writeToChatLog('Me: '+$('#messageTextBox').val(), "text-success");
	$('#messageTextBox').val("");
	// Scroll chat text area to the bottom on new input.
	$('#chatlog').scrollTop($('#chatlog')[0].scrollHeight);
    }

    return false;
};


function handleOnconnection() {
    console.log("Datachannel connected");
    writeToChatLog("Datachannel connected", "text-success");
    $('#waitForConnection').modal('hide');
    // If we didn't call remove() here, there would be a race on pc2:
    //   - first onconnection() hides the dialog, then someone clicks
    //     on answerSentBtn which shows it, and it stays shown forever.
    $('#waitForConnection').remove();
    $('#showLocalAnswer').modal('hide');
    $('#messageTextBox').focus();
}

function onsignalingstatechange(state) {
    console.info('signaling state change:', state);
}

function oniceconnectionstatechange(state,self) {
    console.info('ice connection state change:', state);
    writeToChatLog('Connection update: '+self.username+' x '+self.counterparty+' closed');
}

function onicegatheringstatechange(state) {
    console.info('ice gathering state change:', state);
}

function getTimestamp() {
    var totalSec = new Date().getTime() / 1000;
    var hours = parseInt(totalSec / 3600) % 24;
    var minutes = parseInt(totalSec / 60) % 60;
    var seconds = parseInt(totalSec % 60);

    var result = (hours < 10 ? "0" + hours : hours) + ":" +
                 (minutes < 10 ? "0" + minutes : minutes) + ":" +
                 (seconds  < 10 ? "0" + seconds : seconds);

    return result;
}

function writeToChatLog(message, message_type) {
    document.getElementById('chatlog').innerHTML += '<p class=\"' + message_type + '\">' + "[" + getTimestamp() + "] " + message + '</p>';
                    // Scroll chat text area to the bottom on new input.
                    $('#chatlog').scrollTop($('#chatlog')[0].scrollHeight);
}

function summarizeRTC1(x) { return {
	username: x.username,
	counterparty: x.counterparty,
	local: x.pc1.localDescription,
	remote: x.pc1.remoteDescription
}; }

function summarizeRTC2(x) { return {
	username: x.username,
	counterparty: x.counterparty,
	local: x.pc2.localDescription,
	remote: x.pc2.remoteDescription
}; }

$('#exportOffer').click(function() {
var blob = new Blob([$('#localOffer').val()], {type: "application/json"});
saveAs(blob, "offer.json");
});

$('#exportAnswer').click(function() {
var blob = new Blob([$('#localAnswer').val()], {type: "application/json"});
saveAs(blob, "answer.json");
});

function importOfferAnswer(fr,elem) {
    var file = fr.files[0];

    var reader = new window.FileReader();
    reader.onload = function(event) {
	if (event) {
		$(elem).val(reader.result);
	}
    }
    reader.readAsText(file);
}
$('#importOffer').change(function() { importOfferAnswer(this,'#remoteOffer'); });
$('#importAnswer').change(function() { importOfferAnswer(this,'#remoteAnswer'); });


function handleOnMessage(e,self) {
            console.log("Got message", e.data);
        var fileReceiver1 = new FileReceiver();
            if (e.data.size) {
                fileReceiver1.receive(e.data, {});
            }
            else {   
                 if (e.data.charCodeAt(0) == 2) {
                    // The first message we get from Firefox (but not Chrome)
                    // is literal ASCII 2 and I don't understand why -- if we
                    // leave it in, JSON.parse() will barf.
                    return;
                 }
                 console.log(e);
                 var data = JSON.parse(e.data);
                 switch(data.type) {
                 case 'echo request':
                     self.send(data.timestamp,'echo response');
                     break; 
                 case 'echo response':
                     self.latency=getTimestamp()+' - '+data.timestamp+' -  '+data.message;
                     writeToChatLog("RTD: "+self.username+' x '+self.counterparty+' , '+self.latency);
                     if(self.echoId!=null) {
                         clearTimeout(self.echoId);
                         self.echoId=null;
                     }
                     break;
                 default:
                     // set the counterparty name
                     if(self.counterparty==null) {
                         self.counterparty=data.username;
                         $('#onlineUsers').append(
                            $('<li>')
                            .append(self.username+' x '+self.counterparty+'&nbsp;')
                            .append( $('<button name="latency">').append('Latency') )
                            .delegate('button[name="latency"]','click', function() {
                                 writeToChatLog('RTD: '+self.username+' x '+self.counterparty+' ...');
                                 self.send('','echo request');
                                 self.echoId=setTimeout(function() { writeToChatLog('RTD: '+self.username+' x '+self.counterparty+' &gt; 30 secs ... closed?'); }, 30000); // timeout in 30 seconds
                            } )
                            .append( $('<button name="close">').append('Close') )
                            .delegate('button[name="close"]','click', function() { self.close(); $(this).parent().remove(); delete self; } )
                            .append( $('<button name="send">').append('Send') )
                            .delegate('button[name="send"]','click', function() {
				if($('#messageTextBox').val()) {
					self.send($('#messageTextBox').val());
					writeToChatLog('Me x '+self.counterparty+': '+$('#messageTextBox').val(), "text-success");
					$('#messageTextBox').val("");
					// Scroll chat text area to the bottom on new input.
					$('#chatlog').scrollTop($('#chatlog')[0].scrollHeight);
				}
			    } )
                         );
                     }
                     self.lastTimestamp=getTimestamp();
                     // write out message
                     writeToChatLog(self.counterparty+' x '+self.username+" : "+data.message, "text-info");
                 }  
             }
}


//--------------
$('#createOrJoin').modal('show');

