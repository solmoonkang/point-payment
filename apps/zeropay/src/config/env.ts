import { z } from 'zod'

// 기본값은 로컬 시나리오 전용
const zEnv = z.object({
  PORT: z.coerce.number().int().default(5100),
  PUBLIC_URL: z.string().url().default('http://localhost:5100'), // 결제 승인 화면 주소를 만들 때 씀
  KEEPAY_URL: z.string().url().default('http://localhost:5200'), // 「킵페이에서 가입하기」 링크가 향하는 곳
  MERCHANT_KEY: z.string().min(1).default('keepay-local-key'),
  MERCHANT_NAME: z.string().min(1).default('킵페이'),
  ADMIN_ID: z.string().min(1).default('admin1234'),
  ADMIN_PASSWORD: z.string().min(1).default('admin1234'),
})

export const env = zEnv.parse(process.env)
