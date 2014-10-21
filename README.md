upnp-mediarenderer-client
=========================
### An UPnP/DLNA MediaRenderer client

This module allows you to control an UPnP/DLNA MediaRenderer directly (usually your TV set). It implements load, play, pause, stop and seek commands.

UPnP/DLNA being a hell of a complicated and poorly implemented protocol, this will probably not work everywhere as it is. If it doesn't and you wish to invest time in it, please post an issue and prepare your debugging belt !

Installation
------------

```bash
$ npm install upnp-mediarenderer-client
```

Usage
-----

```javascript
var MediaRendererClient = require('upnp-mediarenderer-client');

// Instanciate a client with a device description URL (discovered by SSDP)
var client = new MediaRendererClient('http://192.168.1.50:4873/foo.xml');

// Load a stream and play it immediately
client.load('http://url.to.some/stream.avi', { autoplay: true }, function(err, result) {
  if(err) throw err;
  console.log('playing ...');
});

// Pause the current playing stream
client.pause();

// Unpause
client.play();

// Stop
client.stop();

// Seek to 10 minutes
client.seek(10 * 60);
```
