/**
 * index.js for our API
 */

const server = require("./Libs/server");
const worker = require("./Libs/worker");

let app = {};

app.init = function() {
  // Initialise the server
  server.init();

  // Initialise the workers
  worker.init();
};

app.init();

module.exports = app;
