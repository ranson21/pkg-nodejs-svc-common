'use strict';

/**
 * Route Handler wraps handler function with http response
 * @param {Object} options -- Contains the handler and action to use  for the route
 */
const routeHandler = (handler) => async (req, res) => {
  try {
    const result = await handler(req);
    res.status(200).json(result);
  } catch ({ message, code }) {
    req.logger.error(message);
    res.status(code || 500).json({ message, code });
  }
};

exports.routeHandler = routeHandler;
