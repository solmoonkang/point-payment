import { createServer } from 'node:http'
import { createApp } from './app.js'
import { env } from './config/env.js'
import { createServices } from './services.js'
import { attachWeb } from './web.js'

const app = createApp(createServices())
const server = createServer(app)
await attachWeb(app, server)

server.listen(env.PORT, () => {
  console.log(`제로페이 서버: ${env.PUBLIC_URL} (운영자 ${env.PUBLIC_URL}/admin)`)
})
