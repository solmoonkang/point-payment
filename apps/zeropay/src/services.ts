// 저장소는 여기서만 만들어 서비스에 넣음 (컨트롤러는 서비스만 앎)
import { env } from './config/env.js'
import { createAdminService, type AdminService } from './modules/admin/admin.service.js'
import { createMemoryMemberRepository } from './modules/member/member.repository.js'
import { createMemberService, type MemberService } from './modules/member/member.service.js'
import { createMemoryVoucherRepository } from './modules/voucher/voucher.repository.js'
import { createVoucherService, type VoucherService } from './modules/voucher/voucher.service.js'

export interface Services {
  member: MemberService
  voucher: VoucherService
  admin: AdminService
}

export function createServices(): Services {
  // 상품권 서비스가 회원 이름 · 결제 비밀번호를 확인하므로 회원 서비스와 같은 저장소를 봐야 함
  const members = createMemoryMemberRepository()

  return {
    member: createMemberService({ members }),
    voucher: createVoucherService({ vouchers: createMemoryVoucherRepository(), members }),
    admin: createAdminService({ adminId: env.ADMIN_ID, adminPassword: env.ADMIN_PASSWORD }),
  }
}
