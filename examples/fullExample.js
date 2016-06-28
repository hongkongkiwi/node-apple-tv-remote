var RemoteFinder = require('../lib/RemoteFinder');
var Remote = require('../lib/Remote');

var FOUND_EVENT = 'found';

var hostName = 'Apple-TV.local.';

var finder = new RemoteFinder();

var foundRemote = function(remote) {
  // We are only looking for one
  if (remote.ipAddress === hostName) {
    console.log('Found new Remote:', remote.ipAddress);
    console.log('Pairing with ' + hostName);
    finder.stopSearching();
    finder.removeAllListeners(FOUND_EVENT);
    remote.pair(240).then(function(guid) {
      console.log('success!');
      finder = null;
    }, function(msg) {
      console.log('Pairing Failed!',msg);
    }).catch(console.error);
  }
};

finder.on(FOUND_EVENT, foundRemote);

// With a timeout of 5 seconds
finder.startSearching(5);
