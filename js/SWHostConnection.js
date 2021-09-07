/* THIS IS ALICE, THE CALLER/SENDER */

function SWHostConnection() {
return {
    username: null,
    counterparty: null,
    lastTimestamp: null,
    latency: null,
    pc1 : new RTCPeerConnection(cfg, con),
    dc1 : null,
    setupDC1: function() {
        try {
        var self=this;
        self.dc1 = self.pc1.createDataChannel('test', {reliable:true});
        activedc = self.dc1;
        console.log("Created datachannel (pc1)");
	self.dc1.onopen = function (e) {
	    console.log('data channel connect');
	    $('#waitForConnection').modal('hide');
	    $('#waitForConnection').remove();
	    self.send('Initiated');
	    setTimeout(function() { self.send('','echo request'); }, 1000);
	};
        self.dc1.onmessage = function (e) { handleOnMessage(e,self); };
        } catch (e) { console.warn("No data channel (pc1)", e); }
    },
    createLocalOffer: function() {
        var self=this;
        self.setupDC1();
        self.pc1.createOffer(function (desc) {
            self.pc1.setLocalDescription(desc, function () {});
            console.log("created local offer", desc);
        }, function () {console.warn("Couldn't create offer");});
    },
    init: function(un) {
        var self=this;
        self.username=un;
        self.pc1.onconnection = handleOnconnection;
        self.pc1.onsignalingstatechange = onsignalingstatechange;
        self.pc1.oniceconnectionstatechange = function(e) { oniceconnectionstatechange(e,self) };
        self.pc1.onicegatheringstatechange = onicegatheringstatechange;
	self.pc1.onicecandidate = function (e) {
	    console.log("ICE candidate (pc1)", e);
	    if (e.candidate == null) {
		$('#localOffer').html(JSON.stringify(self.pc1.localDescription));
	    }
	};
	return self;
    },
    send: function(msg,type) {
        var self=this;
        self.dc1.send(JSON.stringify({
            username: self.username,
            message: msg,
            timestamp: getTimestamp(),
            type: type
        }));
    },
    close: function() {
	this.pc1.close();
	if(this.echoId!=null) {
            clearTimeout(this.echoId);
            this.echoId=null;
	}
    },
    echoId:null,
};
}
