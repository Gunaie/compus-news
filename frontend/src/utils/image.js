const PROXY_PATH = '/api/image/proxy'
const PROXY_HOSTS = new Set(['picsum.photos', 'www.picsum.photos', 'fastly.picsum.photos', 'fastly.jsdelivr.net', 'www.fastly.jsdelivr.net'])
const CDN_BASE_URL = (import.meta.env.VITE_IMAGE_CDN_BASE_URL || '').replace(/\/$/, '')

function withCdn(path) {
  return `${CDN_BASE_URL}${path}`
}

export function getImageUrl(source, { width, height, format = 'webp', quality = 80 } = {}) {
  if (!source || typeof source !== 'string' || source.startsWith('data:') || source.startsWith('blob:')) {
    return source || ''
  }

  if (source.startsWith(`${PROXY_PATH}?`)) {
    const proxy = new URL(source, 'http://image.local')
    if (width) proxy.searchParams.set('w', String(width))
    if (height) proxy.searchParams.set('h', String(height))
    proxy.searchParams.set('format', format)
    proxy.searchParams.set('quality', String(quality))
    return withCdn(`${proxy.pathname}${proxy.search}`)
  }

  let parsed
  try {
    parsed = new URL(source)
  } catch {
    return source
  }
  if (!['http:', 'https:'].includes(parsed.protocol) || !PROXY_HOSTS.has(parsed.hostname)) {
    return source
  }

  const params = new URLSearchParams({ url: source, format, quality: String(quality) })
  if (width) params.set('w', String(width))
  if (height) params.set('h', String(height))
  return withCdn(`${PROXY_PATH}?${params}`)
}

export function getThumbnailProps(source) {
  const src = getImageUrl(source, { width: 100, height: 80 })
  const src2x = getImageUrl(source, { width: 200, height: 160 })
  return {
    src,
    srcset: src ? `${src} 1x, ${src2x} 2x` : '',
    sizes: '100px'
  }
}
