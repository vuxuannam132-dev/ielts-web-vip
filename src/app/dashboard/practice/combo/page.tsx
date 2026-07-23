"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, CheckCircle2, Award, AlertTriangle, BookOpen, Headphones, Edit3, Mic } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

// Sub-components would ideally be imported, but since we have standalone pages for them, 
// we'll build a simplified launcher and state manager here.

export default function ComboPractice() {
    const [combos, setCombos] = useState<any[]>([]);
    const [selected, setSelected] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [activeSkill, setActiveSkill] = useState<'READING'|'LISTENING'|'WRITING'|'SPEAKING'|null>(null);
    
    // Status tracking for the current combo
    const [completedSkills, setCompletedSkills] = useState<Record<string, any>>({});
    const [isAttemptingExit, setIsAttemptingExit] = useState(false);
    
    const router = useRouter();

    useEffect(() => {
        fetch("/api/practice?skill=COMBO")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length) {
                    setCombos(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    const handleExitClick = (e: React.MouseEvent) => {
        if (selected && Object.keys(completedSkills).length > 0 && Object.keys(completedSkills).length < 4) {
            e.preventDefault();
            setIsAttemptingExit(true);
        }
    };

    const confirmExit = () => {
        router.push('/dashboard');
    };

    if (loading) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent" /></div>;

    if (!combos.length) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center bg-slate-50">
                <div className="text-center max-w-md mx-4">
                    <div className="w-20 h-20 bg-indigo-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><Award className="h-10 w-10 text-indigo-500" /></div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Chưa có bài Combo</h2>
                    <p className="text-slate-500 mb-6">Hệ thống chưa có bài test Combo 4 kỹ năng nào.</p>
                    <Link href="/dashboard"><Button>← Về Dashboard</Button></Link>
                </div>
            </div>
        );
    }

    if (!selected) {
        return (
            <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-indigo-50/20 py-10 px-4">
                <div className="max-w-4xl mx-auto space-y-8">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-white rounded-lg transition"><ArrowLeft className="h-6 w-6 text-slate-600" /></Link>
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900">IELTS Full Combo Test</h1>
                            <p className="text-slate-500">Làm trọn bộ 4 kỹ năng để đánh giá toàn diện năng lực của bạn.</p>
                        </div>
                    </div>
                    
                    <div className="grid md:grid-cols-2 gap-6">
                        {combos.map(c => (
                            <div key={c.id} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition cursor-pointer" onClick={() => setSelected(c)}>
                                <div className="flex justify-between items-start mb-4">
                                    <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">FULL COMBO</span>
                                    <span className="text-xs text-slate-400 font-mono">{new Date(c.createdAt).toLocaleDateString('vi-VN')}</span>
                                </div>
                                <h3 className="text-xl font-bold text-slate-800 mb-2">{c.title}</h3>
                                <p className="text-sm text-slate-500 mb-6">{c.description || 'Bài test đánh giá 4 kỹ năng chuẩn IELTS'}</p>
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-5">
                                    Bắt đầu làm bài
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Inside a selected Combo
    const isCompleted = (skill: string) => !!completedSkills[skill];
    const canSubmit = Object.keys(completedSkills).length === 4;

    const handleSubmitCombo = async () => {
        alert("Tính năng tổng hợp và chấm điểm điểm số 4 kỹ năng đang được xử lý...");
        // In a real scenario, we'd send all completedSkills data to a unified endpoint
        // For now, we simulate success
        setCompletedSkills({ ...completedSkills, submitted: true });
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 p-4 sm:p-8">
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold text-slate-800">{selected.title}</h1>
                        <p className="text-sm text-slate-500">Hoàn thành cả 4 kỹ năng để nhận Band điểm tổng.</p>
                    </div>
                    <Button variant="outline" onClick={handleExitClick} className="text-slate-600 border-slate-300">
                        <ArrowLeft className="h-4 w-4 mr-2" /> Về Dashboard
                    </Button>
                </div>

                {completedSkills.submitted ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-10 text-center space-y-4">
                        <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Award className="h-12 w-12" />
                        </div>
                        <h2 className="text-3xl font-bold text-emerald-800">Chúc mừng bạn đã hoàn thành!</h2>
                        <p className="text-emerald-700">Giám khảo AI đang đánh giá chi tiết bài làm của bạn...</p>
                        <div className="pt-6">
                            <Link href="/dashboard"><Button className="bg-emerald-600 hover:bg-emerald-700">Quay về trang chủ</Button></Link>
                        </div>
                    </div>
                ) : (
                    <div className="grid sm:grid-cols-2 gap-6">
                        {[
                            { id: 'reading', label: 'Reading', icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200' },
                            { id: 'listening', label: 'Listening', icon: Headphones, color: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200' },
                            { id: 'writing', label: 'Writing', icon: Edit3, color: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200' },
                            { id: 'speaking', label: 'Speaking', icon: Mic, color: 'text-rose-600', bg: 'bg-rose-100', border: 'border-rose-200' },
                        ].map(s => {
                            const done = isCompleted(s.id);
                            return (
                                <div key={s.id} className={`p-6 rounded-2xl border ${done ? 'bg-slate-50 border-emerald-200' : 'bg-white border-slate-200 shadow-sm'} flex flex-col items-center text-center space-y-4`}>
                                    <div className={`w-16 h-16 rounded-full flex items-center justify-center ${done ? 'bg-emerald-100 text-emerald-600' : s.bg + ' ' + s.color}`}>
                                        {done ? <CheckCircle2 className="h-8 w-8" /> : <s.icon className="h-8 w-8" />}
                                    </div>
                                    <h3 className="text-xl font-bold text-slate-800">{s.label}</h3>
                                    {done ? (
                                        <span className="text-sm font-bold text-emerald-600 px-3 py-1 bg-emerald-50 rounded-full">Đã hoàn thành</span>
                                    ) : (
                                        <Button 
                                            onClick={() => {
                                                // MOCK: instantly mark as done for demo purposes. 
                                                // Ideally, this redirects to a sub-page or opens a modal to take the test
                                                alert(`Mở giao diện làm bài ${s.label}... (Tính năng đang được tách trang)`);
                                                setCompletedSkills({...completedSkills, [s.id]: true});
                                            }} 
                                            className="w-full bg-slate-900 text-white"
                                        >
                                            Bắt đầu làm bài
                                        </Button>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}

                {!completedSkills.submitted && (
                    <div className="mt-8 flex justify-end">
                        <Button 
                            onClick={handleSubmitCombo}
                            disabled={!canSubmit} 
                            className={`px-8 py-4 text-lg font-bold rounded-xl shadow-lg transition-all ${canSubmit ? 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105 text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                        >
                            Chấm Điểm Toàn Bộ Combo
                        </Button>
                    </div>
                )}
            </div>

            {/* Exit Warning Popup */}
            {isAttemptingExit && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-200">
                        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-rose-500 to-orange-500"></div>
                        <div className="w-16 h-16 bg-rose-100 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-6">
                            <AlertTriangle className="h-8 w-8" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 text-center mb-3">Bạn định từ bỏ thật sao?</h3>
                        <p className="text-slate-600 text-center mb-8 leading-relaxed font-medium">
                            "Kẻ bỏ cuộc không bao giờ chiến thắng, và người chiến thắng không bao giờ bỏ cuộc."<br/><br/>
                            Bạn đã hoàn thành một nửa chặng đường. Hãy nỗ lực hết mình vì mục tiêu Band điểm mơ ước nhé!
                        </p>
                        <div className="flex flex-col gap-3">
                            <Button onClick={() => setIsAttemptingExit(false)} className="w-full bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold py-4 text-lg shadow-lg hover:shadow-xl transition-all transform hover:-translate-y-1">
                                Tiếp tục chiến đấu! 💪
                            </Button>
                            <Button onClick={confirmExit} variant="ghost" className="w-full text-slate-400 hover:text-rose-500 hover:bg-rose-50">
                                Tôi vẫn muốn thoát
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
