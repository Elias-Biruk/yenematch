import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'

export default async function HomePage() {
  const session = await getSession()
  
  if (session) {
    // Check if user has completed onboarding
    const { prisma } = await import('@/lib/db/prisma')
    const user = await prisma.user.findUnique({
      where: { id: session.userId },
      include: { profile: true },
    })
    
    if (!user?.profile) {
      redirect('/onboarding')
    }
    
    redirect('/discover')
  }
  
  redirect('/login')
}
