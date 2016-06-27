
//curl -H "Host: 192.168.1.140:3689" -H "Viewer-Only-Client: 1" -H "Client-ATV-Sharing-Version: 1.2" -H "Accept: */*" -H "Accept-Language: en-us" -H "Client-iTunes-Sharing-Version: 3.10" -H "Client-DAAP-Version: 3.12" -H "User-Agent: Remote/875" --compressed http://192.168.1.140:3689/login?pairing-guid=0x26C361EA5232AD63&hasFP=1

var Promise = require('bluebird');
var rp = require('request-promise');
var _ = require('underscore');

var Remote = function(options) {
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
};

// 'Accept': '*/*',
// 'Content-Type': 'application/x-www-form-urlencoded',
// 'Accept-Encoding': 'gzip',
// 'Pragma': 'no-cache',
// 'Accept-Language': 'en-us',

Remote.prototype.login = function(guid) {
  var options = {
    method: 'GET',
    baseUrl: 'http://192.168.1.140:3689',
    uri: '/login?pairing-guid=' + guid + '&hasFP=1',
    headers: this.options.headers,
    encoding: null
  };

  var me = this;

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
    method: 'GET',
    baseUrl: 'http://192.168.1.140:3689',
    uri: '/logout?session-id=' + me.sessionId,
    headers: this.options.headers,
    encoding: null
  };

  return rp(options)
    .then(function() {
      me.promptId = 1;
      me.sessionId = 0;
    });
};

Remote.prototype.serverInfo = function() {
  var options = {
    method: 'GET',
    baseUrl: 'http://192.168.1.140:3689',
    uri: '/server-info',
    headers: this.options.headers,
    encoding: null
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

var parseResult = function(result) {
  var p = new Parser(result);
  return p.parse();
};

var Parser = function(buffer) {
    this.buffer = buffer;
    this.location = 0;

    this.branches = /(casp|cmst|mlog|agal|mccr|mlcl|mdcl|mshl|mlit|abro|abar|agar|apso|caci|avdb|cmgt|aply|adbs)/;
    this.strings = /(minm|cann|cana|cang|canl|asaa|asal|asar|ascn|asgn|assa|assu|mcnm|mcna)/;
    this.ints = /(mstt|mlid)/;
    this.raws = /(canp)/;
};

Parser.prototype.parse = function(listener, listenFor, handle) {
    var me = this;
    var resp = {};
    var progress = 0;
    handle = handle ? handle : me.buffer.length;

    while (handle !== 0) {
      var key = me.readString(4, me);
      var length = me.readInt(me);
      handle -= 8 + length;
      progress += 8 + length;

      if (me.branches.test(key)) {
        var branch = me.parse(listener, listenFor, length);
        resp[key] = branch;

        if (listener) {
          if (listener.matcher(key).matches()) {
            listener.foundTag(key, branch);
          }
        }

      } else if (me.ints.test(key)) {
        resp[key] = me.readInt(me);
      } else if (me.strings.test(key)) {
        resp[key] = me.readString(length, me);
      } else if (me.raws.test(key)) {
        resp[key] = me.readRaw(length, me);
      } else if (length === 1 || length === 2 || length === 4 || length === 8) {
        resp[key] = me.readRaw(length, me);
      } else {
        resp[key] = me.readString(length, me);
      }
    }

    return resp;
};

Parser.prototype.readRaw = function(length, context) {
  var loc = this.location;
  this.location += length;
  return this.buffer.slice(loc, loc+length);
};

Parser.prototype.readString = function(length, context) {
    var loc = this.location;
    this.location += length;
    return this.buffer.slice(loc, loc+length).toString();
};

Parser.prototype.readInt = function(context) {
    var loc = context.location;
    context.location += 4;
    return context.buffer.readInt32BE(loc);
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
