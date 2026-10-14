import { paths } from '@point-payment/contract'
import type { Express } from 'express'
import { env } from '../../config/env.js'
import { adminAuth } from '../../middlewares/adminAuth.js'
import { memberAuth } from '../../middlewares/memberAuth.js'
import { merchantAuth } from '../../middlewares/merchantAuth.js'
import type { Services } from '../../services.js'
import { createMemberController } from './member.controller.js'

export function memberRoutes(app: Express, services: Services): void {
  const memberController = createMemberController(services.member, services.voucher, env.KEEPAY_URL)
  app.post('/api/member/login', memberController.login)
  app.post('/api/member/logout', memberController.logout)
  app.get('/api/member/me', memberAuth, memberController.me)
  app.post(paths.memberVerify, merchantAuth, memberController.verify)
  app.get('/api/admin/members', adminAuth, memberController.list)
}
