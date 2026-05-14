import {
  ConfigService,
  type Context,
  INJECT,
  emptyContext,
  PubSubService,
  AdminAuditService,
  AJV_INSTANCE,
  I18nService,
  type Result,
} from "@tymber/core";
import {
  ConfigRepository,
  type Revision,
} from "../repositories/ConfigRepository.js";
import { encryptValue } from "../utils/encryptValue.js";
import { decryptValue } from "../utils/decryptValue.js";

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
      throw new Error("CONFIG_SECRET_KEYS environment variable is not set");
    }

    this.#secretKeys = secretKeys
      .split(",")
      .map((key) => key.trim())
      .filter(Boolean);

    if (this.#secretKeys.length === 0) {
      throw new Error("CONFIG_SECRET_KEYS must contain at least one key");
    }

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
    });
  }

  async createNewRevision(
    ctx: Context,
    payload: { values: Record<string, any>; comment: string },
  ): Promise<Result<number>> {
    if (!this.#validateConfig) {
      this.#validateConfig = this.#createValidationSchema();
    }

    const isValid = this.#validateConfig(payload.values);

    if (!isValid) {
      return { ok: false, reason: "invalid values" };
    }

    const { id } = await this.configRepository.startTransaction(
      ctx,
      async () => {
        const { id } = await this.configRepository.insert(ctx, {
          createdBy: ctx.admin?.id,
          createdAt: ctx.startedAt,
          values: this.#encryptValues(payload.values),
          comment: payload.comment,
        });

        this.pubSubService.publish(ctx, "config:update");

        await this.adminAuditService.log(ctx, "CREATE_CONFIG_REVISION", {
          id,
        });

        return {
          id,
        };
      },
    );

    await this.notifyConsumers(ctx);

    return {
      ok: true,
      value: id,
    };
  }

  async revertToRevision(
    ctx: Context,
    revisionId: number,
    payload: { comment: string },
  ): Promise<Result<number>> {
    if (!this.#validateConfig) {
      this.#validateConfig = this.#createValidationSchema();
    }

    const result: Result<number> = await this.configRepository.startTransaction(
      ctx,
      async () => {
        const [revision, currentRevision] = await Promise.all([
          this.configRepository.findById(ctx, revisionId),
          this.configRepository.findCurrentRevision(ctx),
        ]);

        if (!revision) {
          return { ok: false, reason: "revision not found" } as const;
        }

        if (currentRevision && revision.id === currentRevision.id) {
          return {
            ok: false,
            reason: "already current",
          } as const;
        }

        const values = this.#decryptValues(revision);
        const isValid = this.#validateConfig!(values);

        if (!isValid) {
          // config schema might have changed since the revision was created
          return { ok: false, reason: "invalid values" };
        }

        const { id } = await this.configRepository.insert(ctx, {
          createdBy: ctx.admin?.id,
          createdAt: ctx.startedAt,
          values: this.#encryptValues(values),
          ...payload,
        });

        this.pubSubService.publish(ctx, "config:update");

        await this.adminAuditService.log(ctx, "REVERT_CONFIG_REVISION", {
          id: revisionId,
        });

        return {
          ok: true,
          value: id,
        };
      },
    );

    if (result.ok) {
      await this.notifyConsumers(ctx);
    }

    return result;
  }
}
