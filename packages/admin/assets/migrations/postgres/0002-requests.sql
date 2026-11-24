CREATE TABLE t_incoming_requests
(
    id             BIGSERIAL PRIMARY KEY,
    created_at     TIMESTAMPTZ NOT NULL,

    request_id     TEXT UNIQUE NOT NULL,
    method         TEXT        NOT NULL,
    path           TEXT        NOT NULL,
    matched_route  TEXT,
    user_id        INTEGER,
    status         INTEGER     NOT NULL,
    duration_in_ms INTEGER     NOT NULL
);

CREATE TABLE t_outgoing_requests
(
    id             BIGSERIAL PRIMARY KEY,
    created_at     TIMESTAMPTZ NOT NULL,

    request_id     TEXT UNIQUE NOT NULL,
    method         TEXT        NOT NULL,
    origin         TEXT        NOT NULL,
    path           TEXT        NOT NULL,
    status         INTEGER     NOT NULL,
    duration_in_ms INTEGER     NOT NULL
);

CREATE INDEX t_idx_incoming_requests_created_at ON t_incoming_requests (created_at);
CREATE INDEX t_idx_incoming_requests_status_created_at ON t_incoming_requests (status, created_at);

CREATE INDEX t_idx_outgoing_requests_created_at ON t_outgoing_requests (created_at);
CREATE INDEX t_idx_outgoing_requests_status_created_at ON t_outgoing_requests (status, created_at);
