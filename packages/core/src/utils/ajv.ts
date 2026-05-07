import { Ajv } from "ajv";
import addFormats from "ajv-formats";

// reference: https://ajv.js.org/api.html

export const AJV_INSTANCE = new Ajv({
  useDefaults: true,
  coerceTypes: true,
  removeAdditional: "all",
});

// @ts-expect-error FIXME
addFormats(AJV_INSTANCE);

// no defaults, no coercion
export const AJV_INSTANCE_STRICT = new Ajv({
  removeAdditional: "all",
});

// @ts-expect-error FIXME
addFormats(AJV_INSTANCE_STRICT);
