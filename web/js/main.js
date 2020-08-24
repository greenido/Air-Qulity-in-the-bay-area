var classNames = [
  {
    className: "green",
    title: "Good"
  },
  {
    className: "yellow",
    title: "Moderate"
  },
  {
    className: "orange",
    title: "Unhealthy<br>for<br>Sensitive"
  },
  {
    className: "purple",
    title: "Unhealthy"
  },
  {
    className: "red",
    title: "Very<br>Unhealthy!"
  }
];

var svg = document.getElementsByClassName("gauge")[0];
var title = svg.getElementsByClassName("gauge_rating")[0];

//
// Start the party
//
$(document).ready(function() {
  console.log("== start the party");
  getPurpleAQI();

  const FIVE_MINUTES = 1000 * 60 * 5;
  setInterval(function(){
    getPurpleAQI();
   }, FIVE_MINUTES);
});

function getPurpleAQI() {
  let losAltosData = "https://www.purpleair.com/data.json?show=40757";
  $.get("proxy.php?url=" + losAltosData, function(data) {
    let aqiData = JSON.parse(JSON.stringify(data.contents)  );
    //console.log(aqiData);
    try {
      if (aqiData.code == 429) {
        console.log("🧗🏽‍♀️ - " + new Date() + " - Rate limit from purpleAir ");
        getSpareTheAirAQI();
        // svg.className = "gauge " + classNames[3].className;
        // title.innerHTML = "<br><small>check below...</small>";  
        return;
      }
      let pmVal = aqiData.data[0][1];
      let aqiVal = aqiFromPM(pmVal);
      console.log("🎩 Air index: " + aqiVal + " [ " + new Date() + " ]");
      var normalizeVal = 0;
      switch (true) {
        case (aqiVal > 0 && aqiVal <= 50):
            normalizeVal = 0;
            break;
        case (aqiVal > 50 && aqiVal <= 100):
            normalizeVal = 1;
            break;
        case (aqiVal > 100 && aqiVal <= 150):
            normalizeVal = 2;
            break;
        case (aqiVal > 150 && aqiVal <= 200):
            normalizeVal = 3;
            break;
        case (aqiVal > 200 ):
            normalizeVal = 4;
            break;
        default:
            console.log("Could not find a match to airIndex: " + airInx);
            break;
      }
      // Update the gauge with the AQI
      svg.className = "gauge " + classNames[normalizeVal].className;
      title.innerHTML = classNames[normalizeVal].title + "<br><small>" + aqiVal + "</small>";  
    } catch (error) {
      console.log("ERR getting the data:");
      console.log(error);
    }
    

  });

}

//
//
//
function geoLoc() {
  if (navigator.geolocation) {
    navigator.geolocation.getCurrentPosition(function(position) {
      where = [position.coords.latitude, position.coords.longitude];
      console.log("== " + where);
      getZipCode(where);
    });
  } else {
    console.error("Could not get the location");
  }
}

//
// The old data from sparetheair.org
//
function getSpareTheAirAQI() {
  var curDate = getCurDate();
  var htmlPage = "http://sparetheair.org/understanding-air-quality/air-quality-forecast";
      
  $.get("proxy.php?url=" + htmlPage, function(data) {
    //console.log("===got from proxy airNow: " + JSON.stringify(data.contents));
    var htmlData = data.contents;
    if (htmlData === undefined || htmlData === null) {
      $("#last_update").html("<p>Could not fetch info! Sorry.</p>")
      return null;
    }
    var inx1 = htmlData.indexOf('South Central Bay');
    var inx11 = htmlData.indexOf('FiveDaysForecastByDays', inx1 + 8) + 9;
    var inx2 = htmlData.indexOf('["', inx11 + 4) + 2;
    var inx3 = htmlData.indexOf('"', inx2);
    var airInx = htmlData.substr(inx2 , (inx3-inx2));

    console.log("🎩 sparetheair.org AQI: " + airInx);
    var normalizeVal = 0;
    switch (true) {
      case (airInx > 0 && airInx <= 50):
          normalizeVal = 0;
          break;
      case (airInx > 50 && airInx <= 100):
          normalizeVal = 1;
          break;
      case (airInx > 100 && airInx <= 150):
          normalizeVal = 2;
          break;
      case (airInx > 150 && airInx <= 200):
          normalizeVal = 3;
          break;
      case (airInx > 200 ):
          normalizeVal = 4;
          break;
      default:
          console.log("Could not find a match to airIndex: " + airInx);
          break;
    }
    // Update the gauge with the AQI
    svg.className = "gauge " + classNames[normalizeVal].className;
    title.innerHTML = classNames[normalizeVal].title + "<br><small>" + airInx + "</small>";

    // update the last update div
    var lastUpdate = getLastUpdate(htmlData);
    $("#last_update").html("<p>Update At " + lastUpdate + "</p>")
  });
}

//
//
//
function getLastUpdate(htmlData) {
  var inx1 = htmlData.indexOf('Last Updated:') + 13;
  var inx2 = htmlData.indexOf('<', inx1);
  var lastUpdate = htmlData.substr(inx1 , (inx2 - inx1));
  if (lastUpdate.length < 7) {
    console.log("Could not get the last update. Got: " + lastUpdate);
    return "N/A";
  }
  return lastUpdate;
}

//
//
//
function airNowlogResults(json) {
  console.log("== airnow retJson: " + json);
}

//
// TODO: https://weather.weatherbug.com/life/air-quality/94024
//
function getAQIweather(zipcode) {
  console.log("-- in getAQIweather()");
}

//
//
//
function getCurDate() {
  var today = new Date();
  var dd = today.getDate();
  var mm = today.getMonth() + 1; //January is 0!

  var yyyy = today.getFullYear();
  if (dd < 10) {
    dd = "0" + dd;
  }
  if (mm < 10) {
    mm = "0" + mm;
  }
  var today = yyyy + "-" + mm + "-" + dd;
  return today;
}
