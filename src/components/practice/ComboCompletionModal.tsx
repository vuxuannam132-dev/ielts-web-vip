"use client";

import React from "react";
import { Sparkles, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ComboCompletionModalProps {
    isOpen: boolean;
    onContinue: () => void;
    onClose: () => void;
    completedCount?: number;
    totalCount?: number;
}

export default function ComboCompletionModal({
    isOpen,
    onContinue,
    onClose,
    completedCount = 1,
    totalCount = 4
}: ComboCompletionModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-md w-full p-8 text-center shadow-2xl border border-slate-100 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition">
                    <X className="h-5 w-5" />
                </button>

                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-5 shadow-inner text-4xl">
                    🎉
                </div>

                <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 mb-3">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Bài Combo IELTS
                </span>

                <h3 className="text-2xl font-black text-slate-900 mb-3">Xuất sắc hoàn thành!</h3>

                <p className="text-slate-600 text-base mb-8 leading-relaxed">
                    Bạn đã làm xong <b className="text-blue-600 text-lg font-bold">{completedCount}/{totalCount} kỹ năng</b> của đề này, bạn có muốn làm tiếp không?
                </p>

                <div className="flex flex-col sm:flex-row gap-3 justify-center">
                    <Button
                        onClick={onContinue}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl flex-1 flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/30 text-sm transition-all hover:scale-105">
                        🟢 Tiếp tục <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-slate-300 text-slate-700 font-bold py-3 px-6 rounded-2xl flex-1 hover:bg-slate-100 text-sm transition-all">
                        🔴 Không mún đouuu
                    </Button>
                </div>
            </div>
        </div>
    );
}
