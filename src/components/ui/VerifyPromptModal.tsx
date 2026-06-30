'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { ShieldCheck, Mail, AlertTriangle, CheckCircle2 } from 'lucide-react'

export default function VerifyPromptModal() {
  const { data: session, status, update } = useSession()
  const [showModal, setShowModal] = useState(false)
  const [step, setStep] = useState<'prompt' | 'otp'>('prompt')
  const [otp, setOtp] = useState('')
  const [sending, setSending] = useState(false)
  const [verifying, setVerifying] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  useEffect(() => {
    if (status === 'authenticated' && (session?.user as any)?.isVerified === false) {
      setShowModal(true)
    } else {
      setShowModal(false)
    }
  }, [session, status])

  const handleRequestOtp = async () => {
    setSending(true)
    setError('')
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Có lỗi xảy ra')
      setStep('otp')
    } catch (err: any) {
      setError(err.message)
    } finally {
      setSending(false)
    }
  }

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault()
    setVerifying(true)
    setError('')
    try {
      const res = await fetch('/api/auth/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: session?.user?.email, code: otp })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Mã không đúng')
      setSuccess(true)
      await update({ isVerified: true })
      setTimeout(() => setShowModal(false), 2000)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setVerifying(false)
    }
  }

  if (!showModal) return null

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-9 h-9 text-white" />
          </div>
          <h2 className="text-xl font-bold text-white">Xác thực tài khoản</h2>
          <p className="text-white/80 text-sm mt-1">Bạn cần xác thực email trước khi sử dụng</p>
        </div>

        <div className="p-6">
          {success ? (
            <div className="text-center py-4">
              <CheckCircle2 className="w-14 h-14 text-emerald-500 mx-auto mb-3" />
              <p className="font-semibold text-slate-800">Xác thực thành công!</p>
              <p className="text-sm text-slate-500 mt-1">Bạn có thể sử dụng đầy đủ tính năng.</p>
            </div>
          ) : step === 'prompt' ? (
            <div className="space-y-4">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
                <p className="text-sm text-amber-800">
                  Tài khoản của bạn chưa được xác thực. Vui lòng xác thực email để sử dụng đầy đủ các tính năng.
                </p>
              </div>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}
              <p className="text-sm text-slate-600 text-center">
                Mã OTP sẽ được gửi tới: <strong>{session?.user?.email}</strong>
              </p>
              <button
                onClick={handleRequestOtp}
                disabled={sending}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                <Mail className="w-4 h-4" />
                {sending ? 'Đang gửi...' : 'Xác thực ngay'}
              </button>
            </div>
          ) : (
            <form onSubmit={handleVerify} className="space-y-4">
              <p className="text-sm text-slate-600 text-center">
                Nhập mã 6 số đã gửi tới <strong>{session?.user?.email}</strong>
              </p>
              {error && <p className="text-sm text-red-600 bg-red-50 border border-red-100 rounded-lg p-3">{error}</p>}
              <input
                type="text"
                maxLength={6}
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                className="w-full px-4 py-4 text-center text-3xl tracking-widest font-mono border-2 border-slate-200 rounded-xl focus:border-blue-500 focus:ring-4 focus:ring-blue-500/20 outline-none transition-all"
                placeholder="000000"
                autoFocus
              />
              <button
                type="submit"
                disabled={verifying || otp.length !== 6}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white font-semibold rounded-xl hover:opacity-90 transition-all disabled:opacity-50"
              >
                {verifying ? 'Đang xác nhận...' : 'Xác nhận'}
              </button>
              <button
                type="button"
                onClick={() => { setStep('prompt'); setOtp(''); setError('') }}
                className="w-full py-2 text-sm text-slate-500 hover:text-slate-700 transition-colors"
              >
                ← Gửi lại mã khác
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
