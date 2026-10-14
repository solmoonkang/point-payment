// 잔액을 확인하는 곳과 차감하는 곳 사이에 await 를 넣지 않음
// (Node 는 한 번에 하나씩 실행하므로, 그래야 두 결제가 같은 잔액을 동시에 쓰지 못함)
import type { RejectReason, UsageCreateRequest, UsageListQuery } from '@point-payment/contract'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import { newId } from '../../utils/id.js'
import type { MemberRepository } from '../member/member.repository.js'
import type { Member } from '../member/member.type.js'
import type { VoucherRepository } from './voucher.repository.js'
import type { ApprovalView, HistoryRow, LedgerEntry, UsageRecord } from './voucher.type.js'

export interface VoucherService {
  grant(input: { memberId: string; amount: number; expiresOn: string; memo: string }): LedgerEntry
  balance(memberId: string): { balance: number; expiresOn: string | null }
  createUsage(merchant: string, request: UsageCreateRequest): UsageRecord // 같은 요청 번호면 처음 건을 돌려줌
  getUsage(merchant: string, usageId: string): UsageRecord
  approvalView(memberId: string, usageId: string): ApprovalView
  approve(memberId: string, usageId: string, payPassword: string): UsageRecord
  decline(memberId: string, usageId: string): UsageRecord
  cancelUsage(merchant: string, usageId: string): UsageRecord // 같은 건에 두 번 와도 한 번만 복원
  listUsages(merchant: string, query: UsageListQuery): UsageRecord[]
  history(): HistoryRow[] // 최신 순
}

