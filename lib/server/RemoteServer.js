var Promise = require('bluebird');
var mdns = require('mdns');
var _ = require('underscore');
var express = require('express');
var EventEmitter = require('events');
var rp = require('request-promise');
var util = require('util');

// TODO: Write server portion so we can interact with this using Remote app on iOS or other compatible clients

var RemoteServer = function(options) {
  this.options = _.extendOwn({
    listenPort: 3869,
    bonjourClientService: 'touch-able',
    bonjourServerService: 'touch-able',
    guidLength: 16,
    persistGuids: true
  }, options);

  var port = this.options.listenPort;
  var bonjourService = this.options.bonjourService;
  this.ad = mdns.createAdvertisement(mdns.tcp(bonjourClientService), port);
  this.app = express();

  this.browser = mdns.createBrowser(mdns.tcp(bonjourServerService));

  this.guids = {}; // Lets save/load this to disk
  this.sessionIds = {};
  this.lastSessionId = 0;

  // Add Command Routes
  require('./RemoteServerCommands')(this);
};

util.inherits(RemoteServer, EventEmitter);

RemoteServer.prototype.CONTROLS = {
  UP: 'control_up',
  DOWN: 'control_down',
  LEFT: 'control_left',
  RIGHT: 'control_right',
  MENU: 'control_menu',
  SELECT: 'control_select',
};

RemoteServer.prototype.startServer = function() {
  this.app.listen(port, function () {
    this.ad.start();
  });
};

RemoteServer.prototype.stopServer = function() {
  this.ad.stop();
};

// Search local network for clients
RemoteServer.prototype.startSearchingForClients = function(withTimeout) {
  // watch all http servers
  browser.on('serviceUp', function(service) {
    console.log("service up: ", service);
  });
  browser.on('serviceDown', function(service) {
    console.log("service down: ", service);
  });
  browser.start();
};

RemoteServer.prototype.stopSearchingForClients = function() {
  if (this.browser) {
    this.browser.stop();
    this.browser.removeAllListeners();
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

RemoteServer.prototype.generateGUID = function(callback) {
  var context = this;
  crypto.randomBytes(context.options.guidLength, function(err, buf) {
    if (err) return callback(err);
    var guid = buf.toString('hex');
    callback(null, guid);
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

RemoteServer.prototype.pairWithClient = function(clientUrl, pinCode, pairCode) {
  var context = this;
  return new Promise(function(resolve, reject) {
    // Request /pair to the client
    // Make a request to clientUrl with correct hash

    // If response is correct then generate guid
    context.generateGUID(function(err, guid) {
      var url = clientUrl + '?passcode=' + hash + '&servername=' + blah;
      var options = {
        method: 'GET',
        url: url
      };
      context.rp(options).then(function(result) {

        resolve();
      });
    });
    // If response fails then reject
  });
};

module.exports = RemoteServer;

var server = new RemoteServer();
