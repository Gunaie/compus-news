import axios from 'axios'

const BASE_URL = 'http://localhost:8888'

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000
})

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

api.interceptors.response.use(
  (response) => {
    return response.data
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('userInfo')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

export const userApi = {
  register(data) {
    return api.post('/api/user/register', data)
  },
  login(data) {
    return api.post('/api/user/login', data)
  },
  getInfo() {
    return api.get('/api/user/info')
  },
  update(data) {
    return api.put('/api/user/update', data)
  },
  changePassword(data) {
    return api.put('/api/user/password', data)
  }
}

export const newsApi = {
  getCategories(params) {
    return api.get('/api/news/categories', { params })
  },
  getList(params) {
    return api.get('/api/news/list', { params })
  },
  getDetail(params) {
    return api.get('/api/news/detail', { params })
  }
}

export const favoriteApi = {
  check(params) {
    return api.get('/api/favorite/check', { params })
  },
  add(data) {
    return api.post('/api/favorite/add', data)
  },
  remove(params) {
    return api.delete('/api/favorite/remove', { params })
  },
  getList(params) {
    return api.get('/api/favorite/list', { params })
  },
  clear() {
    return api.delete('/api/favorite/clear')
  }
}

export const historyApi = {
  add(data) {
    return api.post('/api/history/add', data)
  },
  getList(params) {
    return api.get('/api/history/list', { params })
  },
  delete(id) {
    return api.delete(`/api/history/delete/${id}`)
  },
  clear() {
    return api.delete('/api/history/clear')
  }
}

export default api