import { expect, test } from '@playwright/test'

test('未登录直访私有页使用 CSR 并重定向登录，无水合错误', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })

  const response = await page.goto('/favorite')
  const html = await response.text()
  expect(html).toContain('<div id="app" data-csr-only></div>')
  expect(html).not.toContain('__INITIAL_STATE__')
  await expect(page).toHaveURL(/\/login\?redirect=/)
  await expect(page.getByRole('button', { name: '登录', exact: true })).toBeVisible()
  expect(errors).toEqual([])
})

test('已登录直访访客页使用 CSR 并返回首页，无水合错误', async ({ page }) => {
  const errors = []
  page.on('pageerror', (error) => errors.push(error.message))
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text())
  })
  await page.addInitScript(() => {
    window.sessionStorage.setItem('campus_news_token', 'e2e-token')
  })

  const response = await page.goto('/login')
  const html = await response.text()
  expect(html).toContain('<div id="app" data-csr-only></div>')
  expect(html).not.toContain('__INITIAL_STATE__')
  await expect(page).toHaveURL('/')
  await expect(page.locator('.news-item').first()).toBeVisible()
  expect(errors).toEqual([])
})

test('登录后可以收藏新闻', async ({ page }) => {
  test.skip(Boolean(process.env.E2E_BASE_URL), '外部环境需要提供确定性测试账号')
  await page.goto('/login')
  await page.getByPlaceholder('请输入用户名').fill('e2e-user')
  await page.getByPlaceholder('请输入密码').fill('e2e-password')
  await page.getByRole('button', { name: '登录', exact: true }).click()
  await expect(page).toHaveURL('/')

  await page.goto('/news/1')
  const favoriteButton = page.locator('.news-actions button')
  await expect(favoriteButton).toContainText('收藏')
  await favoriteButton.click()
  await expect(favoriteButton).toContainText('取消收藏')
})
