import { z } from 'zod'

export const likeSchema = z.object({
  likedId: z.string().min(1, 'User ID is required').cuid('Invalid user ID format'),
})

export const passSchema = z.object({
  passedId: z.string().min(1, 'User ID is required').cuid('Invalid user ID format'),
})

export const discoveryQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10).optional(),
  cursor: z.string().optional(),
})

export type LikeInput = z.infer<typeof likeSchema>
export type PassInput = z.infer<typeof passSchema>
export type DiscoveryQueryInput = z.infer<typeof discoveryQuerySchema>
