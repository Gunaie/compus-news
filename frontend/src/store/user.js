import { defineStore } from 'pinia'
import { ref } from 'vue'
import { userApi } from '../api'

export const useUserStore = defineStore('user', () => {
  const userInfo = ref(null)
  const token = ref(localStorage.getItem('token') || '')

  function setToken(newToken) {
    token.value = newToken
    localStorage.setItem('token', newToken)
  }

  function setUserInfo(info) {
    userInfo.value = info
    localStorage.setItem('userInfo', JSON.stringify(info))
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
    localStorage.removeItem('token')
    localStorage.removeItem('userInfo')
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