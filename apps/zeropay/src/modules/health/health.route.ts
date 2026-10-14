import type { Express } from 'express'

export function healthRoutes(app: Express): void {
  app.get('/api/health', (_request, response) => {
    response.json({ ok: true, service: 'zeropay' })
  })
}
