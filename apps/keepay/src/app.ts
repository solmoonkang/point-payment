import express, { type Express } from 'express'
import { apiNotFound, errorHandler } from './middlewares/errorHandler.js'
import { adminRoutes } from './modules/admin/admin.route.js'
import { healthRoutes } from './modules/health/health.route.js'
import { memberRoutes } from './modules/member/member.route.js'
import { orderRoutes } from './modules/order/order.route.js'
import { productRoutes } from './modules/product/product.route.js'
import type { Services } from './services.js'

export function createApp(services: Services): Express {
  const app = express()
  // 앞단 프록시(nginx 등)가 같은 서버에 있을 때만 X-Forwarded-For 를 접속 IP 로 믿음. 밖에서 보낸 값은 무시
  app.set('trust proxy', 'loopback')
  app.use(express.json())

  healthRoutes(app)
  productRoutes(app, services)
  memberRoutes(app, services)
  orderRoutes(app, services)
  adminRoutes(app, services)

  app.use('/api', apiNotFound)
  app.use(errorHandler)
  return app
}
