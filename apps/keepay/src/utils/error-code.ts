import type { ApiErrorCode } from '@point-payment/contract'

interface ErrorSpec {
  status: ApiErrorCode // 응답의 code (HTTP 상태는 errorHandler 가 정함)
  message: string
}

export const ErrorCode = defineErrors({
  INVALID_INPUT: { status: 'invalid', message: '입력값이 올바르지 않습니다' },
  API_NOT_FOUND: { status: 'not-found', message: '없는 경로입니다' },
  SERVER_ERROR: { status: 'unavailable', message: '서버 오류' },

  VISITOR_NOT_SIGNED_UP: { status: 'unauthorized', message: '고객정보를 먼저 입력해 주세요' },
  ADMIN_LOGIN_REQUIRED: { status: 'unauthorized', message: '운영자 로그인이 필요합니다' },
  LOGIN_FAILED: { status: 'unauthorized', message: '아이디 또는 비밀번호가 맞지 않습니다' },

  PRODUCT_NOT_FOUND: { status: 'not-found', message: '없는 상품입니다' },
  PLAN_NOT_FOUND: { status: 'not-found', message: '없는 플랜입니다' },
  GYM_NOT_FOUND: { status: 'not-found', message: '없는 헬스장입니다' },
  MEMBER_NOT_FOUND: { status: 'not-found', message: '없는 회원입니다' },
  REQUIRED_TERMS_NOT_AGREED: { status: 'invalid', message: '필수 약관에 동의해 주세요' },

  ORDER_NOT_FOUND: { status: 'not-found', message: '없는 주문입니다' },
  REQUEST_ID_REUSED: { status: 'conflict', message: '같은 요청 번호로 다른 결제를 보냈습니다' },
  GYM_REQUIRED: { status: 'invalid', message: '헬스장을 선택해 주세요' },
  ZEROPAY_NOT_LINKED: { status: 'invalid', message: '제로페이 회원 연결이 없어 포인트로 결제할 수 없습니다' },
  ORDER_NOT_CANCELLABLE: { status: 'conflict', message: '가입 완료 · 취소 미완료 주문만 취소할 수 있습니다' },

  ZEROPAY_UNAVAILABLE: { status: 'unavailable', message: '제로페이에 일시적으로 연결할 수 없습니다' },
  ZEROPAY_REJECTED: { status: 'invalid', message: '제로페이가 요청을 거절했습니다' },
})

export type ErrorEntry = (typeof ErrorCode)[keyof typeof ErrorCode]

// 표의 키를 각 항목의 name 으로 넣음 (응답의 error 값)
function defineErrors<T extends Record<string, ErrorSpec>>(table: T) {
  return Object.fromEntries(Object.entries(table).map(([name, spec]) => [name, { ...spec, name }])) as { [K in keyof T]: T[K] & { name: K } }
}
