import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { email, code } = await request.json()

    if (!email || !code) {
      return NextResponse.json({ error: 'Thiếu thông tin xác thực' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Tài khoản đã được xác thực' }, { status: 400 })
    }

    if (user.verifyCode !== code) {
      return NextResponse.json({ error: 'Mã xác nhận không đúng' }, { status: 400 })
    }

    if (!user.verifyExpiry || new Date() > user.verifyExpiry) {
      return NextResponse.json({ error: 'Mã xác nhận đã hết hạn' }, { status: 400 })
    }

    // Verify user
    await prisma.user.update({
      where: { id: user.id },
      data: { isVerified: true, verifyCode: null, verifyExpiry: null }
    })

    // Return success to frontend (frontend will redirect to login page)
    return NextResponse.json({ success: true, email: user.email })
  } catch (error) {
    console.error('Verify error:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 })
  }
}
