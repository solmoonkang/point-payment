import type { ApiErrorCode } from '@point-payment/contract'

interface ErrorSpec {
  status: ApiErrorCode // 응답의 code (HTTP 상태는 errorHandler 가 정함)
  message: string
}

export const ErrorCode = defineErrors({
  INVALID_INPUT: { status: 'invalid', message: '입력값이 올바르지 않습니다' },
  API_NOT_FOUND: { status: 'not-found', message: '없는 경로입니다' },
  SERVER_ERROR: { status: 'unavailable', message: '서버 오류' },

  MERCHANT_KEY_INVALID: { status: 'unauthorized', message: '가맹점 키가 맞지 않습니다' },
  MEMBER_LOGIN_REQUIRED: { status: 'unauthorized', message: '제로페이 로그인이 필요합니다' },
  ADMIN_LOGIN_REQUIRED: { status: 'unauthorized', message: '운영자 로그인이 필요합니다' },
  LOGIN_FAILED: { status: 'unauthorized', message: '아이디 또는 비밀번호가 맞지 않습니다' },

  MEMBER_NOT_FOUND: { status: 'not-found', message: '없는 회원입니다' },
  LINK_CODE_NOT_FOUND: { status: 'not-found', message: '없는 일회용 값입니다' },
  LINK_CODE_USED: { status: 'expired', message: '이미 쓴 일회용 값입니다' },
  LINK_CODE_EXPIRED: { status: 'expired', message: '시간이 지난 일회용 값입니다' },

  GRANT_AMOUNT_INVALID: { status: 'invalid', message: '지급 금액은 1원 이상 정수입니다' },
  USAGE_NOT_FOUND: { status: 'not-found', message: '없는 사용 건입니다' },
  USAGE_OF_OTHER_MEMBER: { status: 'unauthorized', message: '다른 회원의 결제입니다' },
  REQUEST_ID_REUSED: { status: 'conflict', message: '같은 요청 번호로 다른 내용을 보냈습니다' },
  PAY_PASSWORD_MISMATCH: { status: 'invalid', message: '결제 비밀번호가 맞지 않습니다' },
  CANCEL_FAILURE_FORCED: { status: 'unavailable', message: '오류 상황 설정으로 사용 취소를 실패시켰습니다' },
})

export type ErrorEntry = (typeof ErrorCode)[keyof typeof ErrorCode]

// 표의 키를 각 항목의 name 으로 넣음 (응답의 error 값)
function defineErrors<T extends Record<string, ErrorSpec>>(table: T) {
  return Object.fromEntries(Object.entries(table).map(([name, spec]) => [name, { ...spec, name }])) as { [K in keyof T]: T[K] & { name: K } }
}