export function createVoucherService(dependencies: { vouchers: VoucherRepository; members: MemberRepository; publicUrl: string; now?: () => Date }): VoucherService {
  const { vouchers, members, publicUrl, now = () => new Date() } = dependencies

  return {
    grant({ memberId, amount, expiresOn, memo }) {
      getMember(memberId)
      validateGrantAmount(amount)
      // ponytail: 회원별 만료일 하나 (마지막 지급의 만료일로 덮어씀), 지급 건별 만료가 필요하면 지급 건별로 차감해야 함
      vouchers.saveWallet({ memberId, expiresOn })
      return addEntry({ memberId, kind: 'grant', amount, usageId: null, memo })
    },

    balance(memberId) {
      getMember(memberId)
      const { balance, expiresOn } = usable(memberId)
      return { balance, expiresOn }
    },

    createUsage(merchant, request) {
      // 응답을 못 받은 가맹점이 같은 요청 번호로 다시 보내면 처음 건을 돌려줌
      const existing = vouchers.findUsageByRequestId(merchant, request.requestId)
      if (existing) {
        validateSameRequest(existing, request)
        return existing
      }
      getMember(request.memberId)

      // 최종 확인은 승인 때 다시 함. 여기서 먼저 거르는 것은 가맹점이 바로 다른 결제수단으로 바꿀 수 있게 하려는 것
      const rejectReason = rejectReasonOf(request.memberId, request.amount)
      const usage = newUsage(merchant, request, rejectReason)
      vouchers.saveUsage(usage)
      return usage
    },

    getUsage: (merchant, usageId) => getMerchantUsage(merchant, usageId),

    approvalView(memberId, usageId) {
      const usage = getOwnUsage(memberId, usageId)
      const { merchant, amount, status, rejectReason, returnUrl } = usage
      return { usageId, merchant, amount, status, rejectReason, returnUrl, balance: usable(memberId).balance, memberName: getMember(memberId).name }
    },

    approve(memberId, usageId, payPassword) {
      const usage = getOwnUsage(memberId, usageId)
      if (usage.status !== 'pending') return usage
      validatePayPassword(getMember(memberId), payPassword)

      // 요청 뒤 다른 곳에서 썼을 수 있어 차감 직전에 다시 확인
      const rejectReason = rejectReasonOf(memberId, usage.amount)
      if (rejectReason) return saveUsage({ ...usage, status: 'rejected', rejectReason })

      addEntry({ memberId, kind: 'use', amount: -usage.amount, usageId, memo: `${usage.merchant} 주문 ${usage.merchantOrderId}` })
      return saveUsage({ ...usage, status: 'approved', approvalNo: vouchers.nextApprovalNo(), approvedAt: now().toISOString() })
    },

    decline(memberId, usageId) {
      const usage = getOwnUsage(memberId, usageId)
      if (usage.status !== 'pending') return usage
      return saveUsage({ ...usage, status: 'rejected', rejectReason: 'declined' })
    },

    cancelUsage(merchant, usageId) {
      const usage = getMerchantUsage(merchant, usageId)
      if (usage.status === 'cancelled' || usage.status === 'rejected') return usage
      if (usage.status === 'approved') {
        addEntry({ memberId: usage.memberId, kind: 'cancel', amount: usage.amount, usageId, memo: `${usage.merchant} 주문 ${usage.merchantOrderId} 취소` })
      }
      return saveUsage({ ...usage, status: 'cancelled', cancelledAt: now().toISOString() })
    },

    listUsages(merchant, { from, to }) {
      return vouchers.usages().filter((usage) => {
        const day = usage.createdAt.slice(0, 10)
        return usage.merchant === merchant && (!from || day >= from) && (!to || day <= to)
      })
    },

    history: () => vouchers.entries().reverse().map(toHistoryRow),
  }

  function getMember(memberId: string): Member {
    const member = members.findById(memberId)
    if (!member) throw new AppError(ErrorCode.MEMBER_NOT_FOUND)
    return member
  }

  // 다른 가맹점의 사용 건은 없는 것으로 다룸
  function getMerchantUsage(merchant: string, usageId: string): UsageRecord {
    const usage = vouchers.findUsage(usageId)
    if (!usage || usage.merchant !== merchant) throw new AppError(ErrorCode.USAGE_NOT_FOUND)
    return usage
  }

  function getOwnUsage(memberId: string, usageId: string): UsageRecord {
    const usage = vouchers.findUsage(usageId)
    if (!usage) throw new AppError(ErrorCode.USAGE_NOT_FOUND)
    if (usage.memberId !== memberId) throw new AppError(ErrorCode.USAGE_OF_OTHER_MEMBER)
    return usage
  }

  function validateGrantAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) throw new AppError(ErrorCode.GRANT_AMOUNT_INVALID)
  }

  function validateSameRequest(existing: UsageRecord, request: UsageCreateRequest): void {
    const same = existing.memberId === request.memberId && existing.amount === request.amount && existing.merchantOrderId === request.merchantOrderId
    if (!same) throw new AppError(ErrorCode.REQUEST_ID_REUSED)
  }

  function validatePayPassword(member: Member, payPassword: string): void {
    if (member.payPassword !== payPassword) throw new AppError(ErrorCode.PAY_PASSWORD_MISMATCH)
  }

  function usable(memberId: string) {
    const { expiresOn } = vouchers.wallet(memberId)
    const sum = vouchers.entries(memberId).reduce((total, entry) => total + entry.amount, 0)
    const expired = expiresOn !== null && now().toISOString().slice(0, 10) > expiresOn
    return { balance: expired ? 0 : sum, sum, expiresOn, expired }
  }

  function rejectReasonOf(memberId: string, amount: number): RejectReason | null {
    const { balance, expired } = usable(memberId)
    if (expired) return 'expired'
    return balance < amount ? 'insufficient' : null
  }

  function addEntry(entry: Omit<LedgerEntry, 'id' | 'balanceAfter' | 'at'>): LedgerEntry {
    const added: LedgerEntry = { ...entry, id: newId('led'), balanceAfter: usable(entry.memberId).sum + entry.amount, at: now().toISOString() }
    vouchers.addEntry(added)
    return added
  }

  function saveUsage(usage: UsageRecord): UsageRecord {
    vouchers.saveUsage(usage)
    return usage
  }

  function newUsage(merchant: string, request: UsageCreateRequest, rejectReason: RejectReason | null): UsageRecord {
    const usageId = newId('use')
    return {
      usageId,
      requestId: request.requestId,
      memberId: request.memberId,
      merchantOrderId: request.merchantOrderId,
      amount: request.amount,
      status: rejectReason ? 'rejected' : 'pending',
      rejectReason,
      approvalNo: null,
      approvalUrl: new URL(`/approve/${usageId}`, publicUrl).toString(),
      createdAt: now().toISOString(),
      approvedAt: null,
      cancelledAt: null,
      merchant,
      returnUrl: request.returnUrl,
    }
  }

  function toHistoryRow(entry: LedgerEntry): HistoryRow {
    const member = members.findById(entry.memberId)
    const usage = entry.usageId ? vouchers.findUsage(entry.usageId) : undefined
    return {
      entryId: entry.id,
      kind: entry.kind,
      approvalNo: usage?.approvalNo ?? null,
      memberName: member?.name ?? '-',
      phone: member?.phone ?? '-',
      merchant: usage?.merchant ?? null,
      merchantOrderId: usage?.merchantOrderId ?? null,
      amount: entry.amount,
      balanceAfter: entry.balanceAfter,
      at: entry.at,
    }
  }
}
