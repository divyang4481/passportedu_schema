var SchoolModel = require('../../../server/models/school')
  , card = require('../../../server/models/card')
  , fs = require('fs')
  , lazy = require('lazy')
  , _ = require('underscore')
  , mongoose = require('mongoose');
mongoose.connect('mongodb://localhost/psprt');
console.log('Starting...');
new lazy(fs.createReadStream(__dirname + '/../mechTurkURLS.csv'))
  .lines.map(String)
  .map(
  function(line) {
    var lineArr = line.replace(/\"/g, '');
    var fields = line.split(',');
    var school = {
      unitId: fields[0],
      state: fields[2],
      city: fields[3],
      zip: fields[4],
      schoolURL: fields[5],
      accept: fields[6],
      reject: fields[7]
    };
    return school;
  }).filter(function(school) {
    return school.accept === 'x';
  }).join(function(transformedSchools) {
    _.each(transformedSchools, function(school) {
      SchoolModel.findOne({"data.unitId": Number(school.unitId)}, function(err, School) {
        card.create({
          type: 'schools/map',
          owners: {
            schools: School._id.toString()
          },
          order: 1,
          data: {
            city: school.city,
            state: school.state,
            zip: school.zip
          }
        }, function(err, Card) {
          School.cards.push(Card._id.toString());
          School.save(function(err) {
            console.log(err, school, Card);
          });
        });
      });
    });
  });