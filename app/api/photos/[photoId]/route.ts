import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError, NotFoundError, AuthorizationError } from '@/lib/utils/errors'
import { deletePhoto } from '@/lib/storage/cloudinary'
import { prisma } from '@/lib/db/prisma'

// GET /api/photos/[photoId] - Not implemented, use profile endpoint
// DELETE /api/photos/[photoId] - Delete a photo
// PATCH /api/photos/[photoId] - Set primary or reorder

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { photoId } = await params

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { profile: true },
    })

    if (!photo) {
      throw new NotFoundError('Photo')
    }

    // Verify ownership
    if (photo.profile.userId !== session.userId) {
      throw new AuthorizationError('You can only delete your own photos')
    }

    // Check if this is the only photo
    const photoCount = await prisma.photo.count({
      where: { profileId: photo.profileId },
    })

    if (photoCount === 1) {
      return NextResponse.json(
        { error: 'Cannot delete the only photo' },
        { status: 400 }
      )
    }

    // If deleting primary photo, set another photo as primary
    if (photo.isPrimary) {
      const nextPhoto = await prisma.photo.findFirst({
        where: {
          profileId: photo.profileId,
          id: { not: photo.id },
        },
        orderBy: { order: 'asc' },
      })

      if (nextPhoto) {
        await prisma.photo.update({
          where: { id: nextPhoto.id },
          data: { isPrimary: true },
        })
      }
    }

    // Delete from Cloudinary using stored public ID
    if (photo.cloudinaryPublicId) {
      try {
        await deletePhoto(photo.cloudinaryPublicId)
      } catch (error) {
        console.error('Failed to delete from Cloudinary:', photo.cloudinaryPublicId, error)
        // Continue with database deletion even if Cloudinary fails
        // Asset will be tracked for cleanup
      }
    }

    // Delete from database
    await prisma.photo.delete({
      where: { id: photoId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ photoId: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { photoId } = await params

    const body = await request.json()
    const { isPrimary, order } = body

    const photo = await prisma.photo.findUnique({
      where: { id: photoId },
      include: { profile: true },
    })

    if (!photo) {
      throw new NotFoundError('Photo')
    }

    // Verify ownership
    if (photo.profile.userId !== session.userId) {
      throw new AuthorizationError('You can only modify your own photos')
    }

    // Set as primary
    if (isPrimary === true) {
      // Remove primary from all other photos
      await prisma.photo.updateMany({
        where: {
          profileId: photo.profileId,
          id: { not: photoId },
        },
        data: { isPrimary: false },
      })

      await prisma.photo.update({
        where: { id: photoId },
        data: { isPrimary: true },
      })
    }

    // Reorder
    if (order !== undefined) {
      await prisma.photo.update({
        where: { id: photoId },
        data: { order },
      })
    }

    // Return updated photo
    const updatedPhoto = await prisma.photo.findUnique({
      where: { id: photoId },
    })

    return NextResponse.json(updatedPhoto)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
