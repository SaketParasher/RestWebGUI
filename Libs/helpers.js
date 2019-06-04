let crypto = require("crypto");
let config = require("../config");
let queryString = require("querystring");
let https = require("https");
const fs = require('fs');
const path = require('path');
const stringDecoder = require("string_decoder").StringDecoder;
//const Nexmo = require("nexmo");

/*
const nexmo = new Nexmo({
  apiKey: config.nexmo.apiKey,
  apiSecret: config.nexmo.apiSecret
});
*/
const decoder = new stringDecoder("utf-8");
let buffer = "";

let helpers = {};

helpers.hash = function(pass) {
  if (typeof pass == "string" && pass.length > 0) {
    let hash = crypto
      .createHmac("sha256", config.hashingSecret)
      .update(pass)
      .digest("hex");
    return hash;
  } else {
    return false;
  }
};

helpers.JSONtoObject = function(str) {
  try {
    return JSON.parse(str);
  } catch (e) {
    return {};
  }
};

helpers.createRandomString = function(strLength) {
  strLength = typeof strLength == "number" && strLength > 0 ? strLength : null;
  if (strLength != null) {
    let availableCharacters = "abcdefghijklmnopqrstuvwxyz0123456789";
    let randomString = "";
    for (let i = 0; i < strLength; i++) {
      randomString +=
        availableCharacters[
          Math.floor(Math.random() * availableCharacters.length)
        ];
    }
    return randomString;
  } else {
    return false;
  }
};

// TWILLIO MESSAGING SENDING FUNCTION
helpers.sendTwilioMessage = function(phone, message, callback) {
  const twilioClient = require("twilio")(
    config.twilio.accountSid,
    config.twilio.authToken
  );
  //validate parameters
  phone =
    typeof phone == "string" && phone.trim().length == 10
      ? phone.trim()
      : false;
  message =
    typeof message == "string" &&
    message.trim().length > 0 &&
    message.trim().length <= 1600
      ? message.trim()
      : false;
  if (true) {
    // configure the request payload
    let payload = {
      From: config.twilio.fromPhone,
      To: "+91" + phone,
      Body: message
    };

    twilioClient.messages
      .create({
        body: message,
        to: "+91" + phone, // Text this number
        from: "+19153206813" // From a valid Twilio number
      })
      .then(
        message => console.log(message.sid),
        err => {
          console.log(err);
        }
      );

    // STRINGIFY THE PAYLOAD
    let stringPayload = queryString.stringify(payload);

    /*
    // Configure the request details
    let requestDetails = {
      protocol: "https:",
      hostname: "api.twilio.com",
      method: "POST",
      path:
        "/2010-04-01/Accounts/" + config.twilio.accountSid + "/Messages.json",
      auth: config.twilio.accountSid + ":" + config.twilio.authToken,
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        "Content-Length": Buffer.byteLength(stringPayload)
      }
    };

    // Instantiate the request object
    let twilioReq = https.request(requestDetails, res => {
      console.log("Response Arrived");
      // Grab the status of the sent request
      let status = res.statusCode;
      console.log("status :- " + status);

      //callback the requester if the request went through
      if (status == 200 || status == 201) {
        // callback(false) because we are using error back pattern.
        callback(false);
      } else {
        callback("Status Code returned was " + status);
      }
    });

    // Bind the error handler on request so that it doesn't gets thrown back
    twilioReq.on("error", err => {
      console.log("Error Occurred from error callabck");
      console.log(err.message + " " + err.name);
      callback(err);
    });

    // Add the payload to the request.
    twilioReq.write(stringPayload);

    // End the Request
    twilioReq.end();

    */
  } else {
    callback(" Given parameters were missing or invalid");
  }
};

/*
helpers.sendNexmoMessage = function(from, to, message) {
  nexmo.message.sendSms(from, to, message, (err, responseData) => {
    if (err) {
      console.log(err);
    } else {
      if (responseData.messages[0]["status"] === "0") {
        console.log("Message sent successfully.");
      } else {
        console.log(
          `Message failed with error: ${responseData.messages[0]["error-text"]}`
        );
      }
    }
  });
};*/

// Helper Method to get the templates


module.exports = helpers;
