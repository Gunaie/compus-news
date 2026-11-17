import { createPinia } from 'pinia'
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'

export function createAppStore() {
  const pinia = createPinia()
  if (typeof window !== 'undefined') {
    pinia.use(piniaPluginPersistedstate)
  }
  return pinia
}
