/**
 * Dependencies
 */
var express = require('express')
  , api = express()
  , auth = require('./authenticate')
  , root = require('./root')
  , authorize = require('./authorize')
  , studentApplication = require('./application')
  , studentSchools = require('./schools')
  , searchSchools = require('./search')
/**
 * Public Area
 */
api.get('/', root.get)
/**
 * Register and Login
 */
api.get('/register', authorize.register.get);
api.post('/register', authorize.register.post);
api.get('/login', authorize.login.get);
api.post('/login', authorize.login.post);
api.get('/logout', authorize.logout.get);
/**
 * Dashboard
 */
api.get('/:studentId', auth, root.student.get);
/**
 * Application
 */
api.get('/:studentId/application', auth, studentApplication.get);
api.put('/:studentId/application/cards/:cardId', auth, studentApplication.cards.put);
api.delete('/:studentId/application/cards/:cardId', auth, studentApplication.cards.delete);
/**
 * Schools
 */
api.get('/:studentId/schools/:schoolId', auth, studentSchools.school.get)
api.post('/:studentId/schools/:schoolId/charge', studentSchools.school.payApplicationFee);
api.delete('/:studentId/schools/:schoolId', auth, studentSchools.school.delete)
api.put('/:studentId/schools/:schoolId/application/:applicationId/apply', auth, studentSchools.school.apply)
api.put('/:studentId/schools/:schoolId/application/:applicationId/save', auth, studentSchools.school.save)
/**
 * School Search
 */
api.get('/:studentId/search/schools', auth, searchSchools.get);
api.get('/:studentId/search/schools/:schoolId', auth, searchSchools.school.get);
api.get('/search/schools', searchSchools.get);
api.get('/search/schools/:schoolId', searchSchools.school.get);
/**
 *
 */
module.exports = api;