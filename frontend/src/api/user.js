import request from './request'

export const getUsers = (params) => request.get('/api/users', { params })
export const getUser = (id) => request.get(`/api/users/${id}`)
export const createUser = (data) => request.post('/api/users', data)
export const updateUser = (id, data) => request.put(`/api/users/${id}`, data)
export const resetPassword = (id, updaterId) => request.put(`/api/users/${id}/reset-password`, { updater_id: updaterId })
export const toggleUserStatus = (id, status, updaterId) => request.put(`/api/users/${id}/status`, { status, updater_id: updaterId })
export const checkPhone = (phone, excludeId) => request.get('/api/users/check-phone', { params: { phone, excludeId } })
export const checkEmployeeNo = (employee_no, excludeId) => request.get('/api/users/check-employee-no', { params: { employee_no, excludeId } })
export const hrSearch = (keyword) => request.get('/api/users/hr-search', { params: { keyword } })
