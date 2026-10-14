import { randomBytes, randomUUID } from 'node:crypto'

export function newId(prefix: string): string {
  return `${prefix}_${randomUUID().replaceAll('-', '').slice(0, 12)}`
}

// 링크로 회원을 넘기는 값이라 추측할 수 없어야 함 (무작위 192비트)
export function newCode(): string {
  return randomBytes(24).toString('base64url')
}
