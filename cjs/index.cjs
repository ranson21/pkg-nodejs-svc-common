'use strict';

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var constants = require('src/constants');
var middleware = require('src/middleware');

// NPM Module dependencies

/**
 * Configure an instance of the Express App with middleware, routes, and optional db
 * @returns {object} -- Express App instance and Logger
 */
async function configure(router, environment) {
  // Create the express app
  const app = express();

  // Add support for content encodings (application/x-www-form-urlencoded, json)
  app.use(bodyParser.urlencoded({ extended: false }));
  app.use(bodyParser.json());

  // Add CORS support
  app.use(cors({ origin: environment.CORS }));

  // Attach the logger
  const { routeLogger, log, logMiddleware } = middleware.newLogger();
  app.use(logMiddleware);
  app.use(routeLogger);

  // Attach the router
  app.use(router(app));

  // Return the configured express app and logger
  return { app, log };
}

/**
 * Method to gracefully stop the server and close any open db connections
 * @param {Object} options -- Includes the server and optional db connection as well as the logger
 * @returns {Function} -- Partial app callback loaded with server and optional db connection
 */
function stop({ server, log }) {
  return () => {
    log.info(constants.MESSAGES.SHUTDOWN_START);
    server.close();
    log.info(constants.MESSAGES.SHUTDOWN_COMPLETE);
  };
}

/**
 * Express service listener
 * @param {Error} err -- Server Error
 */
function listener(log, port) {
  return (err) => {
    if (err) {
      log.info(constants.MESSAGES.STARTUP_ERROR);
      return;
    }

    log.info(constants.MESSAGES.STARTUP.replace("%port", port));
  };
}

/**
 * Start -- loads the express app
 */
async function start(app, log, environment) {
  // Set the port
  const port = environment.PORT;

  // Start the service
  const server = await app.listen(port, listener(log, port));

  // Listen for sigint to gracefully shutdown
  process.on("SIGINT", stop({ server, log }));
}

exports.configure = configure;
exports.listener = listener;
exports.start = start;
exports.stop = stop;
