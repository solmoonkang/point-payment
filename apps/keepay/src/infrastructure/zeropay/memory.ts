// 테스트용 제로페이. 킵페이가 제로페이 앱 코드를 가져다 쓰지 않도록 계약만 보고 따로 흉내 냄 (한쪽을 지워도 다른 쪽이 돌게)
import type { MemberVerifyRequest, Usage } from '@point-payment/contract'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import type { ZeropayClient } from './index.js'

export interface MemoryZeropay extends ZeropayClient {
  grant(memberId: string, amount: number): void
  spendElsewhere(memberId: string, amount: number): void // 다른 가맹점에서 쓴 것처럼 잔액만 줄임
  failNextCancel(): void
  addMember(memberId: string, identity: MemberVerifyRequest): void
}

export function createMemoryZeropay(): MemoryZeropay {
  const balances = new Map<string, number>()
  const usages = new Map<string, Usage>()
  const members = new Map<string, MemberVerifyRequest>()
  let failCancel = false
  let seq = 0

  return {
    grant: (memberId, amount) => void balances.set(memberId, balanceOf(memberId) + amount),
    spendElsewhere: (memberId, amount) => void balances.set(memberId, balanceOf(memberId) - amount),
    addMember: (memberId, identity) => void members.set(memberId, identity),
    failNextCancel: () => void (failCancel = true),

    async verifyMember({ name, birth, phone }) {
      const found = [...members.entries()].find(([, member]) => member.name === name && member.birth === birth && member.phone === phone)
      return found?.[0] ?? null
    },

    async balance(memberId) {
      return { memberId, balance: balanceOf(memberId) }
    },

    async createUsage(request) {
      const existing = [...usages.values()].find((usage) => usage.merchantOrderId === request.merchantOrderId)
      if (existing) return { approvalNo: existing.approvalNo }
      if (balanceOf(request.memberId) < request.amount) throw new AppError(ErrorCode.POINT_INSUFFICIENT)
      balances.set(request.memberId, balanceOf(request.memberId) - request.amount)
      const approvalNo = `A-${1000 + ++seq}`
      usages.set(approvalNo, { ...request, approvalNo, status: 'approved', approvedAt: new Date().toISOString(), cancelledAt: null })
      return { approvalNo }
    },

    async cancelUsage(approvalNo) {
      if (failCancel) {
        failCancel = false
        throw new AppError(ErrorCode.ZEROPAY_UNAVAILABLE, '사용 취소 실패')
      }
      const usage = getUsage(approvalNo)
      if (usage.status === 'cancelled') return usage
      balances.set(usage.memberId, balanceOf(usage.memberId) + usage.amount)
      const cancelled: Usage = { ...usage, status: 'cancelled', cancelledAt: new Date().toISOString() }
      usages.set(approvalNo, cancelled)
      return cancelled
    },

    listUsages: async () => ({ usages: [...usages.values()] }),
  }

  function balanceOf(memberId: string): number {
    return balances.get(memberId) ?? 0
  }

  function getUsage(approvalNo: string): Usage {
    const usage = usages.get(approvalNo)
    if (!usage) throw new AppError(ErrorCode.ZEROPAY_REJECTED, '없는 사용 건입니다')
    return usage
  }
}
