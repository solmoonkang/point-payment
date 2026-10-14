import { readFile } from 'node:fs/promises'
import type { Server } from 'node:http'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import type { Express } from 'express'
import { createServer as createViteServer } from 'vite'

const appRoot = fileURLToPath(new URL('..', import.meta.url))

// API 와 같은 포트에서 화면을 내보냄 (주소 하나 = 서버 하나), API 가 아닌 GET 은 모두 index.html 로
export async function attachWeb(app: Express, server: Server): Promise<void> {
  // ponytail: 개발용 연결만 둠, 배포가 필요해지면 vite build 결과를 express.static 으로
  const vite = await createViteServer({
    configFile: path.join(appRoot, 'vite.config.ts'),
    server: { middlewareMode: true, hmr: { server, path: '/vite-hmr' } },
    appType: 'custom',
  })
  app.use(vite.middlewares)

  const indexPath = path.join(appRoot, 'web', 'index.html')
  app.use(async (request, response, next) => {
    if (request.method !== 'GET') return next()
    try {
      const html = await vite.transformIndexHtml(request.originalUrl, await readFile(indexPath, 'utf8'))
      response.status(200).type('html').end(html)
    } catch (error) {
      vite.ssrFixStacktrace(error as Error)
      next(error)
    }
  })
}
