import request from './request'

export const getArchives = (params) => request.get('/api/archives', { params })
export const getArchivesByTypeName = (typeName) => request.get('/api/archives/by-type-name', { params: { type_name: typeName } })
export const createArchive = (data) => request.post('/api/archives', data)
export const updateArchive = (id, data) => request.put(`/api/archives/${id}`, data)
export const toggleArchiveStatus = (id, data) => request.put(`/api/archives/${id}/status`, data)
export const deleteArchive = (id, data) => request.delete(`/api/archives/${id}`, { data })
export const batchUpdateSort = (data) => request.put('/api/archives/batch-sort', data)
