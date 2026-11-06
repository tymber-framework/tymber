import { describe, it } from "node:test";
import { createTestApp } from "../../src";
import { createTestDB } from "../setup";
import { ConsoleLogService } from "../../src/LogService";

describe("LogService", () => {
  it("should work", async () => {
    process.env.LOG_LEVEL = "info";

    const ctx = await createTestApp(() => createTestDB(), []);

    const log = ctx.getInstance(ConsoleLogService);

    log.debug("debug");
    log.info("info");
    log.warn("warn");
    log.error("error");

    const scopedLog = log.for("MyComponent");

    scopedLog.debug("debug");
    scopedLog.info("info");
    scopedLog.warn("warn");
    scopedLog.error("error");

    return ctx.close();
  });
});
