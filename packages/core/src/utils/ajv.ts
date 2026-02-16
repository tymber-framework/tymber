import { Ajv } from "ajv";
import addFormats from "ajv-formats";

// reference: https://ajv.js.org/api.html

export const AJV_INSTANCE = new Ajv({
  useDefaults: true,
  coerceTypes: true,
  removeAdditional: true,
});

// @ts-expect-error FIXME
addFormats(AJV_INSTANCE);
