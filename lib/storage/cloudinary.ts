import { v2 as cloudinary } from 'cloudinary'
import { fileTypeFromBuffer } from 'file-type'

if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
  console.warn('Cloudinary credentials not configured. Photo upload will not work.')
}

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export { cloudinary }

export interface UploadResult {
  publicId: string
  url: string
  secureUrl: string
  width: number
  height: number
  format: string
  bytes: number
}

export async function uploadPhoto(
  file: File,
  folder: string = 'yene-match/profiles'
): Promise<UploadResult> {
  const allowedFormats = ['jpg', 'jpeg', 'png', 'webp']
  const maxSize = 5 * 1024 * 1024 // 5MB

  // Validate file size
  if (file.size > maxSize) {
    throw new Error('File size exceeds 5MB limit')
  }

  // Validate file type using magic bytes (file signature)
  const arrayBuffer = await file.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const fileType = await fileTypeFromBuffer(buffer)

  if (!fileType) {
    throw new Error('Unable to determine file type. Only JPEG, PNG, and WebP are allowed')
  }

  const detectedExtension = fileType.ext
  if (!allowedFormats.includes(detectedExtension)) {
    throw new Error(`Invalid file type: ${detectedExtension}. Only JPEG, PNG, and WebP are allowed`)
  }

  // Validate that extension matches detected type
  const fileExtension = file.name.split('.').pop()?.toLowerCase()
  if (fileExtension && !allowedFormats.includes(fileExtension)) {
    throw new Error(`Invalid file extension: ${fileExtension}. Only JPEG, PNG, and WebP are allowed`)
  }

  const uploadResult = await cloudinary.uploader.upload(
    `data:image/${detectedExtension};base64,${buffer.toString('base64')}`,
    {
      folder,
      resource_type: 'image',
      allowed_formats: allowedFormats,
      transformation: [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
      ],
    }
  )

  return {
    publicId: uploadResult.public_id,
    url: uploadResult.url,
    secureUrl: uploadResult.secure_url,
    width: uploadResult.width,
    height: uploadResult.height,
    format: uploadResult.format,
    bytes: uploadResult.bytes,
  }
}

export async function deletePhoto(publicId: string): Promise<void> {
  await cloudinary.uploader.destroy(publicId)
}
