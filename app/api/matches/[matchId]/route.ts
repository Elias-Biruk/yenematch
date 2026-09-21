import { NextRequest, NextResponse } from 'next/server'
import { getMatch, unmatch } from '@/lib/services/matches.service'
import { requireAuth } from '@/lib/auth/middleware'
import { handleError } from '@/lib/utils/errors'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { matchId } = await params

    const match = await getMatch(matchId, session.userId)

    return NextResponse.json(match)
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ matchId: string }> }
) {
  try {
    const session = await requireAuth(request)
    const { matchId } = await params

    await unmatch(matchId, session.userId)

    return NextResponse.json({ success: true })
  } catch (error) {
    const { message, statusCode } = handleError(error)
    return NextResponse.json(
      { error: message },
      { status: statusCode }
    )
  }
}
