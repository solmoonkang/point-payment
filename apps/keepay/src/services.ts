// 저장소 · 바깥 연동 클라이언트는 여기서만 만들어 서비스에 넣음 (컨트롤러는 서비스만 앎)
import { env } from './config/env.js'
import { createFakePgClient } from './infrastructure/pg/index.js'
import { createHttpZeropayClient } from './infrastructure/zeropay/index.js'
import { createAdminService, type AdminService } from './modules/admin/admin.service.js'
import { createMemoryMemberRepository } from './modules/member/member.repository.js'
import { createMemberService, type MemberService } from './modules/member/member.service.js'
import { createMemoryOrderRepository } from './modules/order/order.repository.js'
import { createOrderService, type OrderService } from './modules/order/order.service.js'
import { createFixedProductRepository } from './modules/product/product.repository.js'
import { createProductService, type ProductService } from './modules/product/product.service.js'

export interface Services {
  product: ProductService
  member: MemberService
  order: OrderService
  admin: AdminService
}

export function createServices(): Services {
  const zeropay = createHttpZeropayClient({ baseUrl: env.ZEROPAY_URL, merchantKey: env.MERCHANT_KEY, timeoutMs: env.ZEROPAY_TIMEOUT_MS })
  // 주문 서비스가 결제하고 운영자 서비스가 실패 설정을 바꾸므로 같은 PG 를 봐야 함
  const pg = createFakePgClient()

  const product = createProductService({ products: createFixedProductRepository() })
  const member = createMemberService({ members: createMemoryMemberRepository(), zeropay })
  const order = createOrderService({ orders: createMemoryOrderRepository(), products: product, zeropay, pg })
  const admin = createAdminService({ adminId: env.ADMIN_ID, adminPassword: env.ADMIN_PASSWORD, order, member, pg })

  return { product, member, order, admin }
}
