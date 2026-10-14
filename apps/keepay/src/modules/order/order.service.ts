// 같은 요청 번호면 주문 하나. 같은 결제 요청이 겹치면 하나만 돌고 나머지는 그 결과를 기다림 (PG 가 두 번 결제되지 않게)
// PG 가 실패하면 이미 승인된 상품권 사용을 취소함
// 되돌리기는 단계마다 기록함 (중간에 실패하면 「취소 미완료」로 남고, 다시 취소하면 남은 쪽만 처리)
import type { PgClient } from '../../infrastructure/pg/index.js'
import type { ZeropayClient } from '../../infrastructure/zeropay/index.js'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import type { ProductService } from '../product/product.service.js'
import type { Plan, Product } from '../product/product.type.js'
import type { OrderRepository } from './order.repository.js'
import type { Order, PayMethod, PayResult, Quote } from './order.type.js'

export interface PayInput {
  requestId: string
  memberId: string
  zeropayMemberId: string | null
  productId: string
  planId: string
  gymId: string | null
  method: PayMethod
  ip: string
}

export interface OrderService {
  quote(input: { zeropayMemberId: string | null; productId: string; planId: string; method: PayMethod }): Promise<Quote>
  pay(input: PayInput): Promise<PayResult>
  get(orderId: number, memberId: string): Order
  cancel(orderId: number): Promise<Order>
  list(): Order[]
}

