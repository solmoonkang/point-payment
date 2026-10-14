import { paths } from '@point-payment/contract'
import type { Express } from 'express'
import { adminAuth } from '../../middlewares/adminAuth.js'
import { memberAuth } from '../../middlewares/memberAuth.js'
import { merchantAuth } from '../../middlewares/merchantAuth.js'
import type { Services } from '../../services.js'
import { createMemberController } from './member.controller.js'

export function memberRoutes(app: Express, services: Services): void {
  const memberController = createMemberController(services.member, services.voucher)
  app.post('/api/member/login', memberController.login)
  app.post('/api/member/logout', memberController.logout)
  app.get('/api/member/me', memberAuth, memberController.me)
  app.post('/api/member/link', memberAuth, memberController.link)
  app.post(paths.linkExchange, merchantAuth, memberController.exchange)
  app.get('/api/admin/members', adminAuth, memberController.list)
}
