import type { Usage } from '@point-payment/contract'

// 내역은 쌓기만 하고 고치거나 지우지 않음, 잔액은 내역의 합계
// 되돌릴 때는 반대 금액의 줄을 새로 더함 (언제 · 왜 잔액이 바뀌었는지 끝까지 남기려고)
export interface LedgerEntry {
  id: string
  memberId: string
  kind: 'grant' | 'use' | 'cancel' // 지급 · 사용 · 사용 취소
  amount: number // 지급 · 사용 취소는 +, 사용은 -
  balanceAfter: number // 화면에 바로 보여 주려고 더한 뒤 잔액을 함께 남김
  usageId: string | null
  memo: string
  at: string
}

export interface Wallet {
  memberId: string
  expiresOn: string | null // YYYY-MM-DD, 지급 전이면 null
}

export interface UsageRecord extends Usage {
  merchant: string
  returnUrl: string
}

export interface ApprovalView {
  usageId: string
  merchant: string
  amount: number
  balance: number
  status: Usage['status']
  rejectReason: Usage['rejectReason']
  memberName: string
  returnUrl: string
}

export interface HistoryRow {
  entryId: string
  kind: LedgerEntry['kind']
  approvalNo: string | null
  memberName: string
  phone: string
  merchant: string | null
  merchantOrderId: string | null
  amount: number
  balanceAfter: number
  at: string
}
