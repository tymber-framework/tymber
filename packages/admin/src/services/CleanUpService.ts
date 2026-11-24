import {
  Component,
  ConfigService,
  type Context,
  emptyContext,
  INJECT,
} from "@tymber/core";
import { OutgoingRequestRepository } from "../repositories/OutgoingRequestRepository.js";
import { IncomingRequestRepository } from "../repositories/IncomingRequestRepository.js";

interface Config {
  ADMIN_INCOMING_REQUESTS_RETENTION_IN_DAYS: number;
  ADMIN_OUTGOING_REQUESTS_RETENTION_IN_DAYS: number;
}

const ONE_HOUR_IN_MS = 60 * 60 * 1000;

export class CleanUpService extends Component {
  static [INJECT] = [
    IncomingRequestRepository,
    OutgoingRequestRepository,
    ConfigService,
  ];

  private timerId?: NodeJS.Timeout | null = null;
  private config!: Config;

  constructor(
    private readonly incomingRequestRepository: IncomingRequestRepository,
    private readonly outgoingRequestRepository: OutgoingRequestRepository,
    configService: ConfigService,
  ) {
    super();
    configService.subscribe<Config>(
      {
        ADMIN_INCOMING_REQUESTS_RETENTION_IN_DAYS: {
          type: "number",
          default: 30,
        },
        ADMIN_OUTGOING_REQUESTS_RETENTION_IN_DAYS: {
          type: "number",
          default: 30,
        },
      },
      (config) => {
        this.config = config;
      },
    );
  }

  override async init() {
    this.timerId = setInterval(() => this.run(), ONE_HOUR_IN_MS);
  }

  override close() {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  async run() {
    const ctx = emptyContext();
    try {
      await this.incomingRequestRepository.deleteEntriesOlderThan(
        ctx,
        this.config.ADMIN_INCOMING_REQUESTS_RETENTION_IN_DAYS,
      );
      await this.outgoingRequestRepository.deleteEntriesOlderThan(
        ctx,
        this.config.ADMIN_OUTGOING_REQUESTS_RETENTION_IN_DAYS,
      );
    } catch (e) {}
  }
}
