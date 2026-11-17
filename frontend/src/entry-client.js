import { createApp } from './main'
import { updateDocumentHead } from './seo'
import { useNewsStore } from './store/news'
import { useThemeStore } from './store/theme'
import { startMonitoring } from './monitor'

function getInitialState() {
  const element = document.getElementById('__INITIAL_STATE__')
  if (!element) return undefined
  try {
    return JSON.parse(element.textContent)
  } catch {
    return undefined
  }
}

async function mount() {
  const csrOnly = document.getElementById('app')?.hasAttribute('data-csr-only') ?? false
  const { app, router, pinia } = createApp(getInitialState(), { ssr: !csrOnly })
  router.afterEach((to) => updateDocumentHead(to, useNewsStore(pinia)))
  await router.isReady()
  updateDocumentHead(router.currentRoute.value, useNewsStore(pinia))
  app.mount('#app')
  useThemeStore(pinia).initTheme()
}

startMonitoring()
mount()
