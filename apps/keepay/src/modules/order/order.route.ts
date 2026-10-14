import type { Express } from 'express'
import { requireMember } from '../../middlewares/visitor.js'
import type { Services } from '../../services.js'
import { createOrderController } from './order.controller.js'

export function orderRoutes(app: Express, services: Services): void {
  const orderController = createOrderController(services.order)
  app.get('/api/orders/quote', requireMember, orderController.quote)
  app.post('/api/orders', requireMember, orderController.pay)
  app.get('/api/orders/:orderId', requireMember, orderController.get)
}
