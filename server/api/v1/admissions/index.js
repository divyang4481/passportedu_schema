/**
 *
 */
var express = require('express')
  , api = express();
/**
 * Sub modules
 */
var root = require('./root')
  , authorize = require('./authorize')
  , admissionsSchools = require('./schools')
  , admissionsSearch = require('./search')
  , admissionsApplication = require('./schools/application')
  , auth = require('./authenticate')
/**
 * Register and Login Package
 */
api.get('/', root.get);
/**
 *
 */
api.get('/register', authorize.register.get);
api.post('/register', authorize.register.post);
api.get('/login', authorize.login.get);
api.post('/login', authorize.login.post);
api.get('/logout', authorize.logout.get);
api.get('/:admissionsId', auth, root.admissions.get);
/**
 *
 */
api.get('/:admissionsId/schools/:schoolId', auth, admissionsSchools.school.get);
api.get('/:admissionsId/schools/:schoolId/applications/:applicationId/csv', auth, admissionsSchools.school.application.csv);
api.delete('/:admissionsId/schools/:schoolId', auth, admissionsSchools.school.delete);
api.get('/:admissionsId/schools/:schoolId/applicants/:applicantId', auth, admissionsSchools.school.applicant.get);
/**
 *
 */
api.get('/:admissionsId/search/schools', auth, admissionsSearch.schools.get);
api.get('/:admissionsId/search/schools/:schoolId', auth, admissionsSearch.schools.school.get);
api.put('/:admissionsId/search/schools/:schoolId/claim', auth, admissionsSearch.schools.school.claim);
api.delete('/:admissionsId/search/schools/:schoolId/claim', auth, admissionsSearch.schools.school.unclaim);
/**
 *
 */
api.get('/:admissionsId/schools/:schoolId/applications', auth, admissionsApplication.applications.get);
api.post('/:admissionsId/schools/:schoolId/applications', auth, admissionsApplication.applications.post);
//
api.get('/:admissionsId/schools/:schoolId/applications/:applicationId', auth, admissionsApplication.applications.application.get);
api.put('/:admissionsId/schools/:schoolId/applications/:applicationId', auth, admissionsApplication.applications.application.put);
api.delete('/:admissionsId/schools/:schoolId/applications/:applicationId', auth, admissionsApplication.applications.application.delete);
//
api.get('/:admissionsId/schools/:schoolId/applications/:applicationId/removeCards', auth, admissionsApplication.applications.application.removeCards);
api.post('/:admissionsId/schools/:schoolId/applications/:applicationId/addCards/*', auth, admissionsApplication.applications.application.addCards.post);
api.get('/:admissionsId/schools/:schoolId/applications/:applicationId/addCards', auth, admissionsApplication.applications.application.addCards.get);
api.get('/:admissionsId/schools/:schoolId/applications/:applicationId/assign', auth, admissionsApplication.applications.application.assign.get);
api.get('/:admissionsId/schools/:schoolId/applications/:applicationId/arrange', auth, admissionsApplication.applications.application.arrange.get);
api.put('/:admissionsId/schools/:schoolId/applications/:applicationId/cards/:cardId/arrange', auth, admissionsApplication.applications.application.arrange.put);
//
//api.put('/:admissionsId/schools/:schoolId/applications/:applicationId/assign', auth, admissionsApplication.applications.application.assign.put);
//api.delete('/:admissionsId/schools/:schoolId/applications/:applicationId/assign', auth, admissionsApplication.applications.application.assign.delete);
api.put('/:admissionsId/schools/:schoolId/applications/:applicationId/cards/:cardId', auth, admissionsApplication.applications.application.card.put);
api.delete('/:admissionsId/schools/:schoolId/applications/:applicationId/cards/:cardId', auth, admissionsApplication.applications.application.card.delete);
/**
 *
 */
module.exports = api;