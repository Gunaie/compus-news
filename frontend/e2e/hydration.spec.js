import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/image/proxy?**', (route) => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="450"><rect width="100%" height="100%" fill="#e8f5e9"/></svg>'
  }))
})

test('水合无错误且首屏公开 API 不重复请求', async ({ page }) => {
  const errors = []
  const requests = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  page.on('request', (request) => requests.push(request.url()))

  await page.goto('/')
  await expect(page.locator('.news-item').first()).toBeVisible()
  await expect(page.locator('.virtual-list')).toBeVisible()
  expect(requests.filter((url) => url.includes('/api/news/categories'))).toHaveLength(0)
  expect(requests.filter((url) => url.includes('/api/news/list') && new URL(url).searchParams.get('page') === '1')).toHaveLength(0)

  await page.locator('.news-item').first().click()
  await expect(page).toHaveURL(/\/news\/\d+$/)
  await expect(page.locator('h1.news-title')).toBeVisible()
  expect(requests.filter((url) => url.includes('/api/news/detail'))).toHaveLength(1)

  await page.goBack()
  await expect(page.locator('.news-item').first()).toBeVisible()
  expect(requests.filter((url) => url.includes('/api/news/list') && new URL(url).searchParams.get('page') === '1')).toHaveLength(0)
  expect(errors).toEqual([])
})

test('浏览器监控上报 Web Vitals 和异常事件', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0 })
  const events = []
  await page.route('**/api/metrics', async (route) => {
    events.push(route.request().postDataJSON())
    await route.fulfill({ status: 204 })
  })

  await page.goto('/')
  await expect(page.locator('.news-item').first()).toBeVisible()
  await page.evaluate(() => {
    window.dispatchEvent(new ErrorEvent('error', { message: 'e2e-monitor' }))
  })
  await expect.poll(() => events.some((event) => event.message === 'e2e-monitor')).toBe(true)

  const vitalRequest = page.waitForRequest((request) => (
    request.url().endsWith('/api/metrics') && request.postDataJSON()?.kind === 'web-vital'
  ))
  await page.goto('about:blank')
  const event = (await vitalRequest).postDataJSON()
  expect(['LCP', 'CLS', 'INP', 'FCP', 'TTFB']).toContain(event.name)
  expect(Number.isFinite(event.value)).toBe(true)
  expect(event.path).toBe('/')
})
