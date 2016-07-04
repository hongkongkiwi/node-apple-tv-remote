
//curl -H "Host: 192.168.1.140:3689" -H "Viewer-Only-Client: 1" -H "Client-ATV-Sharing-Version: 1.2" -H "Accept: */*" -H "Accept-Language: en-us" -H "Client-iTunes-Sharing-Version: 3.10" -H "Client-DAAP-Version: 3.12" -H "User-Agent: Remote/875" --compressed http://192.168.1.140:3689/login?pairing-guid=0x26C361EA5232AD63&hasFP=1

var Promise = require('bluebird');
var _ = require('underscore');
var mdns = require('mdns');
var debug = require('debug')('atv::Remote');
var cmdDebug = require('debug')('atv::Remote::Cmds');
var md5 = require('md5');
var crypto = require('crypto');
var express = require('express');
var app = express();
var getPort = Promise.promisify(require('portfinder').getPort);
var randomBytes = Promise.promisify(crypto.randomBytes);
var isReachable = Promise.promisify(require('is-reachable'));

//var Parser = require('./Parser');
var Parser = require('../ResponseParser2');

var Remote = function(host, options) {
  if (!host) {
    throw Error("Must supply IP Address");
  }

  // var pairCode = '4EA92B4292701F31'.toUpperCase();
  // var pinCode = '8222';

  this.options = _.extendOwn({
    headers: { // Not really sure what all these are for, but just copied from Apple app
      'Viewer-Only-Client': 1,
      'Client-DAAP-Version': '3.11',
      'Client-iTunes-Sharing-Version': '3.9',
      'Client-ATV-Sharing-Version': '1.2',
      'User-Agent': 'Remote/875'
    },
    pairServer: {
      mdnsName: '0000000000000000000000000000000000000001', // We should probably generate this?
      listenPort: 49152, // We should use something to find a free port
      pairingTimeout: 60, // 30 seconds
      pairCode: null, // Should generate this, otherwise pass a 16 character hex string
      pairingName: 'node.js atv-remote remote', // This shows up in the search on the device for pairing
      pinCode: null, // By default this is generated, otherwise pass a 4 digit string
      deviceName: 'Node.js Testing Script', // This is what shows up in settings once paired
      deviceType: 'ipod'
    },
    port: 3689,
  }, options);

  this.guid = null;

  /** Private Stuff **/
  var promptId = 1;
  var sessionId = null;
  var revisionNumber = 1;

  this.setAddress(host,this.options.port);

  // Builds the URL from cmd value
  var _cmd = function(cmd, params) {
    var url = '' + cmd + '?sessionId=' + sessionId;
    if (params) {
      for (var key in params) {
        var value = params[key];
        if (_.isArray(value)) {
          url += '&' + key + '=' + value.join(',');
        } else {
          url += '&' + key + '=' + value;
        }
      }
    }
    return url;
  };

  this._rp = require('request-promise').defaults({
    baseUrl: this.baseUrl,
    headers: this.options.headers,
    encoding: null,
    method: 'GET'
  });

  this._resetValues();
};

// 'Accept': '*/*',
// 'Content-Type': 'application/x-www-form-urlencoded',
// 'Accept-Encoding': 'gzip',
// 'Pragma': 'no-cache',
// 'Accept-Language': 'en-us',

// Parses the incoming binary result
Remote.prototype._parseResult = function(result) {
  // var p = new Parser(result);
  // return p.parse();
  return Parser.parse(result);
};

Remote.prototype._resetValues = function() {
  promptId = 1;
  sessionId = null;
  revisionNumber = 1;
};

// Builds the base url
Remote.prototype.setAddress = function(host, port) {
  this.host = host;
  this.port = port;
  this.baseUrl = 'http://' + this.host + ":" + this.port;
};

