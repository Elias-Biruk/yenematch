import { NextRequest, NextResponse } from 'next/server'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError, ValidationError } from '@/lib/utils/errors'
import { prisma } from '@/lib/db/prisma'

export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request)

    const body = await request.json()
    const { confirmation } = body

    // Require explicit confirmation
    if (confirmation !== 'DELETE') {
      throw new ValidationError('Please type DELETE to confirm account deletion')
    }

    const userId = session.userId

    // Phase 1: Identify all user's photos and their Cloudinary public IDs
    const photos = await prisma.photo.findMany({
      where: {
        profile: { userId },
      },
      select: {
        id: true,
        cloudinaryPublicId: true,
        url: true,
      },
    })

    // Phase 2: Perform database deletion transaction
    await prisma.$transaction(async (tx) => {
      // Delete user's likes
      await tx.like.deleteMany({
        where: { OR: [{ likerId: userId }, { likedId: userId }] },
      })

      // Delete user's passes
      await tx.pass.deleteMany({
        where: { OR: [{ passerId: userId }, { passedId: userId }] },
      })

      // Delete user's blocks
      await tx.block.deleteMany({
        where: { OR: [{ blockerId: userId }, { blockedId: userId }] },
      })

      // Delete user's messages
      await tx.message.deleteMany({
        where: { OR: [{ senderId: userId }, { receiverId: userId }] },
      })

      // Delete user's matches (this will cascade delete messages too, but we already did it)
      await tx.match.deleteMany({
        where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      })

      // Delete user's interests (will cascade with profile)
      await tx.interest.deleteMany({
        where: { profile: { userId } },
      })

      // Delete user's preferences (will cascade with profile)
      await tx.preference.deleteMany({
        where: { profile: { userId } },
      })

      // Delete user's photos (will cascade with profile)
      await tx.photo.deleteMany({
        where: { profile: { userId } },
      })

      // Delete user's profile
      await tx.profile.deleteMany({
        where: { userId },
      })

      // Delete user's sent reports (preserve received reports for evidence)
      await tx.report.deleteMany({
        where: { reporterId: userId },
      })

      // Delete the user
      await tx.user.delete({
        where: { id: userId },
      })
    })

    // Phase 3: Delete Cloudinary assets after successful database operation
    const { deletePhoto } = await import('@/lib/storage/cloudinary')
    const failedDeletions: Array<{ photoId: string; publicId: string; url: string }> = []

    for (const photo of photos) {
      const publicId = photo.cloudinaryPublicId || photo.url.split('/').pop()?.split('.')[0]
      if (publicId) {
        try {
          await deletePhoto(publicId)
        } catch (error) {
          console.error('Failed to delete photo from Cloudinary:', publicId, error)
          // Track failed deletions for cleanup
          failedDeletions.push({
            photoId: photo.id,
            publicId,
            url: photo.url,
          })
        }
      }
    }

    // Log failed deletions for manual cleanup
    if (failedDeletions.length > 0) {
      console.error('Account deletion completed but failed to delete Cloudinary assets:', failedDeletions)
      // In production, this should be sent to a monitoring system
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
