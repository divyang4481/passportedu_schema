var _ = require('underscore')
  , querystring = require('querystring');
/**
 *
 * @param model
 * @returns {Function}
 */
module.exports = function(model) {
  /**
   * RESTful query
   */
  var queryFunc = function(req, callback) {
    var parentRoute = req.app.route
      , queryVars = _.extend(req.query, req.restrictQuery)
      , query = model.find();
    if (_.isUndefined(queryVars.limit)) {
      queryVars.limit = 12;
    }
    if (_.isUndefined(queryVars.offset)) {
      queryVars.offset = 0;
    }
    advancedQueries(query, queryVars);
    // Handle limit and offset
    var pagelessQuery = query.toConstructor()
      , limit = queryVars.limit
      , offset = queryVars.offset;
    query.limit(limit);
    query.skip(offset);
    query.sort('field _id');
    query.exec(function(err, result) {
      if (err) {
        callback(err);
        return;
      }
      // Count total results
      pagelessQuery().count().exec(function(err, count) {
        queryVars.limit = Number(limit);
        var nextPage = _.clone(queryVars)
          , prevPage = _.clone(queryVars)
          , lastPage = _.clone(queryVars)
          , firstPage = _.clone(queryVars)
          , nextOffset = Math.max(0, Number(offset) + Number(limit))
          , prevOffset = Math.min(count - limit, Number(offset) - Number(limit))
          , meta = []
          , currentPage = (Math.ceil(queryVars.offset / queryVars.limit))
          , minBound = Math.max(0, (currentPage - 2))
          , maxBound = Math.min((count / limit), currentPage + 1);
        firstPage.offset = 0;
        meta.push({
          query: querystring.stringify(firstPage),
          page: "<<",
          rel: "first"
        });
        prevPage.offset = prevOffset;
        meta.push({
          query: querystring.stringify(prevPage),
          page: "<",
          rel: "prev"
        });
        var pages = _.range(minBound, maxBound, 1);
        _.each(pages, function(page) {
          var pageQuery = _.clone(queryVars);
          pageQuery.offset = (page * limit) + 1;
          meta.push({
            query: querystring.stringify(pageQuery),
            page: Math.ceil(pageQuery.offset / pageQuery.limit),
            rel: pageQuery.offset == queryVars.offset ? 'self' : 'page_' + (Math.ceil(pageQuery.offset / pageQuery.limit))
          });
        });
        nextPage.offset = nextOffset;
        meta.push({
          query: querystring.stringify(nextPage),
          page: ">",
          rel: "next"
        });
        lastPage.offset = (Math.ceil(count / queryVars.limit) - 1) * queryVars.limit + 1;
        meta.push({
          query: querystring.stringify(lastPage),
          page: ">>",
          rel: "last"
        });
        callback(err, {
          meta: meta,
          result: result,
          count: count,
          pages: Math.ceil(count / limit),
          page: Math.ceil(offset / limit) + 1
        });
      });
    });
  };
  /**
   * More advanced queries that match data in complex ways
   */
  var advancedQueries = function(query, queryVars) {
    _.each(queryVars, function(value, key) {
      if (key.match(/>/)) {
        var cleanKey = key.replace(/>/, '');
        query.gte(cleanKey, Number(value));
      }
      else if (key.match(/</)) {
        var cleanKey = key.replace(/</, '');
        query.lte(cleanKey, Number(value));
      }
      else if (key.match(/\*/)) {
        var cleanKey = key.replace(/\*/, '');
        var regStr = "^(?=.*\\b" + value.split(' ').join("\\b)(?=.*\\b") + "\\b)";
        var reg = new RegExp(regStr, 'i');
        query.regex(cleanKey, reg);
      }
      else if (key.match('limit') || key.match('offset')) {
        // skip limit and offset for later
      }
      else if (key.match(/\!/)) {
        var cleanKey = key.replace(/\!/, '');
        query.ne(cleanKey, value);
      }
      else {
        query.where(key, value);
      }
    });
  };
  return queryFunc;
}