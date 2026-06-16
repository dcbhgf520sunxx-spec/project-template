import request from './request'

export const getArchiveTypes = (params) => request.get('/api/archive-types', { params })
export const createArchiveType = (data) => request.post('/api/archive-types', data)
export const updateArchiveType = (id, data) => request.put(`/api/archive-types/${id}`, data)
export const toggleArchiveTypeStatus = (id, data) => request.put(`/api/archive-types/${id}/status`, data)
export const deleteArchiveType = (id, data) => request.delete(`/api/archive-types/${id}`, { data })
export const checkArchiveTypePrefix = (prefix, excludeId) => request.get('/api/archive-types/check-prefix', { params: { prefix, excludeId } })
