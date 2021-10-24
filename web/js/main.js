//
// Get the AQI from https://www.purpleair.com/ and/or sparetheair.org
// So we can decide if it's ok to go for a ride/run
//
// @author Ido Green
// @date 8/2020
//

let aqiObj = {
  aqiVal: -1,
  lastUpdate: -1
}

let classNames = [
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

let svg = document.getElementsByClassName("gauge")[0];
let title = svg.getElementsByClassName("gauge_rating")[0];
let mainTitle = document.getElementById("main_title");
const app1 = "9af694a540de6120";
const app2 = "cc63fd7a56d8d331";

//
// Start the party
//
$(document).ready(function() {
  console.log("🍺 - Start the party");

  getTemp();
  getPurpleAQI();

  // let's refresh the data every 5 minutes
  const FIVE_MINUTES = 1000 * 60 * 5;
  setInterval(function(){
    getPurpleAQI();
   }, FIVE_MINUTES);
});

//
//
//
function getAQIFromLocalStorage() {
  const curAqi = window.localStorage.getItem('aqiObj');
  if (curAqi != null) {
    curAqiData = JSON.parse(curAqi);
    let lastUpdate = curAqiData.lastUpdate;
    let now = new Date().getTime() / 1000;
    if (now - lastUpdate > (3 * 1000 * 60 * 5)) {
      // let's not use this data if it's that old (> 15 min)
      curAqiData = null;
      title.innerHTML = "<br><small>Check below...</small>";  
    }
    return curAqiData;
  }
  else {
    title.innerHTML = "<br><small>Check below...</small>";  
  }  
}

//
// Get the current temp from openweathermap.org/data/2.5/weather?zip=94040,us&appid=XXX
// API doc: https://openweathermap.org/current
//
function getTemp() {
  let tempURL = "https://api.openweathermap.org/data/2.5/weather?zip=94024,us&APPID=" + app1 + app2;
  $.get(tempURL, function(data) {
    if (data.contents != undefined && data.contents.cod == 401) {
      console.log(" 🥺 ERROR with the weather temp data: " + data.contents.message);
    }
    else {  
      let description = data.weather[0].description;
      let tempK = data.main.temp;
      // Kelvin to F:  (280K − 273.15) × 9/5 + 32 = 44.33°F
      let tempF = Math.round( (tempK - 273.15) * 9/5 + 32 );
      let feelsLike = Math.round( (data.main.feels_like - 273.15) * 9/5 + 32 );
      let humidity = data.main.humidity;
      let windDirection = data.wind.deg;
      let windSpeed = data.wind.speed;
      let rain1h = data.rain;
      if (data.rain && (data.rain)["1h"]) {
        rain1h= (data.rain)["1h"];
      }
       
      //let rain3h = data.rain."3h";

      let htmlDetails = "<ul style='list-style-type:none; text-align: center'> " + 
                        "<li>🌡 Feels like: " + feelsLike + "ºF </li>" +
                        "<li>💦 Humidity: " + humidity + "% </li>" +
                        "<li>💨 Wind direction: " + windDirection + " deg</li>" +
                        "<li>🍃  <a href='https://www.windy.com/?gfs,37.421,-122.111,11' target='_blank'>Wind Speed:</a> " + windSpeed + " meter/sec</li>";

      if (rain1h) {
        htmlDetails += "<li>Rain in last hour: " + rain1h + "mm </li>";
      }
      // if (rain3h) {
      //   htmlDetails += "<li>Rain in 3 hours: " + rain3h + "mm </li>";
      // }
      htmlDetails += "</ul>";
      
      console.log("WEATHER 😎 temp: " + tempF + " desc: " + description);
      console.log("feels: " + feelsLike + " humidity: " + humidity + 
                  " wind dir: " + windDirection + " windSpeed: " + windSpeed + "meter/sec");
      if (tempF > 0) {
        mainTitle.innerHTML = "<h4>Los Altos Area - <a href='https://weather.com/weather/today/l/8102dc83928b477ba293d2869dcb04509fd361183c4318177dfa28c32af68af6' target='_blank'>" +
            tempF +  " ºF</a> " + description + " </h4>" + 
            "<details open> <summary>Weather Details</summary>" + htmlDetails+  " </details>";
      }
    }
  });
}

//
//
//
function getPurpleAQI() {
  let losAltosData = "https://www.purpleair.com/data.json?show=40757"; // st. simon church: "40757";
  $.get("proxy.php?url=" + losAltosData, function(data) {
    let aqiData = JSON.parse(JSON.stringify(data.contents)  );
    //console.log(aqiData);
    let curAqiData = null;
    try {
      if (aqiData.code == 429) {
        console.log("🧗🏽‍♀️ - " + new Date() + " - Rate limit from purpleAir ");
        // let's check if we have some data from the last 15 min
        curAqiData = getAQIFromLocalStorage();
      }

      let aqiVal = 0;
      let pmVal = 0;
      // TODO: check if this temp is acurate or not
      let temp = 0;
      if (curAqiData) {
        aqiVal = curAqiData.aqiVal;
      }
      else {
        if (aqiData.data != undefined && aqiData.data.length > 0 &&
            aqiData.data[0].length > 15) {
          pmVal = aqiData.data[0][1];
          temp = aqiData.data[0][20] - 9; // as it's a bit 'too warm'
          aqiVal = aqiFromPM(pmVal);
        }
        else {
          if (aqiData.data != null && aqiData.data.length > 0) {
            pmVal = aqiData.data[1][1];
            temp = aqiData.data[1][20] - 9; // as it's a bit 'too warm'
            aqiVal = aqiFromPM(pmVal);
          }
          else {
            curAqiData = getAQIFromLocalStorage();
            if (curAqiData) {
              aqiVal = curAqiData.aqiVal;
            }
          }
        }
      }
      
      console.log("🎩 Air index: " + aqiVal + " temp: " + temp + "F [ " + new Date() + " ]");
      var normalizeVal = 0;
      switch (true) {
        case (aqiVal >= 0 && aqiVal <= 50):
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
            console.log("WARN: Could not find a match to airIndex: " + aqiVal);
            break;
      }
      // Update the gauge with the AQI
      svg.className = "gauge " + classNames[normalizeVal].className;
      title.innerHTML = classNames[normalizeVal].title + "<br><small>" + aqiVal + "</small>";  
      saveAqi(aqiVal);
      
    } catch (error) {
      console.log("ERR getting the data:");
      console.log(error);
    }
  });
}

//
//
//
function saveAqi(aqiVal) {
  aqiObj.aqiVal = aqiVal;
  aqiObj.lastUpdate = new Date().getTime() / 1000;
  window.localStorage.setItem('aqiObj', JSON.stringify(aqiObj));
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