import { expect, test } from '@playwright/test'

test('首页和详情直出完整内容、SEO 与真实 404', async ({ request }) => {
  const home = await request.get('/')
  expect(home.status()).toBe(200)
  const homeHtml = await home.text()
  const renderedHome = homeHtml.split('<script id="__INITIAL_STATE__"')[0]
  expect(renderedHome).toContain('class="news-item"')
  expect(renderedHome).toContain('name="description"')
  expect(renderedHome).toContain('format=webp')
  expect(renderedHome).toContain('srcset=')
  expect(renderedHome).toMatch(/<link rel="stylesheet" href="\/assets\/Home-[^"]+\.css">/)

  const detail = await request.get('/news/1')
  expect(detail.status()).toBe(200)
  const detailHtml = await detail.text()
  expect(detailHtml).toContain('确定性的测试新闻正文 1')
  expect(detailHtml).toContain('rel="canonical"')
  expect(detailHtml).toContain('property="og:title"')
  expect(detailHtml).toMatch(/<link rel="stylesheet" href="\/assets\/NewsDetail-[^"]+\.css">/)

  const missingNews = await request.get('/news/999999')
  expect(missingNews.status()).toBe(404)
  expect(await missingNews.text()).toContain('新闻不存在')

  const missingPage = await request.get('/not-a-page')
  expect(missingPage.status()).toBe(404)
})

test('水合状态只包含公开新闻数据', async ({ request }) => {
  const response = await request.get('/news/1')
  const html = await response.text()
  const match = html.match(/<script id="__INITIAL_STATE__" type="application\/json">([\s\S]*?)<\/script>/)
  expect(match).toBeTruthy()
  const state = JSON.parse(match[1])
  expect(state.news.detail.id).toBe(1)
  expect(state.user).toBeUndefined()
  expect(html).not.toContain('e2e-token')
})

test('禁用 JavaScript 仍可读公开新闻', async ({ browser }) => {
  const context = await browser.newContext({ javaScriptEnabled: false })
  const page = await context.newPage()
  await page.goto('/')
  await expect(page.locator('.news-item').first()).toBeVisible()
  await expect(page.locator('.news-title').first()).not.toBeEmpty()
  await page.goto('/news/1')
  await expect(page.locator('.news-content')).toContainText('确定性的测试新闻正文 1')
  await context.close()
})
