var SchoolModel = require ('../../../server/models/School')
	, fs = require ('fs')
	, lazy = require ('lazy')
	, _ = require ('underscore')
	, mongoose = require ('mongoose');

mongoose.connect ('mongodb://localhost/tiro');

var stream = fs.createReadStream (__dirname + '/CaliDataTabs.txt');

require ('fs').readFileSync (__dirname + '/CaliDataTabs.txt').toString ().split (/\r/).forEach (function (line) {
	line = line.replace (/\"/g, '');
	var fields = line.split ("\t");
	if (! (Number (fields[0]) > 0) || fields[2] !== 'California') {
		return;
	}
	var school = {
		unitId: fields[0],
		state: fields[2],
		schoolURL: fields[5],
		applicationFee: Number (fields[9].replace (/[^0-9]/g, '')),
	};
	var financesReq = Number (fields[11].replace (/[^0-9]/g, ''));
	if (_.isNumber(financesReq)) {
		school.financesRequired = financesReq;
	}
	var GPA = fields[10];
	if (! _.isEmpty (GPA)) {
		school.GPA = Number (GPA) > 0 ? Number (fields[10]) : - 1;
	}
	var TOEFL = fields[8];
	if (! _.isEmpty (TOEFL)) {
		school.TOEFLScore = Number (TOEFL) > 0 ? Number (TOEFL) : - 1;
	}
	var IELTS = fields[16];
	if (! _.isEmpty (IELTS)) {
		school.IELTSScore = Number (IELTS) > 0 ? Number (IELTS) : - 1;
	}
	var SAT = fields[12];
	if (! _.isEmpty (SAT)) {
		school.SAT = Number (SAT) > 0 ? Number (SAT) : - 1;
	}
	var Deadline = fields[19];
	if (! _.isEmpty (Deadline)) {
		school.deadline = Deadline;
	}
	var Essays = fields[18];
	if (Essays == 'Y') {
		school.essaysRequired = 'Y';
	}
	if (Essays == 'NR') {
		school.essaysRequired = 'N';
	}
	var References = fields[15];
	if (References == 'Y') {
		school.referencesRequired = 'Y';
	}
	if (References == 'NR') {
		school.referencesRequired = 'N';
	}
	var Diploma = fields[13];
	if (Diploma == 'Y') {
		school.diplomaRequired = 'Y';
	}
	if (Diploma == 'NR') {
		school.diplomaRequired = 'N';
	}
	SchoolModel.findOne ({unitId: Number (school.unitId)}, function (err, School) {
		var tags = [];
		School.schoolURL = school.schoolURL;
		School.applicationFee = school.applicationFee;
		if (school.applicationFee === 0) {
			School.tags.push ('noApplicationFee');
		}
		School.financesRequired = school.financesRequired;
		School.state = school.state;
		if (school.GPA) {
			School.GPA = school.GPA;
		}
		if (school.TOEFLScore) {
			School.TOEFLScore = school.TOEFLScore;
		}
		if (school.IELTSScore) {
			School.IELTSScore = school.IELTSScore;
		}
		if (school.SAT) {
			School.SAT = school.SAT;
		}
		if (school.deadline) {
			School.deadlines.push (new Date (school.deadlines));
		}
		if (school.essaysRequired) {
			School.essaysRequired = school.essaysRequired;
		}
		if (school.essaysRequired === 'N') {
			School.tags.push ('noEssays');
		}
		if (school.referencesRequired) {
			School.referencesRequired = school.referencesRequired;
		}
		if (school.referencesRequired === 'N') {
			School.tags.push ('noReferences');
		}
		if (school.diplomaRequired) {
			School.diplomaRequired = school.diplomaRequired;
		}
		if (school.diplomaRequired === 'N') {
			School.tags.push ('noDiploma');
		}
		console.log (School);
		School.save (function (err, savedSchool) {
			console.log (err, savedSchool);
		});
	});
});