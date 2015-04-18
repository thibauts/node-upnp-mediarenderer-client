var DeviceClient = require('upnp-device-client');
var util = require('util');
var debug = require('debug')('upnp-mediarenderer-client');

var MEDIA_EVENTS = [
  'status',
  'loading',
  'playing',
  'paused',
  'stopped',
  'speedChanged'
];

function MediaRendererClient(url) {
  DeviceClient.call(this, url);
  this.instanceId = 0;

  // Subscribe / unsubscribe from AVTransport depending
  // on relevant registered / removed event listeners.
  var self = this;
  var refs = 0;
  var receivedState;

  this.addListener('newListener', function(eventName, listener) {
    if(MEDIA_EVENTS.indexOf(eventName) === -1) return;
    if(refs === 0) {
      receivedState = false;
      self.subscribe('AVTransport', onstatus);
    }
    refs++;
  });

  this.addListener('removeListener', function(eventName, listener) {
    if(MEDIA_EVENTS.indexOf(eventName) === -1) return;
    refs--;
    if(refs === 0) self.unsubscribe('AVTransport', onstatus);
  });

  function onstatus(e) {
    self.emit('status', e);

    if(!receivedState) {
      // Starting from here we only want state updates.
      // As the first received event is the full service state, we ignore it.
      receivedState = true;
      return;
    }

    if(e.hasOwnProperty('TransportState')) {
      switch(e.TransportState) {
        case 'TRANSITIONING':
          self.emit('loading');
          break;
        case 'PLAYING':
          self.emit('playing');
          break;
        case 'PAUSED_PLAYBACK':
          self.emit('paused');
          break;
        case 'STOPPED':
          self.emit('stopped');
          break;
      }
    }

    if(e.hasOwnProperty('TransportPlaySpeed')) {
      self.emit('speedChanged', Number(e.TransportPlaySpeed));
    }
  }

}

util.inherits(MediaRendererClient, DeviceClient);


MediaRendererClient.prototype.getSupportedProtocols = function(callback) {
  this.callAction('ConnectionManager', 'GetProtocolInfo', {}, function(err, result) {
    if(err) return callback(err);
    
    //
    // Here we leave off the `Source` field as we're hopefuly dealing with a Sink-only device.
    //
    var lines = result.Sink.split(',');

    var protocols = lines.map(function(line) {
      var tmp = line.split(':');
      return {
        protocol: tmp[0],
        network: tmp[1],
        contentFormat: tmp[2],
        additionalInfo: tmp[3]
      };
    });

    callback(null, protocols);
  });
};


MediaRendererClient.prototype.load = function(url, options, callback) {
  var self = this;
  if(typeof options === 'function') {
    callback = options;
    options = {};
  }


  var contentType = options.contentType || 'video/mpeg'; // Default to something generic

  var metadata = options.metadata || null;

  var params = {
    RemoteProtocolInfo: 'http-get:*:' + contentType + ':*',
    PeerConnectionManager: null,
    PeerConnectionID: -1,
    Direction: 'Input'
  };

  this.callAction('ConnectionManager', 'PrepareForConnection', params, function(err, result) {
    if(err) {
      if(err.code !== 'ENOACTION') {
        return callback(err);
      }
      //
      // If PrepareForConnection is not implemented, we keep the default (0) InstanceID
      //
    } else {
      self.instanceId = result.AVTransportID;    
    }

    var params = {
      InstanceID: self.instanceId,
      CurrentURI: url,
      CurrentURIMetaData: metadata
    };

    self.callAction('AVTransport', 'SetAVTransportURI', params, function(err) {
      if(err) return callback(err);
      if(options.autoplay) {
        self.play(callback);
        return;
      }
      callback();
    });
  });
};


MediaRendererClient.prototype.play = function(callback) {
  var params = {
    InstanceID: this.instanceId,
    Speed: 1,
  };
  this.callAction('AVTransport', 'Play', params, callback || noop);
};


MediaRendererClient.prototype.pause = function(callback) {
  var params = {
    InstanceID: this.instanceId
  };
  this.callAction('AVTransport', 'Pause', params, callback || noop);
};


MediaRendererClient.prototype.stop = function(callback) {
  var params = {
    InstanceID: this.instanceId
  };
  this.callAction('AVTransport', 'Stop', params, callback || noop);
};


MediaRendererClient.prototype.seek = function(seconds, callback) {
  var params = {
    InstanceID: this.instanceId,
    Unit: 'REL_TIME',
    Target: formatTime(seconds)
  };
  this.callAction('AVTransport', 'Seek', params, callback || noop);
};


function formatTime(seconds) {
  var h = 0;
  var m = 0;
  var s = 0;
  h = Math.floor((seconds - (h * 0)    - (m * 0 )) / 3600); 
  m = Math.floor((seconds - (h * 3600) - (m * 0 )) / 60);
  s =            (seconds - (h * 3600) - (m * 60));

  function pad(v) {
    return (v < 10) ? '0' + v : v;
  }

  return [pad(h), pad(m), pad(s)].join(':');
}


function noop() {}


module.exports = MediaRendererClient;
