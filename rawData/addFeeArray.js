var user = require('../server/models/user');
user.find({}, function(er, users) {
  for(var u = 0; u < users.length; u++) {
    users[u].feesPaid = [];
    users[u].save(function(err) {
    });
  }
});