/** Methods **/
Remote.prototype._computePairingHash = function(pairCode, pinCode) {
  //https://searchcode.com/codesearch/view/13799720/
  var code = pairCode.toUpperCase() + pinCode.substr(0,1) + '\0' + pinCode.substr(1,1) + '\0' + pinCode.substr(2,1) + '\0' + pinCode.substr(3,1) + '\0';
  return md5(code).toUpperCase();
};

/** Constants **/
Remote.BUTTONS = {
  UP: {name: 'UP', code: [
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchDown&time=0&point=20,275",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=1&point=20,270",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=2&point=20,265",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=3&point=20,260",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=4&point=20,255",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=5&point=20,250",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1BtouchUp&time=6&point=20,250"
  ]},
  DOWN: {name: 'DOWN', code: [
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchDown&time=0&point=20,250",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=1&point=20,255",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=2&point=20,260",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=3&point=20,265",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=4&point=20,270",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=5&point=20,275",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1BtouchUp&time=6&point=20,275"
  ]},
  LEFT: {name: 'LEFT', code: [
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1EtouchDown&time=0&point=75,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=1&point=70,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=3&point=65,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=4&point=60,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=5&point=55,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=6&point=50,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1BtouchUp&time=7&point=50,100"
  ]},
  RIGHT: {name: 'RIGHT', code: [
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchDown&time=0&point=50,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=1&point=55,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=3&point=60,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=4&point=65,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=5&point=70,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1DtouchMove&time=6&point=75,100",
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x1BtouchUp&time=7&point=75,100"
  ]},
  MENU: {name: 'MENU', code: [
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x04menu"
  ]},
  SELECT: {name: 'SELECT', code: [
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x06select"
  ]},
  HOME: {name: 'HOME', code: [
    "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x07topmenu"
  ]},
  // STOP: {name: 'STOP', code: [
  //   "cmcc\x00\x00\x00\x01\x30cmbe\x00\x00\x00\x07topmenu"
  // ]}
};

Remote.REPEAT_STATE = {
  OFF: {name: 'OFF', code: 0},
  ONCE: {name: 'ONCE', code: 1},
  ALWAYS: {name: 'ALWAYS', code: 2}
};

Remote.SHUFFLE_STATE = {
  OFF: {name: 'OFF', code: 0},
  ON: {name: 'OFF', code: 1},
};

Remote.prototype.isHostUp = function() {
  var me = this;
  return new Promise(function(resolve,reject) {
    return isReachable(me.host + ':' + me.port).then(function(isReachable) {
      if (!isReachable) return reject('Host not reachable!');
      resolve();
    });
  });
};

Remote.prototype.getPinCode = function(context) {
  function pad(n, width, z) {
    z = z || '0';
    n = n + '';
    return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
  }

  context = context || this;
  if (!context.options.pairServer.pinCode) {
    var min = 1;
    var max = 9999;
    context.options.pairServer.pinCode = pad((Math.floor(Math.random() * (max - min + 1)) + min),4);
  }
  return context.options.pairServer.pinCode;
};

