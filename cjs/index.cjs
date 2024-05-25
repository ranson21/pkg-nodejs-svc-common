'use strict';

var express = require('express');
var cors = require('cors');
var bodyParser = require('body-parser');
var winston = require('winston');
var expressWinston = require('express-winston');
require('swagger-ui-express');
require('yamljs');

// Global constants
const MESSAGES = {
  STARTUP: "🚀 Server running at localhost:%port",
  SHUTDOWN_START: "Shutting down... To force quit hit Ctrl+C again",
  SHUTDOWN_COMPLETE: "✅ Successfully closed the server",
  STARTUP_ERROR: "Error in server setup",
};

// NPM Module Dependencies

/**
 * Standard Logging Format
 * @param {Object} options -- Log options including level and message
 */
const logFormatter = ({ level, timestamp, message, meta }) => {
  // Start creating the message with the log level and timestamp
  let msg = `${level} - [${timestamp}]: `;

  // Attach route specific details
  if (meta) {
    // Attach the user if present
    if (meta?.req?.user?.email) {
      msg += `(${meta?.req.user?.email}) `;
    }

    // Attach the status code icon
    switch (true) {
      case meta?.res?.statusCode >= 400 && meta?.res?.statusCode <= 499:
        msg += "🚫 ";
        break;
      case meta?.res?.statusCode >= 200 && meta?.res?.statusCode <= 299:
        msg += "✅ ";
        break;
      case meta?.res?.statusCode >= 300 && meta?.res?.statusCode <= 399:
        msg += "➡ ";
        break;
      case meta?.res?.statusCode >= 500:
        msg += "❌ ";
        break;
    }

    msg += `${meta?.res?.statusCode} - `;
  }

  // Attach the message at the end
  msg += message;

  // Return the formatted log message
  return msg;
};

/**
 * CreateLogger -- Creates an instance of the winston logger
 * @returns {Object} -- App loggers
 */
const newLogger = () => {
  const logger = {
    transports: [
      new winston.transports.Console({
        format: winston.format.combine(
          winston.format.colorize(),
          winston.format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
          winston.format.printf(logFormatter),
        ),
      }),
    ],
    headerBlacklist: ["authorization", "cookie"],
    level: "info",
    requestWhitelist: ["user", "headers", "query", "originalUrl", "method"],
  };

  const log = winston.createLogger(logger);

  // Return the different loggers
  return {
    log,
    logMiddleware: (req, _, next) => {
      req.logger = log;
      next();
    },
    routeLogger: expressWinston.logger(logger),
  };
};

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
  const { routeLogger, log, logMiddleware } = newLogger();
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
    log.info(MESSAGES.SHUTDOWN_START);
    server.close();
    log.info(MESSAGES.SHUTDOWN_COMPLETE);
  };
}

/**
 * Express service listener
 * @param {Error} err -- Server Error
 */
function listener(log, port) {
  return (err) => {
    if (err) {
      log.info(MESSAGES.STARTUP_ERROR);
      return;
    }

    log.info(MESSAGES.STARTUP.replace("%port", port));
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
