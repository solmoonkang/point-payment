// 잔액을 확인하는 곳과 차감하는 곳 사이에 await 를 넣지 않음
// (Node 는 한 번에 하나씩 실행하므로, 그래야 두 결제가 같은 잔액을 동시에 쓰지 못함)
import type { UsageCreateRequest, UsageListQuery } from '@point-payment/contract'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import { newId } from '../../utils/id.js'
import type { MemberRepository } from '../member/member.repository.js'
import type { Member } from '../member/member.type.js'
import type { VoucherRepository } from './voucher.repository.js'
import type { HistoryRow, LedgerEntry, UsageRecord } from './voucher.type.js'

export interface VoucherService {
  grant(input: { memberId: string; amount: number; expiresOn: string; memo: string }): LedgerEntry
  balance(memberId: string): { balance: number; expiresOn: string | null }
  createUsage(merchant: string, request: UsageCreateRequest): UsageRecord // 같은 주문 번호면 처음 건을 돌려줌
  cancelUsage(merchant: string, approvalNo: string, reason: string): UsageRecord // 같은 건에 두 번 와도 한 번만 복원
  listUsages(merchant: string, query: UsageListQuery): UsageRecord[]
  history(): HistoryRow[] // 최신 순
}

export function createVoucherService(dependencies: { vouchers: VoucherRepository; members: MemberRepository; now?: () => Date }): VoucherService {
  const { vouchers, members, now = () => new Date() } = dependencies

  return {
    grant({ memberId, amount, expiresOn, memo }) {
      getMember(memberId)
      validateGrantAmount(amount)
      // ponytail: 회원별 만료일 하나 (마지막 지급의 만료일로 덮어씀), 지급 건별 만료가 필요하면 지급 건별로 차감해야 함
      vouchers.saveWallet({ memberId, expiresOn })
      return addEntry({ memberId, kind: 'grant', amount, approvalNo: null, memo })
    },

    balance(memberId) {
      getMember(memberId)
      const { balance, expiresOn } = usable(memberId)
      return { balance, expiresOn }
    },

    createUsage(merchant, request) {
      // 응답을 못 받은 가맹점이 같은 주문 번호로 다시 보내면 처음 건을 돌려줌
      const existing = vouchers.findUsageByOrder(merchant, request.merchantOrderId)
      if (existing) {
        validateSameRequest(existing, request)
        return existing
      }
      getMember(request.memberId)
      validateUsable(request.memberId, request.amount)

      const usage: UsageRecord = { ...request, approvalNo: vouchers.nextApprovalNo(), status: 'approved', approvedAt: now().toISOString(), cancelledAt: null, merchant }
      addEntry({ memberId: request.memberId, kind: 'use', amount: -request.amount, approvalNo: usage.approvalNo, memo: `${merchant} 주문 ${request.merchantOrderId}` })
      return saveUsage(usage)
    },

    cancelUsage(merchant, approvalNo, reason) {
      const usage = getMerchantUsage(merchant, approvalNo)
      if (usage.status === 'cancelled') return usage
      addEntry({ memberId: usage.memberId, kind: 'cancel', amount: usage.amount, approvalNo, memo: `${usage.merchant} 주문 ${usage.merchantOrderId} 취소 · ${reason}` })
      return saveUsage({ ...usage, status: 'cancelled', cancelledAt: now().toISOString() })
    },

    listUsages(merchant, { from, to }) {
      return vouchers.usages().filter((usage) => {
        const day = usage.approvedAt.slice(0, 10)
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
  function getMerchantUsage(merchant: string, approvalNo: string): UsageRecord {
    const usage = vouchers.findUsage(approvalNo)
    if (!usage || usage.merchant !== merchant) throw new AppError(ErrorCode.USAGE_NOT_FOUND)
    return usage
  }

  function validateGrantAmount(amount: number): void {
    if (!Number.isInteger(amount) || amount <= 0) throw new AppError(ErrorCode.GRANT_AMOUNT_INVALID)
  }

  function validateSameRequest(existing: UsageRecord, request: UsageCreateRequest): void {
    const same = existing.memberId === request.memberId && existing.amount === request.amount && existing.merchantOrderId === request.merchantOrderId
    if (!same) throw new AppError(ErrorCode.ORDER_REUSED)
  }

  function usable(memberId: string) {
    const { expiresOn } = vouchers.wallet(memberId)
    const sum = vouchers.entries(memberId).reduce((total, entry) => total + entry.amount, 0)
    const expired = expiresOn !== null && now().toISOString().slice(0, 10) > expiresOn
    return { balance: expired ? 0 : sum, sum, expiresOn, expired }
  }

  function validateUsable(memberId: string, amount: number): void {
    const { balance, expired } = usable(memberId)
    if (expired) throw new AppError(ErrorCode.VOUCHER_EXPIRED)
    if (balance < amount) throw new AppError(ErrorCode.INSUFFICIENT_BALANCE)
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

  function toHistoryRow(entry: LedgerEntry): HistoryRow {
    const member = members.findById(entry.memberId)
    const usage = entry.approvalNo ? vouchers.findUsage(entry.approvalNo) : undefined
    return {
      entryId: entry.id,
      kind: entry.kind,
      approvalNo: entry.approvalNo,
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
