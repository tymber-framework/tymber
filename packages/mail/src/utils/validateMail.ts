import { Ajv } from "ajv";
import addFormats from "ajv-formats";
import type { JSONSchemaType } from "ajv";

const AJV_INSTANCE = new Ajv();
// @ts-expect-error
addFormats(AJV_INSTANCE);

export interface MailAddress {
  email: string;
  name?: string;
}

export interface MailAttachment {
  contentType: string;
  filename: string;
  content: Uint8Array;
}

export interface Mail {
  from: MailAddress;
  replyTo?: MailAddress;
  to?: MailAddress[];
  cc?: MailAddress[];
  bcc?: MailAddress[];
  subject: string;
  body: string;
  attachments?: MailAttachment[];
}

const mailAddressSchema: JSONSchemaType<MailAddress> = {
  type: "object",
  properties: {
    email: { type: "string", format: "email" },
    name: { type: "string", nullable: true },
  },
  required: ["email"],
  additionalProperties: false,
};

const mailSchema: JSONSchemaType<Mail> = {
  type: "object",
  properties: {
    from: mailAddressSchema,
    replyTo: { ...mailAddressSchema, nullable: true },
    to: {
      type: "array",
      items: mailAddressSchema,
      nullable: true,
      minItems: 1,
    },
    cc: {
      type: "array",
      items: mailAddressSchema,
      nullable: true,
      minItems: 1,
    },
    bcc: {
      type: "array",
      items: mailAddressSchema,
      nullable: true,
      minItems: 1,
    },
    subject: { type: "string" },
    body: { type: "string" },
    attachments: {
      type: "array",
      items: {
        type: "object",
        properties: {
          contentType: { type: "string" },
          filename: { type: "string" },
          content: { type: "object", required: [] }, // Uint8Array is an object
        },
        required: ["contentType", "filename", "content"],
      },
      nullable: true,
    },
  },
  required: ["from", "subject", "body"],
  anyOf: [{ required: ["to"] }, { required: ["cc"] }, { required: ["bcc"] }],
  additionalProperties: false,
};

export const validateMail = AJV_INSTANCE.compile(mailSchema);
