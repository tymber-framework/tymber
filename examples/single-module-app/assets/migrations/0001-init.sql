CREATE TABLE todos
(
    id         SERIAL PRIMARY KEY,
    title      TEXT        NOT NULL,
    completed  BOOLEAN     NOT NULL,
    created_at TIMESTAMPTZ NOT NULL
);
