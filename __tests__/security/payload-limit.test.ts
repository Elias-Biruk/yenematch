import { enforcePayloadLimit } from '@/lib/utils/payload-limit'
import { ValidationError } from '@/lib/utils/errors'

describe('Payload Limit Security', () => {
  it('should accept requests within size limit', () => {
    const request = new Request('http://example.com', {
      headers: { 'content-length': '512000' }, // 500KB
    })

    expect(() => enforcePayloadLimit(request)).not.toThrow()
  })

  it('should reject requests exceeding size limit', () => {
    const request = new Request('http://example.com', {
      headers: { 'content-length': '2097152' }, // 2MB
    })

    expect(() => enforcePayloadLimit(request)).toThrow(ValidationError)
    expect(() => enforcePayloadLimit(request)).toThrow('Request body too large')
  })

  it('should accept requests without content-length header', () => {
    const request = new Request('http://example.com')

    expect(() => enforcePayloadLimit(request)).not.toThrow()
  })

  it('should enforce custom size limit', () => {
    const request = new Request('http://example.com', {
      headers: { 'content-length': '3000000' }, // 3MB
    })

    expect(() => enforcePayloadLimit(request, 6 * 1024 * 1024)).not.toThrow() // 6MB limit
  })
})
