//
// Alexa skill to get the AQI in the bay area
// @author Ido Green | @greenido
// @date 11/2017
// @see
// 0. https://greenido.wordpress.com
// 1. reporting zones: http://sparetheair.org/stay-informed/todays-air-quality/reporting-zones
// 2. http://sparetheair.org/stay-informed/todays-air-quality/five-day-forecast
//
//
var express = require("express");
var alexa = require("alexa-app");
var request = require("request");
var BASE_URL = "http://sparetheair.org/stay-informed/todays-air-quality/five-day-forecast";
var PORT = process.env.PORT || 3000;
var app = express();

// Setup the alexa app and attach it to express before anything else.
var alexaApp = new alexa.app("");
console.log("Starting with building the app");

// POST calls to / in express will be handled by the app.request() function
alexaApp.express({
  expressApp: app,
  checkCert: true,
  // sets up a GET route when set to true. This is handy for testing in development, but not recommended for production.
  debug: true
});

app.set("view engine", "ejs");

alexaApp.launch(function(request, response) {
  console.log("App launched !");
  return getAQI()
    .then(function (aqi) {
      console.log('Responding to AQI request for with:', aqi);
      response.say('The air quality index in the bay area is ' + aqi + '<break time="1s"/> Have a wonderful day!') ;
    })
    .catch(function(err){
      console.log('ERR: ' + err);
      response.say(err);
    });
  //response.say('I can tell you the air quality index for the bay area<break time="1s"/> Have a wonderful day!');
});

// The main Weather intent - checks if a day/date was supplied or not and sends the appropriate response
alexaApp.intent("airQuality", {
    "slots": {},
    "utterances": [
      "what's the air quality in the bay area",
      "what is the air quality index",
      "air quality"
    ]
  },
  function(request, response) {
    console.log("In AirQuality intent! ");
    // If the requester specified a date/day
    return getAQI()
      .then(function (aqi) {
        console.log('Responding to AQI request for with:', aqi);
        response.say('The air quality index in the bay area is ' + aqi);
      })
      .catch(function(err){
        console.log('ERR: ' + err);
        response.say(err);
      });
  }
);

alexaApp.intent("AMAZON.CancelIntent", {
    "slots": {},
    "utterances": []
  }, function(request, response) {
    console.log("Sent cancel response");
  	response.say("Ok, sure thing");
  	return;
  }
);

alexaApp.intent("AMAZON.StopIntent", {
    "slots": {},
    "utterances": []
  }, function(request, response) {
    console.log("Sent stop response");
  	response.say("Alright, I'll stop. See you later!");
  	return;
  }
);

alexaApp.sessionEnded(function(request, response) {
  console.log("In sessionEnded");
  console.error('Alexa ended the session due to an error');
  // no response required
});

// Looks up the weather for the date given, using forecast.io
function getAQI() {
  return new Promise(function(resolve, reject) {
    request({
      url: BASE_URL,
      json: true
    }, function(err, res, body) {
      var data;
      var text;
      if (err || res.statusCode >= 400) {
        console.error(res.statusCode, err);
        return reject('Unable to get Air quality index.');
      }
      data = getAQIFromPage(body);
      if (!data) {
       return reject('I have no air quality index for you - sorry.');
      }

      text = " " + data;
      resolve(text);
    });
  }); 
}

//
// helper function to check for numbers
//
function isNumeric(n) { 
  return !isNaN(parseFloat(n)) && isFinite(n); 
}

//
// Get the AQI from the page
//
function getAQIFromPage(htmlData) {
    var inx1 = htmlData.indexOf('South Central Bay'); // TODO: have all the other zones/citys in the future
    var inx2 = htmlData.indexOf('ftemp', inx1 + 8) + 9;
    var inx3 = htmlData.indexOf('<', inx2);
    var airInx = htmlData.substring(inx2, inx3);
    console.log("(!) Air index for $zone: " + airInx);
    if (isNumeric(airInx)) {
      var text = airInx + " which is " + getAQITerm(airInx);
      return text;
    }
    return -1;
}

//
// translate the AQI to words that people will understand
//
function getAQITerm(airInx) {
    if (airInx >= 0 && airInx <= 50) {
        return "Good";
    }
    else if (airInx > 50 && airInx <= 100) {
        return "Moderate";
    }
    else if (airInx > 100 && airInx <= 150) {
        return "Unhealthy for Sensitive Groups";
    }
    else if (airInx > 150 && airInx <= 200) {
        return "Unhealthy";
    }
    else if (airInx > 200 ) {
        return "Very Unhealthy";
    }
    return "";
}


//
// Start the party
//
app.listen(PORT, () => console.log("Our Alexa skill is Listening on port " + PORT + "."));
