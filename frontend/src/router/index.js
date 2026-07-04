import { createRouter, createWebHistory } from 'vue-router'
import { userApi } from '../api'
import { showToast } from 'vant'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/news/:id',
    name: 'NewsDetail',
    component: () => import('../views/NewsDetail.vue')
  },
  {
    path: '/favorite',
    name: 'Favorite',
    component: () => import('../views/Favorite.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/history',
    name: 'History',
    component: () => import('../views/History.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('../views/Profile.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/chat',
    name: 'Chat',
    component: () => import('../views/Chat.vue'),
    meta: { requiresAuth: true }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('../views/Login.vue'),
    meta: { guestOnly: true }
  },
  {
    path: '/register',
    name: 'Register',
    component: () => import('../views/Register.vue'),
    meta: { guestOnly: true }
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

function getToken() {
  try {
    return sessionStorage.getItem('campus_news_token') || localStorage.getItem('token')
  } catch {
    return localStorage.getItem('token')
  }
}

function clearAuthData() {
  try {
    sessionStorage.removeItem('campus_news_token')
    sessionStorage.removeItem('campus_news_userinfo')
  } catch {}
  localStorage.removeItem('token')
  localStorage.removeItem('userInfo')
}

router.beforeEach(async (to, from, next) => {
  const token = getToken()
  const isAuthenticated = !!token

  if (to.meta.requiresAuth && !isAuthenticated) {
    next({ name: 'Login', query: { redirect: to.fullPath } })
    return
  }

  if (to.meta.guestOnly && isAuthenticated) {
    next({ name: 'Home' })
    return
  }

  if (to.meta.requiresAuth && isAuthenticated) {
    try {
      await userApi.getInfo()
      next()
    } catch (error) {
      clearAuthData()
      showToast({ message: '登录已过期，请重新登录', icon: 'error' })
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }

  next()
})

export default router
