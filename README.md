upnp-mediarenderer-client
=========================
### An UPnP/DLNA MediaRenderer client

This module allows you to control an UPnP/DLNA MediaRenderer directly (usually your TV set). It implements load, play, pause, stop and seek commands.

Events coming from the MediaRenderer (ie. fired from the TV remote) such as `playing`, `paused`, `stopped` can be listened to, too.

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

client.on('status', function(status) {
  // Reports the full state of the AVTransport service the first time it fires,
  // then reports diffs. Can be used to maintain a reliable copy of the
  // service internal state.
  console.log(status);
});

client.on('loading', function() {
  console.log('loading');
});

client.on('playing', function() {
  console.log('playing');
});

client.on('paused', function() {
  console.log('paused');
});

client.on('stopped', function() {
  console.log('stopped');
});

client.on('speedChanged', function(speed) {
  // Fired when the user rewinds of fast-forwards the media from the remote
  console.log('speedChanged', speed);
});
```
