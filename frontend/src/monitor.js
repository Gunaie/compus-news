const metrics = new Map()
const sentMetrics = new Set()

function send(event) {
  const body = JSON.stringify({
    path: location.pathname.slice(0, 512),
    timestamp: Date.now(),
    ...event
  })
  fetch('/api/metrics', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body,
    credentials: 'omit',
    keepalive: true
  }).catch(() => {})
}

function sendMetric(name) {
  if (!metrics.has(name) || sentMetrics.has(name)) return
  sentMetrics.add(name)
  send({ kind: 'web-vital', name, value: metrics.get(name) })
}

function flushMetrics() {
  for (const name of metrics.keys()) sendMetric(name)
}

function observe(type, callback, options = {}) {
  try {
    const observer = new PerformanceObserver((list) => callback(list.getEntries()))
    observer.observe({ type, buffered: true, ...options })
    return observer
  } catch {
    return null
  }
}

export function startMonitoring() {
  const configuredRate = Number(import.meta.env.VITE_MONITOR_SAMPLE_RATE ?? 0.1)
  const sampleRate = Number.isFinite(configuredRate) ? Math.min(1, Math.max(0, configuredRate)) : 0.1
  if (sampleRate === 0 || Math.random() >= sampleRate) return

  const navigation = performance.getEntriesByType('navigation')[0]
  if (navigation) metrics.set('TTFB', navigation.responseStart)

  observe('paint', (entries) => {
    const fcp = entries.find((entry) => entry.name === 'first-contentful-paint')
    if (fcp) metrics.set('FCP', fcp.startTime)
  })
  observe('largest-contentful-paint', (entries) => {
    const latest = entries.at(-1)
    if (latest) metrics.set('LCP', latest.startTime)
  })
  observe('layout-shift', (entries) => {
    const cls = entries.reduce((total, entry) => total + (entry.hadRecentInput ? 0 : entry.value), 0)
    metrics.set('CLS', (metrics.get('CLS') || 0) + cls)
  })
  observe('event', (entries) => {
    for (const entry of entries) {
      if (entry.interactionId) metrics.set('INP', Math.max(metrics.get('INP') || 0, entry.duration))
    }
  }, { durationThreshold: 40 })

  window.addEventListener('error', (event) => {
    send({
      kind: 'error',
      name: 'window-error',
      message: String(event.message || 'Unknown browser error').slice(0, 500)
    })
  })
  window.addEventListener('unhandledrejection', (event) => {
    send({
      kind: 'error',
      name: 'unhandled-rejection',
      message: String(event.reason?.message || event.reason || 'Unhandled rejection').slice(0, 500)
    })
  })
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushMetrics()
  })
  window.addEventListener('pagehide', flushMetrics)
}
