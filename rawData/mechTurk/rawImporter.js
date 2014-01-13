var SchoolModel = require ('../../server/models/school')
	, fs = require ('fs')
	, lazy = require ('lazy')
	, _ = require ('underscore')
	, mongoose = require ('mongoose');

mongoose.connect ('mongodb://localhost/psprt');

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
			SchoolModel.findOne ({"data.unitId": Number (school.unitId)}, function (err, School) {
					console.log (School);
					School.data.state = school.state;
					School.data.city = school.city;
					School.data.zip = school.zip;
					School.data.schoolURL = school.schoolURL;
					School.save (function (err, savedSchool) {
						console.log (err, savedSchool);
					});
				});
		});
});