import { describe, expect, it } from 'vitest'
import { createFakePgClient } from '../src/infrastructure/pg/index.js'
import { createMemoryZeropay } from '../src/infrastructure/zeropay/memory.js'
import { createMemoryOrderRepository } from '../src/modules/order/order.repository.js'
import { createOrderService, type PayInput } from '../src/modules/order/order.service.js'
import { createFixedProductRepository } from '../src/modules/product/product.repository.js'
import { createProductService } from '../src/modules/product/product.service.js'

const ZM = 'zm_0001' // 제로페이 회원 번호

// 메모리 제로페이 · 흉내 PG 로 묶은 주문 서비스
function setup(balance: number) {
  const zeropay = createMemoryZeropay()
  const pg = createFakePgClient()
  zeropay.grant(ZM, balance)
  const order = createOrderService({
    orders: createMemoryOrderRepository(),
    products: createProductService({ products: createFixedProductRepository() }),
    zeropay,
    pg,
  })
  // 헬스장 휴폐업 보험 15,000원 결제 요청
  let seq = 0
  const input = (patch: Partial<PayInput> = {}): PayInput => ({
    requestId: `request-${++seq}-0000`,
    memberId: 'km_1',
    zeropayMemberId: ZM,
    productId: 'gym',
    planId: 'closure',
    gymId: 'gym-3',
    method: 'point',
    ip: '127.0.0.1',
    ...patch,
  })
  const pay = (patch: Partial<PayInput> = {}) => order.pay(input(patch))
  return { zeropay, pg, order, input, pay }
}

describe('결제', () => {
  it('포인트 충분: 상품권 15,000 · PG 0, 승인 번호를 남기고 가입 완료', async () => {
    const { zeropay, pay } = setup(35000)
    const { order } = await pay()
    expect(order).toMatchObject({ status: 'paid', pointAmount: 15000, pgAmount: 0 })
    expect(order.approvalNo).toMatch(/^A-/)
    expect((await zeropay.balance(ZM)).balance).toBe(20000)
  })

  it('포인트 부족: 상품권 5,000 · PG 10,000', async () => {
    const { pay } = setup(5000)
    const { order } = await pay()
    expect(order).toMatchObject({ status: 'paid', pointAmount: 5000, pgAmount: 10000 })
    expect(order.pgTxId).toBeTruthy()
  })

  it('카드 선택: 제로페이를 부르지 않고 PG 15,000', async () => {
    const { zeropay, order, input } = setup(35000)
    const { order: paid } = await order.pay(input({ method: 'card' }))
    expect(paid).toMatchObject({ status: 'paid', pointAmount: 0, pgAmount: 15000, approvalNo: null })
    expect((await zeropay.balance(ZM)).balance).toBe(35000)
  })

  it('다른 회원의 주문은 조회할 수 없음', async () => {
    const { order, pay } = setup(35000)
    const { order: paid } = await pay()
    expect(() => order.get(paid.id, 'km_2')).toThrow(expect.objectContaining({ name: 'ORDER_NOT_FOUND' }))
  })

  it('결제 버튼을 두 번 눌러도 주문 하나', async () => {
    const { order, input } = setup(35000)
    const request = input()
    const first = await order.pay(request)
    const second = await order.pay(request)
    expect(second.order.id).toBe(first.order.id)
    expect(order.list()).toHaveLength(1)
  })

  it('같은 결제 요청이 겹쳐 들어와도 PG 결제는 한 번', async () => {
    const { pg, order, input } = setup(5000)
    let charges = 0
    const charge = pg.charge
    pg.charge = async (args) => (charges++, charge(args))
    const request = input()
    const [first, second] = await Promise.all([order.pay(request), order.pay(request)])
    expect(first.order.status).toBe('paid')
    expect(second.order.id).toBe(first.order.id)
    expect(charges).toBe(1)
  })

  it('조회 뒤 다른 곳에서 써서 잔액이 줄면 사용 요청이 거절 → 결제 실패', async () => {
    const { zeropay, pay } = setup(15000)
    const balance = zeropay.balance
    zeropay.balance = async (memberId) => {
      const result = await balance(memberId)
      zeropay.spendElsewhere(ZM, 10000)
      return result
    }
    const { order } = await pay()
    expect(order).toMatchObject({ status: 'failed', failReason: '상품권 잔액이 부족합니다' })
  })
})

describe('되돌리기', () => {
  it('PG 실패: 승인된 상품권을 복원하고 결제 실패', async () => {
    const { zeropay, pg, pay } = setup(5000)
    pg.setFailNext(true)
    const { order } = await pay()
    expect(order).toMatchObject({ status: 'failed', pointRestored: true })
    expect((await zeropay.balance(ZM)).balance).toBe(5000)
  })

  it('가입 취소: 카드 취소 후 상품권 복원', async () => {
    const { zeropay, order, pay } = setup(5000)
    const { order: paid } = await pay()
    const cancelled = await order.cancel(paid.id)
    expect(cancelled).toMatchObject({ status: 'cancelled', pgCancelled: true, pointRestored: true })
    expect((await zeropay.balance(ZM)).balance).toBe(5000)
  })

  it('상품권 복원이 실패하면 취소 미완료, 다시 취소하면 남은 쪽만 처리', async () => {
    const { zeropay, order, pay } = setup(35000)
    const { order: paid } = await pay()
    zeropay.failNextCancel()
    expect(await order.cancel(paid.id)).toMatchObject({ status: 'cancel_failed', pointRestored: false })
    expect((await zeropay.balance(ZM)).balance).toBe(20000)

    expect(await order.cancel(paid.id)).toMatchObject({ status: 'cancelled', pointRestored: true, failReason: null })
    expect((await zeropay.balance(ZM)).balance).toBe(35000)
  })
})
