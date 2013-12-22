var SchoolModel = require ('../../../server/models/School')
	, fs = require ('fs')
	, lazy = require ('lazy')
	, _ = require ('underscore')
	, mongoose = require ('mongoose');

mongoose.connect ('mongodb://localhost/tiro');

console.log ('Starting...');

new lazy (fs.createReadStream (__dirname + '/mechTurkURLS.csv')).lines.map (String)//	.skip (1)
	.map (function (line) {
	var lineArr = line.replace (/\"/g, '');
	var fields = line.split (',');
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
}).filter (function (school) {
	return school.accept === 'x';
}).join (function (transformedSchools) {
	_.each (transformedSchools, function (school) {
			console.log (school.unitId);
			SchoolModel.findOne ({unitId: Number (school.unitId)}, function (err, School) {
					console.log (School);
					School.state = school.state;
					School.city = school.city;
					School.zip = school.zip;
					School.schoolURL = school.schoolURL;
					School.save (function (err, savedSchool) {
						console.log (err, savedSchool);
					});
				});
		});
});