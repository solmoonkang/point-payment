import type { ApiErrorCode } from '@point-payment/contract'
import type { ErrorEntry } from './error-code.js'

export class AppError extends Error {
  readonly status: ApiErrorCode
  fields?: Record<string, string> // 입력 칸별 문구 (화면이 칸 아래에 띄움)

  constructor(entry: ErrorEntry, detail?: string) {
    super(detail ? `${entry.message}: ${detail}` : entry.message)
    this.name = entry.name
    this.status = entry.status
  }
}
