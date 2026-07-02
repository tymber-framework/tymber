CREATE TABLE t_users
(
    internal_id BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,

    first_name  TEXT,
    last_name   TEXT,

    email       TEXT UNIQUE
);

CREATE INDEX t_idx_users_first_name ON t_users (LOWER(first_name));
CREATE INDEX t_idx_users_last_name ON t_users (LOWER(last_name));

CREATE TABLE t_groups
(
    internal_id BIGSERIAL PRIMARY KEY,
    id          TEXT UNIQUE,

    label       TEXT
);

CREATE INDEX t_idx_groups_label ON t_groups (LOWER(label));

CREATE TABLE t_memberships
(
    user_id  BIGINT  NOT NULL REFERENCES t_users (internal_id) ON DELETE CASCADE,
    group_id BIGINT  NOT NULL REFERENCES t_groups (internal_id) ON DELETE CASCADE,
    role     INTEGER NOT NULL,

    PRIMARY KEY (user_id, group_id)
);

CREATE INDEX t_idx_memberships_group_id ON t_memberships (group_id);

CREATE TABLE t_user_sessions
(
    id         UUID PRIMARY KEY,
    user_id    BIGINT NOT NULL REFERENCES t_users (internal_id) ON DELETE CASCADE,
    expires_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX t_idx_user_sessions_expires_at ON t_user_sessions (expires_at);
CREATE INDEX t_idx_user_sessions_user_id ON t_user_sessions (user_id);
