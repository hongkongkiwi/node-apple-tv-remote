var Remote = require('../lib/Remote');

var remote = new Remote('192.168.1.140');

remote.pair().then(function() {
  console.log('success!');
}, function(err) {
  console.log('failure',err);
}).catch(console.error);
