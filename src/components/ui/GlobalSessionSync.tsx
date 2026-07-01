'use client'

import { useEffect, useState } from 'react'
import { useSession, signOut } from 'next-auth/react'
import { AlertTriangle, LogOut, Send, Loader2 } from 'lucide-react'

export default function GlobalSessionSync() {
  const { data: session, status, update } = useSession()
  const [isLocked, setIsLocked] = useState(false)
  
  const [reason, setReason] = useState('')
  const [sending, setSending] = useState(false)
  const [message, setMessage] = useState<{ type: 'error'|'success', text: string } | null>(null)

  useEffect(() => {
    if (status !== 'authenticated') return

    const checkStatus = async () => {
      try {
        const res = await fetch('/api/auth/status')
        if (res.ok) {
          const data = await res.json()
          if (!data.authenticated) return

          if (data.isLocked) {
            setIsLocked(true)
          } else {
            setIsLocked(false)
          }

          const user = session?.user as any
          if (user) {
            let needsUpdate = false;
            const payload: any = {};

            if (data.role && data.role !== user.role) {
              needsUpdate = true;
              payload.role = data.role;
            }
            if (data.tier && data.tier !== user.tier) {
              needsUpdate = true;
              payload.tier = data.tier;
            }

            if (needsUpdate) {
              await update(payload)
            }
          }
        }
      } catch (e) {
        // Ignore network errors
      }
    }

    checkStatus()
    const interval = setInterval(checkStatus, 30000)
    return () => clearInterval(interval)
  }, [status, session, update])

  const handleUnlockRequest = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!reason.trim()) {
      setMessage({ type: 'error', text: 'Vui lòng nhập lý do' })
      return
    }

    setSending(true)
    setMessage(null)
    try {
      const res = await fetch('/api/auth/unlock-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason })
      })
      const data = await res.json()
      
      if (res.ok) {
        setMessage({ type: 'success', text: 'Đã gửi yêu cầu thành công. Vui lòng đợi quản trị viên xem xét.' })
        setReason('')
      } else {
        setMessage({ type: 'error', text: data.error || 'Đã xảy ra lỗi' })
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Lỗi kết nối' })
    } finally {
      setSending(false)
    }
  }

  if (!isLocked) return null

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-slate-900/95 p-4 backdrop-blur-md">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md p-8 text-center animate-in fade-in zoom-in duration-300">
        <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="w-10 h-10 text-red-600" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Tài khoản đã bị khóa</h2>
        <p className="text-slate-500 mb-6">
          Tài khoản của bạn đã bị khóa bởi Quản trị viên do vi phạm hoặc vì lý do bảo mật. 
          Bạn không thể tiếp tục sử dụng hệ thống.
        </p>

        {message ? (
          <div className={`p-4 rounded-xl mb-6 text-sm font-medium border text-left ${
            message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'
          }`}>
            {message.text}
          </div>
        ) : (
          <form onSubmit={handleUnlockRequest} className="mb-6 space-y-3 text-left">
            <label className="block text-sm font-semibold text-slate-700">Gửi yêu cầu mở khóa:</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Nhập lý do tại sao bạn cần mở khóa tài khoản..."
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:border-red-500 focus:ring-4 focus:ring-red-500/20 outline-none resize-none h-24 text-sm"
              required
            />
            <button
              type="submit"
              disabled={sending || !reason.trim()}
              className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white py-3 rounded-xl hover:bg-slate-800 disabled:opacity-50 transition-colors"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              Gửi yêu cầu
            </button>
          </form>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/' })}
          className="flex items-center justify-center gap-2 w-full py-3 text-slate-500 hover:bg-slate-100 hover:text-slate-900 rounded-xl transition-colors font-semibold"
        >
          <LogOut className="w-4 h-4" /> Đăng xuất
        </button>
      </div>
    </div>
  )
}
