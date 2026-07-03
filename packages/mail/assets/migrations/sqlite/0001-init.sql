CREATE TABLE t_mails
(
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    created_at  INTEGER NOT NULL,
    sent_at     INTEGER,
    status      INTEGER NOT NULL,
    error       TEXT,

    subject     TEXT,
    external_id TEXT
);

CREATE INDEX t_idx_mails_created_at ON t_mails (created_at);
CREATE INDEX t_idx_mails_status_created_at ON t_mails (status, created_at);

CREATE TABLE t_mail_recipients
(
    id      INTEGER PRIMARY KEY AUTOINCREMENT,
    mail_id INTEGER NOT NULL REFERENCES t_mails (id) ON DELETE CASCADE,
    type    INTEGER NOT NULL,
    email   TEXT    NOT NULL,
    name    TEXT
);

CREATE INDEX t_idx_mail_recipients_mail_id ON t_mail_recipients (mail_id);
CREATE INDEX t_idx_mail_recipients_email ON t_mail_recipients (email);
