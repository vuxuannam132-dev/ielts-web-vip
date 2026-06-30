import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { auth } from '@/auth'

export async function POST(request: Request) {
  try {
    const session = await auth()
    const { message } = await request.json()

    if (!message || message.trim() === '') {
      return NextResponse.json({ error: 'Nội dung báo lỗi không được để trống' }, { status: 400 })
    }

    const userContext = session?.user ? `[${session.user.name} - ${session.user.email}]` : '[Khách]';
    
    // Ghi log hoạt động loại Lỗi
    await prisma.activityLog.create({
      data: {
        type: 'BUG',
        message: `${userContext} Báo lỗi: ${message}`,
        userId: session?.user?.id || null
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Report error:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 })
  }
}
