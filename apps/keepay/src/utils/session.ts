import { randomUUID } from 'node:crypto'
import type { Request, Response } from 'express'

export interface SessionStore<T> {
  get(request: Request): T | undefined
  set(request: Request, response: Response, data: T): void // 세션이 있으면 같은 번호에 내용만 바꿈
  end(request: Request, response: Response): void
}

// 쿠키는 포트를 가리지 않아 localhost:5100 · 5200 이 같은 쿠키를 봄 → 앱마다 쿠키 이름을 다르게 써야 함
export function createSessionStore<T>(cookieName: string): SessionStore<T> {
  // ponytail: 메모리 보관이라 서버를 다시 켜면 세션이 사라짐, 서버를 여러 대로 늘리면 공유 저장소로
  const sessions = new Map<string, T>()
  const idOf = (request: Request) => readCookie(request.headers.cookie, cookieName)

  return {
    get(request) {
      const id = idOf(request)
      return id ? sessions.get(id) : undefined
    },
    set(request, response, data) {
      const id = idOf(request) ?? randomUUID()
      sessions.set(id, data)
      response.cookie(cookieName, id, { httpOnly: true, sameSite: 'lax', path: '/' })
    },
    end(request, response) {
      const id = idOf(request)
      if (id) sessions.delete(id)
      response.clearCookie(cookieName, { path: '/' })
    },
  }
}

function readCookie(header: string | undefined, name: string): string | undefined {
  for (const part of (header ?? '').split(';')) {
    const [key, ...rest] = part.trim().split('=')
    if (key === name) return decodeURIComponent(rest.join('='))
  }
  return undefined
}
