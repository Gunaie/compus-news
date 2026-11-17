import { renderToString } from 'vue/server-renderer'
import { createApp } from './main'
import { getSeo, renderHead } from './seo'
import { useNewsStore } from './store/news'

function serializeState(state) {
  return JSON.stringify(state)
    .replaceAll('&', '\\u0026')
    .replaceAll('<', '\\u003c')
    .replaceAll('>', '\\u003e')
    .replaceAll('\u2028', '\\u2028')
    .replaceAll('\u2029', '\\u2029')
}

export async function render(url, origin) {
  const { app, router, pinia } = createApp()
  await router.push(url)
  await router.isReady()

  const route = router.currentRoute.value
  const newsStore = useNewsStore(pinia)
  const head = renderHead(getSeo(route, newsStore, origin))
  const csrOnly = Boolean(route.meta.requiresAuth || route.meta.guestOnly)
  if (csrOnly) {
    return { html: '', head, state: '', status: 200, modules: [], csrOnly }
  }

  const status = route.name === 'NotFound' || newsStore.detailStatus === 404 ? 404 : 200
  const context = {}
  const html = await renderToString(app, context)
  const publicState = { news: pinia.state.value.news }
  const state = `<script id="__INITIAL_STATE__" type="application/json">${serializeState(publicState)}</script>`

  return { html, head, state, status, modules: [...context.modules], csrOnly }
}
