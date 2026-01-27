CREATE TABLE t_users
(
    internal_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id          TEXT UNIQUE,

    first_name  TEXT,
    last_name   TEXT,

    auth_type   TEXT,
    email       TEXT UNIQUE,
    password    TEXT
) STRICT;

CREATE INDEX t_idx_users_first_name ON t_users (LOWER(first_name));
CREATE INDEX t_idx_users_last_name ON t_users (LOWER(last_name));

CREATE TABLE t_groups
(
    internal_id INTEGER PRIMARY KEY AUTOINCREMENT,
    id          TEXT UNIQUE,

    label       TEXT
) STRICT;

CREATE INDEX t_idx_groups_label ON t_groups (LOWER(label));

CREATE TABLE t_user_roles
(
    user_id  INTEGER NOT NULL REFERENCES t_users (internal_id),
    group_id INTEGER NOT NULL REFERENCES t_groups (internal_id),
    role     INTEGER NOT NULL,

    PRIMARY KEY (user_id, group_id)
) STRICT;

CREATE INDEX t_idx_user_roles_group_id ON t_user_roles (group_id);

CREATE TABLE t_user_sessions
(
    id         TEXT PRIMARY KEY,
    user_id    INTEGER REFERENCES t_users (internal_id),
    expires_at INTEGER
) STRICT;
