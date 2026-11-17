import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useThemeStore = defineStore('theme', () => {
  const theme = ref('light')

  function initTheme() {
    if (typeof window === 'undefined') return
    const savedTheme = window.localStorage.getItem('theme')
    if (savedTheme) {
      theme.value = savedTheme
    }
    applyTheme()
  }

  function toggleTheme() {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('theme', theme.value)
    }
    applyTheme()
  }

  function applyTheme() {
    if (typeof document !== 'undefined') {
      document.documentElement.classList.toggle('dark', theme.value === 'dark')
    }
  }

  return {
    theme,
    initTheme,
    toggleTheme
  }
}, {
  persist: true
})