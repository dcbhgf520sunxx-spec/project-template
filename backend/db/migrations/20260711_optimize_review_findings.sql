UPDATE pms_user_preference
SET appearance_mode = 'light'
WHERE appearance_mode <> 'light';

ALTER TABLE pms_user_preference
  ALTER COLUMN appearance_mode SET DEFAULT 'light';

CREATE INDEX IF NOT EXISTS idx_op_log_module_created_at
  ON pms_op_log(module, created_at DESC);

UPDATE pms_message
SET description = LEFT(description, 1000)
WHERE char_length(description) > 1000;

ALTER TABLE pms_message
  DROP CONSTRAINT IF EXISTS pms_message_description_length;

ALTER TABLE pms_message
  ADD CONSTRAINT pms_message_description_length
  CHECK (char_length(description) <= 1000);
