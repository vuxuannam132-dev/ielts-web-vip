"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Target, Zap, ChevronRight, Trophy, School, Briefcase, Share2, GraduationCap, GraduationCap as TeacherIcon, Loader2, CheckCircle2 } from "lucide-react";

interface OnboardingModalProps {
    onComplete: (data: any) => void;
}

const REFERRAL_OPTIONS = [
    { value: "admin", label: "👨‍💼 Admin giới thiệu" },
    { value: "youtube", label: "📺 YouTube" },
    { value: "facebook", label: "📘 Facebook" },
    { value: "tiktok", label: "🎵 TikTok" },
    { value: "friend", label: "👫 Bạn bè giới thiệu" },
    { value: "google", label: "🔍 Google" },
    { value: "teacher_ref", label: "👨‍🏫 Thầy/cô giới thiệu" },
    { value: "other", label: "🤔 Khác" },
];

const OCCUPATION_OPTIONS = [
    { value: "employee", label: "💼 Nhân viên", icon: Briefcase },
    { value: "teacher", label: "👨‍🏫 Giáo viên", icon: TeacherIcon },
    { value: "student_highschool", label: "🏫 Học sinh", icon: School },
    { value: "student_university", label: "🎓 Sinh viên", icon: GraduationCap },
];

const TEACHER_ROLE_OPTIONS = [
    { value: "ielts_teacher", label: "🎯 Giáo viên IELTS chuyên nghiệp" },
    { value: "school_english_teacher", label: "🏫 Giáo viên tiếng Anh trường học" },
    { value: "self_improve", label: "📚 Giáo viên muốn tự nâng cao trình độ" },
];

const STEPS = [
    { title: "Mục tiêu band IELTS của bạn?", icon: Target },
    { title: "Bạn đang làm gì?", icon: Briefcase },
    { title: "Bạn biết IELTS SKIBIDI qua đâu?", icon: Share2 },
    { title: "Bạn đang học trường nào?", icon: School },
    { title: "Band hiện tại của bạn?", icon: Trophy },
];

