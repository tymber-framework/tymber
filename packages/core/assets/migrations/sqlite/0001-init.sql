CREATE TABLE t_admin_users
(
    id                    INTEGER PRIMARY KEY AUTOINCREMENT,

    created_at            INTEGER,
    created_by            INTEGER REFERENCES t_admin_users (id),
    updated_at            INTEGER,
    updated_by            INTEGER REFERENCES t_admin_users (id),

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

    created_at INTEGER,
    created_by INTEGER REFERENCES t_admin_users (id),
    updated_at INTEGER,
    updated_by INTEGER REFERENCES t_admin_users (id),

    value      TEXT
) STRICT;

CREATE TABLE t_admin_queries
(
    id            INTEGER PRIMARY KEY AUTOINCREMENT,

    created_at    INTEGER,
    created_by    INTEGER REFERENCES t_admin_users (id),
    updated_at    INTEGER,
    updated_by    INTEGER REFERENCES t_admin_users (id),

    query         TEXT,
    comment       TEXT,
    affected_rows INTEGER
) STRICT;
