"use client";

import { useState } from 'react';
import { AlertCircle, X, Send } from 'lucide-react';
import toast from 'react-hot-toast';

export default function BugReportWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setLoading(true);
    try {
      const res = await fetch('/api/reports', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message })
      });
      
      if (res.ok) {
        toast.success('Cảm ơn bạn đã báo lỗi. Admin sẽ kiểm tra sớm nhất có thể!');
        setIsOpen(false);
        setMessage('');
      } else {
        const data = await res.json();
        toast.error(data.error || 'Có lỗi xảy ra');
      }
    } catch (err) {
      toast.error('Có lỗi xảy ra khi gửi báo lỗi');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {isOpen ? (
        <div className="bg-white rounded-2xl shadow-2xl w-80 p-5 border border-slate-200 animate-in fade-in slide-in-from-bottom-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-slate-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-500" />
              Báo lỗi / Góp ý
            </h3>
            <button 
              onClick={() => setIsOpen(false)}
              className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <textarea
              className="w-full text-sm p-3 border border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 resize-none h-28"
              placeholder="Mô tả chi tiết lỗi bạn gặp phải hoặc góp ý cho hệ thống..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              required
            />
            <button
              type="submit"
              disabled={loading || !message.trim()}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-xl flex justify-center items-center gap-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Đang gửi...' : <><Send className="w-4 h-4" /> Gửi báo cáo</>}
            </button>
          </form>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="bg-white hover:bg-red-50 text-slate-700 hover:text-red-600 shadow-lg border border-slate-200 rounded-full py-3 px-4 flex items-center gap-2 font-medium transition-all hover:scale-105 active:scale-95"
        >
          <AlertCircle className="w-5 h-5 text-red-500" />
          <span className="hidden sm:inline">Báo lỗi</span>
        </button>
      )}
    </div>
  );
}
