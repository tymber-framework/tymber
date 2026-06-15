import { hash } from "node:crypto";
import { Component } from "./Component.js";
import { type Context, emptyContext } from "./Context.js";
import type {
  PropertiesSchema,
  UncheckedJSONSchemaType,
} from "./contrib/json-schema.d.ts";
import { AJV_INSTANCE_STRICT } from "./utils/ajv.js";
import { type ValidateFunction, type ErrorObject } from "ajv";

type ConfigType = "string" | "array" | "number" | "boolean";

type ConfigValues = Record<string, any>;

interface ConfigHandler {
  configDefinitions: any;
  handler: (config: any) => void | Promise<void>;
  previousConfigHash: string;
}

class InvalidConfigError extends Error {
  constructor(public readonly errors: ErrorObject[]) {
    super("invalid configuration");
  }
}

export abstract class ConfigService extends Component {
  protected handlers: ConfigHandler[] = [];
  // @ts-expect-error defined during init()
  protected validateConfig: ValidateFunction;

  private configDefinitions: PropertiesSchema<any> = {};

  public subscribe<T extends Record<string, any>>(
    configDefinitions: PropertiesSchema<T>,
    handler: (config: T) => void | Promise<void>,
  ) {
    this.handlers.push({
      configDefinitions,
      handler,
      previousConfigHash: "",
    });
  }

  override async init() {
    const properties = {};

    for (const handler of this.handlers) {
      Object.assign(properties, handler.configDefinitions);
    }

    this.validateConfig = AJV_INSTANCE_STRICT.compile({
      type: "object",
      properties,
      required: [],
    });

    const values = await this.getCurrentValues(emptyContext());

    const isValid = this.validateConfig(values);

    if (!isValid) {
      throw new InvalidConfigError(this.validateConfig.errors!);
    }

    this.configDefinitions = properties;

    return this.notifyConsumers(emptyContext(), values);
  }

  protected async notifyConsumers(ctx: Context, values?: ConfigValues) {
    if (!values) {
      values = await this.getCurrentValues(ctx);
    }

    for (const elem of this.handlers) {
      const config: ConfigValues = {};

      for (const key in elem.configDefinitions) {
        config[key] = values[key] ?? elem.configDefinitions[key].default;
      }

      const configHash = hash("sha256", JSON.stringify(config));

      if (configHash !== elem.previousConfigHash) {
        elem.previousConfigHash = configHash;
        await elem.handler(Object.freeze(config));
      }
    }
  }

  public async getCurrentConfig(ctx: Context) {
    const values = await this.getCurrentValues(ctx);
    const config: any[] = [];

    for (const key in this.configDefinitions) {
      const property = this.configDefinitions[key] as UncheckedJSONSchemaType<
        ConfigType,
        any
      >;
      config.push({
        key,
        type: property.type,
        items: property.items,
        enum: property.enum,
        value: values[key] ?? property.default,
        default: property.default,
      });
    }

    return config;
  }

  protected abstract getCurrentValues(ctx: Context): Promise<ConfigValues>;
}

function formatValue(type: ConfigType, value: string) {
  switch (type) {
    case "string":
      return value;
    case "array":
      return value.split(",");
    case "number":
      return parseInt(value, 10);
    case "boolean":
      return value === "1";
  }
}

export class EnvironmentBasedConfigService extends ConfigService {
  override getCurrentValues() {
    const values: Record<string, any> = {};

    for (const handler of this.handlers) {
      for (const key in handler.configDefinitions) {
        const type = handler.configDefinitions[key].type as ConfigType;
        if (key in process.env) {
          values[key] = formatValue(type, process.env[key] ?? "");
        }
      }
    }

    return Promise.resolve(values);
  }
}
