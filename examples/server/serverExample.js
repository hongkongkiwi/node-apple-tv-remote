var RemoteServer = require('../../index').server;
var menu = require('appendable-cli-menu');
var keypress = require('keypress');
var readline = require('readline');

var server = new RemoteServer();

console.log('Starting Server...');
server.startServer().then(function() {
  console.log('Server is started on port',server.options.listenPort);
  //console.log('Press p to begin pairing');
  // var stdin = process.stdin;
  //
  // // without this, we would only get streams once enter is pressed
  // stdin.setRawMode( true );
  //
  // // resume stdin in the parent process (node app won't quit all by itself
  // // unless an error or process.exit() happens)
  // stdin.resume();
  //
  // // i don't want binary, do you?
  // stdin.setEncoding( 'utf8' );
  //
  // var keyListener = function(key) {
  //   // ctrl-c ( end of text )
  //   if ( key === '\u0003' ) {
  //     process.exit();
  //   } else if ( key === 'p' ) {
  //     console.log('p');
  //     stdin.setRawMode( false );
  //     stdin.removeAllListeners();
  //     startSearching();
  //   }
  // };
  //
  // // on any data into stdin
  // stdin.on( 'data', keyListener);

  startSearching();

  function startSearching() {
    console.log('Starting search for Remote Clients');
    server.startSearchForClients();
    var clients = {};
    server.on('client found', function(service) {
      if (!clients.hasOwnProperty(service.name)) {
        clients[service.name] = service;
        client_menu.add({ name: service.txtRecord.DvNm, value: service.name });
      }
    });
    var client_menu = menu('Select a client to pair with', function (client) {
      server.stopSearchForClients(server);
      console.log('You selected %s (host: %s)', client.name, client.value);
      var service = clients[client.value];
      var clientUrl = 'http://' + service.host + ':' + service.port;
      var pairCode = service.txtRecord.Pair;
      var pinCode = '';

      var getPinCode = function() {
        var rl = readline.createInterface({
          input: process.stdin,
          output: process.stdout,
          terminal: false
        });

        rl.setPrompt('Please enter pairing Pin Code (4 digits): ');

        rl.prompt();

        rl.on('line', function(line)  {
          line = line.trim();
          if (line.length !== 4) {
            console.log('! Invalid Pin Code! Must be 4 digits');
          } else if (!/^\d+$/.test(line)) {
            console.log('! Invalid Pin Code! Must only use digits');
          } else {
            pinCode = line;
            rl.close();
          }
          rl.prompt();
        }).on('close', function() {
          if (pinCode.length > 0) {
            attemptPair();
          }
        });
      };
      getPinCode();

      var attemptPair = function() {
        console.log('Attempting to Pair with client...');
        server.pairWithClient(clientUrl, pinCode, pairCode).then(function() {
          console.log('success!');
        }, function(reason) {
          console.log('Pairing Failed! Please try again...');
          getPinCode();
        });
      };
    });
  }


});

// process.on('SIGINT', function() {
//   if (server) {
//     server.stopserver();
//   }
//   process.kill(process.pid, 'SIGINT');
// });
