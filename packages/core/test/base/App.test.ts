import { describe, it } from "node:test";
import * as assert from "node:assert";
import { App, type AppInit, Component } from "../../src";
import { createTestDB } from "../setup.js";

describe("App", () => {
  it("should initialize and close components", async () => {
    let initCalled = false;
    let closeCalled = false;

    class TestComponent extends Component {
      override async init() {
        initCalled = true;
      }

      override async close() {
        closeCalled = true;
      }
    }

    const app = await App.create({
      components: [createTestDB()],
      modules: [
        {
          name: "test",
          version: "0.0.1",
          init(app: AppInit) {
            app.component(TestComponent);
          },
        },
      ],
    });

    assert.equal(initCalled, true);
    assert.equal(closeCalled, false);

    await app.close();

    assert.equal(closeCalled, true);
  });
});
