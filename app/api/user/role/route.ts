import { NextRequest, NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'

export async function GET(request: NextRequest) {
  try {
    const session = await getSession()
    
    if (!session) {
      return NextResponse.json({ isAdmin: false })
    }
    
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      select: { role: true },
    })
    
    if (!user) {
      return NextResponse.json({ isAdmin: false })
    }
    
    const isAdmin = user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN
    
    return NextResponse.json({ isAdmin, role: user.role })
  } catch (error) {
    return NextResponse.json({ isAdmin: false })
  }
}
