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

module.exports = Parser;
