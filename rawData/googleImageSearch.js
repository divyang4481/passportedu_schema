

var googleapis = require('googleapis');
googleapis.discover('customsearch', 'v1').execute(function(err, client) {
  // set api key
  console.log(client);
  client.customsearch.cse.list({
    key: 'AIzaSyAUdA6ttvdXPWKsNwOfuHQa89rvglMX1YE',
    q: 'University of Texas',
    imgSize: 'large',
    imgType: 'photo',
    rights: 'cc_publicdomain',
    safe: 'high',
    searchType: 'image',
    num: 1,
    imgDominantColor: 'blue'
  }).execute(console.log);
});

