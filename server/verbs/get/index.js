module.exports = function(model) {
  /**
   * GET Verb
   * @param req
   * @param res
   */
  var getFunc = function(req, res) {
    model.findById(req.params.id, function(err, model) {
      res.set('Content-Type', 'application/json');
      res.json(model);
    });
  };
  return getFunc;
}