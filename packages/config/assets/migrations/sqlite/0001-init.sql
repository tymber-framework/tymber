CREATE TABLE t_config_revisions
(
    id         INTEGER PRIMARY KEY AUTOINCREMENT,

    created_at INTEGER,
    created_by INTEGER REFERENCES t_admin_users (id),

    "values"   TEXT,
    comment    TEXT
);

CREATE INDEX t_idx_config_revisions_created_at ON t_config_revisions (created_at);
