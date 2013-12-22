var cheerio = require ('cheerio');
var request = require ('request');
var _ = require ('underscore');

var mongoose = require ('mongoose');
mongoose.connect ('mongodb://localhost/tiro');

var SchoolIPEDSModel = require ('../models/School');

var SocialLinkModel = require ('../models/SocialLink');

function compileRegex (name, numPop)
{
	name = name.replace (/[oO]f/g,
			'').replace (/[Tt]he/g,
			'').replace (/&#8217;/,
			' ').replace (/[Ss]t /g,
			'').replace (/&amp;/g,
			'').replace (/[-:,\. ]+/g,
			' ').trim ();

	var nameParts = name.split (' ');
	var usableName = name.replace (/[uU]niversity/g,
			'').replace (/[cC]ollege/g,
			'').replace (/[Ss]aint/g,
			'').replace (/[Cc]entral/g,
			'').replace (/[Tt]echnical/g,
			'').replace (/[Cc]ommunity/g,
			'').replace (/[Ss]tate/g,
			'').replace (/[Cc]ampus/g,
			'').replace (/[Dd]istrict/g,
			'').replace (/[Cc]ounty/g,
			'').replace (/[-:,\. ]+/g,
			' ').trim ().split (' ');
	if (usableName.length <= 1) {
		return false;
	}
	var pop = 0;
	while (pop ++ < numPop) {
		nameParts.pop ();
	}
	var regex = '';
	_.each (nameParts,
		function (part)
		{
			regex += '(?=.*' + part + ')';
		});
	regex += '.*';
	if (regex === '.*') {
		return false;
	}
	return new RegExp (regex,
		"i");
}

var url = 'http://blog.shortyawards.com/post/39958750448/bncollegelist';

request ({uri: url},
	function (error, response, body)
	{
		$ = cheerio.load (body);

		var links = {};

		var elem = $ ('#content .post-body p:nth-child(5)')[0].children;
		for (var i in
			elem) {
			var nodeElem = elem[i];
			if (nodeElem.type == "text") {
				if (nodeElem.data == " | " || nodeElem.data == " ") {
					continue;
				}
				else {
					currentSchool = nodeElem.data;
					links[currentSchool] = {};
				}
			}
			else {
				if (nodeElem.children[0] && nodeElem.children[0].data) {
					links[currentSchool][nodeElem.children[0].data] = nodeElem.attribs.href.replace (/denied:%22/,
						'');
				}
			}
		}
		var count = {
			found: 0,
			skipped: 0
		};
		_.each (links,
			function (sites, name)
			{
				findSchool (name,
					0,
					count,
					function (school)
					{
						if (! _.isNull (school)) {
							_.each (sites,
								function (site, siteName)
								{
									var SocialLink = new SocialLinkModel ({
										unitId: school.unitId,
										type: siteName,
										link: site
									});
									SocialLink.save (function (err, socialLink)
									{
										console.log (socialLink);
									});
								});
						}
					});
			});

	});

function findSchool (name, numPop, count, callback)
{
	var regex = compileRegex (name,
		numPop);
	if (regex === false) {
		return false;
	}
	else {
		SchoolIPEDSModel.findOne ({institutionName: regex},
			function (err, school)
			{
				if (! _.isNull (school)) {
					callback (school);
				}
				else {
					callback (null);
					return false;
				}
			});
	}
}
