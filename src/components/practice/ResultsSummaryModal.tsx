"use client";

import React, { useEffect } from "react";
import { Award, CheckCircle2, XCircle, HelpCircle, ArrowRight, RotateCcw, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { triggerFireworks } from "@/lib/utils/confetti";

export interface EvaluationData {
    bandScore: number;
    totalCorrect?: number;
    totalIncorrect?: number;
    rawScore?: number;
    totalQuestions?: number;
    feedback?: string;
    wrongAnswers?: {
        questionId: number;
        userAnswer: any;
        correctAnswer: any;
        reason: string;
    }[];
}

interface ResultsSummaryModalProps {
    isOpen: boolean;
    skill: "reading" | "listening" | "writing" | "speaking";
    evaluation: EvaluationData | null;
    onReviewDetails: () => void;
    onRetry: () => void;
    onBackToList: () => void;
}

const skillMeta = {
    reading: { title: "Reading Test Results", color: "blue", bg: "bg-blue-600" },
    listening: { title: "Listening Test Results", color: "orange", bg: "bg-orange-600" },
    writing: { title: "Writing Test Results", color: "purple", bg: "bg-purple-600" },
    speaking: { title: "Speaking Test Results", color: "emerald", bg: "bg-emerald-600" },
};

export default function ResultsSummaryModal({
    isOpen,
    skill,
    evaluation,
    onReviewDetails,
    onRetry,
    onBackToList,
}: ResultsSummaryModalProps) {
    useEffect(() => {
        if (isOpen) {
            triggerFireworks();
        }
    }, [isOpen]);

    if (!isOpen || !evaluation) return null;

    const meta = skillMeta[skill];
    const totalQ = evaluation.totalQuestions || (evaluation.totalCorrect || 0) + (evaluation.totalIncorrect || 0);
    const correct = evaluation.totalCorrect || 0;
    const incorrect = evaluation.totalIncorrect || 0;
    const unanswered = Math.max(0, totalQ - correct - incorrect);

    return (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-md flex items-center justify-center p-4 z-50 animate-fade-in overflow-y-auto">
            <div className="bg-white rounded-3xl max-w-xl w-full p-6 sm:p-8 text-center shadow-2xl border border-slate-100 relative my-8">
                <button
                    onClick={onBackToList}
                    className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-2 rounded-full hover:bg-slate-100 transition">
                    <X className="h-5 w-5" />
                </button>

                {/* Header Badge */}
                <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <Award className="h-8 w-8 text-blue-600" />
                </div>

                <h2 className="text-2xl font-black text-slate-900 mb-1">{meta.title}</h2>
                <p className="text-xs text-slate-500 mb-6">Kết quả đánh giá bài thi bởi AI Examiner chuẩn IELTS</p>

                {/* Band Score Display */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white rounded-2xl p-6 shadow-xl mb-6 relative overflow-hidden">
                    <div className="absolute top-3 right-3 bg-amber-400/20 text-amber-300 border border-amber-400/30 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1">
                        <Sparkles className="h-3.5 w-3.5 text-amber-300" /> IELTS Band
                    </div>
                    <div className="text-xs uppercase tracking-widest text-slate-400 font-bold mb-1">Điểm Band Kỹ Năng</div>
                    <div className="text-5xl font-black text-amber-400 tracking-tight my-1">{evaluation.bandScore}</div>
                    <div className="text-xs text-slate-300 mt-2">
                        {evaluation.bandScore >= 7.0 ? "🎉 Xuất sắc! Band điểm chuẩn mục tiêu cao cấp." : evaluation.bandScore >= 6.0 ? "👍 Tốt! Đã đạt band vững chắc." : "💪 Cần luyện tập thêm để cải thiện."}
                    </div>
                </div>

                {/* Question Breakdown Stats */}
                {totalQ > 0 && (
                    <div className="grid grid-cols-3 gap-3 mb-6">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-emerald-600 text-xs font-bold mb-1">
                                <CheckCircle2 className="h-4 w-4" /> Đúng
                            </div>
                            <div className="text-xl font-bold text-emerald-800">{correct}</div>
                        </div>
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-red-600 text-xs font-bold mb-1">
                                <XCircle className="h-4 w-4" /> Sai
                            </div>
                            <div className="text-xl font-bold text-red-800">{incorrect}</div>
                        </div>
                        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 text-center">
                            <div className="flex items-center justify-center gap-1 text-slate-500 text-xs font-bold mb-1">
                                <HelpCircle className="h-4 w-4" /> Bỏ trống
                            </div>
                            <div className="text-xl font-bold text-slate-700">{unanswered}</div>
                        </div>
                    </div>
                )}

                {/* AI Examiner Summary Feedback */}
                {evaluation.feedback && (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-left mb-6 max-h-48 overflow-y-auto">
                        <div className="text-xs font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                            📝 Nhận xét của AI Examiner:
                        </div>
                        <div
                            className="text-xs text-slate-700 leading-relaxed space-y-2 prose prose-xs max-w-none"
                            dangerouslySetInnerHTML={{ __html: evaluation.feedback }}
                        />
                    </div>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                    <Button
                        onClick={onReviewDetails}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-5 rounded-2xl flex-1 flex items-center justify-center gap-2 shadow-md text-sm">
                        Xem chi tiết đáp án <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                        onClick={onRetry}
                        variant="outline"
                        className="border-slate-300 text-slate-700 font-bold py-3 px-5 rounded-2xl flex-1 hover:bg-slate-100 text-sm flex items-center justify-center gap-1.5">
                        <RotateCcw className="h-4 w-4" /> Làm lại
                    </Button>
                </div>
            </div>
        </div>
    );
}
