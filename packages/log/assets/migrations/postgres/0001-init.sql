CREATE TABLE t_logs
(
    id         BIGSERIAL PRIMARY KEY,
    level      INTEGER     NOT NULL,
    component  TEXT,
    message    TEXT        NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);

CREATE INDEX t_idx_logs_level_created_at ON t_logs (level, created_at DESC);
CREATE INDEX t_idx_logs_created_at ON t_logs (created_at DESC);
