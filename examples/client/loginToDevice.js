var Remote = require('../../index').client;

var remote = new Remote('Apple-TV.local.');
// remote.serverInfo().then(function(serverInfo) {
//   console.log('Got Server Info',serverInfo);
// });

// remote.ctrlInit().then(function(serverInfo) {
//   console.log('Got ctrlInit',serverInfo);
// });

remote.isHostUp().then(function() {
  return remote.login('0xA50880EE02A0B77A');
}).then(function(sessionId) {
  console.log('Successfully Logged In (sessionId=' + sessionId + ')');
  // remote.logout().then(function() {
  //   console.log('Successfully Logged Out');
  // });
});
