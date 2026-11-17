import { createMemoryHistory, createRouter, createWebHistory } from 'vue-router'
import { showToast } from 'vant'
import { userApi } from '../api'
import { useNewsStore } from '../store/news'

const routes = [
  {
    path: '/',
    name: 'Home',
    component: () => import('../views/Home.vue')
  },
  {
    path: '/news/:id(\\d+)',
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
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('../views/NotFound.vue')
  }
]

function getToken() {
  if (typeof window === 'undefined') return ''
  try {
    return window.sessionStorage.getItem('campus_news_token') || window.localStorage.getItem('token')
  } catch {
    return window.localStorage.getItem('token')
  }
}

function clearAuthData() {
  if (typeof window === 'undefined') return
  try {
    window.sessionStorage.removeItem('campus_news_token')
    window.sessionStorage.removeItem('campus_news_userinfo')
  } catch {}
  window.localStorage.removeItem('token')
  window.localStorage.removeItem('userInfo')
}

export function createAppRouter(pinia) {
  const router = createRouter({
    history: typeof window === 'undefined' ? createMemoryHistory() : createWebHistory(),
    routes,
    scrollBehavior(to, from, savedPosition) {
      return savedPosition || { top: 0 }
    }
  })

  router.beforeEach(async (to, from, next) => {
    if (typeof window === 'undefined') {
      next()
      return
    }

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

  router.beforeResolve(async (to) => {
    const newsStore = useNewsStore(pinia)
    if (to.name === 'Home') {
      await newsStore.loadHome()
    } else if (to.name === 'NewsDetail') {
      await newsStore.loadDetail(Number(to.params.id))
    }
  })

  return router
}
