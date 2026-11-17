import http from 'node:http'

const port = Number(process.env.FIXTURE_PORT || 8899)
const items = Array.from({ length: 57 }, (_, index) => {
  const id = index + 1
  const categoryId = id <= 45 ? 2 : 3
  const categoryName = categoryId === 2 ? '校园新闻' : '通知公告'
  return {
    id,
    categoryId,
    title: `${categoryName} ${id}`,
    description: `确定性的测试新闻摘要 ${id}`,
    content: `<p>确定性的测试新闻正文 ${id}</p>`,
    author: '测试记者',
    image: `https://picsum.photos/seed/e2e-${id}/800/450`,
    publish_time: '2026-11-01 08:00:00',
    publishTime: '2026-11-01 08:00:00',
    views: 100 + id
  }
})
const favorites = new Set()
const fixtureImage = Buffer.from('UklGRtwCAABXRUJQVlA4INACAAAwUQCdASogA8IBPm02mUmkIqKhIAgAgA2JaW7hd2EbQAnsA99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32ych77ZOQ99snIe+2TkPfbJyHvtk5D32rAAP7/p5v/QfFy///5Bj/dl/pJxQTdYCL0CAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA=', 'base64')

function send(res, status, data) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' })
  res.end(JSON.stringify(data))
}

async function body(req) {
  let value = ''
  for await (const chunk of req) value += chunk
  return value ? JSON.parse(value) : {}
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://127.0.0.1:${port}`)
  const path = url.pathname

  if (path === '/api/health' || path === '/api/health/ready') {
    send(res, 200, { status: 'ok' })
    return
  }
  if (path === '/api/news/categories') {
    send(res, 200, { code: 200, data: [{ id: 1, name: '全部' }, { id: 2, name: '校园新闻' }, { id: 3, name: '通知公告' }] })
    return
  }
  if (path === '/api/news/list') {
    const categoryId = Number(url.searchParams.get('categoryId'))
    const page = Number(url.searchParams.get('page') || 1)
    const pageSize = Number(url.searchParams.get('pageSize') || 10)
    const filtered = items.filter((item) => item.categoryId === categoryId)
    const offset = (page - 1) * pageSize
    send(res, 200, {
      code: 200,
      data: {
        list: filtered.slice(offset, offset + pageSize),
        total: filtered.length,
        hasMore: offset + pageSize < filtered.length
      }
    })
    return
  }
  if (path === '/api/news/detail') {
    const item = items.find((news) => news.id === Number(url.searchParams.get('id')))
    if (!item) {
      send(res, 404, { code: 404, message: '新闻不存在' })
      return
    }
    const relatedNews = items.filter((news) => news.categoryId === item.categoryId && news.id !== item.id).slice(0, 3)
    send(res, 200, { code: 200, data: { ...item, relatedNews } })
    return
  }
  if (path === '/api/user/login' && req.method === 'POST') {
    send(res, 200, {
      code: 200,
      message: '登录成功',
      data: { token: 'e2e-token', userInfo: { id: 1, username: 'e2e-user', nickname: '测试用户' } }
    })
    return
  }
  if (path === '/api/user/info') {
    send(res, 200, { code: 200, data: { id: 1, username: 'e2e-user', nickname: '测试用户' } })
    return
  }
  if (path === '/api/favorite/check') {
    send(res, 200, { code: 200, data: { isFavorite: favorites.has(Number(url.searchParams.get('newsId'))) } })
    return
  }
  if (path === '/api/favorite/add' && req.method === 'POST') {
    const data = await body(req)
    favorites.add(Number(data.newsId))
    send(res, 200, { code: 200, data: { isFavorite: true } })
    return
  }
  if (path === '/api/favorite/remove' && req.method === 'DELETE') {
    favorites.delete(Number(url.searchParams.get('newsId')))
    send(res, 200, { code: 200, data: { isFavorite: false } })
    return
  }
  if (path === '/api/favorite/list') {
    send(res, 200, { code: 200, data: { list: items.filter((item) => favorites.has(item.id)), hasMore: false } })
    return
  }
  if (path === '/api/history/add' && req.method === 'POST') {
    send(res, 200, { code: 200, data: {} })
    return
  }
  if (path === '/api/image/proxy') {
    res.writeHead(200, {
      'Content-Type': 'image/webp',
      'Content-Length': fixtureImage.length,
      'Cache-Control': 'public, max-age=31536000, immutable'
    })
    res.end(fixtureImage)
    return
  }
  if (path === '/api/metrics' && req.method === 'POST') {
    await body(req)
    res.writeHead(204)
    res.end()
    return
  }
  send(res, 404, { code: 404, message: 'Not found' })
})

server.listen(port, '0.0.0.0', () => {
  console.log(`Fixture API listening on ${port}`)
})
