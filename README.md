serverless-webrtc
=================

This is a tech demo of using WebRTC without a signaling server -- the 
WebRTC offer/answer exchange is performed manually by the users, perhaps
via IM.  This means that the app can run out of `file:///` directly, without
involving a web server.  You can send text messages and files between peers.

The code currently requires Firefox Nightly, and doesn't work on Chrome;
patches to add Chrome support are welcome.  To run it, just clone this
repository and open serverless-webrtc.html in Firefox.

Blog post with more details:
http://blog.printf.net/articles/2013/05/17/webrtc-without-a-signaling-server

-- Chris Ball <chris@printf.net>
