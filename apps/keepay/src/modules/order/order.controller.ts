import type { RequestHandler } from 'express'
import { z } from 'zod'
import type { Visitor } from '../../middlewares/visitor.js'
import type { OrderService } from './order.service.js'

const zMethod = z.enum(['point', 'card'])
const zQuoteQuery = z.object({ productId: z.string(), planId: z.string(), method: zMethod })
const zPayRequest = z.object({
  requestId: z.string().min(8).max(64),
  productId: z.string(),
  planId: z.string(),
  gymId: z.string().nullable(),
  method: zMethod,
})

export function createOrderController(order: OrderService) {
  const visitorOf = (locals: Record<string, unknown>) => locals.visitor as Visitor & { memberId: string }

  const quote: RequestHandler = async (request, response) => {
    const query = zQuoteQuery.parse(request.query)
    response.json(await order.quote({ ...query, zeropayMemberId: visitorOf(response.locals).zeropayMemberId ?? null }))
  }

  const pay: RequestHandler = async (request, response) => {
    const input = zPayRequest.parse(request.body)
    const visitor = visitorOf(response.locals)
    response.json(await order.pay({ ...input, memberId: visitor.memberId, zeropayMemberId: visitor.zeropayMemberId ?? null, ip: request.ip ?? '-' }))
  }

  const get: RequestHandler = (request, response) => {
    response.json({ order: order.get(Number(request.params.orderId), visitorOf(response.locals).memberId) })
  }

  return { quote, pay, get }
}
