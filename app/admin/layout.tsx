import { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db/prisma'
import { UserRole } from '@prisma/client'
import AdminLayoutClient from './admin-layout-client'

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const session = await getSession()
  
  if (!session) {
    redirect('/login')
  }
  
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { role: true },
  })
  
  if (!user || (user.role !== UserRole.ADMIN && user.role !== UserRole.SUPER_ADMIN)) {
    redirect('/')
  }

  return <AdminLayoutClient>{children}</AdminLayoutClient>
}