export default function OnboardingModal({ onComplete }: OnboardingModalProps) {
    const [step, setStep] = useState(1);
    const totalSteps = STEPS.length;

    const [targetBand, setTargetBand] = useState(7.0);
    const [occupation, setOccupation] = useState("");
    const [referralSource, setReferralSource] = useState("");
    const [school, setSchool] = useState("");
    const [currentBand, setCurrentBand] = useState<number | null>(null);
    const [saving, setSaving] = useState(false);

    // Teacher registration sub-form
    const [showTeacherForm, setShowTeacherForm] = useState(false);
    const [teacherFormData, setTeacherFormData] = useState({ name: "", schoolOrClass: "", role: "" });
    const [teacherRegSent, setTeacherRegSent] = useState(false);
    const [sendingTeacherReg, setSendingTeacherReg] = useState(false);

    const StepIcon = STEPS[step - 1].icon;

    const sendTeacherRegistration = async () => {
        if (!teacherFormData.name.trim() || !teacherFormData.role) return;
        setSendingTeacherReg(true);
        try {
            await fetch("/api/bug-report", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    title: "[Đăng ký tài khoản Giáo viên]",
                    description: `Họ tên: ${teacherFormData.name}\nTrường/Lớp: ${teacherFormData.schoolOrClass}\nVai trò: ${teacherFormData.role}`,
                    url: "/onboarding",
                })
            });
            setTeacherRegSent(true);
        } finally {
            setSendingTeacherReg(false);
        }
    };

    const handleComplete = async () => {
        setSaving(true);
        try {
            await fetch("/api/user/stats", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    targetBand,
                    currentBand,
                    onboardingDone: true,
                    school,
                    occupation,
                    referralSource,
                })
            });
        } catch { }
        finally {
            setSaving(false);
            onComplete({ targetBand, currentBand, school, occupation, referralSource, onboardingDone: true });
        }
    };

    const canNext = () => {
        if (step === 1) return true;
        if (step === 2) return occupation.length > 0;
        if (step === 3) return true; // skippable
        if (step === 4) return true; // skippable
        if (step === 5) return true;
        return true;
    };

    const goNext = () => {
        if (step < totalSteps) setStep(s => s + 1);
        else handleComplete();
    };

    const skip = () => {
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
                    <div className="mt-4 h-1.5 bg-white/30 rounded-full">
                        <div className="h-full bg-white rounded-full transition-all duration-500" style={{ width: `${(step / totalSteps) * 100}%` }} />
                    </div>
                </div>

                <div className="p-6">
                    {/* Step 1: Target Band */}
                    {step === 1 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-5">Chọn band IELTS bạn muốn đạt được. Hệ thống sẽ cá nhân hóa lộ trình học cho bạn.</p>
                            <div className="grid grid-cols-3 gap-2 mb-4">
                                {[5.0, 5.5, 6.0, 6.5, 7.0, 7.5, 8.0, 8.5, 9.0].map(b => (
                                    <button key={b} onClick={() => setTargetBand(b)}
                                        className={`py-3 rounded-xl text-lg font-bold border-2 transition-all ${targetBand === b ? "bg-blue-600 text-white border-blue-600 shadow-md scale-105" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                        {b}
                                    </button>
                                ))}
                            </div>
                            <p className="text-center text-blue-700 font-bold text-2xl my-2">🎯 Mục tiêu: {targetBand}</p>
                        </div>
                    )}

                    {/* Step 2: Occupation + Teacher sub-form */}
                    {step === 2 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-4">Giúp chúng tôi đề xuất lộ trình phù hợp với bạn.</p>
                            <div className="grid grid-cols-2 gap-3 mb-3">
                                {OCCUPATION_OPTIONS.map(opt => {
                                    const Icon = opt.icon;
                                    return (
                                        <button key={opt.value} onClick={() => { setOccupation(opt.value); setShowTeacherForm(false); setTeacherRegSent(false); }}
                                            className={`flex flex-col items-center gap-2 py-4 px-3 rounded-xl text-sm font-semibold border-2 transition-all ${occupation === opt.value ? "bg-blue-600 text-white border-blue-600 shadow-md" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                                            <Icon className="h-6 w-6" />
                                            {opt.label}
                                        </button>
                                    );
                                })}
                            </div>

                            {/* Teacher sub-form */}
                            {occupation === "teacher" && (
                                <div className="mt-3">
                                    {!showTeacherForm ? (
                                        <button onClick={() => setShowTeacherForm(true)}
                                            className="w-full py-2.5 px-4 bg-amber-50 border-2 border-amber-300 rounded-xl text-sm font-semibold text-amber-700 hover:bg-amber-100 transition-colors">
                                            📋 Đăng ký tài khoản Giáo viên
                                        </button>
                                    ) : teacherRegSent ? (
                                        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-center gap-3">
                                            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                                            <p className="text-sm text-emerald-700 font-medium">Đã gửi yêu cầu! Admin sẽ kích hoạt tài khoản giáo viên cho bạn sớm.</p>
                                        </div>
                                    ) : (
                                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 space-y-3">
                                            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">Form đăng ký Giáo viên</p>
                                            <input value={teacherFormData.name} onChange={e => setTeacherFormData(p => ({ ...p, name: e.target.value }))}
                                                placeholder="Họ và tên *" className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
                                            <input value={teacherFormData.schoolOrClass} onChange={e => setTeacherFormData(p => ({ ...p, schoolOrClass: e.target.value }))}
                                                placeholder="Tên trường / lớp dạy" className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white" />
                                            <select value={teacherFormData.role} onChange={e => setTeacherFormData(p => ({ ...p, role: e.target.value }))}
                                                className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-amber-400 bg-white">
                                                <option value="">Vai trò của bạn *</option>
                                                {TEACHER_ROLE_OPTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                                            </select>
                                            <button onClick={sendTeacherRegistration} disabled={sendingTeacherReg || !teacherFormData.name.trim() || !teacherFormData.role}
                                                className="w-full py-2 bg-amber-500 text-white rounded-lg text-sm font-semibold hover:bg-amber-600 disabled:opacity-50 flex items-center justify-center gap-2">
                                                {sendingTeacherReg ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi đăng ký"}
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Step 3: Referral Source (skippable) */}
                    {step === 3 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-4">Giúp chúng tôi biết kênh nào hiệu quả. <span className="text-slate-400">(Có thể bỏ qua)</span></p>
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

                    {/* Step 4: School (skippable) */}
                    {step === 4 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-4">Thông tin này giúp chúng tôi hiểu môi trường học tập của bạn. <span className="text-slate-400">(Có thể bỏ qua)</span></p>
                            <input autoFocus type="text" value={school} onChange={e => setSchool(e.target.value)}
                                placeholder="VD: Trường Đời, THPT Đoàn Kết-Hai Bà Trưng,..."
                                className="w-full border-2 border-slate-200 focus:border-blue-500 rounded-xl px-4 py-3 text-sm outline-none transition-colors mb-2" />
                            <p className="text-xs text-slate-400">💡 Gõ tên trường đang học, hoặc nơi làm việc nếu đã đi làm.</p>
                        </div>
                    )}

                    {/* Step 5: Current Band */}
                    {step === 5 && (
                        <div>
                            <p className="text-slate-500 text-sm mb-5">Nếu chưa thi IELTS lần nào, chọn "Chưa biết" — hệ thống sẽ đánh giá bằng bài test.</p>
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

                    {/* Navigation */}
                    <div className="mt-6 flex gap-3">
                        {step > 1 && (
                            <Button variant="outline" onClick={() => setStep(s => s - 1)} className="flex-1">← Quay lại</Button>
                        )}
                        {/* Skip button for steps 3 and 4 */}
                        {(step === 3 || step === 4) && (
                            <Button variant="outline" onClick={skip} className="px-4 text-slate-500">Bỏ qua</Button>
                        )}
                        <Button
                            onClick={goNext}
                            disabled={saving || !canNext()}
                            className="flex-1 bg-blue-600 hover:bg-blue-700 gap-2 disabled:opacity-50">
                            {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</> : step < totalSteps ? <>Tiếp theo <ChevronRight className="h-4 w-4" /></> : <><Zap className="h-4 w-4" /> Bắt đầu luyện thi!</>}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
