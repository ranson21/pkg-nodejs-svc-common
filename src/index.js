// NPM Module dependencies
import express from "express";
import cors from "cors";
import { urlencoded, json } from "body-parser";

// Local Package Dependencies
import { MESSAGES } from "./constants";
import { newLogger } from "./middleware";

/**
 * Configure an instance of the Express App with middleware, routes, and optional db
 * @returns {object} -- Express App instance and Logger
 */
export async function configure(router, environment) {
  // Create the express app
  const app = express();

  // Add support for content encodings (application/x-www-form-urlencoded, json)
  app.use(urlencoded({ extended: false }));
  app.use(json());

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
export function stop({ server, log }) {
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
export function listener(log, port) {
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
export async function start(app, log, environment) {
  // Set the port
  const port = environment.PORT;

  // Start the service
  const server = await app.listen(port, listener(log, port));

  // Listen for sigint to gracefully shutdown
  process.on("SIGINT", stop({ server, log }));
}
