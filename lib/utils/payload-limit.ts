import { ValidationError } from './errors'

const MAX_PAYLOAD_SIZE = 1024 * 1024 // 1MB

export function enforcePayloadLimit(request: Request, limit: number = MAX_PAYLOAD_SIZE) {
  const contentLength = request.headers.get('content-length')

  if (contentLength) {
    const size = parseInt(contentLength, 10)
    if (size > limit) {
      throw new ValidationError(`Request body too large. Maximum size is ${limit / 1024 / 1024}MB`)
    }
  }
}
