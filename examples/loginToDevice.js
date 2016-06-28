var Remote = require('../lib/Remote');

var remote = new Remote('192.168.1.140');
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
