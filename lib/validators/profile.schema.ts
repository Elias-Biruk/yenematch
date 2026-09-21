import { z } from 'zod'
import { MIN_AGE, MAX_AGE, MAX_BIO_LENGTH, PHOTOS_LIMIT, INTERESTS_LIMIT } from '@/lib/constants'

export const ageConfirmationSchema = z.object({
  confirmed: z.boolean().refine((val) => val === true, {
    message: 'You must confirm you are 18 or older',
  }),
})

export const basicInfoSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).trim(),
  lastName: z.string().min(1, 'Last name is required').max(50).trim(),
  age: z.number().int().min(MIN_AGE).max(MAX_AGE),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  city: z.string().min(1, 'City is required').max(100).trim(),
})

export const preferencesSchema = z.object({
  preferredGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  minAge: z.number().int().min(MIN_AGE).max(MAX_AGE).default(MIN_AGE),
  maxAge: z.number().int().min(MIN_AGE).max(MAX_AGE).default(MAX_AGE),
  preferredCity: z.string().max(100).trim().optional(),
  relationshipIntention: z.enum([
    'SERIOUS_RELATIONSHIP',
    'MARRIAGE',
    'LONG_TERM',
    'DATING',
    'CASUAL_DATING',
    'FRIENDSHIP_FIRST',
    'NOT_SURE',
  ]).optional(),
  openToLongDistance: z.boolean().default(false),
  smoking: z.enum(['NEVER', 'OCCASIONALLY', 'REGULARLY', 'DOESNT_MATTER']).optional(),
  drinking: z.enum(['NEVER', 'OCCASIONALLY', 'REGULARLY', 'DOESNT_MATTER']).optional(),
  childrenPreference: z.enum([
    'HAS_CHILDREN',
    'NO_CHILDREN',
    'WANTS_CHILDREN',
    'DOESNT_WANT_CHILDREN',
    'MAYBE_SOMEDAY',
    'NOT_SURE',
  ]).optional(),
  languages: z.array(z.string().min(1).max(50).trim()).max(10).optional(),
}).refine((data) => data.minAge <= data.maxAge, {
  message: 'Minimum age must be less than or equal to maximum age',
})

export const photoSchema = z.object({
  url: z.string().url('Invalid photo URL'),
  order: z.number().int().min(0),
  isPrimary: z.boolean().default(false),
})

export const createProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim(),
  lastName: z.string().min(1).max(50).trim(),
  age: z.number().int().min(MIN_AGE).max(MAX_AGE),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']),
  city: z.string().min(1).max(100).trim(),
  bio: z.string().max(MAX_BIO_LENGTH).trim().optional(),
  interests: z.array(z.string().min(1).max(50).trim()).max(INTERESTS_LIMIT).optional(),
  photos: z.array(photoSchema).max(PHOTOS_LIMIT).optional(),
  preferredGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  minAge: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
  maxAge: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
  preferredCity: z.string().max(100).trim().optional(),
  relationshipIntention: z.enum([
    'SERIOUS_RELATIONSHIP',
    'MARRIAGE',
    'LONG_TERM',
    'DATING',
    'CASUAL_DATING',
    'FRIENDSHIP_FIRST',
    'NOT_SURE',
  ]).optional(),
  openToLongDistance: z.boolean().optional(),
  smoking: z.enum(['NEVER', 'OCCASIONALLY', 'REGULARLY', 'DOESNT_MATTER']).optional(),
  drinking: z.enum(['NEVER', 'OCCASIONALLY', 'REGULARLY', 'DOESNT_MATTER']).optional(),
  childrenPreference: z.enum([
    'HAS_CHILDREN',
    'NO_CHILDREN',
    'WANTS_CHILDREN',
    'DOESNT_WANT_CHILDREN',
    'MAYBE_SOMEDAY',
    'NOT_SURE',
  ]).optional(),
  languages: z.array(z.string().min(1).max(50).trim()).max(10).optional(),
}).refine((data) => {
  if (data.minAge && data.maxAge) {
    return data.minAge <= data.maxAge
  }
  return true
}, {
  message: 'Minimum age must be less than or equal to maximum age',
})

export const updateProfileSchema = z.object({
  firstName: z.string().min(1).max(50).trim().optional(),
  lastName: z.string().min(1).max(50).trim().optional(),
  age: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  city: z.string().min(1).max(100).trim().optional(),
  bio: z.string().max(MAX_BIO_LENGTH).trim().optional(),
  interests: z.array(z.string().min(1).max(50).trim()).max(INTERESTS_LIMIT).optional(),
  photos: z.array(photoSchema).max(PHOTOS_LIMIT).optional(),
  preferredGender: z.enum(['MALE', 'FEMALE', 'OTHER']).optional(),
  minAge: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
  maxAge: z.number().int().min(MIN_AGE).max(MAX_AGE).optional(),
  preferredCity: z.string().max(100).trim().optional(),
  relationshipIntention: z.enum([
    'SERIOUS_RELATIONSHIP',
    'MARRIAGE',
    'LONG_TERM',
    'DATING',
    'CASUAL_DATING',
    'FRIENDSHIP_FIRST',
    'NOT_SURE',
  ]).optional(),
  openToLongDistance: z.boolean().optional(),
  smoking: z.enum(['NEVER', 'OCCASIONALLY', 'REGULARLY', 'DOESNT_MATTER']).optional(),
  drinking: z.enum(['NEVER', 'OCCASIONALLY', 'REGULARLY', 'DOESNT_MATTER']).optional(),
  childrenPreference: z.enum([
    'HAS_CHILDREN',
    'NO_CHILDREN',
    'WANTS_CHILDREN',
    'DOESNT_WANT_CHILDREN',
    'MAYBE_SOMEDAY',
    'NOT_SURE',
  ]).optional(),
  languages: z.array(z.string().min(1).max(50).trim()).max(10).optional(),
}).refine((data) => {
  if (data.minAge && data.maxAge) {
    return data.minAge <= data.maxAge
  }
  return true
}, {
  message: 'Minimum age must be less than or equal to maximum age',
})

export type AgeConfirmationInput = z.infer<typeof ageConfirmationSchema>
export type BasicInfoInput = z.infer<typeof basicInfoSchema>
export type PreferencesInput = z.infer<typeof preferencesSchema>
export type CreateProfileInput = z.infer<typeof createProfileSchema>
export type UpdateProfileInput = z.infer<typeof updateProfileSchema>
