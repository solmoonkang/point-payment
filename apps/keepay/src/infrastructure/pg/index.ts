import { randomUUID } from 'node:crypto'

export type ChargeResult = { ok: true; txId: string } | { ok: false; reason: string }

export interface PgClient {
  charge(input: { orderId: number; amount: number }): Promise<ChargeResult>
  cancel(txId: string): Promise<void>
  failNext(): boolean
  setFailNext(value: boolean): void // 다음 결제 한 번을 실패시킴 (/admin/dev)
}

// ponytail: 실제 PG 연동 없음 (항상 성공), PG 가 정해지면 같은 인터페이스로 실제 클라이언트를 만듦
export function createFakePgClient(): PgClient {
  let failNextCharge = false

  return {
    async charge({ amount }) {
      if (failNextCharge) {
        failNextCharge = false
        return { ok: false, reason: '카드 승인 거절 (개발용 설정)' }
      }
      return { ok: true, txId: `pg_${randomUUID().slice(0, 8)}_${amount}` }
    },
    async cancel() {},
    failNext: () => failNextCharge,
    setFailNext: (value) => void (failNextCharge = value),
  }
}
