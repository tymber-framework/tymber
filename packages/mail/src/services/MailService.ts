import {
  Component,
  INJECT,
  type Context,
  type Result,
  emptyContext,
} from "@tymber/core";
import {
  MailRepository,
  MailStatus,
  type Mail as MailEntity,
  type MailId,
} from "../repositories/MailRepository.js";
import { type ErrorObject } from "ajv";
import { type Mail, validateMail } from "../utils/validateMail.js";

export abstract class MailProvider extends Component {
  abstract send(mail: Mail): Promise<Result<string>>;
}

export class MailService extends Component {
  static [INJECT] = [MailProvider, MailRepository];

  constructor(
    private readonly mailProvider: MailProvider,
    private readonly mailRepository: MailRepository,
  ) {
    super();
  }

  public async queue(
    ctx: Context,
    mail: Mail,
  ): Promise<Result<MailId, ErrorObject[]>> {
    if (!validateMail(mail)) {
      return {
        ok: false,
        reason: validateMail.errors!,
      };
    }

    const entity = await this.mailRepository.startTransaction(ctx, async () => {
      return this.mailRepository.insertMailWithRecipients(ctx, {
        createdAt: ctx.startedAt,
        status: MailStatus.QUEUED,
        subject: mail.subject,
        to: mail.to,
        cc: mail.cc,
        bcc: mail.bcc,
      });
    });

    // could be delegated to a background worker
    void this.sendMail(mail, entity);

    return {
      ok: true,
      value: entity.id,
    };
  }

  private async sendMail(mail: Mail, entity: MailEntity) {
    const ctx = emptyContext();

    entity.status = MailStatus.SENDING;
    await this.mailRepository.update(ctx, entity);

    const res = await this.mailProvider.send(mail);

    if (res.ok) {
      entity.status = MailStatus.SENT;
      entity.sentAt = new Date();
      entity.externalId = res.value;
    } else {
      entity.status = MailStatus.FAILED;
      entity.error = res.reason;
    }

    await this.mailRepository.update(ctx, entity);
  }
}

export { type Mail };
