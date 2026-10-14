import type { Express } from 'express'
import type { Services } from '../../services.js'
import { createMemberController } from './member.controller.js'

export function memberRoutes(app: Express, services: Services): void {
  const memberController = createMemberController(services.member)
  app.get('/api/session', memberController.session)
  app.post('/api/members', memberController.signUp)
}
