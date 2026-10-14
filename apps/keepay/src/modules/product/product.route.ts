import type { Express } from 'express'
import type { Services } from '../../services.js'
import { createProductController } from './product.controller.js'

export function productRoutes(app: Express, services: Services): void {
  const productController = createProductController(services.product)
  app.get('/api/products', productController.list)
  app.get('/api/products/:productId', productController.get)
  app.get('/api/gyms', productController.gyms)
}
