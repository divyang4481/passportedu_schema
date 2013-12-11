var _ = require('underscore')
  , authenticate = require('../../../helpers/authenticate')
  , cards = require('../../../models/card');

module.exports = function(req, res) {
  authenticate.auth(req, function(err, auth) {
    console.log(err, auth);
    if ((err) || (auth.permission.length === 0) || (!_.contains(auth.permission, 'student'))) {
      res.set('WWW-Authenticate', 'Basic realm="/api/v1/student"');
      res.send(401);
      return;
    }
    var response = {
      message: "welcome to PassportEDU"
    };
    response = _.extend(response, auth);
    card.find({ownerId: auth.studentId}, function(cards) {
      response.cards = cards;
      res.json(response);
    });
  });
}