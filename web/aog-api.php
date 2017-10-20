<?php

/**
 * @what Goolgle Apps for Assistant that give you AQI in the bay area
 * @author Ido Green | @greenido
 * @date 10/2017
 * @see https://greenido.wordpress.com
 */

/**
 * 
 * @param type $html
 * @param type $zone - e.g. South Central Bay
 */
function getAQIFromPage($htmlData, $zone) {
    $inx1 = strpos($htmlData, $zone);
    $inx2 = strpos($htmlData, 'ftemp', $inx1 + 8) + 9;
    $inx3 = strpos($htmlData, '<', $inx2);
    $airInx = substr($htmlData, $inx2, ($inx3 - $inx2));
    error_log("(!) Air index for $zone: " + $airInx);
    if (is_numeric($airInx)) {
        return $airInx;
    }
    return -1;
}

//
// Entry point to all the different request that this webhook will get
//
function processMessage($update) {

    $htmlPage = "http://sparetheair.org/stay-informed/todays-air-quality/five-day-forecast";
    $htmlData = file_get_contents($htmlPage);
    //error_log("====\n" . $htmlData . "\n=========\n");

    if (!isset($htmlData)) {
        Ïerror_log("Could not get the html data");
        return "N/A";
    }

//    $inx1 = strpos($htmlData, 'South Central Bay');
//    $inx2 = strpos($htmlData, 'ftemp', $inx1 + 8) + 9;
//    $inx3 = strpos($htmlData, '<', $inx2);
//    $airInx = substr($htmlData, $inx2, ($inx3 - $inx2));

    $airInxNorth = getAQIFromPage($htmlData, 'North Counties');
    $airInxCoast = getAQIFromPage($htmlData, 'Coast and Central Bay');
    $airInxEastern = getAQIFromPage($htmlData, 'Eastern District');
    $airInxSouth = getAQIFromPage($htmlData, 'South Central Bay');
    $airInxSanta = getAQIFromPage($htmlData, 'Santa Clara Valley');

    if ($update["result"]["action"] === "air-quality-in-zone") {
        $zone = $update["result"]["parameters"]["zones"];
        error_log(" Working on $zone ");
        $tmpStr = "Sorry! I could not find the air quality index for $zone. Try again later.";
        if (strpos($zone, "north") > -1) {
            $tmpStr = "The North Counties Air Quality Index is {$airInxNorth}. Do you wish to check another location or good bye?";
        } elseif (strpos($zone, "coast") > -1) {
            $tmpStr = "The Coast and Central Bay Air Quality Index is {$airInxCoast}. Do you wish to check another location or good bye?";
        } elseif (strpos($zone, "eastern") > -1) {
            $tmpStr = "The Eastern District Air Quality Index is {$airInxEastern}. Do you wish to check another location or good bye?";
        } elseif (strpos($zone, "south") > -1) {
            $tmpStr = "The South Central Bay Air Quality Index is {$airInxSouth}. Do you wish to check another location or good bye?";
        } elseif (strpos($zone, "santa") > -1) {
            $tmpStr = "The Santa Clara Valley Air Quality Index is {$airInxSanta}. Do you wish to check another location or good bye?";
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
$response = file_get_contents("php://input");

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

error_log("\n== STARTING and Got: $response \n\n");
$update = json_decode($response, true);
if (isset($update["result"]["action"])) {
    processMessage($update);
} else {
    error_log("\nError: $update \n");
    // A simple 'error msg' that will guide the user to provide something that we can work with
    echo '{ "speech": "Sorry but I did not understand. Try: What is the air quality in South Central Bay?",
    "source": "eth-price-sample",
    "displayText": "Sorry but I did not understand. Try: What is the air quality in South Central Bay?" }';
}