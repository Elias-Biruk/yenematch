import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'
import { uploadPhoto, deletePhoto } from '@/lib/storage/cloudinary'
import { prisma } from '@/lib/db/prisma'
import { enforcePayloadLimit } from '@/lib/utils/payload-limit'

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    // Enforce payload limit (6MB for photo uploads)
    enforcePayloadLimit(request, 6 * 1024 * 1024)
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Upload to Cloudinary
    const uploadResult = await uploadPhoto(file)
    
    // Get user's profile
    const profile = await prisma.profile.findUnique({
      where: { userId: session.userId },
      include: { photos: true },
    })

    if (!profile) {
      // Delete the uploaded photo since we can't associate it
      await deletePhoto(uploadResult.publicId)
      throw new Error('Profile not found')
    }

    // Count current photos
    const photoCount = await prisma.photo.count({
      where: { profileId: profile.id },
    })

    const maxPhotos = 6
    if (photoCount >= maxPhotos) {
      await deletePhoto(uploadResult.publicId)
      return NextResponse.json(
        { error: `Maximum ${maxPhotos} photos allowed` },
        { status: 400 }
      )
    }

    // Create photo record
    const order = photoCount
    const isPrimary = photoCount === 0 // First photo is primary

    const photo = await prisma.photo.create({
      data: {
        profileId: profile.id,
        url: uploadResult.secureUrl,
        cloudinaryPublicId: uploadResult.publicId,
        order,
        isPrimary,
      },
    })

    return NextResponse.json({
      id: photo.id,
      url: photo.url,
      isPrimary: photo.isPrimary,
      order: photo.order,
      publicId: uploadResult.publicId,
    }, { status: 201 })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
