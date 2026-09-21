import { z } from 'zod'

export const telegramAuthSchema = z.object({
  initData: z.string().min(1, 'Init data is required'),
})

export const createSessionSchema = z.object({
  userId: z.string().cuid(),
  telegramId: z.string().min(1),
})

export const sessionSchema = z.object({
  userId: z.string().cuid(),
  telegramId: z.string(),
  expiresAt: z.date(),
})

export type TelegramAuthInput = z.infer<typeof telegramAuthSchema>
export type CreateSessionInput = z.infer<typeof createSessionSchema>
export type SessionData = z.infer<typeof sessionSchema>
