import axios from 'axios'
const api = axios.create({ baseURL: '/api' })

export const login = (data) => api.post('/auth/login', data)
export const changePassword = (data) => api.put('/auth/password', data)
export const getMe = (id) => api.get('/auth/me', { params: { id } })
