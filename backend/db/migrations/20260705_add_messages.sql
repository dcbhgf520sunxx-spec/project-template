CREATE TABLE IF NOT EXISTS pms_message (
  id BIGSERIAL PRIMARY KEY,
  recipient_user_id BIGINT NOT NULL REFERENCES pms_user(id),
  type VARCHAR(30) NOT NULL,
  title VARCHAR(120) NOT NULL,
  description TEXT NOT NULL,
  link_path VARCHAR(200),
  read_at TIMESTAMPTZ,
  creator_id BIGINT,
  is_deleted SMALLINT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_message_recipient_read ON pms_message(recipient_user_id, read_at, is_deleted);
CREATE INDEX IF NOT EXISTS idx_message_created_at ON pms_message(created_at);
