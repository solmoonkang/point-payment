import type { PgClient } from '../../infrastructure/pg/index.js'
import { ErrorCode } from '../../utils/error-code.js'
import { AppError } from '../../utils/error.js'
import type { MemberService } from '../member/member.service.js'
import type { OrderService } from '../order/order.service.js'
import type { Order } from '../order/order.type.js'
import type { DevSettings, SubscriberRow } from './admin.type.js'

export interface AdminService {
  login(adminId: string, password: string): void
  subscribers(): SubscriberRow[]
  cancel(orderId: number): Promise<Order>
  devSettings(): DevSettings
  updateDevSettings(patch: Partial<DevSettings>): DevSettings
}

// 가입자 리스트에 올리는 주문: 가입을 마쳤거나, 가입 뒤 취소했거나, 되돌리기가 남은 것
const LISTED = new Set<Order['status']>(['paid', 'cancelled', 'cancel_failed'])

export function createAdminService(dependencies: { adminId: string; adminPassword: string; order: OrderService; member: MemberService; pg: PgClient }): AdminService {
  const { order, member, pg } = dependencies

  return {
    login(adminId, password) {
      validateAccount(adminId, password)
    },

    subscribers: () =>
      order
        .list()
        .filter((item) => LISTED.has(item.status))
        .map(toSubscriberRow),

    cancel: (orderId) => order.cancel(orderId),

    devSettings: () => ({ pgFailNext: pg.failNext() }),

    updateDevSettings(patch) {
      if (patch.pgFailNext !== undefined) pg.setFailNext(patch.pgFailNext)
      return { pgFailNext: pg.failNext() }
    },
  }

  function validateAccount(adminId: string, password: string): void {
    if (adminId !== dependencies.adminId || password !== dependencies.adminPassword) throw new AppError(ErrorCode.LOGIN_FAILED)
  }

  function toSubscriberRow(item: Order): SubscriberRow {
    const subscriber = member.get(item.memberId)
    return {
      orderId: item.id,
      productName: item.productId === 'sports' ? `${item.productName} · ${item.planName}` : item.productName,
      name: subscriber.name,
      phone: subscriber.phone,
      emergencyPhone: null,
      address: null,
      email: subscriber.email,
      promotionCode: null,
      ip: item.ip,
      joinedAt: item.paidAt ?? item.createdAt,
      payMethod: payMethodOf(item),
      method: item.method,
      status: item.status,
      price: item.price,
      pointAmount: item.pointAmount,
      pgAmount: item.pgAmount,
      approvalNo: item.approvalNo,
      failReason: item.failReason,
    }
  }
}

function payMethodOf(item: Order): SubscriberRow['payMethod'] {
  if (item.pointAmount > 0 && item.pgAmount > 0) return '포인트+카드'
  return item.pointAmount > 0 ? '포인트' : '카드'
}
