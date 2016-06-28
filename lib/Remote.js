
//curl -H "Host: 192.168.1.140:3689" -H "Viewer-Only-Client: 1" -H "Client-ATV-Sharing-Version: 1.2" -H "Accept: */*" -H "Accept-Language: en-us" -H "Client-iTunes-Sharing-Version: 3.10" -H "Client-DAAP-Version: 3.12" -H "User-Agent: Remote/875" --compressed http://192.168.1.140:3689/login?pairing-guid=0x26C361EA5232AD63&hasFP=1

var Promise = require('bluebird');
var rp = require('request-promise');
var _ = require('underscore');
var Parser = require('./Parser');
var mdns = require('mdns');
var debug = require('debug')('atv::Remote');
var md5 = require('md5');
var crypto = require('crypto');
var express = require('express');
var app = express();

var Remote = function(ipAddress, options) {
  if (!ipAddress) {
    throw Error("Must supply IP Address");
  }

  var pairCode = '4EA92B4292701F31'.toUpperCase();
  var pinCode = '8222';

  this.options = _.extendOwn({
    headers: {
      'Viewer-Only-Client': 1,
      'Client-DAAP-Version': '3.11',
      'Client-iTunes-Sharing-Version': '3.9',
      'Client-ATV-Sharing-Version': '1.2',
      'User-Agent': 'Remote/875'
    },
    pairServer: {
      listenPort: 49152,
      pairingTimeout: 60, // 30 seconds
      pairCode: pairCode, // Should generate this
      pairingName: 'node.js atv-remote remote',
      pinCode: pinCode,
      deviceName: 'Node.js Testing Script', // This is what shows up in settings
      deviceType: 'ipod'
    }
  }, options);

  this.guid = null;
  this.promptId = 1;
  this.sessionId = null;
  this._setAddress(ipAddress,3689);
};

Remote.prototype._setAddress = function(ip, port) {
  this.ipAddress = ip;
  this.port = port;
  this.baseUrl = 'http://' + this.ipAddress + ":" + this.port;
};

// 'Accept': '*/*',
// 'Content-Type': 'application/x-www-form-urlencoded',
// 'Accept-Encoding': 'gzip',
// 'Pragma': 'no-cache',
// 'Accept-Language': 'en-us',

Remote.prototype._parser = function(result) {
  var p = new Parser(result);
  return p.parse();
};

Remote.prototype._computePairingHash = function(pairCode, pinCode) {
  //https://searchcode.com/codesearch/view/13799720/
  var code = pairCode.toUpperCase() + pinCode.substr(0,1) + '\0' + pinCode.substr(1,1) + '\0' + pinCode.substr(2,1) + '\0' + pinCode.substr(3,1) + '\0';
  return md5(code).toUpperCase();
};

Remote.prototype.pair = function(withTimeout) {
  var me = this;
  var psOpts = this.options.pairServer;
  var withTimeout = withTimeout || psOpts.pairingTimeout
  return new Promise(function(resolve,reject) {
    var expectedHash = me._computePairingHash(psOpts.pairCode,psOpts.pinCode);

    var ad = mdns.createAdvertisement(mdns.tcp('touch-remote'), psOpts.listenPort, {
      name: '0000000000000000000000000000000000000001',
      txtRecord: {
        DvNm: psOpts.pairingName,
        RemV: '10000',
        DvTy: 'iPod',
        RemN: 'Remote',
        txtvers: '1',
        Pair: psOpts.pairCode,
      }
    });

    app.get('/pair', function (req, res) {
      var query = req.query;
      var clientIp = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
      debug('Got Pair Request from ' + clientIp);

      if (query.hasOwnProperty('pairingcode') && query.hasOwnProperty('servicename')) {
        if (query.pairingcode === expectedHash) {
          debug('Correct Pairing Code');

          crypto.randomBytes(8, function(ex, buf) {
              me.guid = me.guid ? me.guid : buf.toString('hex').toUpperCase();

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
};

Remote.prototype.login = function(guid) {
  var me = this;

  if (!guid) return new Error('Must supply guid!');

  var options = {
    baseUrl: me.baseUrl,
    headers: me.options.headers,
    encoding: null,
    method: 'GET',
    uri: '/login?pairing-guid=' + guid + '&hasFP=1',
  };

  return rp(options)
    .then(me._parseResult)
    .then(function(result) {
      debug(result);
      me.sessionId = result.mlog.mlid;
      return result.mlog.mlid;
    });
};

Remote.prototype.logout = function() {
  var me = this;

  if (!me.sessionId || me.sessionId === 0) return; // TODO: result successful promise

  var options = {
    baseUrl: me.baseUrl,
    headers: this.options.headers,
    encoding: null,
    method: 'GET',
    uri: '/logout?session-id=' + me.sessionId,
  };

  return rp(options)
    .then(function() {
      me.promptId = 1;
      me.sessionId = 0;
    });
};

Remote.prototype.serverInfo = function() {
  var me = this;

  var options = {
    baseUrl: me.baseUrl,
    headers: me.options.headers,
    encoding: null,
    method: 'GET',
    uri: '/server-info'
  };

  return rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.ctrlInit = function() {
  var options = {
    method: 'GET',
    baseUrl: 'http://192.168.1.140:3689',
    uri: '/ctrl-int',
    headers: this.options.headers,
    encoding: null
  };

  return rp(options)
    .then(me._parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.fpSetup = function() {

};

module.exports = Remote;
