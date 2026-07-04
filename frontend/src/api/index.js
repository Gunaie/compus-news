import axios from 'axios'
import { showToast } from 'vant'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || ''

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 30000
})

function replacePicsumUrl(value) {
  if (typeof value === 'string' && value.startsWith('https://picsum.photos/')) {
    return `/api/image/proxy?url=${encodeURIComponent(value)}`
  }
  if (typeof value === 'object' && value !== null) {
    if (Array.isArray(value)) {
      return value.map(replacePicsumUrl)
    }
    for (const key in value) {
      value[key] = replacePicsumUrl(value[key])
    }
  }
  return value
}

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
    replacePicsumUrl(response.data)
    return response.data
  },
  (error) => {
    const { response, message } = error
    
    if (response) {
      const { status, data } = response
      
      const errorMsg = data?.message || '请求失败'
      
      switch (status) {
        case 400:
          showToast({ message: errorMsg, icon: 'error' })
          break
        case 401:
          localStorage.removeItem('token')
          localStorage.removeItem('userInfo')
          showToast({ message: '登录已过期，请重新登录', icon: 'error' })
          setTimeout(() => {
            window.location.href = '/login'
          }, 1500)
          break
        case 403:
          showToast({ message: '无权限访问', icon: 'error' })
          break
        case 422:
          const detail = data?.detail || []
          const validationError = detail.map(item => item.msg).join('; ')
          showToast({ message: validationError || '参数验证失败', icon: 'error' })
          break
        case 429:
          showToast({ message: '请求过于频繁，请稍后再试', icon: 'error' })
          break
        case 500:
          showToast({ message: '服务器内部错误，请稍后再试', icon: 'error' })
          break
        default:
          showToast({ message: errorMsg, icon: 'error' })
      }
    } else if (message) {
      if (message.includes('Network Error')) {
        showToast({ message: '网络连接异常，请检查网络', icon: 'error' })
      } else if (message.includes('timeout')) {
        showToast({ message: '请求超时，请重试', icon: 'error' })
      } else {
        showToast({ message: '请求失败', icon: 'error' })
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