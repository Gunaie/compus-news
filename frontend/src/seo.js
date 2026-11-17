import { getImageUrl } from './utils/image'

const DEFAULT_TITLE = '校园资讯'
const DEFAULT_DESCRIPTION = '校园新闻、活动与通知资讯平台'

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;')
}

function plainText(value = '') {
  return String(value).replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export function getSeo(route, newsStore, origin) {
  const detail = route.name === 'NewsDetail' ? newsStore.detail : null
  const title = detail ? `${detail.title} - ${DEFAULT_TITLE}` : route.name === 'NotFound' ? `页面不存在 - ${DEFAULT_TITLE}` : DEFAULT_TITLE
  const description = detail
    ? plainText(detail.content).slice(0, 160) || detail.title
    : DEFAULT_DESCRIPTION
  const canonical = origin ? new URL(route.fullPath, origin).href : ''
  const image = detail?.image && origin
    ? new URL(getImageUrl(detail.image, { width: 800, height: 450 }), origin).href
    : ''
  return { title, description, canonical, image }
}

export function renderHead(seo) {
  const title = escapeHtml(seo.title)
  const description = escapeHtml(seo.description)
  const canonical = seo.canonical ? `<link rel="canonical" href="${escapeHtml(seo.canonical)}">` : ''
  const image = seo.image ? `<meta property="og:image" content="${escapeHtml(seo.image)}">` : ''
  return `<title>${title}</title>
    <meta name="description" content="${description}">
    ${canonical}
    <meta property="og:type" content="article">
    <meta property="og:title" content="${title}">
    <meta property="og:description" content="${description}">
    ${seo.canonical ? `<meta property="og:url" content="${escapeHtml(seo.canonical)}">` : ''}
    ${image}`
}

function ensureMeta(selector, attributes) {
  let element = document.head.querySelector(selector)
  if (!element) {
    element = document.createElement('meta')
    document.head.appendChild(element)
  }
  for (const [key, value] of Object.entries(attributes)) {
    element.setAttribute(key, value)
  }
}

export function updateDocumentHead(route, newsStore) {
  const seo = getSeo(route, newsStore, window.location.origin)
  document.title = seo.title
  ensureMeta('meta[name="description"]', { name: 'description', content: seo.description })
  ensureMeta('meta[property="og:title"]', { property: 'og:title', content: seo.title })
  ensureMeta('meta[property="og:description"]', { property: 'og:description', content: seo.description })
  ensureMeta('meta[property="og:url"]', { property: 'og:url', content: seo.canonical })
  let canonical = document.head.querySelector('link[rel="canonical"]')
  if (!canonical) {
    canonical = document.createElement('link')
    canonical.rel = 'canonical'
    document.head.appendChild(canonical)
  }
  canonical.href = seo.canonical
}
