CREATE TABLE t_admin_users
(
    id                    SERIAL PRIMARY KEY,

    created_at            TIMESTAMPTZ,
    created_by            INTEGER REFERENCES t_admin_users (id),
    updated_at            TIMESTAMPTZ,
    updated_by            INTEGER REFERENCES t_admin_users (id),

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

    created_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES t_admin_users (id),
    updated_at TIMESTAMPTZ,
    updated_by INTEGER REFERENCES t_admin_users (id),

    value      JSONB
);

CREATE TABLE t_admin_queries
(
    id            SERIAL PRIMARY KEY,

    created_at    TIMESTAMPTZ,
    created_by    INTEGER REFERENCES t_admin_users (id),
    updated_at    TIMESTAMPTZ,
    updated_by    INTEGER REFERENCES t_admin_users (id),

    query         TEXT,
    comment       TEXT,
    affected_rows INTEGER
);
