import { basicInfoSchema, preferencesSchema, updateProfileSchema } from '@/lib/validators/profile.schema'
import { createReportSchema } from '@/lib/validators/report.schema'

describe('Input Trimming Security', () => {
  it('should trim whitespace from firstName', () => {
    const result = basicInfoSchema.parse({
      firstName: '  John  ',
      lastName: 'Doe',
      age: 25,
      gender: 'MALE',
      city: 'Addis Ababa',
    })

    expect(result.firstName).toBe('John')
  })

  it('should trim whitespace from lastName', () => {
    const result = basicInfoSchema.parse({
      firstName: 'John',
      lastName: '  Doe  ',
      age: 25,
      gender: 'MALE',
      city: 'Addis Ababa',
    })

    expect(result.lastName).toBe('Doe')
  })

  it('should trim whitespace from city', () => {
    const result = basicInfoSchema.parse({
      firstName: 'John',
      lastName: 'Doe',
      age: 25,
      gender: 'MALE',
      city: '  Addis Ababa  ',
    })

    expect(result.city).toBe('Addis Ababa')
  })

  it('should trim whitespace from bio', () => {
    const result = updateProfileSchema.parse({
      bio: '  This is my bio  ',
    })

    expect(result.bio).toBe('This is my bio')
  })

  it('should trim whitespace from interests', () => {
    const result = updateProfileSchema.parse({
      interests: ['  Music  ', '  Sports  '],
    })

    expect(result.interests).toEqual(['Music', 'Sports'])
  })

  it('should trim whitespace from report description', () => {
    const result = createReportSchema.parse({
      reportedUserId: 'user123',
      reason: 'HARASSMENT',
      description: '  This is a report  ',
    })

    expect(result.description).toBe('This is a report')
  })

  it('should trim whitespace from preferredCity', () => {
    const result = preferencesSchema.parse({
      preferredCity: '  Addis Ababa  ',
    })

    expect(result.preferredCity).toBe('Addis Ababa')
  })

  it('should trim whitespace from languages', () => {
    const result = preferencesSchema.parse({
      languages: ['  Amharic  ', '  English  '],
    })

    expect(result.languages).toEqual(['Amharic', 'English'])
  })
})
