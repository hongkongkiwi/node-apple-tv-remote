var crypto = require('crypto');

module.exports = function(context) {
  var app = context.app;

  function checkForValidSessionId(sessionId) {
    if (context.sessionIds.indexOf(sessionId) > -1) {
      return true;
    } else {
      return false;
    }
  }

  function handleLogin(req, res) {
    var query = req.query;
    var sessionId = context.getSessionId(query.guid);

    context.emit('login', sessionId);
  }

  function handleLogout(req, res) {
    var query = req.query;
    if (!checkForValidSessionId(query.sessionId)) {
      return res.send(401);
    }
    context.removeSessionId(query.sessionId);
    context.emit('logout');

  }

  function handleControlCommand(req, res) {
    var query = req.query;
    if (!checkForValidSessionId(query.sessionId)) {
      return res.send(401);
    }
    context.emit('control_command');

  }

  function handlePlayStatusUpdate(req, res) {
    var query = req.query;
    if (!checkForValidSessionId(query.sessionId)) {
      return res.send(401);
    }
    context.emit('now_playing_status_update', query.property);

  }

  function handleNowPlayingArtwork(req, res) {
    var query = req.query;
    if (!checkForValidSessionId(query.sessionId)) {
      return res.send(401);
    }
    context.emit('now_playing_artwork', query.property);

  }

  function handleGetProperty(req, res) {
    var query = req.query;
    if (!checkForValidSessionId(query.sessionId)) {
      return res.send(401);
    }
    context.emit('get_property', query.property);

  }

  function handleSetProperty(req, res) {
    var query = req.query;
    if (!checkForValidSessionId(query.sessionId)) {
      return res.send(401);
    }
    context.emit('set_property', query.property);
  }

  /** Login **/
  app.get('/login', handleLogin);
  app.get('/logout', handleLogout);

  /** Commands **/
  app.post('/ctrl-int/1/controlpromptupdate', handleControlCommand);
  app.get('/ctrl-int/1/playstatusupdate', handlePlayStatusUpdate);
  app.get('/ctrl-int/1/nowplayingartwork', handleNowPlayingArtwork);
  app.get('/ctrl-int/1/getproperty', handleGetProperty);
  app.get('/ctrl-int/1/setproperty', handleSetProperty);
};
