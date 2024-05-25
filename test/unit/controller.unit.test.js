// Import the module to test
import { routeHandler } from "src/controller";

// Mock data
const req = {
  logger: {
    error: jest.fn(),
  },
};

const jsonReturn = { json: jest.fn() };
const res = {
  status: jest.fn().mockReturnValue(jsonReturn),
};

const result = "Something";
const testHandler = jest.fn().mockReturnValue(result);

describe("controller.js", () => {
  it("returns 200 and result of handler on success", async () => {
    // Setup the test
    const handler = routeHandler(testHandler);

    // Run the test
    await handler(req, res);

    // Assertions
    expect(testHandler).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(jsonReturn.json).toHaveBeenCalledWith(result);
  });

  it("returns 500 and error message on error", async () => {
    // Setup the test
    const err = { message: "something went wrong" };
    const handler = routeHandler(testHandler);
    testHandler.mockImplementation(() => {
      throw err;
    });

    // Run the test
    await handler(req, res);

    // Assertions
    expect(testHandler).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(500);
    expect(jsonReturn.json).toHaveBeenCalledWith({
      message: err.message,
      code: undefined,
    });
  });

  it("returns 'code' and error message on error when 'code' provided", async () => {
    // Setup the test
    const err = { code: 404, message: "not found" };
    const handler = routeHandler(testHandler);
    testHandler.mockImplementation(() => {
      throw err;
    });

    // Run the test
    await handler(req, res);

    // Assertions
    expect(testHandler).toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(err.code);
    expect(jsonReturn.json).toHaveBeenCalledWith({
      message: err.message,
      code: err.code,
    });
  });
});
