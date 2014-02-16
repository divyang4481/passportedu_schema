var application = require('../../server/models/application');
application.find({}, function(er, apps) {
  for(var u = 0; u < apps.length; u++) {
    apps[u].fee = 30.00;
    apps[u].save(function(err) {
    });
  }
});