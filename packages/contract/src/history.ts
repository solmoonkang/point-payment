import { z } from 'zod'
import { zUsage } from './usage.js'

const zDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/)

// 기간은 사용 건을 만든 날 기준
export const zUsageListQuery = z.object({
  from: zDate.optional(),
  to: zDate.optional(),
})

export const zUsageListResponse = z.object({
  usages: z.array(zUsage),
})

export type UsageListQuery = z.infer<typeof zUsageListQuery>
export type UsageListResponse = z.infer<typeof zUsageListResponse>
