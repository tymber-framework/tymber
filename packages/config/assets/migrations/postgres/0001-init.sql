CREATE TABLE t_config_revisions
(
    id         SERIAL PRIMARY KEY,

    created_at TIMESTAMPTZ,
    created_by INTEGER REFERENCES t_admin_users (id),

    values     TEXT,
    comment    TEXT
);

CREATE INDEX t_idx_config_revisions_created_at ON t_config_revisions (created_at);
