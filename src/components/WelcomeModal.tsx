"use client";

import { useEffect, useState } from "react";
import { AlertTriangle, X } from "lucide-react";

export function WelcomeModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenModal = localStorage.getItem("hasSeenWelcomeModal");
    if (!hasSeenModal) {
      setIsOpen(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcomeModal", "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-center relative">
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white hover:bg-white/20 p-1 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-3xl">🎯</span>
          </div>
          <h2 className="text-2xl font-bold text-white">
            Web luyện thi IELTS hoàn toàn miễn phí
          </h2>
        </div>

        <div className="p-6">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6 flex gap-3">
            <AlertTriangle className="w-6 h-6 text-amber-500 shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800 leading-relaxed">
              Các bài tập trên web đều do các nguồn và được người trong cộng đồng đóng góp hoặc sưu tầm. Nếu có khiếu nại về bản quyền hoặc sai sót hãy liên hệ ngay với admin để được hỗ trợ.
            </p>
          </div>

          <button
            onClick={handleClose}
            className="w-full py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition-colors shadow-sm shadow-blue-200"
          >
            Đã hiểu và bắt đầu học
          </button>
          
          <p className="text-center text-xs text-slate-400 mt-4 font-mono">
            code by Xuân Nam
          </p>
        </div>
      </div>
    </div>
  );
}
