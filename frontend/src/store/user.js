import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '../api'

const STORAGE_KEY_TOKEN = 'campus_news_token'
const STORAGE_KEY_USERINFO = 'campus_news_userinfo'

function getStorage(key) {
  try {
    return sessionStorage.getItem(key)
  } catch {
    return localStorage.getItem(key)
  }
}

function setStorage(key, value) {
  try {
    sessionStorage.setItem(key, value)
  } catch {
    localStorage.setItem(key, value)
  }
}

function removeStorage(key) {
  try {
    sessionStorage.removeItem(key)
  } catch {
    localStorage.removeItem(key)
  }
}

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const token = ref(getStorage(STORAGE_KEY_TOKEN) || '')

  function setToken(newToken) {
    token.value = newToken
    setStorage(STORAGE_KEY_TOKEN, newToken)
  }

  function setUserInfo(info) {
    userInfo.value = info
    setStorage(STORAGE_KEY_USERINFO, JSON.stringify(info))
  }

  async function login(data) {
    try {
      const res = await userApi.login(data)
      if (res.code === 200) {
        setToken(res.data.token)
        setUserInfo(res.data.userInfo)
        return res
      }
      throw new Error(res.message)
    } catch (error) {
      throw error
    }
  }

  async function register(data) {
    try {
      const res = await userApi.register(data)
      if (res.code === 200) {
        setToken(res.data.token)
        setUserInfo(res.data.userInfo)
        return res
      }
      throw new Error(res.message)
    } catch (error) {
      throw error
    }
  }

  async function logout() {
    token.value = ''
    userInfo.value = null
    removeStorage(STORAGE_KEY_TOKEN)
    removeStorage(STORAGE_KEY_USERINFO)
  }

  async function getUserInfo() {
    try {
      const res = await userApi.getInfo()
      if (res.code === 200) {
        setUserInfo(res.data)
        return res.data
      }
      throw new Error(res.message)
    } catch (error) {
      throw error
    }
  }

  async function updateUserInfo(data) {
    try {
      const res = await userApi.update(data)
      if (res.code === 200) {
        setUserInfo(res.data)
        return res
      }
      throw new Error(res.message)
    } catch (error) {
      throw error
    }
  }

  async function changePassword(data) {
    try {
      const res = await userApi.changePassword(data)
      if (res.code === 200) {
        return res
      }
      throw new Error(res.message)
    } catch (error) {
      throw error
    }
  }

  return {
    userInfo,
    token,
    login,
    register,
    logout,
    getUserInfo,
    updateUserInfo,
    changePassword,
    setToken,
    setUserInfo
  }
}, {
  persist: true
})
