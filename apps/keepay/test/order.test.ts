import { describe, expect, it } from 'vitest'
import { createFakePgClient } from '../src/infrastructure/pg/index.js'
import { createMemoryZeropay } from '../src/infrastructure/zeropay/memory.js'
import { createMemoryOrderRepository } from '../src/modules/order/order.repository.js'
import { createOrderService, type PayInput } from '../src/modules/order/order.service.js'
import { createFixedProductRepository } from '../src/modules/product/product.repository.js'
import { createProductService } from '../src/modules/product/product.service.js'

const ZM = 'zm_hong0001' // 제로페이 회원 번호

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
    publicUrl: 'http://localhost:5200',
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
  // 결제 → 회원 승인 → 확인
  const payAndApprove = async (patch: Partial<PayInput> = {}) => {
    const started = await order.pay(input(patch))
    if (started.order.usageId) zeropay.approve(started.order.usageId)
    return order.confirm(started.order.id, 'km_1')
  }
  return { zeropay, pg, order, input, payAndApprove }
}

describe('결제', () => {
  it('포인트 충분: 상품권 15,000 · PG 0, 승인 번호를 남기고 가입 완료', async () => {
    const { zeropay, payAndApprove } = setup(35000)
    const { order } = await payAndApprove()
    expect(order).toMatchObject({ status: 'paid', pointAmount: 15000, pgAmount: 0 })
    expect(order.approvalNo).toMatch(/^A-/)
    expect((await zeropay.balance(ZM)).balance).toBe(20000)
  })

  it('포인트 부족: 상품권 5,000 · PG 10,000', async () => {
    const { payAndApprove } = setup(5000)
    const { order } = await payAndApprove()
    expect(order).toMatchObject({ status: 'paid', pointAmount: 5000, pgAmount: 10000 })
    expect(order.pgTxId).toBeTruthy()
  })

  it('카드 선택: 제로페이를 부르지 않고 PG 15,000', async () => {
    const { zeropay, order, input } = setup(35000)
    const { order: paid } = await order.pay(input({ method: 'card' }))
    expect(paid).toMatchObject({ status: 'paid', pointAmount: 0, pgAmount: 15000, usageId: null })
    expect((await zeropay.balance(ZM)).balance).toBe(35000)
  })

  it('승인 전에는 승인 대기와 제로페이 승인 화면 주소를 돌려줌', async () => {
    const { order, input } = setup(35000)
    const started = await order.pay(input())
    expect(started.order.status).toBe('awaiting_approval')
    expect(started.approvalUrl).toContain('/approve/')
  })

  it('결제 버튼을 두 번 눌러도 주문 하나', async () => {
    const { order, input } = setup(35000)
    const request = input()
    const first = await order.pay(request)
    const second = await order.pay(request)
    expect(second.order.id).toBe(first.order.id)
    expect(order.list()).toHaveLength(1)
  })

  it('결제 확인이 겹쳐 들어와도 PG 결제는 한 번', async () => {
    const { zeropay, pg, order, input } = setup(5000)
    let charges = 0
    const charge = pg.charge
    pg.charge = async (args) => (charges++, charge(args))
    const started = await order.pay(input())
    zeropay.approve(started.order.usageId!)
    const [first, second] = await Promise.all([order.confirm(started.order.id, 'km_1'), order.confirm(started.order.id, 'km_1')])
    expect(first.order.status).toBe('paid')
    expect(second.order.status).toBe('paid')
    expect(charges).toBe(1)
  })

  it('조회 뒤 다른 곳에서 써서 잔액이 줄면 승인 때 거절 → 결제 실패', async () => {
    const { zeropay, order, input } = setup(15000)
    const started = await order.pay(input())
    zeropay.spendElsewhere(ZM, 10000)
    zeropay.approve(started.order.usageId!)
    const { order: confirmed } = await order.confirm(started.order.id, 'km_1')
    expect(confirmed).toMatchObject({ status: 'failed', failReason: '상품권 잔액이 부족합니다' })
  })
})

describe('되돌리기', () => {
  it('PG 실패: 승인된 상품권을 복원하고 결제 실패', async () => {
    const { zeropay, pg, payAndApprove } = setup(5000)
    pg.setFailNext(true)
    const { order } = await payAndApprove()
    expect(order).toMatchObject({ status: 'failed', pointRestored: true })
    expect((await zeropay.balance(ZM)).balance).toBe(5000)
  })

  it('가입 취소: 카드 취소 후 상품권 복원', async () => {
    const { zeropay, order, payAndApprove } = setup(5000)
    const { order: paid } = await payAndApprove()
    const cancelled = await order.cancel(paid.id)
    expect(cancelled).toMatchObject({ status: 'cancelled', pgCancelled: true, pointRestored: true })
    expect((await zeropay.balance(ZM)).balance).toBe(5000)
  })

  it('상품권 복원이 실패하면 취소 미완료, 다시 취소하면 남은 쪽만 처리', async () => {
    const { zeropay, order, payAndApprove } = setup(35000)
    const { order: paid } = await payAndApprove()
    zeropay.failNextCancel()
    expect(await order.cancel(paid.id)).toMatchObject({ status: 'cancel_failed', pointRestored: false })
    expect((await zeropay.balance(ZM)).balance).toBe(20000)

    expect(await order.cancel(paid.id)).toMatchObject({ status: 'cancelled', pointRestored: true })
    expect((await zeropay.balance(ZM)).balance).toBe(35000)
  })
})
