import { z } from 'zod'

export const reportReasonEnum = z.enum([
  'FAKE_PROFILE',
  'HARASSMENT',
  'SPAM_SCAM',
  'SEXUAL_CONTENT',
  'HATE_OR_DISCRIMINATION',
  'UNDERAGE_CONCERN',
  'OTHER',
])

export const createReportSchema = z.object({
  reportedUserId: z.string().min(1),
  reason: reportReasonEnum,
  description: z.string().max(500).trim().optional(),
})

export type CreateReportInput = z.infer<typeof createReportSchema>
