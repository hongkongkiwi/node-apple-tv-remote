var Remote = require('./Remote');
var mdns = require('mdns');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var debug = require('debug')('atv::RemoteFinder');

var RemoteFinder = function(options) {
  this.options = _.extendOwn({
    serviceName: 'touch-able',
    atvProductName: 'AppleTV',
    foundRemoteOptions: {},
    defaultScanTimeout: 5
  }, options);

  debug('Created RemoteFinder instance');

  var me = this;

  this.foundHosts = [];

  this.browser = mdns.createBrowser(mdns.tcp(this.options.serviceName));
  this.browser.on('serviceUp', function(service) {
    me._foundHost(service,me);
  });
};

util.inherits(RemoteFinder, EventEmitter);

RemoteFinder.prototype._foundHost = function(service,me) {
  if (service.txtRecord.DvTy.substr(0,me.options.atvProductName.length) === me.options.atvProductName) {
    if (me.foundHosts.indexOf(service.host) === -1) {
      me.foundHosts.push(service.host);
      debug('Found Host: ' + service.host);
      me.emit('found', new Remote(service.host), me.options.foundRemoteOptions);
    }
  }
};

RemoteFinder.prototype.startSearching = function(withTimeout) {
  if (withTimeout < 1) {
    throw Error('Invalid Timeout!');
  }

  if (!withTimeout) {
    withTimeout = this.options.defaultScanTimeout;
  }

  this.foundHosts = [];
  debug('Starting Scan with Timeout ' + withTimeout + ' seconds');
  this.browser.start();
  var me = this;
  this.timerId = setInterval(function() {
    me.stopSearching();
  }, withTimeout * 1000);
};

RemoteFinder.prototype.stopSearching = function() {
  this.timerId = clearTimeout(this.timerId);
  this.browser.stop();
  debug('Stopped Scan');
  debug('Found ' + this.foundHosts.length + ' hosts on scan');
};

module.exports = RemoteFinder;
