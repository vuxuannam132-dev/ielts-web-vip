"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PenTool, Clock, FileText, Send, Loader2, ChevronDown, ChevronUp, Star, ArrowLeft, BookOpen } from "lucide-react";
import Link from "next/link";

interface PracticeSet {
    id: string;
    title: string;
    description?: string;
    content: string;
}

interface AIFeedback {
    bandScore: number;
    taskAchievementScore: number;
    cohesionScore: number;
    vocabularyScore: number;
    grammarScore: number;
    feedback: string;
    improvements?: string[];
}

export default function WritingPractice() {
    const [sets, setSets] = useState<PracticeSet[]>([]);
    const [selected, setSelected] = useState<PracticeSet | null>(null);
    const [parsed, setParsed] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [wordCount, setWordCount] = useState(0);
    const [essay, setEssay] = useState("");
    const [timeLeft, setTimeLeft] = useState(60 * 60);
    const [timerRunning, setTimerRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<AIFeedback | null>(null);
    const [showFeedback, setShowFeedback] = useState(false);

    useEffect(() => {
        fetch("/api/practice?skill=writing")
            .then(r => r.json())
            .then(data => { if (Array.isArray(data) && data.length) { setSets(data); setSelected(data[0]); } setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) return;
        try { setParsed(JSON.parse(selected.content || "{}")); } catch { setParsed({}); }
        setEssay(""); setFeedback(null); setWordCount(0); setShowFeedback(false);
    }, [selected]);

    useEffect(() => {
        if (!timerRunning || timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timerRunning, timeLeft]);

    const handleEssayChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
        const text = e.target.value;
        setEssay(text);
        setWordCount(text.trim() ? text.trim().split(/\s+/).length : 0);
        if (!timerRunning && text.length > 0) setTimerRunning(true);
    }, [timerRunning]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const getMinWords = () => {
        const type = parsed?.task1 ? "Task 1" : "Task 2";
        return type === "Task 1" ? 150 : 250;
    };

    const handleSubmit = async () => {
        if (!essay.trim()) return;
        setIsSubmitting(true); setTimerRunning(false);
        try {
            const res = await fetch("/api/ai/writing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ practiceSetId: selected?.id, prompt: parsed?.task2?.prompt || parsed?.task1?.prompt || parsed?.prompt || "", essay })
            });
            const data = await res.json();
            if (data.success || data.evaluation) {
                setFeedback(data.evaluation || data.feedback);
                setShowFeedback(true);
            } else { alert("Lỗi: " + data.error); }
        } catch { alert("Lỗi hệ thống."); }
        finally { setIsSubmitting(false); }
    };

    if (loading) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" /></div>;

    if (!sets.length || !selected) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-center max-w-md mx-4">
                    <div className="w-20 h-20 bg-purple-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><PenTool className="h-10 w-10 text-purple-500" /></div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Chưa có bài Writing</h2>
                    <p className="text-slate-500 mb-6">Admin chưa đăng bài tập nào. Quay lại sau nhé!</p>
                    <Link href="/dashboard"><Button>← Về Dashboard</Button></Link>
                </div>
            </div>
        );
    }

    const taskType = parsed?.task1 ? "Task 1" : "Task 2";
    const prompt = parsed?.task2?.prompt || parsed?.task1?.prompt || parsed?.prompt || "Không có đề bài.";
    const imageUrl = parsed?.task1?.imageUrl;
    const tip = parsed?.task2?.tip || parsed?.task1?.tip || `Viết ít nhất ${getMinWords()} từ.`;
    const minWords = getMinWords();

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-purple-50/20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center"><PenTool className="h-5 w-5 text-purple-600" /></div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Writing Practice</h1>
                            <p className="text-sm text-slate-500">Viết bài IELTS với AI chấm điểm</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-mono">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className={`font-bold ${timeLeft < 300 ? "text-red-600" : ""}`}>{formatTime(timeLeft)}</span>
                    </div>
                </div>

                {/* Set selector */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {sets.map(s => (
                        <button key={s.id} onClick={() => setSelected(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${selected?.id === s.id ? "bg-purple-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-purple-50"}`}>
                            {s.title}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-5 gap-6">
                    {/* Prompt */}
                    <div className="lg:col-span-2 space-y-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2 py-0.5 rounded">{taskType}</span>
                                <span className="text-xs text-slate-500">{selected.description}</span>
                            </div>
                            <h3 className="font-bold text-slate-900 mb-2">{selected.title}</h3>
                            <p className="text-sm text-slate-700 leading-relaxed">{prompt}</p>
                            {imageUrl && <img src={imageUrl} alt="Task 1 chart" className="mt-3 rounded-lg border max-w-full" />}
                            <div className="mt-4 bg-amber-50 rounded-lg p-3 text-xs text-amber-800 border border-amber-200">
                                💡 {tip}
                            </div>
                        </div>
                    </div>

                    {/* Writing area */}
                    <div className="lg:col-span-3 space-y-4">
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-slate-600">Bài làm của bạn</span>
                                <div className="flex items-center gap-2">
                                    <span className={`text-sm font-bold px-2 py-0.5 rounded ${wordCount >= minWords ? "text-emerald-700 bg-emerald-100" : "text-amber-700 bg-amber-100"}`}>
                                        {wordCount} / {minWords}+ từ
                                    </span>
                                </div>
                            </div>
                            <textarea
                                value={essay}
                                onChange={handleEssayChange}
                                disabled={isSubmitting}
                                placeholder={`Bắt đầu viết ${taskType} của bạn tại đây...`}
                                className="w-full h-80 resize-none border-0 outline-none text-slate-800 text-sm leading-relaxed placeholder:text-slate-300 bg-transparent"
                            />
                            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between">
                                <p className="text-xs text-slate-400">AI sẽ chấm theo 4 tiêu chí: Task, Coherence, Vocabulary, Grammar</p>
                                <Button onClick={handleSubmit} disabled={isSubmitting || wordCount < Math.floor(minWords * 0.5)} className="bg-purple-600 hover:bg-purple-700 gap-2 disabled:opacity-50">
                                    {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang chấm...</> : <><Send className="h-4 w-4" /> Nộp bài</>}
                                </Button>
                            </div>
                        </div>

                        {/* Feedback */}
                        {feedback && showFeedback && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="font-bold text-slate-900 flex items-center gap-2"><Star className="h-5 w-5 text-amber-500" /> AI Examiner Feedback</h3>
                                    <button onClick={() => setShowFeedback(!showFeedback)} className="p-1 hover:bg-slate-100 rounded"><ChevronUp className="h-4 w-4" /></button>
                                </div>
                                <div className="text-center mb-5">
                                    <div className="text-4xl font-black text-purple-700">{feedback.bandScore}</div>
                                    <div className="text-sm text-slate-500">Band Score</div>
                                </div>
                                <div className="grid grid-cols-2 gap-3 mb-5">
                                    {[
                                        { label: "Task Achievement", score: feedback.taskAchievementScore },
                                        { label: "Coherence & Cohesion", score: feedback.cohesionScore },
                                        { label: "Lexical Resource", score: feedback.vocabularyScore },
                                        { label: "Grammar", score: feedback.grammarScore },
                                    ].map(item => (
                                        <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                                            <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                                            <div className="font-bold text-lg">{item.score}</div>
                                            <div className="h-1.5 bg-slate-200 rounded-full mt-1"><div className="h-full bg-purple-500 rounded-full" style={{ width: `${(item.score / 9) * 100}%` }} /></div>
                                        </div>
                                    ))}
                                </div>
                                <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: feedback.feedback }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
