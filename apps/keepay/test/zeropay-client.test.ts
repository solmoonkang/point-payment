import { afterEach, describe, expect, it, vi } from 'vitest'
import { createHttpZeropayClient } from '../src/infrastructure/zeropay/index.js'

const usage = {
  usageId: 'use_1',
  requestId: 'request-0001',
  memberId: 'zm_hong0001',
  merchantOrderId: '1',
  amount: 15000,
  status: 'pending',
  rejectReason: null,
  approvalNo: null,
  approvalUrl: 'http://localhost:5100/approve/use_1',
  createdAt: '2026-10-14T03:00:00.000Z',
  approvedAt: null,
  cancelledAt: null,
}
const request = { requestId: 'request-0001', memberId: 'zm_hong0001', amount: 15000, merchantOrderId: '1', returnUrl: 'http://localhost:5200/pay/result/1' }
const client = () => createHttpZeropayClient({ baseUrl: 'http://localhost:5100', merchantKey: 'k', timeoutMs: 1000 })
const ok = (body: unknown) => ({ ok: true, status: 200, json: async () => body }) as unknown as Response

afterEach(() => vi.unstubAllGlobals())

describe('제로페이 클라이언트', () => {
  it('사용 요청 응답이 끊기면 같은 요청 번호로 한 번 다시 보냄', async () => {
    const fetch = vi.fn().mockRejectedValueOnce(new TypeError('socket hang up')).mockResolvedValueOnce(ok(usage))
    vi.stubGlobal('fetch', fetch)
    expect(await client().createUsage(request)).toMatchObject({ usageId: 'use_1' })
    expect(fetch).toHaveBeenCalledTimes(2)
    const bodies = fetch.mock.calls.map(([, init]) => (init as RequestInit).body)
    expect(bodies[0]).toBe(bodies[1])
  })

  it('사용 취소는 다시 보내지 않고 실패를 그대로 알림', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({ code: 'unavailable', error: 'CANCEL_FAILURE_FORCED', message: '사용 취소 실패' }) } as unknown as Response)
    vi.stubGlobal('fetch', fetch)
    await expect(client().cancelUsage('use_1')).rejects.toMatchObject({ name: 'ZEROPAY_UNAVAILABLE' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('제로페이가 거절하면 다시 보내지 않고 ZEROPAY_REJECTED', async () => {
    const fetch = vi.fn().mockResolvedValue({ ok: false, status: 409, json: async () => ({ code: 'conflict', error: 'REQUEST_ID_REUSED', message: '같은 요청 번호로 다른 내용을 보냈습니다' }) } as unknown as Response)
    vi.stubGlobal('fetch', fetch)
    await expect(client().createUsage(request)).rejects.toMatchObject({ name: 'ZEROPAY_REJECTED' })
    expect(fetch).toHaveBeenCalledTimes(1)
  })

  it('계약과 다른 응답은 받아들이지 않음', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(ok({ ...usage, amount: -1 })))
    await expect(client().getUsage('use_1')).rejects.toThrow()
  })
})
