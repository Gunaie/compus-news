import express from 'express'
import compression from 'compression'
import { createProxyMiddleware } from 'http-proxy-middleware'
import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { randomUUID } from 'node:crypto'

const root = dirname(fileURLToPath(import.meta.url))
const isDev = process.argv.includes('--dev')
const port = Number(process.env.PORT || 5175)
const apiTarget = process.env.API_INTERNAL_BASE_URL || 'http://localhost:8888'
const app = express()

app.set('trust proxy', true)
app.use((req, res, next) => {
  const incomingId = req.get('x-request-id')
  req.requestId = incomingId && /^[\w.-]{1,64}$/.test(incomingId) ? incomingId : randomUUID()
  res.setHeader('X-Request-ID', req.requestId)
  const startedAt = process.hrtime.bigint()
  res.on('finish', () => {
    console.log(JSON.stringify({
      level: 'info',
      event: 'http_request',
      request_id: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,
      duration_ms: Number(process.hrtime.bigint() - startedAt) / 1e6
    }))
  })
  next()
})
app.use(compression())
app.use(createProxyMiddleware({
  pathFilter: '/api',
  target: apiTarget,
  changeOrigin: true,
  on: {
    error(error, req, res) {
      if (!res.headersSent) {
        res.writeHead(502, { 'Content-Type': 'application/json' })
      }
      res.end(JSON.stringify({ code: 502, message: '后端服务暂不可用' }))
    }
  }
}))
app.get('/healthz', (req, res) => {
  res.set('Cache-Control', 'no-store').json({ status: 'ok' })
})

let vite
let renderPage
let productionTemplate
let productionManifest

function renderStyles(modules = []) {
  if (isDev) return ''
  const files = new Set()
  for (const moduleId of modules) {
    for (const file of productionManifest[moduleId] || []) {
      if (file.endsWith('.css')) files.add(file)
    }
  }
  return [...files].map((file) => `<link rel="stylesheet" href="/${file.replace(/^\//, '')}">`).join('')
}

if (isDev) {
  const { createServer } = await import('vite')
  vite = await createServer({
    root,
    server: { middlewareMode: true },
    appType: 'custom'
  })
  app.use(vite.middlewares)
} else {
  const clientDir = resolve(root, 'dist/client')
  const serverEntry = resolve(root, 'dist/server/entry-server.js')
  if (!existsSync(serverEntry)) {
    throw new Error('SSR 构建不存在，请先运行 npm run build')
  }
  productionTemplate = await readFile(resolve(clientDir, 'index.html'), 'utf-8')
  productionManifest = JSON.parse(await readFile(resolve(clientDir, '.vite/ssr-manifest.json'), 'utf-8'))
  renderPage = (await import(pathToFileURL(serverEntry).href)).render
  app.use(express.static(clientDir, {
    index: false,
    setHeaders(res, path) {
      if (path.includes(`${resolve(root, 'dist/client/assets')}`)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable')
      }
    }
  }))
}

app.use('*', async (req, res) => {
  try {
    const url = req.originalUrl
    let template
    let render
    if (isDev) {
      template = await vite.transformIndexHtml(url, await readFile(resolve(root, 'index.html'), 'utf-8'))
      render = (await vite.ssrLoadModule('/src/entry-server.js')).render
    } else {
      template = productionTemplate
      render = renderPage
    }
    const origin = process.env.APP_ORIGIN || `${req.protocol}://${req.get('host')}`
    const { html, head, state, status, modules, csrOnly } = await render(url, origin)
    const pageTemplate = csrOnly
      ? template.replace('<div id="app">', '<div id="app" data-csr-only>')
      : template
    res.status(status)
      .set('Cache-Control', 'no-cache')
      .send(pageTemplate
        .replace('<!--ssr-head-->', head + renderStyles(modules))
        .replace('<!--ssr-outlet-->', html)
        .replace('<!--ssr-state-->', state))
  } catch (error) {
    if (isDev) vite.ssrFixStacktrace(error)
    console.error(JSON.stringify({
      level: 'error',
      message: 'SSR render failed',
      request_id: req.requestId,
      path: req.originalUrl,
      error: error.message
    }))
    res.status(500).set('Cache-Control', 'no-store').send('<!doctype html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>服务暂时不可用</title></head><body><h1>服务暂时不可用</h1><p>请稍后重试。</p></body></html>')
  }
})

app.listen(port, '0.0.0.0', () => {
  console.log(`SSR server listening on http://0.0.0.0:${port} (${isDev ? 'development' : 'production'})`)
})
