import type { Express } from 'express'
import { adminAuth } from '../../middlewares/adminAuth.js'
import type { Services } from '../../services.js'
import { createAdminController } from './admin.controller.js'

export function adminRoutes(app: Express, services: Services): void {
  const adminController = createAdminController(services.admin)
  app.post('/api/admin/login', adminController.login)
  app.post('/api/admin/logout', adminController.logout)
  app.get('/api/admin/me', adminController.me)
  app.get('/api/admin/settings', adminAuth, adminController.getSettings)
  app.post('/api/admin/settings', adminAuth, adminController.updateSettings)
}
