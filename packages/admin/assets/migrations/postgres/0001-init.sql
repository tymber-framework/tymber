CREATE TABLE t_admin_users
(
    id                    SERIAL PRIMARY KEY,

    username              TEXT UNIQUE,
    password              TEXT, -- hashed with argon2
    is_temporary_password BOOLEAN
);

CREATE TABLE t_admin_sessions
(
    id         UUID PRIMARY KEY,
    user_id    INTEGER REFERENCES t_admin_users (id),
    expires_at TIMESTAMPTZ
);

CREATE TABLE t_misc
(
    key        TEXT PRIMARY KEY,
    value      JSONB
);

CREATE TABLE t_admin_queries
(
    id            SERIAL PRIMARY KEY,

    created_at    TIMESTAMPTZ,
    created_by    INTEGER REFERENCES t_admin_users (id),

    query         TEXT,
    comment       TEXT,
    affected_rows INTEGER
);

CREATE TABLE t_admin_audit_logs
(
    id         SERIAL PRIMARY KEY,

    created_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES t_admin_users (id),

    action     TEXT,
    details    JSONB
);

CREATE INDEX t_idx_admin_audit_logs_created_at ON t_admin_audit_logs (created_at);
CREATE INDEX t_idx_admin_audit_logs_action_created_at ON t_admin_audit_logs (action, created_at);
CREATE INDEX t_idx_admin_audit_logs_created_by_created_at ON t_admin_audit_logs (created_by, created_at);
