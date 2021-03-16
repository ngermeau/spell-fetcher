import {cleanup} from './index.js'

describe("spell fetcher", () => {
  test("cleanup", () => {
    expect(cleanup(" java:script ")).toBe("javascript");
  });
});
