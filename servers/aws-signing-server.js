var express = require('express'),
  http = require('http'),
  path = require('path'),
  crypto = require('crypto'),
  app = express(),
  bucket = "psprt",
  awsKey = "AKIAJ5YYUQQMQHF2XXCQ",
  secret = "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";
app.use(express.logger("dev"));
app.use(express.methodOverride());
app.use(express.bodyParser());
app.use(app.router);
/**
 *
 * @param req
 * @param res
 * @param next
 */
function sign(req, res, next) {
  var fileName = req.params[0]
    , expiration = new Date(new Date().getTime() + 1000 * 60 * 5).toISOString(); // expire in 5 minutes
  var policy =
  { "expiration": expiration,
    "conditions": [
      {"bucket": bucket},
      {"key": fileName},
      {"acl": 'public-read'},
      ["starts-with", "$Content-Type", ""],
      ["content-length-range", 0, 524288000]
    ]};
  policyBase64 = new Buffer(JSON.stringify(policy), 'utf8').toString('base64');
  signature = crypto.createHmac('sha1', secret).update(policyBase64).digest('base64');
  res.json({bucket: bucket, awsKey: awsKey, policy: policyBase64, signature: signature});
}
// DON'T FORGET TO SECURE THIS ENDPOINT WITH APPROPRIATE AUTHENTICATION/AUTHORIZATION MECHANISM
module.exports = sign;