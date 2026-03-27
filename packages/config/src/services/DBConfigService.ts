import {
  ConfigService,
  type Context,
  INJECT,
  emptyContext,
  PubSubService,
  AdminAuditService,
  AJV_INSTANCE,
  EntityNotFoundError,
  I18nService,
} from "@tymber/core";
import {
  ConfigRepository,
  type Revision,
} from "../repositories/ConfigRepository.js";
import { encryptValue } from "../utils/encryptValue.js";
import { decryptValue } from "../utils/decryptValue.js";

export class ValidationError extends Error {}

export class DBConfigService extends ConfigService {
  static [INJECT] = [
    ConfigRepository,
    PubSubService,
    AdminAuditService,
    I18nService,
  ];

  #validateConfig?: (values: Record<string, any>) => boolean;

  #secretKeys: string[] = [];

  constructor(
    private readonly configRepository: ConfigRepository,
    private readonly pubSubService: PubSubService,
    private readonly adminAuditService: AdminAuditService,
    i18n: I18nService,
  ) {
    super();

    adminAuditService.defineCustomDescription(
      "CREATE_CONFIG_REVISION",
      async (ctx, log) => {
        return i18n.translate(
          ctx,
          ctx.locale,
          "tymber.adminAuditLogs.CREATE_CONFIG_REVISION.description",
          log.details,
        );
      },
    );

    adminAuditService.defineCustomDescription(
      "REVERT_CONFIG_REVISION",
      async (ctx, log) => {
        return i18n.translate(
          ctx,
          ctx.locale,
          "tymber.adminAuditLogs.REVERT_CONFIG_REVISION.description",
          log.details,
        );
      },
    );

    pubSubService.subscribe("config:update", () =>
      this.notifyConsumers(emptyContext()),
    );
  }

  override init() {
    const secretKeys = process.env.CONFIG_SECRET_KEYS;

    if (!secretKeys) {
      throw "CONFIG_SECRET_KEYS environment variable is not set";
    }

    this.#secretKeys = secretKeys.split(",");

    return super.init();
  }

  override async getCurrentValues(ctx: Context) {
    const revision = await this.configRepository.findCurrentRevision(ctx);
    return revision ? this.#decryptValues(revision) : {};
  }

  #decryptValues(revision: Revision) {
    for (const secretKey of this.#secretKeys) {
      try {
        const decryptedPayload = decryptValue(revision.values, secretKey);
        return JSON.parse(decryptedPayload);
      } catch (e) {}
    }

    throw new Error("failed to decrypt config values");
  }

  #encryptValues(values: Record<string, any>) {
    return encryptValue(JSON.stringify(values), this.#secretKeys[0]);
  }

  #createValidationSchema() {
    const properties: Record<string, any> = {};

    for (const { key, type } of this.getDefinitions()) {
      if (type === "string[]") {
        properties[key] = { type: "array", items: { type: "string" } };
      } else {
        properties[key] = { type };
      }
    }

    return AJV_INSTANCE.compile({
      type: "object",
      properties,
      required: [],
      additionalProperties: false,
    });
  }

  async createNewRevision(
    ctx: Context,
    payload: { values: Record<string, any>; comment: string },
  ) {
    if (!this.#validateConfig) {
      this.#validateConfig = this.#createValidationSchema();
    }

    const isValid = this.#validateConfig(payload.values);

    if (!isValid) {
      throw new ValidationError();
    }

    return this.configRepository.startTransaction(ctx, async () => {
      const { id } = await this.configRepository.save(ctx, {
        createdBy: ctx.admin?.id,
        createdAt: ctx.startedAt,
        values: this.#encryptValues(payload.values),
        comment: payload.comment,
      });

      this.pubSubService.publish(ctx, "config:update");

      await this.adminAuditService.log(ctx, "CREATE_CONFIG_REVISION", {
        id,
      });

      await this.notifyConsumers(ctx);

      return {
        id,
      };
    });
  }

  async revertToRevision(
    ctx: Context,
    revisionId: number,
    payload: { comment: string },
  ) {
    if (!this.#validateConfig) {
      this.#validateConfig = this.#createValidationSchema();
    }

    return this.configRepository.startTransaction(ctx, async () => {
      const [revision, currentRevision] = await Promise.all([
        this.configRepository.findById(ctx, revisionId),
        this.configRepository.findCurrentRevision(ctx),
      ]);

      if (!revision) {
        throw new EntityNotFoundError();
      }

      if (currentRevision && revision.id === currentRevision.id) {
        throw new ValidationError();
      }

      const values = this.#decryptValues(revision);
      const isValid = this.#validateConfig!(values);

      if (!isValid) {
        // config schema might have changed since the revision was created
        throw new ValidationError();
      }

      const { id } = await this.configRepository.save(ctx, {
        createdBy: ctx.admin?.id,
        createdAt: ctx.startedAt,
        values: this.#encryptValues(values),
        ...payload,
      });

      await this.adminAuditService.log(ctx, "REVERT_CONFIG_REVISION", {
        id: revisionId,
      });

      await this.notifyConsumers(ctx);

      return {
        id,
      };
    });
  }
}
