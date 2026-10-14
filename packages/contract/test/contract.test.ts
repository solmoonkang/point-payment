import { describe, expect, it } from 'vitest'
import fixtures from '../../../contracts/fixtures/v0.json'
import {
  fillPath,
  paths,
  zApiError,
  zBalanceResponse,
  zMemberVerifyRequest,
  zMemberVerifyResponse,
  zUsage,
  zUsageApproval,
  zUsageCancelRequest,
  zUsageCreateRequest,
} from '../src/index.js'

describe('연동 예시(fixtures)가 계약을 지킴', () => {
  it('회원 확인', () => {
    expect(zMemberVerifyRequest.safeParse(fixtures.memberVerify.request).success).toBe(true)
    expect(zMemberVerifyResponse.safeParse(fixtures.memberVerify.response).success).toBe(true)
  })
  it('잔액 조회', () => {
    expect(zBalanceResponse.safeParse(fixtures.balance.response).success).toBe(true)
  })
  it('사용 요청 · 승인 번호', () => {
    expect(zUsageCreateRequest.safeParse(fixtures.usageCreate.request).success).toBe(true)
    expect(zUsageApproval.safeParse(fixtures.usageCreate.response).success).toBe(true)
  })
  it('사용 취소', () => {
    expect(zUsageCancelRequest.safeParse(fixtures.usageCancel.request).success).toBe(true)
    expect(zUsage.safeParse(fixtures.usageCancel.response).success).toBe(true)
    expect(zUsageCancelRequest.safeParse({}).success).toBe(false)
  })
  it('실패 응답', () => {
    expect(zApiError.safeParse(fixtures.error.response).success).toBe(true)
  })
})

describe('계약이 막는 값', () => {
  it('금액 0 · 소수 · 음수는 사용 요청 불가', () => {
    const base = fixtures.usageCreate.request
    for (const amount of [0, 1.5, -100]) expect(zUsageCreateRequest.safeParse({ ...base, amount }).success).toBe(false)
  })
  it('가맹점 주문 번호가 없으면 불가', () => {
    expect(zUsageCreateRequest.safeParse({ ...fixtures.usageCreate.request, merchantOrderId: '' }).success).toBe(false)
  })
})

describe('fillPath', () => {
  it('자리 이름을 값으로 채우고 특수문자는 인코딩', () => {
    expect(fillPath(paths.usageCancel, { approvalNo: 'A-1001' })).toBe('/api/v0/usages/A-1001/cancel')
    expect(fillPath(paths.balance, { memberId: 'a/b' })).toBe('/api/v0/members/a%2Fb/balance')
  })
})
