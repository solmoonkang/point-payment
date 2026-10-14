import { paths } from '@point-payment/contract'
import type { Express } from 'express'
import { adminAuth } from '../../middlewares/adminAuth.js'
import { merchantAuth } from '../../middlewares/merchantAuth.js'
import type { Services } from '../../services.js'
import { createVoucherController } from './voucher.controller.js'

export function voucherRoutes(app: Express, services: Services): void {
  const voucherController = createVoucherController(services.voucher, services.admin)

  app.get(paths.balance, merchantAuth, voucherController.balance)
  app.post(paths.usages, merchantAuth, voucherController.createUsage)
  app.get(paths.usages, merchantAuth, voucherController.listUsages)
  app.post(paths.usageCancel, merchantAuth, voucherController.cancelUsage)

  app.get('/api/admin/vouchers', adminAuth, voucherController.history)
  app.post('/api/admin/vouchers/grant', adminAuth, voucherController.grant)
}
