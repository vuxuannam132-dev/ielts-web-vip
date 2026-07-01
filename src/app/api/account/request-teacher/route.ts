import { NextResponse } from 'next/server'
import { auth } from '@/auth'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const session = await auth()
    const userId = session?.user?.id
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { reason } = await request.json()

    const user = await prisma.user.findUnique({
      where: { id: userId }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    if (user.role === 'TEACHER' || user.role === 'ADMIN') {
      return NextResponse.json({ error: 'Bạn đã có quyền giáo viên/admin.' }, { status: 400 })
    }

    const existingLog = await prisma.activityLog.findFirst({
      where: {
        userId: user.id,
        type: 'TEACHER_UPGRADE_REQUEST'
      }
    })

    if (existingLog) {
      return NextResponse.json({ error: 'Bạn đã gửi yêu cầu rồi, vui lòng đợi admin duyệt.' }, { status: 400 })
    }

    await prisma.activityLog.create({
      data: {
        userId: user.id,
        type: 'TEACHER_UPGRADE_REQUEST',
        message: `Yêu cầu cấp quyền Giáo viên.\nEmail: ${user.email}\nLý do/Giới thiệu: ${reason || 'Không có'}`
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Teacher request error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
