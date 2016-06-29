function decimalToHex(d, padding) {
    var hex = Number(d).toString(16);
    padding = typeof (padding) === "undefined" || padding === null ? padding = 2 : padding;

    while (hex.length < padding) {
        hex = "0" + hex;
    }

    return hex;
}

var guid = '0000000000000001';

var values = {
        'cmpg': guid,
        'cmnm': 'devicename',
        'cmty': 'ipod',
};

console.log(Buffer.from('cmpg','ascii').toString('hex'));

var lenBuf = Buffer.alloc(4);
var valueBuf = Buffer.from(guid, 'hex');
lenBuf.writeUInt32LE(valueBuf.length);
buf = Buffer.concat([Buffer.from('cmpg'), lenBuf, valueBuf]);

valueBuf = Buffer.from('devicename');
lenBuf.writeUInt32LE(valueBuf.length);
buf = Buffer.concat([buf, Buffer.from('cmnm'), lenBuf, valueBuf]);

valueBuf = Buffer.from('ipod');
lenBuf.writeUInt32LE(valueBuf.length);
buf = Buffer.concat([buf, Buffer.from('cmty'), lenBuf, valueBuf]);

lenBuf.writeUInt32LE(buf.length);
buf = Buffer.concat([Buffer.from('cmpa'), lenBuf, buf]);

console.log(buf.toString('hex'));

// var buf = Buffer.alloc(1);
// for (var value in values) {
//         var lengthBuf = Buffer.alloc(1);
//         lengthBuf.writeUInt8(values[value].length,0);
//         buf = Buffer.concat([buf, Buffer.from(value), lengthBuf, Buffer.from(values[value])]);
// }
// var lengthBuf = Buffer.alloc(1);
// lengthBuf.writeUInt8(buf.length,0);
// buf = Buffer.concat([Buffer.from('cmpa'), lengthBuf, buf]);
//
// console.log(buf);

// encoded = ''
// for key, value in values.iteritems():
// 	encoded += '%s%s%s' % (key, struct.pack('>i', len(value)), value)
// header = 'cmpa%s' % (struct.pack('>i', len(encoded)))
// encoded = '%s%s' % (header, encoded)