Remote.prototype.pair = function(withTimeout) {
  var me = this;
  var psOpts = this.options.pairServer;
  withTimeout = withTimeout || psOpts.pairingTimeout;
  return new Promise(function(resolve,reject) {
    return randomBytes(8).then(function(buf) {
      var pairCode = psOpts.pairCode ? psOpts.pairCode : buf.toString('hex').toUpperCase();
      var pinCode = me.getPinCode(me);
      var expectedHash = me._computePairingHash(pairCode,pinCode);

      debug('Your Pairing PinCode is ' + pinCode);

      return getPort();
    }).then(function(port) {
      var ad = mdns.createAdvertisement(mdns.tcp('touch-remote'), psOpts.listenPort, {
        name: psOpts.mdnsName,
        txtRecord: {
          DvNm: psOpts.pairingName,
          RemV: '10000',
          DvTy: 'iPod',
          RemN: 'Remote',
          txtvers: '1',
          Pair: pairCode,
        }
      });

      app.get('/pair', function (req, res) {
        var query = req.query;
        var clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
        debug('Got Pair Request from ' + clientIp);

        if (query.hasOwnProperty('pairingcode') && query.hasOwnProperty('servicename')) {
          if (query.pairingcode === expectedHash) {
            debug('Correct Pairing Code');

            randomBytes(8).then(function(randBuf) {
                me.guid = me.guid ? me.guid : randBuf.toString('hex').toUpperCase();

                debug('Using GUID: ' + me.guid);

                var lenBuf = Buffer.alloc(4);
                var valueBuf;
                var buf;

                valueBuf = Buffer.from(me.guid, 'hex');
                lenBuf.writeInt32BE(valueBuf.length);
                buf = Buffer.concat([Buffer.from('cmpg'), lenBuf, valueBuf]);

                valueBuf = Buffer.from(psOpts.deviceName);
                lenBuf.writeInt32BE(valueBuf.length);
                buf = Buffer.concat([buf, Buffer.from('cmnm'), lenBuf, valueBuf]);

                valueBuf = Buffer.from(psOpts.deviceType);
                lenBuf.writeInt32BE(valueBuf.length,0);
                buf = Buffer.concat([buf, Buffer.from('cmty'), lenBuf, valueBuf]);

                lenBuf.writeInt32BE(buf.length);
                buf = Buffer.concat([Buffer.from('cmpa'), lenBuf, buf]);

                res.status(200).send(buf);
                closeServer();
                resolve(me.guid);
            });
          } else {
            debug('Invalid Pairing Code. Please try again.');
            res.sendStatus(404);
          }
        } else {
          res.sendStatus(404);
          closeServer();
          reject('Invalid Data Sent to Server');
        }
      });

      var timerId;
      var server = app.listen(psOpts.listenPort, function () {
        ad.start();
        debug('Waiting for Pairing Request on port ' + psOpts.listenPort + ' timeout ' + withTimeout + ' seconds');
        timerId = setTimeout(function() {
          debug('Pairing Request Timed Out');
          closeServer();
          reject();
        }, withTimeout * 1000);
      });

      function closeServer() {
        timerId = clearTimeout(timerId);
        ad.stop();
        server.close();
      }
    });
  });
};

Remote.prototype.login = function(guid) {
  var me = this;

  if (!guid) return new Error('Must supply guid!');

  var options = {
    uri: '/login?pairing-guid=' + guid + '&hasFP=1',
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      debug(result);
      sessionId = result.mlog.mlid;
      return result.mlog.mlid;
    });
};

Remote.prototype.logout = function() {
  var me = this;
  return new Promise(function(resolve,reject) {
    if (!sessionId || sessionId === 0)
      return reject("Not Logged In"); // TODO: result successful promise

    var options = {
      uri: '/logout?session-id=' + sessionId,
    };

    return this._rp(options)
      .then(function() {
        _resetValues();
        resolve();
      });
  });
};

