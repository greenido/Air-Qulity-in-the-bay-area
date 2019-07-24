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
//
//
$(document).ready(function() {
  console.log("== start the party");
  //geoLoc();
  getAQI(94024);
});

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
// TODO check reverse geo: http://maps.googleapis.com/maps/api/geocode/json?latlng=37.344350399999996,-122.06654909999997&sensor=true
//
function getZipCode(geoPoint) {
  let apiUrl =
    "https://maps.googleapis.com/maps/api/geocode/json?latlng=" +
    geoPoint[0] +
    "," +
    geoPoint[1] +
    "&sensor=true&key=AIzaSyCmZBjwB5XzBIO96f5iy8YkDoJ9hrvYSEk";
  $.getJSON(apiUrl, function(json) {
    console.log("++++" + json.results[0]);
    var address = json.results[0].address_components;
    var zipcode = address[address.length - 2].long_name;
    console.log(" ---- zipcode: " + zipcode);
    getAQI(zipcode);

    // var aqi = Math.floor(Math.random() * 4 + 1);
    // console.log("rand API: " + aqi);
    
  });
}

// TODO:
// https://www.airnow.gov/index.cfm?action=airnow.local_city&zipcode=94024&submit=Go
//
function getAQI(zipcode) {
  var curDate = getCurDate();
  var htmlPage = "http://sparetheair.org/stay-informed/todays-air-quality/five-day-forecast";
      
  $.get("proxy.php?url=" + htmlPage, function(data) {
    //console.log("===got from proxy airNow: " + JSON.stringify(data.contents));
    var htmlData = data.contents;
    if (htmlData === undefined || htmlData === null) {
      $("#last_update").html("<p>Could not fetch info! Sorry.</p>")
      return null;
    }
    /*
     $inx2 = strpos($htmlData, 'air-condition-data-panel', $inx1 + 8) + 9;
    $inx22 = strpos($htmlData, 'panel__4">', $inx2+4) + 10;
    $inx3 = strpos($htmlData, '<', $inx22);
    $airInx = substr($htmlData, $inx22, ($inx3 - $inx22));
    error_log("(!) Air index for $zone: " . $airInx);
    */
    var inx1 = htmlData.lastIndexOf('South Central Bay');
    var inx2 = htmlData.indexOf('panel__4', inx1 + 8) + 9;
    var inx3 = htmlData.indexOf('<', inx2);
    var airInx = htmlData.substr(inx2 , (inx3-inx2));
    console.log(" air index: " + airInx);
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
  var inx1 = htmlData.indexOf('class="aq8"') + 12;
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
