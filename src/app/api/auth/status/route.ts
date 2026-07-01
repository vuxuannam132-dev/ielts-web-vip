import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const session = await auth()
    const userId = session?.user?.id
    
    if (!userId) {
      return NextResponse.json({ authenticated: false })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { isLocked: true, role: true, tier: true }
    })

    if (!user) {
      return NextResponse.json({ authenticated: false })
    }

    return NextResponse.json({
      authenticated: true,
      isLocked: user.isLocked,
      role: user.role,
      tier: user.tier
    })
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
