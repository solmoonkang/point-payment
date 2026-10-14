// 테스트용 제로페이. 킵페이가 제로페이 앱 코드를 가져다 쓰지 않도록 계약만 보고 따로 흉내 냄 (한쪽을 지워도 다른 쪽이 돌게)
import type { Usage } from '@point-payment/contract'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import type { ZeropayClient } from './index.js'

export interface MemoryZeropay extends ZeropayClient {
  grant(memberId: string, amount: number): void
  spendElsewhere(memberId: string, amount: number): void // 다른 가맹점에서 쓴 것처럼 잔액만 줄임
  approve(usageId: string): void // 회원이 승인 화면에서 승인한 것처럼
  failNextCancel(): void
  linkCode(code: string, memberId: string, name: string): void
}

export function createMemoryZeropay(): MemoryZeropay {
  const balances = new Map<string, number>()
  const usages = new Map<string, Usage>()
  const codes = new Map<string, { memberId: string; name: string }>()
  let failCancel = false
  let seq = 0

  return {
    grant: (memberId, amount) => void balances.set(memberId, balanceOf(memberId) + amount),
    spendElsewhere: (memberId, amount) => void balances.set(memberId, balanceOf(memberId) - amount),
    linkCode: (code, memberId, name) => void codes.set(code, { memberId, name }),
    failNextCancel: () => void (failCancel = true),

    approve(usageId) {
      const usage = getUsage(usageId)
      if (balanceOf(usage.memberId) < usage.amount) return void usages.set(usageId, { ...usage, status: 'rejected', rejectReason: 'insufficient' })
      balances.set(usage.memberId, balanceOf(usage.memberId) - usage.amount)
      usages.set(usageId, { ...usage, status: 'approved', approvalNo: `A-${1000 + seq}`, approvedAt: new Date().toISOString() })
    },

    async exchange(code) {
      const linked = codes.get(code)
      if (!linked) throw new AppError(ErrorCode.ZEROPAY_REJECTED, '없는 일회용 값입니다')
      codes.delete(code)
      return linked
    },

    async balance(memberId) {
      return { memberId, balance: balanceOf(memberId), expiresOn: '2026-12-20' }
    },

    async createUsage(request) {
      const existing = [...usages.values()].find((usage) => usage.requestId === request.requestId)
      if (existing) return existing
      const usageId = `use_${++seq}`
      const insufficient = balanceOf(request.memberId) < request.amount
      const usage: Usage = {
        usageId,
        requestId: request.requestId,
        memberId: request.memberId,
        merchantOrderId: request.merchantOrderId,
        amount: request.amount,
        status: insufficient ? 'rejected' : 'pending',
        rejectReason: insufficient ? 'insufficient' : null,
        approvalNo: null,
        approvalUrl: `http://zeropay.test/approve/${usageId}`,
        createdAt: new Date().toISOString(),
        approvedAt: null,
        cancelledAt: null,
      }
      usages.set(usageId, usage)
      return usage
    },

    getUsage: async (usageId) => getUsage(usageId),

    async cancelUsage(usageId) {
      if (failCancel) {
        failCancel = false
        throw new AppError(ErrorCode.ZEROPAY_UNAVAILABLE, '사용 취소 실패')
      }
      const usage = getUsage(usageId)
      if (usage.status !== 'approved') return usage
      balances.set(usage.memberId, balanceOf(usage.memberId) + usage.amount)
      const cancelled: Usage = { ...usage, status: 'cancelled', cancelledAt: new Date().toISOString() }
      usages.set(usageId, cancelled)
      return cancelled
    },

    listUsages: async () => ({ usages: [...usages.values()] }),
  }

  function balanceOf(memberId: string): number {
    return balances.get(memberId) ?? 0
  }

  function getUsage(usageId: string): Usage {
    const usage = usages.get(usageId)
    if (!usage) throw new AppError(ErrorCode.ZEROPAY_REJECTED, '없는 사용 건입니다')
    return usage
  }
}
