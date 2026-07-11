DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pms_user WHERE phone IS NULL OR BTRIM(phone) = '') THEN
    RAISE EXCEPTION '存在手机号为空的用户，请先补齐手机号后再执行迁移';
  END IF;
END $$;

UPDATE pms_work_order
SET system_id = (SELECT id FROM pms_archive WHERE code = 'SYS001' AND is_deleted = 0 LIMIT 1)
WHERE system_id IS NULL;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pms_work_order WHERE system_id IS NULL) THEN
    RAISE EXCEPTION '存在所属系统为空的工单，且未找到 SYS001 默认系统档案';
  END IF;
END $$;

ALTER TABLE pms_user ALTER COLUMN phone SET NOT NULL;
ALTER TABLE pms_work_order ALTER COLUMN system_id SET NOT NULL;

UPDATE pms_menu SET sort_order = 20, updated_at = NOW() WHERE code = 'base_settings';
UPDATE pms_menu SET sort_order = 21, updated_at = NOW() WHERE code = 'archive';
UPDATE pms_menu SET sort_order = 22, updated_at = NOW() WHERE code = 'access_log';
UPDATE pms_menu SET sort_order = 30, updated_at = NOW() WHERE code = 'user_auth';
UPDATE pms_menu SET sort_order = 31, updated_at = NOW() WHERE code = 'user';
UPDATE pms_menu SET sort_order = 32, updated_at = NOW() WHERE code = 'role';
