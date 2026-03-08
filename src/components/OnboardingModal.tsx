"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Zap, ChevronRight, Trophy, BookOpen } from "lucide-react";

interface OnboardingModalProps {
    onComplete: (data: { targetBand: number; currentBand: number | null; weakestSkill: string }) => void;
}

const SKILL_OPTIONS = [
    { value: "LISTENING", label: "👂 Listening" },
    { value: "READING", label: "📖 Reading" },
    { value: "WRITING", label: "✍️ Writing" },
    { value: "SPEAKING", label: "🎤 Speaking" },
    { value: "NONE", label: "🤷 Chưa biết" },
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const [targetBand, setTargetBand] = useState(7.0);
    const [currentBand, setCurrentBand] = useState<number | null>(null);
    const [weakestSkill, setWeakestSkill] = useState("NONE");
    const [saving, setSaving] = useState(false);

    const handleComplete = async () => {
        setSaving(true);
        try {
            await fetch("/api/user/stats", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ targetBand, currentBand, weakestSkill, onboardingDone: true })
            });
        } catch { }
        finally {
            setSaving(false);
            onComplete({ targetBand, currentBand, weakestSkill });
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                            {step === 1 ? <Target className="h-4 w-4" /> : step === 2 ? <Trophy className="h-4 w-4" /> : <BookOpen className="h-4 w-4" />}
                        </div>
                        <span className="text-white/70 text-sm">Bước {step}/3</span>
                    </div>
                    <h2 className="text-xl font-bold">
                        {step === 1 && "Mục tiêu của bạn là gì?"}
                        {step === 2 && "Band hiện tại của bạn?"}
                        {step === 3 && "Kỹ năng nào bạn thấy yếu nhất?"}
                    </h2>
                    {/* Progress bar */}
                    <div className="mt-4 h-1.5 bg-white/30 rounded-full">
                        <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${(step / 3) * 100}%` }} />
                    </div>
                </div>

                <div className="p-6">
                    {step === 1 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-6">Chọn band IELTS bạn muốn đạt được. Hệ thống sẽ cá nhân hóa lộ trình cho bạn.</p>
                            <div className="grid grid-cols-4 gap-2 mb-4">
                                {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(b => (
                                    <button key={b} onClick={() => setTargetBand(b)}
                                        className={`py-3 rounded-xl text-lg font-bold border-2 transition-all ${targetBand === b ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                        {b}
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-blue-700 font-bold text-2xl my-3">Mục tiêu: {targetBand}</p>
                        </div>
                    )}

                    {step === 2 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-6">Nếu bạn chưa thi IELTS lần nào, chọn "Chưa biết" — hệ thống sẽ đánh giá qua bài test.</p>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button onClick={() => setCurrentBand(null)}
                                    className={`py-3 rounded-xl font-semibold border-2 transition-all ${currentBand === null ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                    🤷 Chưa biết
                                </button>
                                {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5].map(b => (
                                    <button key={b} onClick={() => setCurrentBand(b)}
                                        className={`py-3 rounded-xl text-lg font-bold border-2 transition-all ${currentBand === b ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                        {b}
                                    </button>
                                ))}
                            </div>
                            {currentBand !== null && <p className="text-center text-blue-700 font-bold text-xl">Band hiện tại: {currentBand}</p>}
                        </div>
                    )}

                    {step === 3 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-6">Chúng tôi sẽ ưu tiên bài luyện tập cho kỹ năng bạn cần cải thiện nhất.</p>
                            <div className="grid grid-cols-2 gap-3">
                                {SKILL_OPTIONS.map(opt => (
                                    <button key={opt.value} onClick={() => setWeakestSkill(opt.value)}
                                        className={`py-4 rounded-xl text-sm font-semibold border-2 transition-all ${weakestSkill === opt.value ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="mt-6 flex gap-3">
                        {step > 1 && (
                            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">← Quay lại</Button>
                        )}
                        {step < 3 ? (
                            <Button onClick={() => setStep(s => s + 1)} className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2">
                                Tiếp theo <ChevronRight className="h-4 w-4" />
                            </Button>
                        ) : (
                            <Button onClick={handleComplete} disabled={saving} className="flex-1 bg-indigo-600 hover:bg-indigo-700 gap-2">
                                {saving ? "Đang lưu..." : <><Zap className="h-4 w-4" /> Bắt đầu luyện thi!</>}
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
