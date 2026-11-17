import { defineConfig } from '@playwright/test'

const externalBaseUrl = process.env.E2E_BASE_URL
const baseURL = externalBaseUrl || 'http://127.0.0.1:4175'

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  workers: 1,
  timeout: 45000,
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }]],
  use: {
    baseURL,
    viewport: { width: 390, height: 700 },
    hasTouch: true,
    trace: 'retain-on-failure'
  },
  webServer: externalBaseUrl ? undefined : [
    {
      command: 'node e2e/fixture-server.mjs',
      url: 'http://127.0.0.1:8899/api/health',
      reuseExistingServer: false,
      timeout: 30000
    },
    {
      command: 'node server.js',
      url: 'http://127.0.0.1:4175/healthz',
      reuseExistingServer: false,
      timeout: 30000,
      env: {
        PORT: '4175',
        API_INTERNAL_BASE_URL: 'http://127.0.0.1:8899',
        APP_ORIGIN: 'http://127.0.0.1:4175'
      }
    }
  ]
})
