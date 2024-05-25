// NPM Module Dependencies
import { createLogger, format, transports } from "winston";
import expressWinston from "express-winston";
import swagger from "swagger-ui-express";
import YAML from "yamljs";

/**
 * Standard Logging Format
 * @param {Object} options -- Log options including level and message
 */
export const logFormatter = ({ level, timestamp, message, meta }) => {
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
export const newLogger = () => {
  const logger = {
    transports: [
      new transports.Console({
        format: format.combine(
          format.colorize(),
          format.timestamp({ format: "MMM-DD-YYYY HH:mm:ss" }),
          format.printf(logFormatter),
        ),
      }),
    ],
    headerBlacklist: ["authorization", "cookie"],
    level: "info",
    requestWhitelist: ["user", "headers", "query", "originalUrl", "method"],
  };

  const log = createLogger(logger);

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
export const initSwagger = (router) => {
  // Load the API documentation
  const apiDoc = YAML.load("config/swagger.yaml");

  // Attach the api docs to the router
  router.use("/api-docs", swagger.serve);
  router.get("/api-docs", swagger.setup(apiDoc));
};
