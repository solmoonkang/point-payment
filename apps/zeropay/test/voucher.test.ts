import { describe, expect, it } from 'vitest'
import { createMemoryMemberRepository } from '../src/modules/member/member.repository.js'
import { createMemoryVoucherRepository } from '../src/modules/voucher/voucher.repository.js'
import { createVoucherService } from '../src/modules/voucher/voucher.service.js'

const MERCHANT = '킵페이'
const HONG = 'zm_hong0001' // 처음부터 있는 회원 (결제 비밀번호 123456)

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
    publicUrl: 'http://localhost:5100',
    now: () => new Date(`${today}T03:00:00.000Z`),
  })
  const request = (requestId: string, amount: number) => ({ requestId, memberId: HONG, amount, merchantOrderId: '1', returnUrl: 'http://localhost:5200/pay/result/1' })
  return { voucher, request }
}

describe('지급 · 잔액', () => {
  it('잔액은 내역의 합계', () => {
    const { voucher } = setup()
    voucher.grant({ memberId: HONG, amount: 30000, expiresOn: '2026-12-20', memo: '' })
    voucher.grant({ memberId: HONG, amount: 5000, expiresOn: '2026-12-20', memo: '' })
    expect(voucher.balance(HONG)).toEqual({ balance: 35000, expiresOn: '2026-12-20' })
  })
  it('만료일이 지나면 잔액 0, 사용 요청은 expired 로 거절', () => {
    const { voucher, request } = setup('2026-12-21')
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    expect(voucher.balance(HONG).balance).toBe(0)
    expect(voucher.createUsage(MERCHANT, request('req-expired-1', 15000))).toMatchObject({ status: 'rejected', rejectReason: 'expired' })
  })
})

describe('사용 요청 → 승인 → 취소', () => {
  it('승인하면 한 번 차감하고 승인 번호 발급, 두 번 눌러도 한 번', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    const usage = voucher.createUsage(MERCHANT, request('req-approve-1', 15000))
    expect(usage.status).toBe('pending')

    const approved = voucher.approve(HONG, usage.usageId, '123456')
    const again = voucher.approve(HONG, usage.usageId, '123456')
    expect(approved.status).toBe('approved')
    expect(approved.approvalNo).toMatch(/^A-\d+$/)
    expect(again.approvalNo).toBe(approved.approvalNo)
    expect(voucher.balance(HONG).balance).toBe(20000)
  })

  it('같은 요청 번호는 같은 사용 건, 내용이 다르면 conflict', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    const first = voucher.createUsage(MERCHANT, request('req-same-0001', 15000))
    expect(voucher.createUsage(MERCHANT, request('req-same-0001', 15000)).usageId).toBe(first.usageId)
    expect(thrown(() => voucher.createUsage(MERCHANT, request('req-same-0001', 9000)))).toBe('REQUEST_ID_REUSED')
  })

  it('결제 비밀번호가 틀리면 차감하지 않음', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    const usage = voucher.createUsage(MERCHANT, request('req-wrongpw-1', 15000))
    expect(thrown(() => voucher.approve(HONG, usage.usageId, '000000'))).toBe('PAY_PASSWORD_MISMATCH')
    expect(voucher.balance(HONG).balance).toBe(35000)
  })

  it('요청 뒤 다른 곳에서 써서 잔액이 줄면 승인 때 insufficient 로 거절', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 20000, expiresOn: '2026-12-20', memo: '' })
    const first = voucher.createUsage(MERCHANT, request('req-race-0001', 15000))
    const second = voucher.createUsage(MERCHANT, request('req-race-0002', 15000))
    voucher.approve(HONG, first.usageId, '123456')
    expect(voucher.approve(HONG, second.usageId, '123456')).toMatchObject({ status: 'rejected', rejectReason: 'insufficient' })
    expect(voucher.balance(HONG).balance).toBe(5000)
  })

  it('취소는 한 번만 복원하고, 내역에는 반대 금액 줄이 쌓임', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    const usage = voucher.createUsage(MERCHANT, request('req-cancel-01', 15000))
    voucher.approve(HONG, usage.usageId, '123456')
    voucher.cancelUsage(MERCHANT, usage.usageId)
    voucher.cancelUsage(MERCHANT, usage.usageId)
    expect(voucher.balance(HONG).balance).toBe(35000)
    expect(voucher.history().map((row) => [row.kind, row.amount])).toEqual([
      ['cancel', 15000],
      ['use', -15000],
      ['grant', 35000],
    ])
  })

  it('다른 가맹점의 사용 건은 조회 · 취소 불가', () => {
    const { voucher, request } = setup()
    voucher.grant({ memberId: HONG, amount: 35000, expiresOn: '2026-12-20', memo: '' })
    const usage = voucher.createUsage(MERCHANT, request('req-other-001', 15000))
    expect(thrown(() => voucher.cancelUsage('다른가맹점', usage.usageId))).toBe('USAGE_NOT_FOUND')
  })
})
