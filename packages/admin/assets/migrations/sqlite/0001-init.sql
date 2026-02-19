CREATE TABLE t_admin_users
(
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,

    username              TEXT UNIQUE,
    password              TEXT, -- hashed with argon2
    is_temporary_password INTEGER
) STRICT;

CREATE TABLE t_admin_sessions
(
    id         TEXT PRIMARY KEY,
    user_id    INTEGER REFERENCES t_admin_users (id),
    expires_at INTEGER
) STRICT;

CREATE TABLE t_misc
(
    key        TEXT PRIMARY KEY,
    value      TEXT
) STRICT;

CREATE TABLE t_admin_queries
(
    id            INTEGER PRIMARY KEY AUTOINCREMENT,

    created_at    INTEGER,
    created_by    INTEGER REFERENCES t_admin_users (id),

    query         TEXT,
    comment       TEXT,
    affected_rows INTEGER
) STRICT;

CREATE TABLE t_admin_audit_logs
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,

    created_at INTEGER,
    created_by INTEGER REFERENCES t_admin_users (id),

    action     TEXT,
    details    JSONB
);

CREATE INDEX t_idx_admin_audit_logs_created_at ON t_admin_audit_logs (created_at);
CREATE INDEX t_idx_admin_audit_logs_action_created_at ON t_admin_audit_logs (action, created_at);
CREATE INDEX t_idx_admin_audit_logs_created_by_created_at ON t_admin_audit_logs (created_by, created_at);
