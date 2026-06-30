import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { sendMail } from '@/lib/mailer'

export async function POST(request: Request) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Thiếu email' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({ where: { email } })

    if (!user) {
      return NextResponse.json({ error: 'Không tìm thấy tài khoản' }, { status: 404 })
    }

    if (user.isVerified) {
      return NextResponse.json({ error: 'Tài khoản đã được xác thực' }, { status: 400 })
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString()
    const expiry = new Date(Date.now() + 15 * 60 * 1000)

    await prisma.user.update({
      where: { id: user.id },
      data: { verifyCode: otp, verifyExpiry: expiry }
    })

    await sendMail({
      to: email,
      subject: 'Mã xác nhận tài khoản',
      html: `<div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:20px">
        <h2 style="color:#2563eb">Xác nhận tài khoản</h2>
        <p>Xin chào <strong>${user.name}</strong>,</p>
        <p>Mã xác nhận của bạn là:</p>
        <div style="text-align:center;margin:24px 0">
          <span style="font-size:32px;font-weight:bold;letter-spacing:8px;background:#f1f5f9;padding:12px 24px;border-radius:12px">${otp}</span>
        </div>
        <p style="color:#64748b;font-size:14px">Mã này sẽ hết hạn sau 15 phút.</p>
      </div>`
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Resend OTP error:', error)
    return NextResponse.json({ error: 'Đã xảy ra lỗi' }, { status: 500 })
  }
}
