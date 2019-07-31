<?php

/**
 * @what Goolgle Apps for Assistant that give you AQI in the bay area
 * @author Ido Green | @greenido
 * @date 10/2017
 * @see 
 * 1. reporting zones: http://sparetheair.org/stay-informed/todays-air-quality/reporting-zones
 * 2. http://sparetheair.org/stay-informed/todays-air-quality/five-day-forecast
 * 3. Done: post on the topic - https://greenido.wordpress.com
 */

/**
 * 
 * @param type $html
 * @param type $zone - e.g. South Central Bay
 */
function getAQIFromPage($htmlData, $zone) {
    $inx1 = strrpos($htmlData, $zone);
    $inx2 = strpos($htmlData, 'air-condition-data-panel', $inx1 + 8) + 9;
    $inx22 = strpos($htmlData, 'panel__4">', $inx2+4) + 10;
    $inx3 = strpos($htmlData, '<', $inx22);
    $airInx = substr($htmlData, $inx22, ($inx3 - $inx22));
    error_log("(!) Air index for $zone: " . $airInx);
    if (is_numeric($airInx)) {
        return $airInx;
    }
    return -1;
}

/**
 * return the term of the range out of the aqi index number
 */
function getAQITerm($airInx) {
    if ($airInx >= 0 && $airInx <= 50) {
        return "Good";
    }
    elseif ($airInx > 50 && $airInx <= 100) {
        return "Moderate";
    }
    elseif ($airInx > 100 && $airInx <= 150) {
        return "Unhealthy for Sensitive Groups";
    }
    elseif ($airInx > 150 && $airInx <= 200) {
        return "Unhealthy";
    }
    elseif ($airInx > 200 ) {
        return "Very Unhealthy";
    }
    return "";
}

//
// Entry point to all the different request that this webhook will get
//
function processMessage($update) {

    $htmlPage = "http://sparetheair.org/";
    $htmlData = file_get_contents($htmlPage);
    //error_log("====\n" . $htmlData . "\n=========\n");

    if (!isset($htmlData)) {
        Ïerror_log("Could not get the html data");
        return "N/A";
    }

    // getting the aqi for all the 5 locations
    $airInxNorth = getAQIFromPage($htmlData, 'Northern Zone');
    $airInxCoast = getAQIFromPage($htmlData, 'Coast and Central Bay');
    $airInxEastern = getAQIFromPage($htmlData, 'Eastern Zone');
    $airInxSouth = getAQIFromPage($htmlData, 'South Central Bay');
    $airInxSanta = getAQIFromPage($htmlData, 'Santa Clara Valley');

    if ($update["result"]["action"] === "air-quality-in-zone") {
        $zone = strtolower($update["result"]["parameters"]["zones"]);
        error_log(" Working on $zone ");
        $tmpStr = "Sorry! I could not find the air quality index for $zone. Try again later.";
        if (strpos($zone, "north") > -1) {
            $aqiStr = getAQITerm($airInxNorth);
            $tmpStr = "The North Counties Air Quality Index is {$airInxNorth} which is {$aqiStr}. Do you wish to check another location or shell we say bye bye?";
        } elseif (strpos($zone, "coast") > -1) {
            $aqiStr = getAQITerm($airInxCoast);
            $tmpStr = "The Coast and Central Bay Air Quality Index is {$airInxCoast} which is {$aqiStr}. Do you wish to check another location or shell we say bye?";
        } elseif (strpos($zone, "eastern") > -1) {
            $aqiStr = getAQITerm($airInxEastern);
            $tmpStr = "The Eastern District Air Quality Index is {$airInxEastern} which is {$aqiStr}. Do you wish to check another location or shell we say see you later?";
        } elseif (strpos($zone, "south") > -1) {
            $aqiStr = getAQITerm($airInxSouth);
            $tmpStr = "The South Central Bay Air Quality Index is {$airInxSouth} which is {$aqiStr}. Do you wish to check another location or shell we say see you around?";
        } elseif (strpos($zone, "santa") > -1) {
            $aqiStr = getAQITerm($airInxSanta);
            $tmpStr = "The Santa Clara Valley Air Quality Index is {$airInxSanta} which is {$aqiStr}. Do you wish to check another location or shell we say good bye?";
        }

        sendMessage(array(
            "source" => "aqi-webhook",
            "speech" => $tmpStr,
            "displayText" => $tmpStr
        ));
    }
    else {
      // Say good bye!
      sendMessage(array(
        "source" => "aqi-webhook",
        "speech" => "Have a wonderful day!",
        "displayText" => "Have a wonderful day!"
      ));
    }
}

//
// Util function to return results
//
function sendMessage($parameters) {
    header('Content-Type: application/json');
    $retObj = json_encode($parameters);
    error_log("\n== returning: $retObj \n");
    echo $retObj;
}

//
// Start the party. Get the $_POST data and work with it.
//
$startTime = time();
$response = file_get_contents("php://input");
error_log("\n== STARTING and Got: $response \n\n");
$update = json_decode($response, true);
if (isset($update["result"]["action"])) {
    processMessage($update);
} else {
    error_log("\nError: $update \n");
    // A simple 'error msg' that will guide the user to provide something that we can work with
    echo '{ "speech": "Sorry but I did not understand. Try: What is the air quality in South Central Bay?",
    "source": "aqi-bay-area-webhook",
    "displayText": "Sorry but I did not understand. Try: What is the air quality in South Central Bay?" }';
}
$endTime = time();
error_log("-P- Took: " . ($endTime - $startTime) . "ms to return an answer");



/* TESTING case

//quick unit test
processMessage("bla-bla-testing");
exit(0);

$testJSON = '{
  "id": "2ffce933-c055-426f-9ff8-cc43d2d2e291",
  "timestamp": "2017-10-20T04:47:07.129Z",
  "lang": "en",
  "result": {
    "source": "agent",
    "resolvedQuery": "air in the north?",
    "action": "air-quality-in-zone",
    "actionIncomplete": false,
    "parameters": {
      "zones": "northern zone"
    },
    "contexts": [],
    "metadata": {
      "intentId": "bcd8c286-f2c2-43de-8436-2f3552ccf697",
      "webhookUsed": "false",
      "webhookForSlotFillingUsed": "false",
      "intentName": "air-quality-in-zone"
    },
    "fulfillment": {
      "speech": "",
      "messages": [
        {
          "type": 0,
          "id": "75db4b39-106f-405e-9724-60c58ad6d750",
          "speech": ""
        }
      ]
    },
    "score": 0.949999988079071
  },
  "status": {
    "code": 200,
    "errorType": "success"
  },
  "sessionId": "310a406c-17d4-4268-8f0f-12e6baea6918"
}';

//$response = $testJSON;

*/