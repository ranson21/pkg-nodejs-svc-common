const babelConfig = require("./babel.config");

require("babel-register")(babelConfig);
require("babel-polyfill");

const { join } = require("path");

const ROOT = process.cwd();
const JEST_ENV = join(ROOT, "test/config");

module.exports = {
  testEnvironment: "node",
  testTimeout: 25000,
  setupFiles: ["./test/config/setup.js"],
  moduleNameMapper: {
    "^src/(.*)$": "<rootDir>/src/$1",
    "^config/(.*)$": "<rootDir>/config/$1",
    "^package(.*)$": "<rootDir>/package.json",
    "^test/(.*)$": "<rootDir>/test/$1",
  },
  collectCoverage: true,
  collectCoverageFrom: ["src/**/*.js"],
  verbose: true,
  transform: {
    "^.+\\.jsx?$": "babel-jest",
  },
};
