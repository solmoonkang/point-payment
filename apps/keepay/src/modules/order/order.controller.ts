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
    response.json(await order.pay({ ...input, memberId: visitor.memberId, zeropayMemberId: visitor.zeropayMemberId ?? null, ip: clientIp(request.ip) }))
  }

  const get: RequestHandler = (request, response) => {
    response.json({ order: order.get(Number(request.params.orderId), visitorOf(response.locals).memberId) })
  }

  return { quote, pay, get }
}

// IPv4 접속도 Node 는 ::ffff:1.2.3.4 로 주고, 로컬 접속은 ::1 로 줌. 운영자 화면에는 흔히 쓰는 IPv4 꼴로 저장
function clientIp(ip: string | undefined): string {
  if (!ip) return '-'
  if (ip === '::1') return '127.0.0.1'
  return ip.replace(/^::ffff:/, '')
}
