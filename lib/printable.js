/*
 * node-daap
 * DAAP library for Node.js
 *
 * Copyright (c) 2013 Jeffrey Muller
 * Licensed under the MIT license.
 */

var printable = {
    to_int32: function(value, code)  {
        if (code !== null && code.toString() === "mcnm") {
            var buffer = new Buffer([
                (value >> 24) & 0xff,
                (value >> 16) & 0xff,
                (value >> 8) & 0xff,
                value & 0xff
            ]);
            return buffer.toString();
        }

        return value;
    },

    to_date: function(value) {
        return new Date(value * 1000);
    },

    to_string: function(buffer, start, len) {
        b = new Buffer(len);

        buffer.copy(b, 0, start, start + len);
        return b.toString();
    },

    to_data: function(buffer, len) {
        var hexchars = "012345789abcdef";
        var result = "";

        for (var i = 0; i < len; i++) {
            result += hexchars[(buffer.readInt8(i) >> 4)];
            result += hexchars[(buffer.readInt8(i) & 0x0f)];
        }

        return result;
    }
};

module.exports = printable;
