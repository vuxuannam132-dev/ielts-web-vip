import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

export async function POST(request: Request) {
  try {
    const { email, code, newPassword } = await request.json()

    if (!email || !code || !newPassword) {
      return NextResponse.json({ error: 'Thiếu thông tin' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy người dùng' }, { status: 404 })
    }

    if (user.resetToken !== code) {
      return NextResponse.json({ error: 'Mã xác nhận không đúng' }, { status: 400 })
    }

    if (!user.resetExpiry || new Date() > user.resetExpiry) {
      return NextResponse.json({ error: 'Mã xác nhận đã hết hạn' }, { status: 400 })
    }

    const passwordHash = await bcrypt.hash(newPassword, 12)

    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash, resetToken: null, resetExpiry: null }
    })

    // Ghi log hoạt động
    await prisma.activityLog.create({
      data: {
        type: 'SECURITY',
        message: `Người dùng ${user.name} (${email}) đã đặt lại mật khẩu thành công.`,
        userId: user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Reset password error:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 })
  }
}
