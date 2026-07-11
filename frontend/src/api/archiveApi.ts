import { request, unwrap } from './requestClient';
import { arrayContract, objectContract } from './responseContract';
import type { PageResult } from '../types/api';

export type ArchiveTypeRecord = Record<string, unknown> & {
  id: string;
  code: string;
  codePrefix: string;
  name: string;
  status: 'enabled' | 'disabled';
  creatorName: string;
  createdAt: string;
};

export type ArchiveRecord = Record<string, unknown> & {
  id: string;
  code: string;
  name: string;
  archiveTypeId: string;
  archiveTypeName: string;
  sortOrder: number;
  status: 'enabled' | 'disabled';
  creatorName: string;
  createdAt: string;
};

type ArchiveTypeResponse = {
  id: number;
  code: string;
  code_prefix: string;
  name: string;
  status: number;
  creator_name?: string;
  created_at?: string;
};

type ArchiveResponse = {
  id: number;
  code: string;
  name: string;
  archive_type_id: number;
  archive_type_name?: string;
  sort_order: number;
  status: number;
  creator_name?: string;
  created_at?: string;
};

type ArchiveOptionResponse = {
  id: number;
  code: string;
  name: string;
};

const archiveTypeContract = objectContract<ArchiveTypeResponse>(['id', 'code', 'code_prefix', 'name', 'status']);
const archiveContract = objectContract<ArchiveResponse>(['id', 'code', 'name', 'archive_type_id', 'sort_order', 'status']);
const archiveOptionContract = objectContract<ArchiveOptionResponse>(['id', 'code', 'name']);
const archiveCreateContract = objectContract<{ id: number; code: string }>(['id', 'code']);
const availableContract = objectContract<{ available: boolean }>(['available']);

function dateText(value?: string) {
  return value ? String(value).slice(0, 19).replace('T', ' ') : '-';
}

function toStatus(status: number): 'enabled' | 'disabled' {
  return Number(status) === 1 ? 'enabled' : 'disabled';
}

function toApiStatus(status: 'enabled' | 'disabled') {
  return status === 'enabled' ? 1 : 0;
}

function toTypeRecord(row: ArchiveTypeResponse): ArchiveTypeRecord {
  return {
    id: String(row.id),
    code: row.code,
    codePrefix: row.code_prefix,
    name: row.name,
    status: toStatus(row.status),
    creatorName: row.creator_name || '-',
    createdAt: dateText(row.created_at)
  };
}

function toArchiveRecord(row: ArchiveResponse): ArchiveRecord {
  return {
    id: String(row.id),
    code: row.code,
    name: row.name,
    archiveTypeId: String(row.archive_type_id),
    archiveTypeName: row.archive_type_name || '-',
    sortOrder: row.sort_order,
    status: toStatus(row.status),
    creatorName: row.creator_name || '-',
    createdAt: dateText(row.created_at)
  };
}

export async function getArchiveTypes(params: Record<string, unknown> = {}): Promise<PageResult<ArchiveTypeRecord>> {
  const rows = await unwrap<ArchiveTypeResponse[]>(request.get('/archive-types', {
    params: {
      name: params.name,
      status: params.status ? toApiStatus(params.status as 'enabled' | 'disabled') : undefined
    }
  }), arrayContract(archiveTypeContract));
  const page = Number(params.current || 1);
  const pageSize = Number(params.pageSize || 20);
  const start = (page - 1) * pageSize;

  return {
    list: rows.map(toTypeRecord).slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize
  };
}

export async function getArchiveTypeOptions() {
  const result = await getArchiveTypes({ pageSize: 1000 });
  return result.list.map((type) => ({ label: type.name, value: type.id }));
}

export async function getArchiveOptionsByTypeName(typeName: string) {
  const rows = await unwrap<ArchiveOptionResponse[]>(request.get('/archive-options/by-type-name', {
    params: { type_name: typeName }
  }), arrayContract(archiveOptionContract));
  return rows.map((item) => ({ label: item.name, value: String(item.id), code: item.code }));
}

export async function createArchiveType(values: { codePrefix: string; name: string }) {
  return unwrap<{ id: number; code: string }>(request.post('/archive-types', {
    code_prefix: values.codePrefix,
    name: values.name
  }), archiveCreateContract);
}

export async function updateArchiveType(id: string, values: { name: string }) {
  return unwrap<null>(request.put(`/archive-types/${id}`, { name: values.name }));
}

export async function toggleArchiveTypeStatus(
  id: string,
  values: { status: 'enabled' | 'disabled' }
) {
  return unwrap<null>(request.put(`/archive-types/${id}/status`, {
    status: toApiStatus(values.status)
  }));
}

export async function deleteArchiveType(id: string) {
  return unwrap<null>(request.delete(`/archive-types/${id}`));
}

export async function checkArchiveTypePrefix(prefix: string, excludeId?: string) {
  return unwrap<{ available: boolean }>(request.get('/archive-types/check-prefix', {
    params: { prefix, excludeId }
  }), availableContract);
}

export async function getArchives(params: Record<string, unknown> = {}): Promise<PageResult<ArchiveRecord>> {
  const rows = await unwrap<ArchiveResponse[]>(request.get('/archives', {
    params: {
      archive_type_id: params.archiveTypeId,
      code: params.code,
      name: params.name,
      status: params.status ? toApiStatus(params.status as 'enabled' | 'disabled') : undefined
    }
  }), arrayContract(archiveContract));
  const page = Number(params.current || 1);
  const pageSize = Number(params.pageSize || 20);
  const start = (page - 1) * pageSize;

  return {
    list: rows.map(toArchiveRecord).slice(start, start + pageSize),
    total: rows.length,
    page,
    pageSize
  };
}

export async function createArchive(values: { archiveTypeId: string; name: string }) {
  return unwrap<{ id: number; code: string }>(request.post('/archives', {
    archive_type_id: Number(values.archiveTypeId),
    name: values.name
  }), archiveCreateContract);
}

export async function updateArchive(id: string, values: { name: string; sortOrder?: number }) {
  return unwrap<null>(request.put(`/archives/${id}`, {
    name: values.name,
    sort_order: values.sortOrder
  }));
}

export async function toggleArchiveStatus(
  id: string,
  values: { status: 'enabled' | 'disabled' }
) {
  return unwrap<null>(request.put(`/archives/${id}/status`, {
    status: toApiStatus(values.status)
  }));
}

export async function deleteArchive(id: string) {
  return unwrap<null>(request.delete(`/archives/${id}`));
}

export async function batchUpdateArchiveSort(items: Array<{ id: string; sortOrder: number }>) {
  return unwrap<null>(request.put('/archives/batch-sort', {
    items: items.map((item) => ({ id: Number(item.id), sort_order: item.sortOrder }))
  }));
}
