serverless-webrtc
=================

This is a tech demo of using WebRTC without a signaling server -- the 
WebRTC offer/answer exchange is performed manually by the users, perhaps
via IM.  This means that the app can run out of `file:///` directly, without
involving a web server.  You can send text messages and files between peers.

The code now works on Firefox and Chrome, including interoperability between
the two browsers.  For Chrome, you'll need to run a local web server rather
than just browsing to `file:///`, like this:

```
 λ cd serverless-webrtc
 λ python -m SimpleHTTPServer 8001 .
Serving HTTP on 0.0.0.0 port 8001 ...
```

and then browse to [http://localhost:8001/](http://localhost:8001/).

Blog post with more details:
http://blog.printf.net/articles/2013/05/17/webrtc-without-a-signaling-server

Demo link:
http://cjb.github.io/serverless-webrtc/serverless-webrtc.html

-- Chris Ball <chris@printf.net>
