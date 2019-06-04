/**
 *  Worker related Tasks
 */

// Dependencies

const path = require("path");
const fs = require("fs");
const http = require("http");
const https = require("https");
const url = require("url");
const libs = require("./libs");
const helpers = require("./helpers");
const _logs = require("./logs");

// Instantiate the worker container object
let workers = {};

// Timer to execute the worker-process once per minute
workers.loop = function() {
  setInterval(function() {
    workers.gatherAllChecks();
  }, 1000 * 60);
};

// Sanity-Check the check data that we are pulling out of each check
workers.validateCheckData = function(originalCheckData) {
  originalCheckData =
    typeof originalCheckData == "object" && originalCheckData != null
      ? originalCheckData
      : {};
  originalCheckData.id =
    typeof originalCheckData.id == "string" &&
    originalCheckData.id.trim().length == 20
      ? originalCheckData.id
      : false;
  originalCheckData.phone =
    typeof originalCheckData.userPhone == "string" &&
    originalCheckData.userPhone.trim().length == 10
      ? originalCheckData.userPhone
      : false;
  originalCheckData.protocol =
    typeof originalCheckData.protocol == "string" &&
    ["http", "https"].indexOf(originalCheckData.protocol) > -1
      ? originalCheckData.protocol
      : false;
  originalCheckData.url =
    typeof originalCheckData.url == "string" &&
    originalCheckData.url.trim().length > 0
      ? originalCheckData.url.trim()
      : false;
  originalCheckData.method =
    typeof originalCheckData.method == "string" &&
    ["get", "post", "put", "delete"].indexOf(originalCheckData.method) > -1
      ? originalCheckData.method
      : false;
  originalCheckData.successCodes =
    typeof originalCheckData.successCodes == "object" &&
    originalCheckData.successCodes instanceof Array &&
    originalCheckData.successCodes.length > 0
      ? originalCheckData.successCodes
      : false;
  originalCheckData.timeoutSeconds =
    typeof originalCheckData.timeoutSeconds == "number" &&
    originalCheckData.timeoutSeconds % 1 === 0 &&
    originalCheckData.timeoutSeconds >= 1 &&
    originalCheckData.timeoutSeconds <= 5
      ? originalCheckData.timeoutSeconds
      : false;

  /* Set the keys that may not be set ( if the workers have never seen this check before)
   * There will be two new keys one is called State that is gonna hold whether the check is currently up or currently down
   * And the next key is called last checked which is a timestamp indicating the last time that this check was performed.  */

  originalCheckData.state =
    typeof originalCheckData.state == "string" &&
    ["up", "down"].indexOf(originalCheckData.state) > -1
      ? originalCheckData.state
      : "down";
  originalCheckData.lastChecked =
    typeof originalCheckData.lastChecked == "number" &&
    originalCheckData.lastChecked > 0
      ? originalCheckData.lastChecked
      : false;

  // If all the checks passed , pass the data along to the next step in the process
  if (
    originalCheckData.id &&
    originalCheckData.userPhone &&
    originalCheckData.protocol &&
    originalCheckData.url &&
    originalCheckData.method &&
    originalCheckData.successCodes &&
    originalCheckData.timeoutSeconds
  ) {
    // if all the check data is verified and validated then pass the originalCheckData
    workers.performCheck(originalCheckData);
  } else {
    console.log(
      "Error :- One of the check is not properly Formatted. Skipping It."
    );
  }
};

workers.performCheck = function(originalCheckData) {
  // Prepare the initial check outcome
  let checkOutCome = {
    error: false,
    responseCode: false
  };

  // Mark that the outcome has not been sent yet
  let outcomeSent = false;

  // parse the hostname and the path out of originl checkdata
  let parsedUrl = url.parse(
    originalCheckData.protocol + "://" + originalCheckData.url
  );

  let hostName = parsedUrl.hostname;
  let path = parsedUrl.path;
  // construct the request
  var requestDtails = {
    protocol: originalCheckData.protocol + ":",
    hostname: hostName,
    method: originalCheckData.method.toUpperCase(),
    path: path,
    timeout: originalCheckData.timeoutSeconds * 1000
  };

  // Instantiate the request object
  let _moduleToUse = originalCheckData.protocol;
  if (_moduleToUse == "https") {
    _moduleToUse = https;
  } else {
    _moduleToUse = http;
  }
  //console.log(_moduleToUse + " " + typeof _moduleToUse);

  let req = _moduleToUse.request(requestDtails, res => {
    let status = res.statusCode;

    // update the checkoutcome and pass the data along
    checkOutCome.responseCode = status;

    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutCome);
      outcomeSent = true;
    }
  });

  // Error on Request
  req.on("error", err => {
    checkOutCome.error = {
      error: true,
      value: err
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutCome);
      outcomeSent = true;
    }
  });

  // Timeout on Request
  req.on("timeout", err => {
    checkOutCome.error = {
      error: true,
      value: "timeout"
    };
    if (!outcomeSent) {
      workers.processCheckOutcome(originalCheckData, checkOutCome);
      outcomeSent = true;
    }
  });

  //End the Request
  req.end();
};

