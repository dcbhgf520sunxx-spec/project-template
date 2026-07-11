import { request, unwrap } from './requestClient';
import { arrayContract, objectContract } from './responseContract';
import type { PageResult } from '../types/api';

export type RoleRecord = Record<string, unknown> & {
  id: string;
  code: string;
  name: string;
  description?: string;
  permissions?: string;
  creatorName?: string;
  updaterName?: string;
  createdAt: string;
  updatedAt?: string;
};

export type RoleFormValues = Record<string, unknown> & {
  code: string;
  name: string;
  description?: string;
};

type RoleListParams = {
  code?: string;
  name?: string;
  current?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
};

type RoleResponse = {
  id: number;
  code: string;
  name: string;
  description?: string;
  permissions?: string;
  creator_name?: string;
  updater_name?: string;
  created_at?: string;
  updated_at?: string;
};

const roleContract = objectContract<RoleResponse>(['id', 'code', 'name']);
const roleListContract = objectContract<{ list: RoleResponse[]; total: number; page: number; pageSize: number }>(
  ['list', 'total', 'page', 'pageSize'],
  { list: arrayContract(roleContract) }
);

export type MenuRecord = {
  id: number;
  parent_id: number;
  name: string;
  code: string;
  type: number;
  path?: string;
  icon?: string;
  sort_order?: number;
};

function toRoleRecord(row: RoleResponse): RoleRecord {
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    description: row.description || '',
    permissions: row.permissions || '-',
    creatorName: row.creator_name || '-',
    updaterName: row.updater_name || '-',
    createdAt: String(row.created_at || '').slice(0, 19).replace('T', ' '),
    updatedAt: row.updated_at ? String(row.updated_at).slice(0, 19).replace('T', ' ') : undefined
  };
}

function toRoleSortField(field?: string) {
  const sortMap: Record<string, string> = {
    code: 'code',
    name: 'name',
    creatorName: 'creator_name',
    createdAt: 'created_at'
  };
  return field ? sortMap[field] || field : undefined;
}

export async function getRoleList(params: RoleListParams = {}): Promise<PageResult<RoleRecord>> {
  const result = await unwrap<{ list: RoleResponse[]; total: number; page: number; pageSize: number }>(request.get('/roles', {
    params: {
      code: params.code,
      name: params.name,
      page: params.current,
      pageSize: params.pageSize,
      sort_field: toRoleSortField(params.sortField),
      sort_order: params.sortOrder
    }
  }), roleListContract);

  return {
    list: result.list.map(toRoleRecord), total: result.total, page: result.page, pageSize: result.pageSize
  };
}

export async function getRoleOptions() {
  const rows = await unwrap<Array<{ id: number; code: string; name: string }>>(request.get('/role-options'));
  return rows.map((role) => ({ label: role.name, value: String(role.id) }));
}

export async function getRole(id: string) {
  const row = await unwrap<RoleResponse>(request.get(`/roles/${id}`), roleContract);
  return toRoleRecord(row);
}

export async function createRole(values: RoleFormValues) {
  return unwrap<{ id: number }>(request.post('/roles', values));
}

export async function updateRole(id: string, values: RoleFormValues) {
  return unwrap<null>(request.put(`/roles/${id}`, values));
}

export async function deleteRole(id: string) {
  return unwrap<null>(request.delete(`/roles/${id}`));
}

export async function checkRoleCode(code: string, excludeId?: string) {
  return unwrap<{ available: boolean }>(request.get('/roles/check-code', { params: { code, excludeId } }));
}

export async function getMenuList() {
  const rows = await unwrap<Array<MenuRecord & { id: string | number; parent_id: string | number }>>(request.get('/menus'));
  return rows.map((row) => ({
    ...row,
    id: Number(row.id),
    parent_id: Number(row.parent_id)
  }));
}

export async function getRoleMenuIds(roleId: string) {
  const ids = await unwrap<Array<number | string>>(request.get(`/menus/role/${roleId}`));
  return ids.map(Number);
}

export async function saveRoleMenuIds(roleId: string, menuIds: number[]) {
  return unwrap<null>(request.put(`/menus/role/${roleId}`, { menuIds }));
}
