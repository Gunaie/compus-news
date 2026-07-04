import axios from 'axios'
import { Toast } from 'vant'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8888'

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
    const { response, message } = error
    
    if (response) {
      const { status, data } = response
      
      const errorMsg = data?.message || '请求失败'
      
      switch (status) {
        case 400:
          Toast.error(errorMsg)
          break
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          Toast.error('登录已过期，请重新登录')
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          break
        case 403:
          Toast.error('无权限访问')
          break
        case 429:
          Toast.error('请求过于频繁，请稍后再试')
          break
        case 500:
          Toast.error('服务器内部错误，请稍后再试')
          break
        default:
          Toast.error(errorMsg)
      }
    } else if (message) {
      if (message.includes('Network Error')) {
        Toast.error('网络连接异常，请检查网络')
      } else if (message.includes('timeout')) {
        Toast.error('请求超时，请重试')
      } else {
        Toast.error('请求失败')
      }
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

export const chatApi = {
  completion(data) {
    return api.post('/api/chat/completion', data)
  }
}

export default api