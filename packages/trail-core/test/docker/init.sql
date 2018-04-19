CREATE TABLE trails (
  id            BIGSERIAL PRIMARY KEY,
  "when"        TIMESTAMP WITHOUT TIME ZONE,

  who_id        VARCHAR(255) NOT NULL,
  what_id       VARCHAR(255) NOT NULL,
  subject_id    VARCHAR(255) NOT NULL,

  who_data      JSONB DEFAULT '{}',
  what_data     JSONB DEFAULT '{}',
  subject_data  JSONB DEFAULT '{}',
  where_data    JSONB DEFAULT '{}',
  why_data      JSONB DEFAULT '{}',
  meta          JSONB DEFAULT '{}'
);