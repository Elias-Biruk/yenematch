import { prisma } from '@/lib/db/prisma'
import { ValidationError, NotFoundError } from '@/lib/utils/errors'
import { rateLimit } from '@/lib/utils/rate-limiter'
import { ReportReason } from '@prisma/client'

export async function createReport(
  reporterId: string,
  reportedUserId: string,
  reason: ReportReason,
  description?: string
) {
  // Prevent self-report
  if (reporterId === reportedUserId) {
    throw new ValidationError('You cannot report yourself')
  }

  // Rate limit: 3 reports per hour
  rateLimit(`reports:${reporterId}`, 3, 3600000)

  // Check if reported user exists
  const reportedUser = await prisma.user.findUnique({
    where: { id: reportedUserId },
  })

  if (!reportedUser) {
    throw new NotFoundError('User')
  }

  // Check for duplicate report from same reporter to same user in last 24 hours
  const existingReport = await prisma.report.findFirst({
    where: {
      reporterId,
      reportedId: reportedUserId,
      createdAt: {
        gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24 hours ago
      },
    },
  })

  if (existingReport) {
    throw new ValidationError('You have already reported this user in the last 24 hours')
  }

  // Create the report
  const report = await prisma.report.create({
    data: {
      reporterId,
      reportedId: reportedUserId,
      reason,
      description: description?.trim() || null,
    },
  })

  return report
}
