import { describe, expect, it } from 'vitest'
import { createMemoryMemberRepository } from '../src/modules/member/member.repository.js'
import { createMemoryVoucherRepository } from '../src/modules/voucher/voucher.repository.js'
import { createVoucherService } from '../src/modules/voucher/voucher.service.js'

const MERCHANT = '킵페이'
const HONG = 'zm_0001' // 처음부터 있는 회원

// 던진 오류의 이름 (ErrorCode 의 키)
function thrown(run: () => unknown): string | undefined {
  try {
    run()
  } catch (error) {
    return (error as Error).name
  }
  return undefined
}

// 오늘을 2026-10-14 로 고정한 상품권 서비스
function setup(today = '2026-10-14') {
  const voucher = createVoucherService({
    vouchers: createMemoryVoucherRepository(),
    members: createMemoryMemberRepository(),
    now: () => new Date(`${today}T03:00:00.000Z`),
  })
  const request = (merchantOrderId: string, amount: number) => ({ memberId: HONG, amount, merchantOrderId })
  return { voucher, request }
}

describe('지급 · 잔액', () => {
  it('잔액은 내역의 합계', () => {
    const { voucher } = setup()
    voucher.grant({ memberId: HONG, amount: 30000, expiresOn: '2026-12-20', memo: '' })
    voucher.grant({ memberId: HONG, amount: 5000, expiresOn: '2026-12-20', memo: '' })
    expect(voucher.balance(HONG)).toEqual({ balance: 35000, expiresOn: '2026-12-20' })
  })
  it('만료일이 지나면 잔액 0, 사용 요청은 VOUCHER_EXPIRED', () => {
    const { voucher, request } = setup('2026-12-21')
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    expect(voucher.balance(HONG).balance).toBe(0)
    expect(thrown(() => voucher.createUsage(MERCHANT, request('1', 15000)))).toBe('VOUCHER_EXPIRED')
  })
})

describe('사용 요청 → 취소', () => {
  it('사용 요청을 받으면 바로 차감하고 승인 번호 발급, 같은 주문 번호로 다시 보내도 한 번', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    const usage = voucher.createUsage(MERCHANT, request('1', 15000))
    const again = voucher.createUsage(MERCHANT, request('1', 15000))
    expect(usage.approvalNo).toMatch(/^A-\d+$/)
    expect(again.approvalNo).toBe(usage.approvalNo)
    expect(voucher.balance(HONG).balance).toBe(20000)
  })

  it('같은 주문 번호로 내용이 다르면 ORDER_REUSED', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    voucher.createUsage(MERCHANT, request('1', 15000))
    expect(thrown(() => voucher.createUsage(MERCHANT, request('1', 9000)))).toBe('ORDER_REUSED')
  })

  it('잔액보다 큰 사용 요청은 INSUFFICIENT_BALANCE, 차감하지 않음', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 20000, expiresOn: '2026-12-20', memo: '' })
    voucher.createUsage(MERCHANT, request('1', 15000))
    expect(thrown(() => voucher.createUsage(MERCHANT, request('2', 15000)))).toBe('INSUFFICIENT_BALANCE')
    expect(voucher.balance(HONG).balance).toBe(5000)
  })

  it('취소는 한 번만 복원하고, 내역에는 반대 금액 줄이 쌓임', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    const usage = voucher.createUsage(MERCHANT, request('1', 15000))
    voucher.cancelUsage(MERCHANT, usage.approvalNo, '가입 취소')
    voucher.cancelUsage(MERCHANT, usage.approvalNo, '가입 취소')
    expect(voucher.balance(HONG).balance).toBe(35000)
    expect(voucher.history().map((row) => [row.kind, row.amount])).toEqual([
      ['cancel', 15000],
      ['use', -15000],
      ['grant', 35000],
    ])
  })

  it('다른 가맹점의 사용 건은 취소 불가', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    const usage = voucher.createUsage(MERCHANT, request('1', 15000))
    expect(thrown(() => voucher.cancelUsage('다른가맹점', usage.approvalNo, '가입 취소'))).toBe('USAGE_NOT_FOUND')
  })
})
