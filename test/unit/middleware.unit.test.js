// Import the module to be tested
import { logFormatter, newLogger, initSwagger } from "src/middleware";

// NPM Module Dependencies
import { config as env } from "dotenv";
import { transports, createLogger } from "winston";
import expressWinston from "express-winston";
import swagger from "swagger-ui-express";
import YAML from "yamljs";

// Mock Dependencies
jest.mock("winston", () => ({
  transports: {
    Console: jest.fn(),
  },
  createLogger: jest.fn(),
  format: {
    combine: jest.fn(),
    colorize: jest.fn(),
    timestamp: jest.fn(),
    printf: jest.fn(),
  },
}));

jest.mock("yamljs");
jest.mock("express-winston");
jest.mock("swagger-ui-express");

describe("Service Middleware", () => {
  afterAll(() => {
    env();
  });

  describe("function logFormatter({ level, timestamp, message, meta })", () => {
    const message = "Something";
    const level = "info";
    const timestamp = "May-13-2024 03:14:25";
    const user = { email: "something@example.com" };

    it("Logs the message, level and timestamp by default", async () => {
      // Run the test
      const formatted = logFormatter({ message, level, timestamp });

      // Assertions
      expect(formatted).toEqual(`${level} - [${timestamp}]: ${message}`);
    });

    it("Attaches the user if present", async () => {
      // Setup the test
      const config = {
        message,
        level,
        timestamp,
        meta: { req: { user }, res: { statusCode: 200 } },
      };

      // Run the test
      const formatted = logFormatter(config);

      // Assertions
      expect(formatted).toEqual(
        `${level} - [${timestamp}]: (${user.email}) ✅ ${config.meta.res.statusCode} - ${message}`,
      );
    });

    it("Adds the appropriate status code", async () => {
      // Setup the test
      const error = 500;
      const notFound = 404;
      const redirect = 302;
      const success = 200;
      const data = (statusCode) => ({
        message,
        level,
        timestamp,
        meta: { res: { statusCode } },
      });

      // Run the test
      const errorFormat = logFormatter(data(error));
      const notFoundFormat = logFormatter(data(notFound));
      const redirectFormat = logFormatter(data(redirect));
      const successFormat = logFormatter(data(success));

      // Assertions
      expect(errorFormat).toEqual(
        `${level} - [${timestamp}]: ❌ ${error} - ${message}`,
      );
      expect(notFoundFormat).toEqual(
        `${level} - [${timestamp}]: 🚫 ${notFound} - ${message}`,
      );
      expect(redirectFormat).toEqual(
        `${level} - [${timestamp}]: ➡ ${redirect} - ${message}`,
      );
      expect(successFormat).toEqual(
        `${level} - [${timestamp}]: ✅ ${success} - ${message}`,
      );
    });
  });

  describe("function newLogger()", () => {
    const mockLogger = jest.fn();
    const mockRouteLogger = jest.fn();
    const mockTransport = jest.fn();
    const config = {
      transports: [mockTransport],
      headerBlacklist: ["authorization", "cookie"],
      level: "info",
      requestWhitelist: ["user", "headers", "query", "originalUrl", "method"],
    };

    beforeAll(() => {
      transports.Console.mockReturnValue(mockTransport);
    });

    it("Adds console transport to winston logger", () => {
      // Setup the test
      expressWinston.logger.mockReturnValue(mockRouteLogger);

      // Run the test
      const logger = newLogger();

      // Assertions
      expect(createLogger).toHaveBeenCalledWith(config);
      expect(expressWinston.logger).toHaveBeenCalledWith(config);
    });

    it("Returns log middleware", () => {
      // Setup the test
      const req = {};
      const res = jest.fn();
      const next = jest.fn();
      createLogger.mockReturnValue(mockLogger);

      // Run the test
      const logger = newLogger();
      logger.logMiddleware(req, res, next);

      // Assertions
      expect(req.logger).toEqual(mockLogger);
      expect(next).toHaveBeenCalled();
    });
  });

  describe("function initSwagger(router)", () => {
    const router = { use: jest.fn(), get: jest.fn() };

    it("Attaches /api-docs in development", () => {
      // Setup the test
      const docs = {};
      const swaggerEndpoint = jest.fn();
      YAML.load.mockReturnValue(docs);
      swagger.setup.mockReturnValue(swaggerEndpoint);

      // Run the test
      initSwagger(router);

      // Assertions
      expect(swagger.setup).toHaveBeenCalledWith(docs);
      expect(YAML.load).toHaveBeenCalledWith("config/swagger.yaml");
      expect(router.use).toHaveBeenCalledWith("/api-docs", swagger.serve);
      expect(router.get).toHaveBeenCalledWith("/api-docs", swaggerEndpoint);
    });
  });
});
