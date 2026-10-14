import express, { type Express } from 'express'
import { apiNotFound, errorHandler } from './middlewares/errorHandler.js'
import { adminRoutes } from './modules/admin/admin.route.js'
import { healthRoutes } from './modules/health/health.route.js'
import { memberRoutes } from './modules/member/member.route.js'
import { voucherRoutes } from './modules/voucher/voucher.route.js'
import type { Services } from './services.js'

export function createApp(services: Services): Express {
  const app = express()
  app.use(express.json())

  healthRoutes(app)
  memberRoutes(app, services)
  voucherRoutes(app, services)
  adminRoutes(app, services)

  app.use('/api', apiNotFound)
  app.use(errorHandler)
  return app
}
