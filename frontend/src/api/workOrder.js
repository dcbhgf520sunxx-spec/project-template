import request from './request'

export const getWorkOrders = (params) => request.get('/api/work-orders', { params })
export const getWorkOrder = (id) => request.get(`/api/work-orders/${id}`)
export const createWorkOrder = (data) => request.post('/api/work-orders', data)
export const updateWorkOrder = (id, data) => request.put(`/api/work-orders/${id}`, data)
export const toggleWorkOrderStatus = (id, data) => request.put(`/api/work-orders/${id}/status`, data)
export const deleteWorkOrder = (id, data) => request.delete(`/api/work-orders/${id}`, { data })
export const getWorkOrderHistory = (id) => request.get(`/api/work-orders/${id}/history`)
export const getWorkOrderNeighbors = (id, params) => request.get('/api/work-orders/neighbors', { params: { id, ...params } })
