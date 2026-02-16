import { describe, it } from "node:test";
import * as assert from "node:assert";
import { sortBy } from "../../src/utils/sortBy.js";

describe("sortBy", () => {
  it("should work", () => {
    const array = [
      {
        name: "d",
      },
      {
        name: "a",
      },
      {
        name: "b",
      },
    ];

    sortBy(array, "name");

    assert.deepEqual(array, [
      {
        name: "a",
      },
      {
        name: "b",
      },
      {
        name: "d",
      },
    ]);
  });
});
