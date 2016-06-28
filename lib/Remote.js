
//curl -H "Host: 192.168.1.140:3689" -H "Viewer-Only-Client: 1" -H "Client-ATV-Sharing-Version: 1.2" -H "Accept: */*" -H "Accept-Language: en-us" -H "Client-iTunes-Sharing-Version: 3.10" -H "Client-DAAP-Version: 3.12" -H "User-Agent: Remote/875" --compressed http://192.168.1.140:3689/login?pairing-guid=0x26C361EA5232AD63&hasFP=1

var Promise = require('bluebird');
var rp = require('request-promise');
var _ = require('underscore');
var Parser = require('./Parser');
var mdns = require('mdns');
var debug = require('debug')('atv-remote::Finder');
var md5 = require('md5');
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
      pinCode: pinCode
    }
  }, options);

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

Remote.prototype.pair = function() {
  var me = this;
  var psOpts = this.options.pairServer;
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
      console.log('Got Pair Request from ' + clientIp);

      if (query.hasOwnProperty('pairingcode') && query.hasOwnProperty('servicename')) {
        if (query.pairingcode === expectedHash) {
          console.log('Correct Pairing Code');

          var values = {
            'cmpg': '\x00\x00\x00\x00\x00\x00\x00\x01',
          	'cmnm': 'devicename',
          	'cmty': 'ipod',
          };

      		// encoded = ''
      		// for key, value in values.iteritems():
      		// 	encoded += '%s%s%s' % (key, struct.pack('>i', len(value)), value)
      		// header = 'cmpa%s' % (struct.pack('>i', len(encoded)))
      		// encoded = '%s%s' % (header, encoded)

          //https://github.com/melloware/dacp-net/blob/master/Melloware.DACP/PairingClientResponse.cs

          res.send(200);
          closeServer();
          resolve();
        } else {
          console.log('Invalid Pairing Code. Please try again.');
          res.send(404);
        }
      } else {
        res.send(404);
        closeServer();
        reject('Invalid Data Sent to Server');
      }
    });

    var timerId;
    var server = app.listen(psOpts.listenPort, function () {
      ad.start();
      console.log('Waiting for Pairing Request on port ' + psOpts.listenPort);
      timerId = setTimeout(function() {
        console.log('Pairing Request Timed Out');
        closeServer();
        reject();
      }, psOpts.pairingTimeout * 1000);
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
      console.log(result);
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
