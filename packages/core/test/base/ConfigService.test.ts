import { describe, it } from "node:test";
import * as assert from "node:assert";
import { ConfigService } from "../../src";
import { InvalidConfigError } from "../../src/ConfigService";

describe("ConfigService", () => {
  it("should work", async () => {
    let count = 0;
    let value = 1;

    const configService = new (class extends ConfigService {
      protected override getCurrentValues() {
        return Promise.resolve({
          A: value,
          B: "2",
          C: ["3", "4"],
          D: true,
          E: 5,
          G: 0,
        });
      }
    })();

    interface Config {
      A: number;
      B: string;
      F: string;
      G: number;
    }

    configService.subscribe<Config>(
      {
        A: {
          type: "number",
          default: 123,
        },
        B: {
          type: "string",
        },
        F: {
          type: "string",
          default: "3",
        },
        G: {
          type: "number",
          default: 1,
        },
      },
      (config) => {
        count++;
        assert.deepEqual(config, {
          A: count === 1 ? 1 : 3,
          B: "2",
          F: "3",
          G: 0,
        });
      },
    );

    await configService.init();
    assert.equal(count, 1);

    await configService.init();
    assert.equal(count, 1); // cached

    value = 3;
    await configService.init();
    assert.equal(count, 2);
  });

  it("should throw if a config is not provided and has no default value", async () => {
    const configService = new (class extends ConfigService {
      protected override getCurrentValues() {
        return Promise.resolve({
          A: 1,
        });
      }
    })();

    interface Config {
      A: number;
      B: string;
      C: number;
    }

    configService.subscribe<Config>(
      {
        A: {
          type: "number",
        },
        B: {
          type: "string",
        },
        C: {
          type: "string",
          default: "123",
        },
      },
      () => {},
    );

    await assert.rejects(
      () => configService.init(),
      (err: InvalidConfigError) => {
        assert.equal(err.message, "invalid configuration");
        assert.deepStrictEqual(err.errors, [
          {
            instancePath: "",
            keyword: "required",
            message: "must have required property 'B'",
            params: { missingProperty: "B" },
            schemaPath: "#/required",
          },
        ]);
        return true;
      },
    );
  });
});
