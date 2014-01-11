var _ = require('underscore');
module.exports = function(model) {
  /**
   * Restful PUT (Save)
   * @param req
   * @param res
   */
  var putFunc = function(req, res) {
    var body = _.extend(req.body, req.restrictQuery);
    model.update({_id: req.params.id}, body, {}, function(err, doc) {
      if (err) {
        res.json({error: err});
        return;
      }
      res.json(doc);
    });
  };
  return putFunc;
}