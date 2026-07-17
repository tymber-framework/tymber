import {
  type Brand,
  type Context,
  Repository,
  type Page,
  sql,
  escapeValue,
} from "@tymber/core";

export type MailId = Brand<bigint, "MailId">;

export enum MailStatus {
  QUEUED = 0,
  SENDING = 1,
  SENT = 2,
  FAILED = 3,
}

export interface MailAddress {
  email: string;
  name?: string;
}

export interface Mail {
  id: MailId;
  createdAt: Date;
  sentAt?: Date;
  status: MailStatus;
  error?: string;
  subject: string;
  externalId?: string;
}

export interface MailWithRecipients extends Mail {
  to?: MailAddress[];
  cc?: MailAddress[];
  bcc?: MailAddress[];
}

enum RecipientType {
  TO,
  CC,
  BCC,
}

interface MailRecipient {
  type: RecipientType;
  email: string;
  name?: string;
}

export interface Query {
  page: number;
  size: number;
  sort: "created_at:asc" | "created_at:desc";
  q?: string;
  status?: MailStatus;
}

export class MailRepository extends Repository<MailId, Mail> {
  tableName = "t_mails";
  dateFields = ["createdAt", "sentAt"];

  async insertMailWithRecipients(
    ctx: Context,
    mail: Partial<MailWithRecipients>,
  ) {
    const entity = await this.insert(ctx, {
      createdAt: mail.createdAt,
      status: mail.status,
      subject: mail.subject,
    });

    const recipients: MailRecipient[] = [];

    for (const recipient of mail.to ?? []) {
      recipients.push({
        type: RecipientType.TO,
        email: recipient.email,
        name: recipient.name,
      });
    }

    for (const recipient of mail.cc ?? []) {
      recipients.push({
        type: RecipientType.CC,
        email: recipient.email,
        name: recipient.name,
      });
    }

    for (const recipient of mail.bcc ?? []) {
      recipients.push({
        type: RecipientType.BCC,
        email: recipient.email,
        name: recipient.name,
      });
    }

    if (recipients.length > 0) {
      await this.db.run(
        ctx,
        sql
          .insert()
          .into("t_mail_recipients")
          .values(
            recipients.map((recipient) => ({
              mail_id: entity.id,
              ...recipient,
            })),
          ),
      );
    }

    return entity;
  }

  public async find(ctx: Context, query: Query) {
    let sqlQuery = sql
      .select(["m.*"])
      .from(`${this.tableName} m`)
      .offset((query.page - 1) * query.size)
      .limit(query.size);

    switch (query.sort) {
      case "created_at:asc":
        sqlQuery = sqlQuery.orderBy(["m.created_at", "m.id"]);
        break;
      case "created_at:desc":
        sqlQuery = sqlQuery.orderBy(["m.created_at DESC", "m.id DESC"]);
        break;
    }

    if (query.status !== undefined) {
      sqlQuery = sqlQuery.where(sql.eq("m.status", query.status));
    }

    if (query.q) {
      const search = escapeValue(query.q) + "%";
      sqlQuery = sqlQuery
        .distinct()
        .innerJoin("t_mail_recipients r", { "r.mail_id": "m.id" })
        .where(sql.like("r.email", search, "~"));
    }

    const items = (await this.all(ctx, sqlQuery)) as MailWithRecipients[];

    await this.fetchRecipients(ctx, items);

    return {
      items,
    };
  }

  private async fetchRecipients(ctx: Context, items: MailWithRecipients[]) {
    const mailIds = items.map((item) => item.id);

    if (mailIds.length === 0) {
      return;
    }

    const recipients = await this.db.query<MailRecipient & { mail_id: MailId }>(
      ctx,
      sql.select().from("t_mail_recipients").where(sql.in("mail_id", mailIds)),
    );

    const recipientsByMailId = new Map<MailId, MailRecipient[]>();

    for (const recipient of recipients) {
      const mailRecipients = recipientsByMailId.get(recipient.mail_id) ?? [];
      mailRecipients.push(recipient);
      recipientsByMailId.set(recipient.mail_id, mailRecipients);
    }

    for (const item of items) {
      const mailRecipients = recipientsByMailId.get(item.id) ?? [];
      item.to = mailRecipients
        .filter((r) => r.type === RecipientType.TO)
        .map((r) => ({ email: r.email, name: r.name }));
      item.cc = mailRecipients
        .filter((r) => r.type === RecipientType.CC)
        .map((r) => ({ email: r.email, name: r.name }));
      item.bcc = mailRecipients
        .filter((r) => r.type === RecipientType.BCC)
        .map((r) => ({ email: r.email, name: r.name }));
    }
  }
}
