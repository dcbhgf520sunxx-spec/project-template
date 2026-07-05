DELETE FROM pms_work_order
WHERE problem_desc LIKE '模拟工单%'
   OR problem_desc IN ('新员工账号权限开通', '基础档案名称调整');

DELETE FROM pms_access_log
WHERE user_id IN (
  SELECT id FROM pms_user WHERE employee_no LIKE 'MUSER%'
);

DELETE FROM pms_user_preference
WHERE user_id IN (
  SELECT id FROM pms_user WHERE employee_no LIKE 'MUSER%'
);

DELETE FROM pms_op_log
WHERE user_id IN (
  SELECT id FROM pms_user WHERE employee_no LIKE 'MUSER%'
);

DELETE FROM pms_user_role
WHERE user_id IN (
  SELECT id FROM pms_user WHERE employee_no LIKE 'MUSER%'
)
OR role_id IN (
  SELECT id FROM pms_role WHERE code LIKE 'demo_role_%'
);

DELETE FROM pms_role_menu
WHERE role_id IN (
  SELECT id FROM pms_role WHERE code LIKE 'demo_role_%'
);

DELETE FROM pms_user
WHERE employee_no LIKE 'MUSER%';

DELETE FROM pms_role
WHERE code LIKE 'demo_role_%';

DELETE FROM pms_archive
WHERE code IN ('OPS001', 'OPS002')
   OR code LIKE 'PLAN%'
   OR code LIKE 'NT%'
   OR archive_type_id IN (
     SELECT id
     FROM pms_archive_type
     WHERE code_prefix IN ('OPS', 'PLAN', 'NT')
   );

DELETE FROM pms_archive_type
WHERE code_prefix IN ('OPS', 'PLAN', 'NT');
