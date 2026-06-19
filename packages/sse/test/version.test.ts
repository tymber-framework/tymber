import { describe, it } from "node:test";
import * as assert from "node:assert";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { SSEModule } from "../src";

describe("version", () => {
  it("should match version in package.json", () => {
    const packageJsonPath = join(import.meta.dirname, "..", "package.json");
    const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf-8"));
    assert.equal(SSEModule.version, packageJson.version);
  });
});
