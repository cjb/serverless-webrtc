/* See also:
    http://www.html5rocks.com/en/tutorials/webrtc/basics/
    https://code.google.com/p/webrtc-samples/source/browse/trunk/apprtc/index.html

    https://webrtc-demos.appspot.com/html/pc1.html
*/

var cfg = {"iceServers":[{"url":"stun:23.21.150.121"}]},
    con = { 'optional': [{'DtlsSrtpKeyAgreement': true}, {'RtpDataChannels': true }] };

// createDataChannel needs `open /Applications/Google\ Chrome\ Canary.app --args --enable-data-channels` :-(

function remoteOfferClick() {
    var offer = document.remoteOfferForm.remoteOffer.value;
    console.log(offer);
    var offerJSON = JSON.parse(offer);
    var offerDesc = new RTCSessionDescription(offerJSON);
    handleOfferFromPC1(offerDesc);
}

function remoteAnswerClick() {
    var answer = document.remoteAnswerForm.remoteAnswer.value;
    var answerDesc = new RTCSessionDescription(JSON.parse(answer));
    handleAnswerFromPC2(answerDesc);
}

function remoteICECandidateClick() {
    var candidate = document.remoteICECandidateForm.remoteICECandidate.value;
    var candidateDesc = new RTCIceCandidate(JSON.parse(candidate));
    handleCandidateFromPC2(candidateDesc);
}
/* THIS IS ALICE, THE CALLER/SENDER */

var pc1 = new RTCPeerConnection(cfg, con),
    dc1 = null, tn1 = null;

var pc1icedone = false;

console.log("hiding modal");
$('#showLocalOffer').modal('hide');
$('#getRemoteAnswer').modal('hide');
$('#createOrJoin').modal('show');

document.getElementById('createBtn').addEventListener('click', function() {
    console.log("createBtn cb");
    $('#showLocalOffer').modal('show');
}, true);

document.getElementById('joinBtn').addEventListener('click', function() {
    $('#getRemoteOffer').modal('show');
}, true);

document.getElementById('offerSentBtn').addEventListener('click', function() {
    console.log('offer sent cb');
    $('#getRemoteAnswer').modal('show');
}, true);

document.getElementById('offerRecdBtn').addEventListener('click', function() {
    console.log('offer recd cb');
    var offer = $('#remoteOffer').val();
    console.log('offer is ' + offer);
    var offerDesc = new RTCSessionDescription(JSON.parse(offer));
    handleOfferFromPC1(offerDesc);
    $('#showLocalAnswer').modal('show');
}, true);

document.getElementById('answerSentBtn').addEventListener('click', function() {
    console.log('answer sent cb');
    // wait
}, true);

document.getElementById('answerRecdBtn').addEventListener('click', function() {
    console.log('answer recd cb');
    var answer = $('#remoteAnswer').val();
    var answerDesc = new RTCSessionDescription(JSON.parse(answer));
    handleAnswerFromPC2(answerDesc);
}, true);

function setupDC1() {
    try {
        dc1 = pc1.createDataChannel('test', {reliable:false});
        console.log("Created datachannel (pc1)");
        dc1.onmessage = function (e) {
            console.log("Got message (pc1)", e.data);
        };
    } catch (e) { console.warn("No data channel (pc1)", e); }
}

getUserMedia({'audio':true, fake:true}, function (stream) {
    console.log("Got local audio", stream);
    pc1.addStream(stream);
    setupDC1();
    //tn1 = pc1.createDTMFSender(pc1.getLocalStreams()[0].getAudioTracks()[0])
    pc1.createOffer(function (offerDesc) {
        console.log("Got offer", offerDesc);
        pc1.setLocalDescription(offerDesc);
        $('#localOffer').html(JSON.stringify(offerDesc));
    }, function () { console.warn("No create offer"); });
}, function () { console.warn("No audio"); });

pc1.onicecandidate = function (e) {
    console.log("ICE candidate (pc1)", e);
    if (e.candidate) {
        //handleCandidateFromPC1(e.candidate)
        if (!pc1icedone) {
            document.localICECandidateForm.localICECandidate.value = JSON.stringify(e.candidate);
            pc1icedone = true;
        }
    }
};

pc1.onconnection = function() {
    console.log("pc1: datachannel connected");
};

function handleAnswerFromPC2(answerDesc) {
    pc1.setRemoteDescription(answerDesc);
}

function handleCandidateFromPC2(iceCandidate) {
    pc1.addIceCandidate(iceCandidate);
}

document.getElementById('msg1').addEventListener('click', function () {
    if (tn1) tn1.insertDTMF('123213');
    if (dc1) dc1.send("ping");
}, false);


/* THIS IS BOB, THE ANSWERER/RECEIVER */

var pc2 = new RTCPeerConnection(cfg, con),
    dc2 = null;

var pc2icedone = false;

pc2.ondatachannel = function (e) {
    var datachannel = e.channel || e; // Chrome sends event, FF sends raw channel
    console.log("Received datachannel (pc2)", arguments);
    dc2 = datachannel;
    dc2.onmessage = function (e) {
        console.log("Got message (pc2)", e.data);
    };
};

function handleOfferFromPC1(offerDesc) {
    pc2.setRemoteDescription(offerDesc);
    pc2.createAnswer(function (answerDesc) {
        console.log("Got answer", answerDesc);
        pc2.setLocalDescription(answerDesc);
        $('#localAnswer').html(JSON.stringify(answerDesc));
    }, function () { console.warn("No create answer"); });
}

pc2.onicecandidate = function (e) {
    console.log("ICE candidate (pc2)", e);
    if (e.candidate)
      handleCandidateFromPC2(e.candidate);
};

function handleCandidateFromPC1(iceCandidate) {
    pc2.addIceCandidate(iceCandidate);
}

pc2.onaddstream = function (e) {
    console.log("Got remote stream", e);
    var el = new Audio();
    el.autoplay = true;
    attachMediaStream(el, e.stream);
};

pc2.onconnection = function() {
    console.log("pc2: datachannel connected");
};

document.getElementById('msg2').addEventListener('click', function () {
    if (dc2) dc2.send("pong");
}, false);
