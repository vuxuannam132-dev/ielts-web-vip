import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getSessionFromRequest } from '@/lib/session'

export async function POST(req: NextRequest) {
  try {
    const session = await getSessionFromRequest(req)
    if (session?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { logId, userId, action } = body // action: 'APPROVE' or 'REJECT'

    if (!logId || !userId || !action) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
    }

    if (action === 'APPROVE') {
      await prisma.$transaction([
        prisma.user.update({
          where: { id: userId },
          data: { role: 'TEACHER' }
        }),
        prisma.activityLog.update({
          where: { id: logId },
          data: { message: '[Đã duyệt] ' + body.message }
        })
      ])
    } else {
      await prisma.activityLog.update({
        where: { id: logId },
        data: { message: '[Đã từ chối] ' + body.message }
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Teacher approval error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
