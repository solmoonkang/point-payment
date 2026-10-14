// point: 상품권 먼저, 모자라면 PG · card: PG 만
export type PayMethod = 'point' | 'card'

// cancel_failed: 되돌리기 미완료 (다시 취소하면 남은 쪽만 처리)
export type OrderStatus = 'pending' | 'paid' | 'failed' | 'cancelled' | 'cancel_failed'

export interface Order {
  id: number // 가입자 리스트의 #, 제로페이에는 가맹점 주문 번호로 보냄
  requestId: string // 화면이 만든 멱등키 (결제 버튼을 두 번 눌러도 주문 하나)
  memberId: string
  productId: string
  planId: string
  productName: string
  planName: string
  gymName: string | null
  price: number
  pointAmount: number
  pgAmount: number
  method: PayMethod
  status: OrderStatus
  failReason: string | null
  approvalNo: string | null
  pgTxId: string | null
  pointRestored: boolean // 되돌리기를 단계마다 기록해, 중간에 실패해도 남은 쪽만 다시 하려고 둠
  pgCancelled: boolean
  ip: string
  createdAt: string
  paidAt: string | null
  cancelledAt: string | null
}

export interface Quote {
  price: number
  balance: number | null // 제로페이 회원 연결이 없으면 null
  pointAmount: number
  pgAmount: number
}

export interface PayResult {
  order: Order
}
