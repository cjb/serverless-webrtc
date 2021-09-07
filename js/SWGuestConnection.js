// This is a moderatorless version of
// http://www.rtcmulticonnection.org/docs/

/* THIS IS BOB, THE ANSWERER/RECEIVER */

function SWGuestConnection() {
return {
    username: null,
    counterparty: null,
    lastTimestamp: null,
    latency: null,
    pc2 : new RTCPeerConnection(cfg, con),
    dc2 : null,
    guestConnections: null,
    p1: null,
    init: function(un,pc2a2,p11) {
        var self=this;
        self.username=un;
	self.guestConnections=pc2a2;
	self.p1=p11;

        self.pc2.ondatachannel = function (e) {
            var fileReceiver2 = new FileReceiver();
            var datachannel = e.channel || e; // Chrome sends event, FF sends raw channel
            console.log("Received datachannel (pc2)", arguments);
            self.dc2 = datachannel;
            activedc = self.dc2;
            self.dc2.onopen = function (e) {
                console.log('data channel connect');
                $('#waitForConnection').remove();
                $('#showLocalAnswer').modal('hide');
                setTimeout(function() { self.send('Initiated'); }, 500);
                setTimeout(function() { self.send('','echo request'); }, 1500);
            };
            self.dc2.onmessage = function (e) { handleOnMessage(e,self); };
        };

        self.pc2.onsignalingstatechange = onsignalingstatechange;
        self.pc2.oniceconnectionstatechange = function(e) { oniceconnectionstatechange(e,self) };
        self.pc2.onicegatheringstatechange = onicegatheringstatechange;

        self.pc2.onaddstream = function (e) {
            console.log("Got remote stream", e);
            var el = new Audio();
            el.autoplay = true;
            attachMediaStream(el, e.stream);
        };

        self.pc2.onconnection = handleOnconnection;

	self.pc2.onicecandidate = function (e) {
	    console.log("ICE candidate (pc2)", e);
	    if (e.candidate == null)
	       $('#localAnswer').html(JSON.stringify(self.pc2.localDescription));
	};

	return self;
    },
    send: function(msg,type) {
        var self=this;
        self.dc2.send(JSON.stringify({
            username: self.username,
            message: msg,
            timestamp: getTimestamp(),
	    type: type
        }));
    },
    handleOfferFromPC1:function(offerDesc) {
        var self=this;
        self.pc2.setRemoteDescription(offerDesc);
        self.pc2.createAnswer(function (answerDesc) {
        self.pc2.setLocalDescription(answerDesc);
        }, function () { console.warn("No create answer"); });
    },
    close: function() {
	this.pc2.close();
	if(this.echoId!=null) {
            clearTimeout(this.echoId);
            this.echoId=null;
	}
    },
    echoId:null,
};
}