/* 	toggle between play and pause */
Remote.prototype.sendPlayPause = function() {
  cmdDebug('Play/Pause');

  var options = {
    uri: _cmd('playpause')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

/*	play after fast forward or rewind */
Remote.prototype.playResume = function() {
  cmdDebug('Play/Resume');

  var options = {
    uri: _cmd('playresume')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.sendPlay = function() {
  cmdDebug('Play');

  var options = {
    uri: _cmd('play')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.sendPause = function() {
  cmdDebug('Pause');

  var options = {
    uri: _cmd('pause')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.sendStop = function() {
  cmdDebug('Stop');

  var options = {
    uri: _cmd('stop')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.sendFastReverse = function() {
  cmdDebug('Fast Reverse');

  var options = {
    uri: _cmd('beginrew')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.sendFastFoward = function() {
  cmdDebug('Fast Forward');

  var options = {
    uri: _cmd('beginff')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.sendSkipPrevious = function() {
  cmdDebug('Skip Previous');

  var options = {
    uri: _cmd('previtem')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.sendSkipNext = function() {
  cmdDebug('Skip Next');

  var options = {
    uri: _cmd('nextitem')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.setProperties = function(properties) {
  cmdDebug('Setting Properties', properties);

  var options = {
    uri: _cmd('setproperty', properties)
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.setProperty = function(property, value) {
  var params = {};
  params[property] = value;
  return this.setProperties(params);
};

Remote.prototype.getProperty = function(property) {
  if (!property || typeof property !== 'string')
    throw new Error('Invalid property passed! Must be property name');

  return this.setProperties([property]);
};

Remote.prototype.getProperties = function(properties) {
  if (!properties || !_.isArray(properties))
    throw new Error('Invalid properties array passed! Must be array of property names');

  cmdDebug('Getting Properties', properties);

  var options = {
    uri: _cmd('getproperty', {'proeprty': properties})
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.getShuffleState = function() {
  return this.getProperty('dacp.shufflestate');
};

Remote.prototype.setShuffleState = function(state) {
  var states = Remote.SHUFFLE_STATES;

  if (!state || state !== 'object' || !states.hasOwnProperty(state.name))
    throw new Error('Invalid Shuffle State! Please use Remote.SHUFFLE_STATES for available states');

  if (state.code < 0 || state.code > 1)
    throw new Error("Invalid Shuffle State Code, must be 0,1,2");

  return this.setProperty('dacp.shufflestate', state.code);
};

/* 	shuffle playlist */
Remote.prototype.shuffleSongs = function() {
  cmdDebug('Shuffle Songs');

  var options = {
    uri: _cmd('shuffle_songs')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.getRepeatState = function() {
  return this.getProperty('dacp.repeatstate');
};

Remote.prototype.setRepeatState = function(value) {
  var states = Remote.REPEAT_STATES;

  if (!state || state !== 'object' || !states.hasOwnProperty(state.name))
    throw new Error('Invalid Repeat State! Please use Remote.REPEAT_STATES for available states');

  if (state.code < 0 || state.code > 2)
    throw new Error("Invalid Repeat State Code, must be 0,1,2");

  cmdDebug('Set Repeat State', value);

  return this.setProperty('dacp.repeatstate', state.code);
};

Remote.prototype.getVolumeLevel = function() {
  return this.getProperty('dmcp.volume');
};

Remote.prototype.setVolumeLevel = function(level) {
  cmdDebug('Set Volume Level', level);

  if (!level || level < 0.0 || level > 100.0)
    throw new Error("Invalid Volume Level, must be between 0.0 & 100.0");

  return this.setProperty('dmcp.volume', level);
};

/* 	turn audio volume down */
Remote.prototype.volumeDown = function() {
  cmdDebug('Volume Down');

  var options = {
    uri: _cmd('volumedown')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

/* 	turn audio volume up */
Remote.prototype.volumeUp = function() {
  cmdDebug('Volume Up');

  var options = {
    uri: _cmd('volumeup')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

/* 	toggle mute status */
Remote.prototype.muteToggle = function() {
  cmdDebug('Mute Toggle');

  var options = {
    uri: _cmd('mutetoggle')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.getNowPlayingArtwork = function(minWidth, minHeight) {
  cmdDebug('Get Now Playing Artwork', {minWidth: minWidth, minHeight: minHeight});

  var options = {
    uri: _cmd('nowplayingartwork', {'mw': minWidth, 'mh': minHeight})
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.getNowPlayingProperties = function() {
  cmdDebug('Get Now Playing Properties');

  var properties = [
    'dacp.playerstate',
    'dacp.nowplaying',
    'dacp.playingtime',
    'dmcp.volume',
    'dacp.volumecontrollable',
    'dacp.availableshufflestates',
    'dacp.availablerepeatstates',
    'dacp.shufflestate',
    'dacp.repeatstate',
    'dacp.fullscreenenabled',
    'dacp.fullscreen',
    'dacp.visualizerenabled',
    'dacp.visualizer',
    'com.apple.itunes.itms-songid',
    'com.apple.itunes.has-chapter-data',
    'com.apple.itunes.mediakind',
    'com.apple.itunes.extended-media-kind'
  ];

  return this.getProperties(properties);
};

Remote.prototype.getNowPlayingStatusUpdate = function() {
  cmdDebug('Get Now Playing Status Update');

  var options = {
    uri: _cmd('playstatusupdate', {'revision-number': revisionNumber})
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.sendUpButton = function() {
  return this.sendButtonPress(Remote.BUTTONS.UP);
};

Remote.prototype.sendDownButton = function() {
  return this.sendButtonPress(Remote.BUTTONS.DOWN);
};

Remote.prototype.sendLeftButton = function() {
  return this.sendButtonPress(Remote.BUTTONS.LEFT);
};

Remote.prototype.sendRightButton = function() {
  return this.sendButtonPress(Remote.BUTTONS.RIGHT);
};

Remote.prototype.sendMenuButton = function() {
  return this.sendButtonPress(Remote.BUTTONS.MENU);
};

Remote.prototype.sendSelectButton = function() {
  return this.sendButtonPress(Remote.BUTTONS.SELECT);
};

Remote.prototype.sendHomeButton = function() {
  return this.sendButtonPress(Remote.BUTTONS.HOME);
};

Remote.prototype.sendButtonPress = function(button) {
  var buttons = Remote.BUTTONS;

  if (button !== 'object' || !buttons.hasOwnProperty(button.name))
    throw new Error('Invalid Button Type! Please use Remote.BUTTONS for available types');

  cmdDebug('Send Button Press', button.name);

  function prepareBody(cmdArray) {

  }

  var options = {
    method: 'POST',
    body: prepareBody(button.code),
    uri: _cmd('controlpromptentry', {'prompt-id': this.promptId})
  };

  this.promptId++;
  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

/**
I think these are only for iTunes, so far these are untested
https://searchcode.com/codesearch/view/9466951/
**/

Remote.prototype.getDatabases = function() {
  cmdDebug('Get Databases');

  var options = {
    uri: _cmd('databases') // Note: {'revision-id': 1} seems optional
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.getPlaylists = function(databaseId) {
  cmdDebug('Get Playlists', {'databaseId': databaseId});

  var options = {
    uri: _cmd('databases/' + databaseId + 'containers', {
      'revision-id': 1,
      'meta': ['dmap.itemid','dmap.itemname','dma.persistentid','com.apple.itunes.smart-playlist']
    })
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.getPlaylist = function(databaseId, playlistId) {
  cmdDebug('Get Playlists', {'databaseId': databaseId, 'playlistId': playlistId});

  var options = {
    uri: _cmd('databases/' + databaseId + '/containers/items', {
      'revision-id': 1,
      'type': 'music',
      'meta': ['dmap.itemkind','dmap.itemid','dmap.containeritemid']
    })
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.getSpeakers = function() {
  cmdDebug('Get Speakers');

  var options = {
    uri: _cmd('getspeakers')
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.setSpeakers = function(speakerIds) {
  cmdDebug('Set Speakers', speakerIds);

  // for (int i = 0; i < ids.Length; i++)
  //  {
  //      if (ids[i].Length == 1 && ids[i][0] == 0)
  //          uriBuilder.Append("0");
  //      else
  //          uriBuilder.AppendFormat("0x{0}", DaapMessage.ToHexString(ids[i]));
  //      if (i < ids.Length - 1)
  //          uriBuilder.Append(",");
  //  }

  var options = {
    uri: _cmd('setspeakers', {'speaker-id': speakerIds})
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};


Remote.prototype.fpSetup = function() {
  cmdDebug('FP Setup');

  var options = {
    uri: '/fp-setup'
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};
Remote.prototype.serverInfo = function() {
  var options = {
    uri: '/server-info'
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.ctrlInit = function() {
  cmdDebug('ctrlInit');

  var options = {
    uri: '/ctrl-int'
  };

  return this._rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

module.exports = Remote;