// Process the CheckOutcome, update the checkdata as needed, trigger an alert if needed
// special logic for accomodating a check that has never been tested before

workers.processCheckOutcome = function(originalCheckData, checkOutCome) {
  // Decide if the check is considered up or down
  let state =
    !checkOutCome.error &&
    checkOutCome.responseCode &&
    originalCheckData.successCodes.indexOf(checkOutCome.responseCode) > -1
      ? "up"
      : "down";
  // Decide if an alert is warranted
  let alertWarranted =
    originalCheckData.lastChecked && originalCheckData.state != state
      ? true
      : false;

  // Log Function
  workers.log = function(
    originalCheckData,
    checkOutCome,
    state,
    alertWarranted,
    timeOfCheck
  ) {
    let logData = {
      check: originalCheckData,
      outcome: checkOutCome,
      state: state,
      alert: alertWarranted,
      time: timeOfCheck
    };

    // convert data to string
    var logString = JSON.stringify(logData);

    // Determine the log file name
    let logFileName = originalCheckData.id;

    // Append the log string to the file
    _logs.append(logFileName, logString, err => {
      if (!err) {
        console.log("Logging to file succedded");
      } else {
        console.log("Logging to file failed");
      }
    });
  };

  // Log the outcome
  let timeOfCheck = new Date();
  workers.log(
    originalCheckData,
    checkOutCome,
    state,
    alertWarranted,
    timeOfCheck.toDateString() + " " + timeOfCheck.toLocaleTimeString()
  );

  // update CheckData
  let newCheckData = originalCheckData;
  newCheckData.state = state;
  newCheckData.lastChecked = Date.now();

  // Save the Update
  libs.update("checks", newCheckData.id, newCheckData, err => {
    if (!err) {
      // send the new check data to the next phase in the process if needed
      if (alertWarranted) {
        //workers.alertUserToStatusChange(newCheckData);
      } else {
        console.log("Check outcome has not changed , no alert needed");
      }
    } else {
      console.log("Error Trying to save updates to one of the checks");
    }
  });
};

workers.alertUserToStatusChange = function(newCheckData) {
  let msg =
    "Alert: Your check for " +
    newCheckData.method.toUpperCase() +
    " " +
    newCheckData.protocol +
    "://" +
    newCheckData.url +
    " is currently " +
    newCheckData.state;
  helpers.sendTwilioMessage("7019609525", msg);
};

// Lookup all the checks, get their data and send that data to a validator
workers.gatherAllChecks = function() {
  // Get all the checks that exists in the system
  libs.list("checks", (err, checks) => {
    if (!err && checks && checks.length > 0) {
      // Iterate all the checks and then read the check data
      for (let check of checks) {
        // Read each check data
        libs.read("checks", check, (err, originalCheckData) => {
          if (!err && originalCheckData) {
            // If there is data pass that check data to the validator, and let that function continue or log error
            workers.validateCheckData(originalCheckData);
          } else {
            console.log("Error Reading one of the checks data");
          }
        });
      }
    } else {
      console.log("Error :- couldn't find any checks to process");
    }
  });
};

// Rotate (compress) the log files
workers.rotateLogs = function(){
  // List all the non compressed log files. false is passed as first arg to signify that we need only decompressed logs not compressed ones.
  // logs.list will list all the logs and we pass false as 1st arg to denote that we want to list only decompressed logs and not compressed ones.
  _logs.list(false,(err,logs)=>{
    if(!err && logs && logs.length > 0){
      for(let log of logs){
        // compress the data to a different file
        let logId = log.replace('.log','');
        let newLogId = logId+'-'+Date.now();
        _logs.compress(logId,newLogId,(err)=>{
          if(!err){
            // Truncate the log
            _logs.truncate(logId,(err)=>{
              if(!err){
                console.log(' Success truncating logFiles');
              }else{
                console.log('Error truncating log file');
              }
            });
          }else{
            console.log('Error compressing one of the log file.',err);
          }
        });
      }
    }else{
      console.log('Error :- could not find any logs to rotate');
    }
  })
};

// Timer to execute the log-rotation process once per day
workers.logRotationLoop = function(){
  setInterval(function() {
  }, 1000 * 60 * 60 * 24);
   workers.rotateLogs();
};


// Worker init script
workers.init = function() {
  // Execute all the checks immediately
  this.gatherAllChecks();

  // set a interval so the checks will execute later on
  this.loop();

  // compress all the logs immediately
  workers.rotateLogs();

  // call the compression loop so logs will be compressed later on 
  workers.logRotationLoop();
};

// export the worker container object
module.exports = workers;
