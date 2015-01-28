serverless-webrtc
=================

This is a tech demo of using WebRTC without a signaling server -- the 
WebRTC offer/answer exchange is performed manually by the users, for example
via IM.  This means that the app can run out of `file:///` directly, without
involving a web server.  You can send text messages and files between peers.

This repository contains three different clients that can talk to each other:

1. `serverless-webrtc.js` runs under node.js
2. `serverless-webrtc.html` runs in Chrome or Firefox
3. `serverless-webrtc-multinode.html` runs in Chrome or Firefox

Chat is fully interoperable between all of the above (Node, Chrome, Firefox)
in any combination (tested with Chrome 35 and Firefox 29).

![screenshot](https://raw.github.com/cjb/serverless-webrtc/master/serverless-webrtc.png)

### For Node:

```
 λ npm install serverless-webrtc
 λ node_modules/serverless-webrtc/serverless-webrtc.js
```

Under Node, if you want to create a session instead of joining one:

```
 λ node_modules/serverless-webrtc/serverless-webrtc.js --create
```

### For browsers:

In Chrome (but not Firefox), you'll need to run a local web server rather
than just browsing to `file:///`, like this:

```
 λ cd serverless-webrtc
 λ python -m SimpleHTTPServer 8001 .
Serving HTTP on 0.0.0.0 port 8001 ...
```

and then browse to [http://localhost:8001/](http://localhost:8001/).

#### Blog posts with more details:

http://blog.printf.net/articles/2013/05/17/webrtc-without-a-signaling-server

http://blog.printf.net/articles/2014/07/01/serverless-webrtc-continued

#### Browser demo link:

http://cjb.github.io/serverless-webrtc/serverless-webrtc.html

-- Chris Ball <chris@printf.net> (http://printf.net/)

#### Multi-node capability

serverless-webrtc-multinode.html adds on top of serverless-webrtc.html the functionality of many-to-many connections.

It just does so by making a new WebRTC peer connection for each new pair of users.

Peer connections are either ''Guest'' connections (Bob the recipient), or ''Host'' connections (Alice the sender)

An unordered list (labeled ''Network'') at the bottom of the page shows all the connections made between you and other users.

You could send text to all connected users at once via the ''Send to all'' button, or to a particular user via the ''Send''

button near his/her nickname in the ''Network'' list.

Individual connections can also be closed, or queried for their Round Trip Duration (labeled RTD) via the ''Latency'' button.

RTD is queried by sending an ''echo request'' package, which automatically triggers an ''echo response'' from the other user.

One could optionally use different nicknames for different connections.
