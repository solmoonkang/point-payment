import type { RequestHandler } from 'express'
import type { ProductService } from './product.service.js'

export function createProductController(product: ProductService) {
  const list: RequestHandler = (_request, response) => {
    response.json({ products: product.list() })
  }

  const get: RequestHandler = (request, response) => {
    response.json(product.get(String(request.params.productId)))
  }

  const gyms: RequestHandler = (request, response) => {
    response.json({ gyms: product.searchGyms(String(request.query.query ?? '')) })
  }

  return { list, get, gyms }
}
