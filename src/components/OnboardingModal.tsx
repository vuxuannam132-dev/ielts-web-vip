"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Zap, ChevronRight, Trophy, BookOpen, School, Briefcase, Share2, GraduationCap } from "lucide-react";

interface OnboardingModalProps {
    onComplete: (data: {
        targetBand: number;
        currentBand: number | null;
        weakestSkill: string;
        school?: string;
        occupation?: string;
        referralSource?: string;
    }) => void;
}

const SKILL_OPTIONS = [
    { value: "LISTENING", label: "👂 Listening", desc: "Nghe và trả lời câu hỏi" },
    { value: "READING", label: "📖 Reading", desc: "Đọc hiểu đoạn văn" },
    { value: "WRITING", label: "✍️ Writing", desc: "Viết luận và báo cáo" },
    { value: "SPEAKING", label: "🎤 Speaking", desc: "Giao tiếp và diễn đạt" },
    { value: "NONE", label: "🤷 Chưa biết", desc: "Cần làm bài test để biết" },
];

const OCCUPATION_OPTIONS = [
    { value: "student_highschool", label: "🏫 Học sinh THPT", icon: School },
    { value: "student_university", label: "🎓 Sinh viên đại học", icon: GraduationCap },
    { value: "worker", label: "💼 Đi làm", icon: Briefcase },
    { value: "other", label: "🌟 Khác", icon: Target },
];

const REFERRAL_OPTIONS = [
    { value: "facebook", label: "📘 Facebook" },
    { value: "tiktok", label: "🎵 TikTok" },
    { value: "youtube", label: "📺 YouTube" },
    { value: "friend", label: "👫 Bạn bè giới thiệu" },
    { value: "google", label: "🔍 Google Search" },
    { value: "teacher", label: "👨‍🏫 Thầy/cô giới thiệu" },
    { value: "other", label: "🤔 Khác" },
];

