import { Component, INJECT } from "./Component.js";
import { ConfigService } from "./ConfigService.js";
import { format } from "node:util";

export interface LogEntry {
  timestamp: Date;
  level: LogLevel;
  component?: string;
  message: string;
  args: any[];
}

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const LOG_LEVEL_BY_NAME: Record<string, LogLevel> = {
  debug: LogLevel.DEBUG,
  info: LogLevel.INFO,
  warn: LogLevel.WARN,
  error: LogLevel.ERROR,
};

const LOG_LEVEL_REVERSE: Record<LogLevel, string> = {
  [LogLevel.DEBUG]: "DEBUG",
  [LogLevel.INFO]: "INFO",
  [LogLevel.WARN]: "WARN",
  [LogLevel.ERROR]: "ERROR",
};

interface Config {
  LOG_LEVEL: LogLevel;
}

export abstract class LogService extends Component {
  debug(message: string, ...args: any[]) {
    this.#log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.#log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.#log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.#log(LogLevel.ERROR, message, ...args);
  }

  for(component: string) {
    return new ScopedLogService(this, component);
  }

  #log(level: LogLevel, message: string, ...args: any[]) {
    this.doLog({
      timestamp: new Date(),
      level,
      message,
      args,
    });
  }

  protected abstract doLog(entry: LogEntry): void;
}

export class ScopedLogService extends LogService {
  constructor(
    private readonly parent: LogService,
    private readonly component: string,
  ) {
    super();
  }

  protected doLog(entry: LogEntry) {
    // @ts-expect-error
    this.parent.doLog({
      component: this.component,
      ...entry,
    });
  }
}

export class ConsoleLogService extends LogService {
  static [INJECT] = [ConfigService];

  #config: Config = {
    LOG_LEVEL: LogLevel.WARN,
  };

  constructor(configService: ConfigService) {
    super();

    configService.subscribe<{ LOG_LEVEL: string }>(
      {
        LOG_LEVEL: {
          type: "string",
          enum: ["debug", "info", "warn", "error"],
          default: "warn",
        },
      },
      (config) => {
        this.#config = {
          LOG_LEVEL: LOG_LEVEL_BY_NAME[config.LOG_LEVEL],
        };

        this.debug("log level set to %s", config.LOG_LEVEL);
      },
    );
  }

  override doLog({ timestamp, level, component, message, args }: LogEntry) {
    if (level < this.#config.LOG_LEVEL) {
      return;
    }

    const parts = [
      timestamp.toISOString(),
      LOG_LEVEL_REVERSE[level].padEnd(5),
      component ? `[${component}]` : "",
      format(message, ...args),
    ];

    console.log(parts.filter(Boolean).join(" "));
  }
}
