import {
  ConfigService,
  type Context,
  emptyContext,
  INJECT,
  type LogEntry,
  LogLevel,
  LogService,
} from "@tymber/core";
import {
  type ListLogsQuery,
  LogRepository,
} from "../repositories/LogRepository.js";

interface Config {
  LOG_LEVEL: LogLevel;
  LOG_RETENTION_IN_DAYS: number;
  LOG_WRITE_BATCH_SIZE: number;
}

export type LogLevelAsString = "debug" | "info" | "warn" | "error";

const LOG_LEVEL_BY_NAME: Record<LogLevelAsString, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

const LOG_LEVEL_BY_CODE: Record<LogLevel, LogLevelAsString> = {
  [LogLevel.DEBUG]: "debug",
  [LogLevel.INFO]: "info",
  [LogLevel.WARN]: "warn",
  [LogLevel.ERROR]: "error",
};

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const TEN_SECONDS_IN_MS = 10 * 1000;

export class DBLogService extends LogService {
  static [INJECT] = [ConfigService, LogRepository];

  private cleanupInterval: NodeJS.Timeout | null = null;
  private flushInterval: NodeJS.Timeout | null = null;

  #config: Config = {
    LOG_LEVEL: LogLevel.WARN,
    LOG_RETENTION_IN_DAYS: 30,
    LOG_WRITE_BATCH_SIZE: 100,
  };

  #batch: LogEntry[] = [];
  #components = new Set<string>();

  constructor(
    configService: ConfigService,
    private readonly logRepository: LogRepository,
  ) {
    super();

    configService.subscribe<
      Omit<Config, "LOG_LEVEL"> & { LOG_LEVEL: LogLevelAsString }
    >(
      {
        LOG_LEVEL: {
          type: "string",
          enum: ["debug", "info", "warn", "error"],
          default: "warn",
        },
        LOG_RETENTION_IN_DAYS: {
          type: "number",
          default: 30,
        },
        LOG_WRITE_BATCH_SIZE: {
          type: "number",
          default: 100,
        },
      },
      (config) => {
        this.#config = {
          ...config,
          LOG_LEVEL: LOG_LEVEL_BY_NAME[config.LOG_LEVEL],
        };
      },
    );
  }

  override for(component: string) {
    this.#components.add(component);
    return super.for(component);
  }

  private async cleanupOldLogs() {
    const olderThan = new Date();
    olderThan.setDate(olderThan.getDate() - this.#config.LOG_RETENTION_IN_DAYS);

    try {
      await this.logRepository.deleteOldLogs(emptyContext(), olderThan);
    } catch (e) {}
  }

  override init() {
    this.cleanupInterval = setInterval(
      () => this.cleanupOldLogs(),
      ONE_HOUR_IN_MS,
    );

    this.flushInterval = setInterval(() => this.flushLogs(), TEN_SECONDS_IN_MS);

    void this.cleanupOldLogs();
  }

  override async close() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
    }

    return this.flushLogs();
  }

  override doLog(entry: LogEntry) {
    if (entry.level < this.#config.LOG_LEVEL) {
      return;
    }

    this.#batch.push(entry);

    if (this.#batch.length >= this.#config.LOG_WRITE_BATCH_SIZE) {
      void this.flushLogs();
    }
  }

  async flushLogs() {
    if (this.#batch.length === 0) {
      return;
    }

    const batch = this.#batch;
    this.#batch = [];

    await this.logRepository.insertBatch(emptyContext(), batch);
  }

  async listLogs(
    ctx: Context,
    query: Omit<ListLogsQuery, "levels"> & { levels?: LogLevelAsString[] },
  ) {
    const { items } = await this.logRepository.listLogs(ctx, {
      ...query,
      levels: query.levels?.map((level) => LOG_LEVEL_BY_NAME[level]),
    });

    return {
      items: items.map((item) => ({
        ...item,
        level: LOG_LEVEL_BY_CODE[item.level],
      })),
    };
  }

  listComponents() {
    return [...this.#components];
  }
}
