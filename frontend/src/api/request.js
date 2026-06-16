import axios from 'axios'

const request = axios.create({
  baseURL: '/',
  timeout: 10000,
})

// Add JWT token to every request
request.interceptors.request.use(config => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

request.interceptors.response.use(
  res => res,
  err => {
    // Redirect to login on 401
    if (err.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      localStorage.removeItem('menus')
      window.location.hash = '#/login'
    }
    return Promise.reject(err)
  }
)

export default request
