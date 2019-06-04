// Dependencies
const http = require("http");
const https = require("https");
const url = require("url");
const fs = require("fs");
const stringDecoder = require("string_decoder").StringDecoder;
const config = require("../config");
const lib = require("./libs");
const helper = require("./helpers");
const handler = require("./handler");
const path = require("path");

// @TODO Delete it later
/*lib.create("users", "second", { secKey: "secVal" }, result => {
  console.log(result);
});*/
/*lib.delete("users", "second", result => {
  console.log(result);
});*/

// TESTING TWILIO MESSAGING

/*
helper.sendTwilioMessage("7019609525", "Hello", err => {
  if (err) {
    console.log("ERRRROR");
    console.log(err);
  }
});
*/

//helper.sendTwilioMessage("7019609525", "Hello Maa");

//helper.sendNexmoMessage("Nexmo", "917019609525", "Hello Maa");

// Container for the server
let server = {};

let trimPath = function(pathName) {
  let splittedPath = pathName.split("/");
  if (splittedPath[0] == "") splittedPath.splice(0, 1);
  if (splittedPath[splittedPath.length - 1] == "")
    splittedPath.splice(splittedPath.length - 1, 1);

  return splittedPath.join("/");
};

const httpsServerCOnfig = {
  key: fs.readFileSync(path.join(__dirname, "../Https/key.pem")),
  cert: fs.readFileSync(path.join(__dirname, "../Https/cert.pem"))
};

const httpServer = http.createServer((req, res) => {
  //console.log("Inside http server");
  unifiedServer(req, res);
});

const httpsServer = https.createServer(httpsServerCOnfig, (req, res) => {
  //console.log("Inside https server");
  unifiedServer(req, res);
});

const unifiedServer = function(req, res) {
  // Get the URL and parse it. true as second arg to get the query string using queryString Module
  var parsedUrl = url.parse(req.url, true);

  // Get the method
  var method = req.method.toLocaleLowerCase();

  // Get the query string as an object
  var queryStringObj = parsedUrl.query;

  // Get the request header
  var headers = req.headers;

  //console.log(headers);

  const decoder = new stringDecoder("utf-8");
  var buffer = "";

  // Get the payload if any ie data of post request
  req.on("data", data => {
    buffer += decoder.write(data);
  });

  req.on("end", () => {
    buffer += decoder.end();

    let data = {
      pathName: trimPath(parsedUrl.pathname),
      method: method,
      queryString: queryStringObj,
      header: headers,
      payload: helper.JSONtoObject(buffer)
    };

    let trimmedPath = trimPath(parsedUrl.pathname);
    
    let handlerToCall =
      router[trimmedPath] != undefined ? router[trimmedPath] : router.notFound;

    handlerToCall(data, function(statusCode, payload, contentType) {

      // use the status code called back by the handler, or default to 200
      statusCode = typeof statusCode == 'number' ? statusCode :200;

      // determine the type of response fallback to JSON
      contentType = typeof(contentType) == 'string' ? contentType : 'json';
      
      let payloadToSend = '';

      // Set the Response part that are specific to content
      if(contentType == 'json'){
        payloadToSend = typeof payload == 'object' ? JSON.stringify(payload) : {};
        res.setHeader("Content-Type", "application/json");
      }
      if(contentType == 'html'){
        payloadToSend = typeof payload == 'string' ? payload : '';
        res.setHeader('Content-Type','text/html');
      }
      
      // Set the response part that are common to all the content Types.
      res.writeHead(statusCode);
      res.end(payloadToSend);
    });
  });
};

// router object which contains the routes
var router = {
  "": handler.index,
  'account/create':handler.accountCreate,
  'account/edit':handler.accountEdit,
  'account/deleted':handler.accountDeleted,
  'session/create':handler.sessionCreate,
  'session/deleted':handler.sessionDeleted,
  'checks/all':handler.checkList,
  'checks/create':handler.checkCreate,
  'checks/edit':handler.checkEdit,
  ping: handler.ping,
  "api/users": handler.users,
  "api/tokens": handler.tokens,
  "api/checks": handler.checks,
  notFound: handler.notFound
};

server.init = function() {
  httpsServer.listen(config.httpsPort, () => {
    console.log(
      `Server is listening on port ${config.httpsPort} in ${
        config.envName
      } Environment`
    );
  });

  httpServer.listen(config.httpPort, () => {
    console.log(
      `Server is listening on port ${config.httpPort} in ${
        config.envName
      } Environment`
    );
  });
};

module.exports = server;
