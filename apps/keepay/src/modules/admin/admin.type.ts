import type { OrderStatus, PayMethod } from '../order/order.type.js'

// orderId ~ joinedAt 은 예시 7 의 칸 그대로, 그 뒤는 행을 눌렀을 때 보이는 값
// 비상 연락처 · 주소 · 프로모션 코드는 가입 화면에서 받지 않아 null
export interface SubscriberRow {
  orderId: number
  productName: string
  name: string
  phone: string
  emergencyPhone: string | null
  address: string | null
  email: string
  promotionCode: string | null
  ip: string
  joinedAt: string
  payMethod: '포인트' | '카드' | '포인트+카드' // 예시 7 의 「결제 수단」 검색 조건
  method: PayMethod
  status: OrderStatus
  price: number
  pointAmount: number
  pgAmount: number
  approvalNo: string | null
  failReason: string | null
}

export interface DevSettings {
  pgFailNext: boolean
}
