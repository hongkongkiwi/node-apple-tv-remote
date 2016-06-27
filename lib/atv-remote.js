
//curl -H "Host: 192.168.1.140:3689" -H "Viewer-Only-Client: 1" -H "Client-ATV-Sharing-Version: 1.2" -H "Accept: */*" -H "Accept-Language: en-us" -H "Client-iTunes-Sharing-Version: 3.10" -H "Client-DAAP-Version: 3.12" -H "User-Agent: Remote/875" --compressed http://192.168.1.140:3689/login?pairing-guid=0x26C361EA5232AD63&hasFP=1

var Promise = require('bluebird');
var rp = require('request-promise');
var _ = require('underscore');
var Parser = require('./Parser');

var Remote = function(ipAddress, options) {
  this.options = _.extendOwn({
    headers: {
      'Viewer-Only-Client': 1,
      'Client-DAAP-Version': '3.11',
      'Client-iTunes-Sharing-Version': '3.9',
      'Client-ATV-Sharing-Version': '1.2',
      'User-Agent': 'Remote/875'
    }
  }, options);

  this.promptId = 1;
  this.sessionId = null;
  this.baseUrl = 'http://' + ipAddress + ":3689";
};

// 'Accept': '*/*',
// 'Content-Type': 'application/x-www-form-urlencoded',
// 'Accept-Encoding': 'gzip',
// 'Pragma': 'no-cache',
// 'Accept-Language': 'en-us',

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
    .then(parseResult)
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
    .then(parseResult)
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
    .then(parseResult)
    .then(function(result) {
      return result;
    });
};

Remote.prototype.fpSetup = function() {

};

// Just a simple function to handle parsing using Parser
var parseResult = function(result) {
  var p = new Parser(result);
  return p.parse();
};

module.exports = Remote;

var remote = new Remote();
// remote.serverInfo().then(function(serverInfo) {
//   console.log('Got Server Info',serverInfo);
// });

// remote.ctrlInit().then(function(serverInfo) {
//   console.log('Got ctrlInit',serverInfo);
// });

remote.login('0x26C361EA5232AD63').then(function(sessionId) {
  console.log('Successfully Logged In (sessionId=' + sessionId + ')');
  // remote.logout().then(function() {
  //   console.log('Successfully Logged Out');
  // });
});
