"use client";

import React from "react";
import { Sparkles, Trophy, BookOpen, Headphones, PenTool, Mic, ArrowRight, X } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SkillScores {
    reading?: number;
    listening?: number;
    writing?: number;
    speaking?: number;
}

interface OverallScorecardModalProps {
    isOpen: boolean;
    overallBand: number;
    skillScores: SkillScores;
    onClose: () => void;
    onGoToDashboard: () => void;
}

export default function OverallScorecardModal({
    isOpen,
    overallBand,
    skillScores,
    onClose,
    onGoToDashboard,
}: OverallScorecardModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in">
            <div className="bg-white rounded-3xl max-w-lg w-full p-8 text-center shadow-2xl border border-slate-100 relative">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition">
                    <X className="h-5 w-5" />
                </button>

                <div className="w-20 h-20 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner text-4xl">
                    🏆
                </div>

                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200 inline-flex items-center gap-1.5 mb-2">
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" /> Bảng Điểm IELTS Overall
                </span>

                <h2 className="text-2xl font-black text-slate-900 mb-1">Chúc Mừng Bạn Đã Hoàn Thành!</h2>
                <p className="text-xs text-slate-500 mb-6">Kết quả ước tính tổng thể bộ bài thi 4 kỹ năng</p>

                {/* Main Overall Band Card */}
                <div className="bg-gradient-to-br from-amber-500 via-amber-600 to-orange-600 text-white rounded-2xl p-6 shadow-xl shadow-amber-500/20 mb-6 relative overflow-hidden">
                    <div className="text-xs uppercase tracking-widest text-amber-100 font-bold mb-1">Overall Band Score</div>
                    <div className="text-6xl font-black tracking-tight my-1 text-white">{overallBand}</div>
                    <div className="text-xs text-amber-100 font-medium mt-2">
                        Tính theo công thức làm tròn chuẩn quốc tế IELTS
                    </div>
                </div>

                {/* 4 Skill Scores Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                    <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                            <BookOpen className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs text-slate-500 font-semibold">Reading</div>
                            <div className="text-lg font-bold text-blue-900">{skillScores.reading ?? "--"}</div>
                        </div>
                    </div>

                    <div className="bg-orange-50 border border-orange-100 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
                            <Headphones className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs text-slate-500 font-semibold">Listening</div>
                            <div className="text-lg font-bold text-orange-900">{skillScores.listening ?? "--"}</div>
                        </div>
                    </div>

                    <div className="bg-purple-50 border border-purple-100 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
                            <PenTool className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs text-slate-500 font-semibold">Writing</div>
                            <div className="text-lg font-bold text-purple-900">{skillScores.writing ?? "--"}</div>
                        </div>
                    </div>

                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-3.5 flex items-center gap-3">
                        <div className="h-9 w-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                            <Mic className="h-5 w-5" />
                        </div>
                        <div className="text-left">
                            <div className="text-xs text-slate-500 font-semibold">Speaking</div>
                            <div className="text-lg font-bold text-emerald-900">{skillScores.speaking ?? "--"}</div>
                        </div>
                    </div>
                </div>

                <div className="flex gap-3">
                    <Button
                        onClick={onGoToDashboard}
                        className="bg-amber-600 hover:bg-amber-700 text-white font-bold py-3 px-6 rounded-2xl flex-1 flex items-center justify-center gap-2 shadow-md text-sm">
                        Về Dashboard <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onClose}
                        variant="outline"
                        className="border-slate-300 text-slate-700 font-semibold py-3 px-5 rounded-2xl hover:bg-slate-100 text-sm">
                        Đóng
                    </Button>
                </div>
            </div>
        </div>
    );
}
