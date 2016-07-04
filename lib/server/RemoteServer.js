var Promise = require('bluebird');
var mdns = require('mdns');
var _ = require('underscore');
var express = require('express');
var EventEmitter = require('events');
var rp = require('request-promise');
var rpErrors = require('request-promise/errors');
var util = require('util');
var crypto = require('crypto');
var randomBytes = Promise.promisify(crypto.randomBytes);
var md5 = require('md5');

// TODO: Write server portion so we can interact with this using Remote app on iOS or other compatible clients

var RemoteServer = function(options) {
  this.options = _.extendOwn({
    listenPort: 3869,
    bonjourClientService: 'touch-remote',
    bonjourTouchableServerService: 'touch-able',
    bonjourDACPServerService: 'dacp',
    guidLength: 16,
    persistGuids: true
  }, options);

  this.mdns_options = {
    name: 'Node Server',
    txtRecord: {
      DvTy: 'Node-Server',
      txtvers: '1',
    }};

  this.ads = [
    mdns.createAdvertisement(mdns.tcp(this.options.bonjourTouchableServerService), this.options.listenPort, this.mdns_options),
    mdns.createAdvertisement(mdns.tcp(this.options.bonjourDACPServerService), this.options.listenPort, this.mdns_options)
  ];

  this.app = express();

  this.browser = mdns.createBrowser(mdns.tcp(this.options.bonjourClientService));

  this.guids = {}; // Lets save/load this to disk
  this.sessionIds = {};
  this.lastSessionId = 0;

  // Add Command Routes
  require('./RemoteServerCommands')(this);
};

util.inherits(RemoteServer, EventEmitter);

/** Methods **/
RemoteServer.prototype._computePairingHash = function(pairCode, pinCode) {
  //https://searchcode.com/codesearch/view/13799720/
  var code = pairCode.toUpperCase() + pinCode.substr(0,1) + '\0' + pinCode.substr(1,1) + '\0' + pinCode.substr(2,1) + '\0' + pinCode.substr(3,1) + '\0';
  return md5(code).toUpperCase();
};

RemoteServer.prototype.CONTROLS = {
  UP: 'control_up',
  DOWN: 'control_down',
  LEFT: 'control_left',
  RIGHT: 'control_right',
  MENU: 'control_menu',
  SELECT: 'control_select',
};

RemoteServer.prototype.startServer = function() {
  var me = this;
  return new Promise(function(resolve,recject) {
    me.app.listen(me.options.listenPort, function (err) {
      if (err) return reject(err);
      for (var ad in this.ads) {
        ad.start();
      }
      resolve();
    });
  });
};

RemoteServer.prototype.stopServer = function() {
  var me = this;
  return new Promise(function(resolve,rejcect) {
    me.ads.forEach(function(ad) {
      if (ad) ad.stop();
    });
    me.stopSearchForClients();
    resolve();
  });
};

// Search local network for clients
RemoteServer.prototype.startSearchForClients = function(context) {
  context = context || this;
  var clients = {};
  context.browser.on('serviceUp', function(service) {
    context.emit('client found', service);
  });
  context.browser.start();
};

RemoteServer.prototype.stopSearchForClients = function(context) {
  context = context || this;
  if (context.browser) {
    context.browser.stop();
    context.browser.removeAllListeners();
  }
};

RemoteServer.prototype.getSessionId = function(info) {
  if (!info) info = {};
  this.lastSessionId++;
  var sessionId = this.lastSessionId;
  this.sessionIds[sessionId] = _.extendOwn(info, {expiry: Date.now()});
  return sessionId;
};

RemoteServer.prototype.removeSessionId = function(sessionId) {
  delete this.sessionIds[sessionId];
};

// Used to check if an individual session id is valid
RemoteServer.prototype.isSessionIdValid = function(sessionId) {
  var expiry = this.sessionIds[sessionId];
  if (!expiry) {
    return false;
  } else {
    return true;
  }
};

// Used for cleanup of session Ids
RemoteServer.prototype.expireInvalidSessionIds = function() {
  for (var sessionId in this.sessionIds) {
    if (isSessionIdValid(sessionId)) {
      this.removeSessionId(sessionId);
    }
  }
};

RemoteServer.prototype.generateGUID = function() {
  var context = this;
  return randomBytes(context.options.guidLength).then(function(buf) {
    var guid = buf.toString('hex');
    return guid;
  });
};

RemoteServer.prototype.addGUID = function(guid, info) {
  if (this.guids.hasOwnProperty(guid)) {
    throw new Error('GUID already exists!');
  }
  this.guids[guid] = info;
};

RemoteServer.prototype.removeGUID = function(guid) {
  delete this.guids[guid];
};

RemoteServer.prototype.pairWithClient = function(clientUrl, pinCode, pairCode, context) {
  context = context || this;
  return new Promise(function(resolve, reject) {
    // Request /pair to the client
    // Make a request to clientUrl with correct hash

    var name = context.mdns_options.name;

    // If response is correct then generate guid
    return context.generateGUID().then(function(guid) {
      var hash = context._computePairingHash(pairCode, pinCode);
      var url = clientUrl + '/pair?pairingcode=' + hash + '&servername=' + name;
      var options = {
        method: 'GET',
        url: url,
        encoding: null
      };
      console.log(options);
      return rp(options);
    }).then(function(result) {
      console.log(result);
      resolve();
    }).catch(rpErrors.StatusCodeError, function(reason) {
      if (reason.statusCode === 404) {
        reject('Invalid PinCode');
      } else {
        throw err;
      }
    });
    // If response fails then reject
  });
};

module.exports = RemoteServer;
