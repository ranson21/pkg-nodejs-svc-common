'use strict';

var winston = require('winston');
var expressWinston = require('express-winston');
var swagger = require('swagger-ui-express');
var YAML = require('yamljs');

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

/**
 * Attach the API documentation
 * @param {Object} router -- Express Router Instance
 */
const initSwagger = (router) => {
  // Load the API documentation
  const apiDoc = YAML.load("config/swagger.yaml");

  // Attach the api docs to the router
  router.use("/api-docs", swagger.serve);
  router.get("/api-docs", swagger.setup(apiDoc));
};

exports.initSwagger = initSwagger;
exports.logFormatter = logFormatter;
exports.newLogger = newLogger;
