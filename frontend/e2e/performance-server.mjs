import { spawn } from 'node:child_process'

const fixturePort = '8898'
const fixture = spawn(process.execPath, ['e2e/fixture-server.mjs'], {
  env: { ...process.env, FIXTURE_PORT: fixturePort },
  stdio: 'inherit'
})
const server = spawn(process.execPath, ['server.js'], {
  env: {
    ...process.env,
    PORT: '4176',
    API_INTERNAL_BASE_URL: `http://127.0.0.1:${fixturePort}`,
    APP_ORIGIN: 'http://127.0.0.1:4176'
  },
  stdio: 'inherit'
})

function stop() {
  fixture.kill()
  server.kill()
}

process.on('SIGINT', stop)
process.on('SIGTERM', stop)
process.on('exit', stop)
fixture.on('exit', (code) => {
  if (code) process.exitCode = code
})
server.on('exit', (code) => {
  if (code) process.exitCode = code
})
