import request from './request'

export const getRoles = (params) => request.get('/api/roles', { params })
export const getRole = (id) => request.get(`/api/roles/${id}`)
export const createRole = (data) => request.post('/api/roles', data)
export const updateRole = (id, data) => request.put(`/api/roles/${id}`, data)
export const getAllRoles = () => request.get('/api/roles/all')
export const deleteRole = (id, data) => request.delete(`/api/roles/${id}`, { data })
export const checkCode = (code, excludeId) => request.get('/api/roles/check-code', { params: { code, excludeId } })