export function createOrderService(dependencies: { orders: OrderRepository; products: ProductService; zeropay: ZeropayClient; pg: PgClient; now?: () => Date }): OrderService {
  const { orders, products, zeropay, pg, now = () => new Date() } = dependencies
  const running = new Map<string, Promise<unknown>>()

  return {
    quote,

    pay: (input) => once(`pay:${input.requestId}`, () => startPay(input)),

    get(orderId, memberId) {
      const order = getOrder(orderId)
      validateOwner(order, memberId)
      return order
    },

    async cancel(orderId) {
      getOrder(orderId)
      return once(`order:${orderId}`, () => cancelOrder(orderId))
    },

    list: () => orders.list(),
  }

  async function quote({ zeropayMemberId, productId, planId, method }: Parameters<OrderService['quote']>[0]): Promise<Quote> {
    const { plan } = products.plan(productId, planId)
    if (method === 'card' || !zeropayMemberId) return { price: plan.price, balance: null, pointAmount: 0, pgAmount: plan.price }
    const { balance } = await zeropay.balance(zeropayMemberId)
    const pointAmount = Math.min(balance, plan.price)
    return { price: plan.price, balance, pointAmount, pgAmount: plan.price - pointAmount }
  }

  async function startPay(input: PayInput): Promise<PayResult> {
    const existing = orders.findByRequestId(input.requestId)
    if (existing) {
      validateSameRequester(existing, input)
      return { order: existing }
    }

    const { product, plan } = products.plan(input.productId, input.planId)
    validatePayable(product, input)
    const { pointAmount, pgAmount } = await quote(input)
    const order = orders.insert(newOrder(input, product, plan, pointAmount, pgAmount))
    if (pointAmount === 0) return finish(order)
    return requestUsage(order, input.zeropayMemberId!)
  }

  async function requestUsage(order: Order, zeropayMemberId: string): Promise<PayResult> {
    let approvalNo: string
    try {
      ;({ approvalNo } = await zeropay.createUsage({ memberId: zeropayMemberId, amount: order.pointAmount, merchantOrderId: String(order.id) }))
    } catch (error) {
      // 견적 뒤 다른 곳에서 써서 잔액이 줄었거나 만료됐으면 여기서 거절됨
      return fail(order, isPointRejection(error) ? (error as Error).message : `제로페이 사용 요청 실패: ${(error as Error).message}`)
    }
    return finish(orders.update(order.id, { approvalNo }))
  }

  async function finish(order: Order): Promise<PayResult> {
    if (order.pgAmount > 0) {
      const charge = await pg.charge({ orderId: order.id, amount: order.pgAmount })
      if (!charge.ok) return failAfterPoints(order, charge.reason)
      order = orders.update(order.id, { pgTxId: charge.txId })
    }
    return { order: orders.update(order.id, { status: 'paid', paidAt: stamp() }) }
  }

  // 되돌리기마저 실패하면 운영자가 다시 시도하도록 「취소 미완료」로 남김
  async function failAfterPoints(order: Order, reason: string): Promise<PayResult> {
    if (!order.approvalNo) return fail(order, reason)
    try {
      await zeropay.cancelUsage(order.approvalNo, '카드 결제 실패')
      orders.update(order.id, { pointRestored: true })
      return fail(order, reason)
    } catch (error) {
      return { order: orders.update(order.id, { status: 'cancel_failed', failReason: `${reason} · 상품권 복원 실패: ${(error as Error).message}` }) }
    }
  }

  async function cancelOrder(orderId: number): Promise<Order> {
    let order = getOrder(orderId)
    validateCancellable(order)

    // 전액 취소라 카드 · 상품권 순서는 결과를 바꾸지 않음
    if (order.pgTxId && !order.pgCancelled) {
      await pg.cancel(order.pgTxId)
      order = orders.update(order.id, { pgCancelled: true })
    }
    if (order.approvalNo && !order.pointRestored) {
      try {
        await zeropay.cancelUsage(order.approvalNo, order.paidAt ? '가입 취소' : '카드 결제 실패')
        order = orders.update(order.id, { pointRestored: true })
      } catch (error) {
        return orders.update(order.id, { status: 'cancel_failed', failReason: `상품권 복원 실패: ${(error as Error).message}` })
      }
    }

    // 결제 실패 중 복원만 남았던 주문은 가입한 적이 없으므로 「결제 실패」로 돌아감
    return order.paidAt ? orders.update(order.id, { status: 'cancelled', failReason: null, cancelledAt: stamp() }) : orders.update(order.id, { status: 'failed' })
  }

  function getOrder(orderId: number): Order {
    const order = orders.findById(orderId)
    if (!order) throw new AppError(ErrorCode.ORDER_NOT_FOUND)
    return order
  }

  // 다른 회원의 주문은 없는 것으로 다룸
  function validateOwner(order: Order, memberId: string): void {
    if (order.memberId !== memberId) throw new AppError(ErrorCode.ORDER_NOT_FOUND)
  }

  function validateSameRequester(existing: Order, input: PayInput): void {
    if (existing.memberId !== input.memberId) throw new AppError(ErrorCode.REQUEST_ID_REUSED)
  }

  function validatePayable(product: Product, input: PayInput): void {
    if (product.needsGym && !input.gymId) throw new AppError(ErrorCode.GYM_REQUIRED)
    if (input.method === 'point' && !input.zeropayMemberId) throw new AppError(ErrorCode.ZEROPAY_NOT_LINKED)
  }

  function validateCancellable(order: Order): void {
    if (order.status !== 'paid' && order.status !== 'cancel_failed') throw new AppError(ErrorCode.ORDER_NOT_CANCELLABLE)
  }

  function isPointRejection(error: unknown): boolean {
    return error instanceof AppError && (error.name === ErrorCode.POINT_INSUFFICIENT.name || error.name === ErrorCode.POINT_EXPIRED.name)
  }

  function fail(order: Order, reason: string): PayResult {
    return { order: orders.update(order.id, { status: 'failed', failReason: reason }) }
  }

  function newOrder(input: PayInput, product: Product, plan: Plan, pointAmount: number, pgAmount: number): Omit<Order, 'id'> {
    return {
      requestId: input.requestId,
      memberId: input.memberId,
      productId: product.id,
      planId: plan.id,
      productName: product.name,
      planName: plan.name,
      gymName: product.needsGym && input.gymId ? products.gym(input.gymId).name : null,
      price: plan.price,
      pointAmount,
      pgAmount,
      method: input.method,
      status: 'pending',
      failReason: null,
      approvalNo: null,
      pgTxId: null,
      pointRestored: false,
      pgCancelled: false,
      ip: input.ip,
      createdAt: stamp(),
      paidAt: null,
      cancelledAt: null,
    }
  }

  // ponytail: 서버 한 대 안에서만 막음, 서버를 여러 대로 늘리면 DB 잠금 · 고유 제약으로
  function once<T>(key: string, job: () => Promise<T>): Promise<T> {
    const current = running.get(key) as Promise<T> | undefined
    if (current) return current
    const started = job().finally(() => running.delete(key))
    running.set(key, started)
    return started
  }

  function stamp(): string {
    return now().toISOString()
  }
}
