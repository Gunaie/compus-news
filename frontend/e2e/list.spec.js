import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.route('**/api/image/proxy?**', (route) => route.fulfill({
    contentType: 'image/svg+xml',
    body: '<svg xmlns="http://www.w3.org/2000/svg" width="100" height="80"><rect width="100%" height="100%" fill="#e8f5e9"/></svg>'
  }))
})

test('连续加载后虚拟 DOM 保持上限', async ({ page }) => {
  const loadedPages = new Set()
  page.on('request', (request) => {
    const url = new URL(request.url())
    if (url.pathname === '/api/news/list') loadedPages.add(Number(url.searchParams.get('page')))
  })
  await page.goto('/')
  await expect(page.locator('.virtual-list')).toBeVisible()

  for (let index = 0; index < 4; index += 1) {
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight))
    await expect.poll(() => loadedPages.size).toBeGreaterThanOrEqual(Math.min(index + 1, 2))
  }
  await expect.poll(() => loadedPages.size).toBeGreaterThanOrEqual(2)
  expect(await page.locator('.news-item').count()).toBeLessThanOrEqual(20)
  expect(await page.locator('.virtual-list').evaluate((element) => element.offsetHeight)).toBeGreaterThan(1000)
})

test('分类切换与下拉刷新重新获取第一页', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.virtual-list')).toBeVisible()
  const categoryResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/news/list' && url.searchParams.get('categoryId') === '3'
  })
  await page.getByRole('tab', { name: '通知公告' }).click()
  await categoryResponse
  await expect(page.locator('.news-title').first()).toContainText('通知公告')

  const refreshResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return url.pathname === '/api/news/list' && url.searchParams.get('categoryId') === '3' && url.searchParams.get('page') === '1'
  })
  await page.locator('.van-pull-refresh__track').evaluate((element) => {
    const start = new Touch({ identifier: 1, target: element, clientX: 180, clientY: 120 })
    const end = new Touch({ identifier: 1, target: element, clientX: 180, clientY: 280 })
    element.dispatchEvent(new TouchEvent('touchstart', { touches: [start], changedTouches: [start], bubbles: true, cancelable: true }))
    element.dispatchEvent(new TouchEvent('touchmove', { touches: [end], changedTouches: [end], bubbles: true, cancelable: true }))
    element.dispatchEvent(new TouchEvent('touchend', { touches: [], changedTouches: [end], bubbles: true, cancelable: true }))
  })
  await refreshResponse
})

test('详情返回后恢复列表滚动位置', async ({ page }) => {
  await page.goto('/')
  await expect(page.locator('.virtual-list')).toBeVisible()
  await page.evaluate(() => window.scrollTo(0, 500))
  const id = await page.locator('.news-item').evaluateAll((elements) => {
    const visible = elements.find((element) => {
      const rect = element.getBoundingClientRect()
      return rect.top >= 0 && rect.bottom <= window.innerHeight
    })
    return visible?.dataset.newsId
  })
  expect(id).toBeTruthy()
  await page.locator(`[data-news-id="${id}"]`).click()
  await expect(page.locator('h1.news-title')).toBeVisible()
  await page.goBack()
  await expect(page.locator('.virtual-list')).toBeVisible()
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBeGreaterThan(100)
})
