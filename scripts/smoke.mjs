import assert from 'node:assert/strict'

const baseUrl = (process.env.SMOKE_BASE_URL || 'http://127.0.0.1:8080').replace(/\/$/, '')

async function request(path, expectedStatus = 200) {
  const response = await fetch(`${baseUrl}${path}`, {
    headers: { 'X-Request-ID': `smoke-${Date.now()}` },
    signal: AbortSignal.timeout(10000)
  })
  assert.equal(response.status, expectedStatus, `${path} 应返回 ${expectedStatus}，实际为 ${response.status}`)
  return response
}

async function run() {
  const health = await request('/healthz')
  assert.equal((await health.json()).status, 'ok')
  console.log('PASS SSR health check')

  const readiness = await request('/api/health/ready')
  const readyBody = await readiness.json()
  assert.equal(readyBody.data?.status, 'ready')
  console.log('PASS backend database and Redis readiness')

  const metric = await fetch(`${baseUrl}/api/metrics`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Request-ID': `smoke-metric-${Date.now()}` },
    body: JSON.stringify({ kind: 'web-vital', name: 'LCP', value: 1234, path: '/', timestamp: Date.now() }),
    signal: AbortSignal.timeout(10000)
  })
  assert.equal(metric.status, 204, `监控事件应返回 204，实际为 ${metric.status}`)
  console.log('PASS browser monitoring event ingestion')

  const home = await request('/')
  const homeHtml = await home.text()
  assert.match(homeHtml, /class="news-title"/)
  assert.match(homeHtml, /id="__INITIAL_STATE__"/)
  assert.match(homeHtml, /format=webp/)
  assert.match(homeHtml, /srcset=/)
  console.log('PASS home SSR content and responsive WebP images')

  const detail = await request('/news/1')
  const detailHtml = await detail.text()
  assert.match(detailHtml, /<h1[^>]*class="news-title"/)
  assert.match(detailHtml, /rel="canonical"/)
  assert.match(detailHtml, /assets\/NewsDetail-[^"]+\.css/)
  console.log('PASS detail SSR content, SEO and route CSS')

  await request('/route-that-does-not-exist', 404)
  console.log('PASS real HTTP 404')

  const assetPath = homeHtml.match(/<script[^>]+src="(\/assets\/[^"]+\.js)"/)?.[1]
  assert.ok(assetPath, 'SSR HTML 应包含构建后的 JS 资源')
  const asset = await request(assetPath)
  assert.match(asset.headers.get('cache-control') || '', /immutable/)
  assert.match(asset.headers.get('content-encoding') || '', /gzip/)
  assert.equal((await asset.arrayBuffer()).byteLength > 0, true)
  console.log('PASS immutable static assets and gzip compression')

  console.log(`Smoke checks passed: ${baseUrl}`)
}

run().catch((error) => {
  console.error(`Smoke check failed: ${error.message}`)
  process.exitCode = 1
})
