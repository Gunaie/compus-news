process.env.CHROME_PATH ||= require('playwright').chromium.executablePath()

module.exports = {
  ci: {
    collect: {
      url: ['http://127.0.0.1:4176/', 'http://127.0.0.1:4176/news/1'],
      numberOfRuns: 3,
      startServerCommand: 'node e2e/performance-server.mjs',
      startServerReadyPattern: 'SSR server listening',
      settings: {
        emulatedFormFactor: 'mobile',
        throttlingMethod: 'simulate'
      }
    },
    assert: {
      assertions: {
        'categories:performance': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
        'categories:best-practices': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
        'categories:seo': ['error', { minScore: 0.9, aggregationMethod: 'median' }],
        'largest-contentful-paint': ['error', { maxNumericValue: 2500, aggregationMethod: 'median' }],
        'cumulative-layout-shift': ['error', { maxNumericValue: 0.1, aggregationMethod: 'median' }]
      }
    },
    upload: {
      target: 'filesystem',
      outputDir: './lighthouse-report'
    }
  }
}
