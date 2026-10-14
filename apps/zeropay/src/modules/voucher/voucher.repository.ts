import type { LedgerEntry, UsageRecord, Wallet } from './voucher.type.js'

export interface VoucherRepository {
  addEntry(entry: LedgerEntry): void // 고치기 · 지우기는 두지 않음
  entries(memberId?: string): LedgerEntry[] // 오래된 순
  wallet(memberId: string): Wallet
  saveWallet(wallet: Wallet): void
  saveUsage(usage: UsageRecord): void
  findUsage(approvalNo: string): UsageRecord | undefined
  findUsageByOrder(merchant: string, merchantOrderId: string): UsageRecord | undefined
  usages(): UsageRecord[]
  nextApprovalNo(): string
}

export function createMemoryVoucherRepository(): VoucherRepository {
  // ponytail: 메모리 보관이라 서버를 다시 켜면 처음 상태로, 오래 남겨야 하면 파일 · DB 로
  const ledger: LedgerEntry[] = []
  const wallets = new Map<string, Wallet>()
  const usages = new Map<string, UsageRecord>()
  let approvalSeq = 1000

  return {
    addEntry: (entry) => void ledger.push({ ...entry }),
    entries: (memberId) => ledger.filter((entry) => !memberId || entry.memberId === memberId).map((entry) => ({ ...entry })),
    wallet: (memberId) => ({ ...(wallets.get(memberId) ?? { memberId, expiresOn: null }) }),
    saveWallet: (wallet) => void wallets.set(wallet.memberId, { ...wallet }),
    saveUsage: (usage) => void usages.set(usage.approvalNo, { ...usage }),
    findUsage: (approvalNo) => {
      const usage = usages.get(approvalNo)
      return usage && { ...usage }
    },
    findUsageByOrder: (merchant, merchantOrderId) => {
      const usage = [...usages.values()].find((item) => item.merchant === merchant && item.merchantOrderId === merchantOrderId)
      return usage && { ...usage }
    },
    usages: () => [...usages.values()].map((usage) => ({ ...usage })),
    nextApprovalNo: () => `A-${++approvalSeq}`,
  }
}
