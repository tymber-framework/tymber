import { Client } from "../Client.js";

export enum MailStatus {
  QUEUED = 0,
  SENDING = 1,
  SENT = 2,
  FAILED = 3,
}

interface MailAddress {
  email: string;
  name?: string;
}

interface Mail {
  id: string;
  createdAt: string;
  sentAt?: string;
  status: MailStatus;
  error?: string;

  subject: string;
  externalId?: string;

  to: MailAddress[];
  cc: MailAddress[];
  bcc: MailAddress[];
}

export class MailAdminClient extends Client {
  listMails(query?: {
    page?: number;
    size?: number;
    sort?: "created_at:asc" | "created_at:desc";
    q?: string;
    status?: MailStatus;
  }) {
    return this.fetch<{ items: Mail[] }>({
      method: "GET",
      path: "/api/admin/mails",
      query,
    });
  }
}
