import { z } from 'zod'

// 기본값은 로컬 시나리오 전용. 포트 5000 은 macOS AirPlay 수신이 써서 5200
const zEnv = z.object({
  PORT: z.coerce.number().int().default(5200),
  PUBLIC_URL: z.string().url().default('http://localhost:5200'), // 제로페이 승인 뒤 돌아올 주소를 만들 때 씀
  ZEROPAY_URL: z.string().url().default('http://localhost:5100'),
  MERCHANT_KEY: z.string().min(1).default('keepay-local-key'),
  ZEROPAY_TIMEOUT_MS: z.coerce.number().int().positive().default(3000),
  ADMIN_ID: z.string().min(1).default('admin1234'),
  ADMIN_PASSWORD: z.string().min(1).default('admin1234'),
})

export const env = zEnv.parse(process.env)
