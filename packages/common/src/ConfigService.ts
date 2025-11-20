import { hash } from "node:crypto";
import { Component } from "./Component.js";
import { type Context, emptyContext } from "./Context.js";

type ConfigType = "string" | "string[]" | "number" | "boolean";

interface ConfigDefinition {
  key: string;
  type: ConfigType;
  defaultValue?: any;
  shouldObfuscate?: boolean;
}

interface ConfigDefinitionWithValue extends ConfigDefinition {
  value: any;
}

type ConfigValues = Record<string, any>;

interface ConfigHandler {
  configDefinitions: ConfigDefinition[];
  handler: (config: ConfigValues) => void | Promise<void>;
  previousConfigHash: string;
}

export abstract class ConfigService extends Component {
  protected handlers: ConfigHandler[] = [];

  public subscribe(
    configDefinitions: ConfigDefinition[],
    handler: (config: ConfigValues) => void | Promise<void>,
  ) {
    this.handlers.push({
      configDefinitions,
      handler,
      previousConfigHash: "",
    });
  }

  override init() {
    return this.notifyConsumers(emptyContext());
  }

  protected async notifyConsumers(ctx: Context) {
    const values = await this.getCurrentValues(ctx);
    for (const elem of this.handlers) {
      const config: ConfigValues = {};

      for (const { key, defaultValue } of elem.configDefinitions) {
        config[key] = values[key] || defaultValue;
      }

      const configHash = hash("sha256", JSON.stringify(config));

      if (configHash !== elem.previousConfigHash) {
        elem.previousConfigHash = configHash;
        await elem.handler(config);
      }
    }
  }

  public getDefinitions() {
    return this.handlers.flatMap((elem) => elem.configDefinitions);
  }

  public async getCurrentConfig(ctx: Context) {
    const values = await this.getCurrentValues(ctx);
    const config: ConfigDefinitionWithValue[] = [];

    for (const handler of this.handlers) {
      for (const {
        key,
        type,
        defaultValue,
        shouldObfuscate,
      } of handler.configDefinitions) {
        config.push({
          key,
          type,
          defaultValue,
          value: values[key] ?? defaultValue,
          shouldObfuscate,
        });
      }
    }

    return config;
  }

  protected abstract getCurrentValues(ctx: Context): Promise<ConfigValues>;
}

function formatValue(type: ConfigType, value: string) {
  switch (type) {
    case "string":
      return value;
    case "string[]":
      return value.split(",");
    case "number":
      return parseInt(value, 10);
    case "boolean":
      return value === "1";
  }
}

export class EnvironmentBasedConfigService extends ConfigService {
  override getCurrentValues() {
    const availableKeys = Object.keys(process.env);
    const values: Record<string, any> = {};

    for (const handler of this.handlers) {
      for (const { key, type } of handler.configDefinitions) {
        if (availableKeys.includes(key)) {
          values[key] = formatValue(type, process.env[key] ?? "");
        }
      }
    }

    return Promise.resolve(values);
  }
}
