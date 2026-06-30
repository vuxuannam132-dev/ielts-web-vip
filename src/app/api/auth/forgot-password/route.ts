import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mailer'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Vui lòng nhập email' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    // To prevent email enumeration, we return success even if user not found, 
    // but in this specific school system it might be better to show error.
    if (!user) {
      return NextResponse.json({ error: 'Email không tồn tại trong hệ thống' }, { status: 404 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { resetToken: otp, resetExpiry: expiry }
    })

    await sendMail({
      to: email,
      subject: "Mã khôi phục mật khẩu",
      html: `<p>Xin chào ${user.name},</p><p>Mã khôi phục mật khẩu của bạn là: <strong>${otp}</strong></p><p>Mã này sẽ hết hạn sau 15 phút.</p>`
    })

    // Ghi log hoạt động
    await prisma.activityLog.create({
      data: {
        type: 'SECURITY',
        message: `Người dùng ${user.name} (${email}) yêu cầu khôi phục mật khẩu.`,
        userId: user.id
      }
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 })
  }
}
