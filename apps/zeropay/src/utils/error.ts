import type { ApiErrorCode } from '@point-payment/contract'
import type { ErrorEntry } from './error-code.js'

export class AppError extends Error {
  readonly status: ApiErrorCode

  constructor(entry: ErrorEntry, detail?: string) {
    super(detail ? `${entry.message}: ${detail}` : entry.message)
    this.name = entry.name
    this.status = entry.status
  }
}