const STEPS = [
    { title: "Mục tiêu band IELTS?", icon: Target },
    { title: "Band hiện tại của bạn?", icon: Trophy },
    { title: "Kỹ năng nào yếu nhất?", icon: BookOpen },
    { title: "Bạn đang học trường nào?", icon: School },
    { title: "Bạn đang đi học hay đi làm?", icon: Briefcase },
    { title: "Bạn biết IELTS SKIBIDI qua đâu?", icon: Share2 },
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const totalSteps = STEPS.length;
    const [targetBand, setTargetBand] = useState(7.0);
    const [currentBand, setCurrentBand] = useState<number | null>(null);
    const [weakestSkill, setWeakestSkill] = useState("NONE");
    const [school, setSchool] = useState("");
    const [occupation, setOccupation] = useState("");
    const [referralSource, setReferralSource] = useState("");
    const [saving, setSaving] = useState(false);

    const StepIcon = STEPS[step - 1].icon;

    const handleComplete = async () => {
        setSaving(true);
        try {
            await fetch("/api/user/stats", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetBand,
                    currentBand,
                    weakestSkill,
                    onboardingDone: true,
                    school,
                    occupation,
                    referralSource,
                })
            });
        } catch { }
        finally {
            setSaving(false);
            onComplete({ targetBand, currentBand, weakestSkill, school, occupation, referralSource });
        }
    };

    const canNext = () => {
        if (step === 4) return school.trim().length > 0;
        if (step === 5) return occupation.length > 0;
        if (step === 6) return referralSource.length > 0;
        return true;
    };

    const goNext = () => {
        if (step < totalSteps) setStep(s => s + 1);
        else handleComplete();
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden">
                {/* Header */}
                <div className="bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-8 w-8 bg-white/20 rounded-lg flex items-center justify-center">
                            <StepIcon className="h-4 w-4" />
                        </div>
                        <span className="text-white/70 text-sm">Bước {step}/{totalSteps}</span>
                    </div>
                    <h2 className="text-xl font-bold">{STEPS[step - 1].title}</h2>
                    {/* Progress bar */}
                    <div className="mt-4 h-1.5 bg-white/30 rounded-full">
                        <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
                    </div>
                </div>

                <div className="p-6">
                    {/* Step 1: Target Band */}
                    {step === 1 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-6">Chọn band IELTS bạn muốn đạt được. Hệ thống sẽ cá nhân hóa lộ trình học cho bạn.</p>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(b => (
                                    <button key={b} onClick={() => setTargetBand(b)}
                                        className={`py-3 rounded-xl text-lg font-bold border-2 transition-all ${targetBand === b ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                        {b}
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-blue-700 font-bold text-2xl my-2">Mục tiêu: {targetBand}</p>
                        </div>
                    )}

                    {/* Step 2: Current Band */}
                    {step === 2 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-6">Nếu bạn chưa thi IELTS lần nào, chọn "Chưa biết" — hệ thống sẽ đánh giá qua bài test.</p>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <button onClick={() => setCurrentBand(null)}
                                    className={`py-3 rounded-xl font-semibold border-2 transition-all col-span-2 ${currentBand === null ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 border-slate-200"}`}>
                                    🤷 Chưa biết / Chưa từng thi
                                </button>
                                {[4.0, 4.5, 5.0, 5.5, 6.0, 6.5, 7.0, 7.5].map(b => (
                                    <button key={b} onClick={() => setCurrentBand(b)}
                                        className={`py-3 rounded-xl text-lg font-bold border-2 transition-all ${currentBand === b ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                        {b}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 3: Weakest Skill */}
                    {step === 3 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-4">Chúng tôi sẽ ưu tiên bài luyện tập cho kỹ năng bạn cần cải thiện nhất.</p>
                            <div className="space-y-2">
                                {SKILL_OPTIONS.map(opt => (
                                    <button key={opt.value} onClick={() => setWeakestSkill(opt.value)}
                                        className={`w-full flex items-center gap-3 py-3 px-4 rounded-xl text-sm font-semibold border-2 transition-all text-left ${weakestSkill === opt.value ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                        <span className="text-lg">{opt.label.split(" ")[0]}</span>
                                        <div>
                                            <div>{opt.label.substring(opt.label.indexOf(" ") + 1)}</div>
                                            <div className={`text-xs ${weakestSkill === opt.value ? "text-blue-100" : "text-slate-400"}`}>{opt.desc}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Step 4: School */}
                    {step === 4 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-4">Thông tin này giúp chúng tôi hiểu môi trường học tập của bạn tốt hơn.</p>
                            <input
                                autoFocus
                                type="text"
                                value={school}
                                onChange={e => setSchool(e.target.value)}
                                placeholder="VD: Trường Đời, Trường THPT Đoàn Kết-Hai Bà Trưng,..."
                                className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors"
                            />
                            <p className="text-xs text-slate-400 mt-2">💡 Gõ tên trường bạn đang học, hoặc nơi làm việc nếu đã đi làm.</p>
                        </div>
                    )}

                    {/* Step 5: Occupation */}
                    {step === 5 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-4">Giúp chúng tôi đề xuất thời gian biểu luyện tập phù hợp với lịch của bạn.</p>
                            <div className="grid grid-cols-2 gap-3">
                                {OCCUPATION_OPTIONS.map(opt => {
                                    const Icon = opt.icon;
                                    return (
                                        <button key={opt.value} onClick={() => setOccupation(opt.value)}
                                            className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${occupation === opt.value ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                            <Icon className="h-6 w-6" />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Step 6: Referral source */}
                    {step === 6 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-4">Giúp chúng tôi biết cách tiếp cận học viên hiệu quả hơn.</p>
                            <div className="grid grid-cols-2 gap-2">
                                {REFERRAL_OPTIONS.map(opt => (
                                    <button key={opt.value} onClick={() => setReferralSource(opt.value)}
                                        className={`py-3 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${referralSource === opt.value ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                        {opt.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Navigation */}
                    <div className="mt-6 flex gap-3">
                        {step > 1 && (
                            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">← Quay lại</Button>
                        )}
                        <Button
                            onClick={goNext}
                            disabled={saving || !canNext()}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2 disabled:opacity-50">
                            {saving ? "Đang lưu..." : step < totalSteps ? <>Tiếp theo <ChevronRight className="h-4 w-4" /></> : <><Zap className="h-4 w-4" /> Bắt đầu luyện thi!</>}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
