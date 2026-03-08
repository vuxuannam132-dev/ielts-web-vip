"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PenTool, Clock, FileText, Send, Loader2, ChevronDown, ChevronUp, Star, ArrowLeft } from "lucide-react";
import Link from "next/link";

const WRITING_PROMPTS = [
    {
        id: 1, type: "Task 2", topic: "Technology & Society",
        title: "Impact of Artificial Intelligence on Employment",
        prompt: "Some people believe that the development of artificial intelligence will lead to widespread unemployment. Others argue that AI will create more jobs than it displaces. Discuss both views and give your own opinion.",
        tip: "Write at least 250 words. Structure: Introduction → Body 1 (View A) → Body 2 (View B) → Your Opinion → Conclusion."
    },
    {
        id: 2, type: "Task 2", topic: "Education",
        title: "Online vs Traditional Education",
        prompt: "With the rise of online learning platforms, some people think traditional classroom education will become obsolete. To what extent do you agree or disagree?",
        tip: "Write at least 250 words. Clearly state your position in the introduction."
    },
    {
        id: 3, type: "Task 1", topic: "Report Writing",
        title: "Bar Chart: Energy Consumption",
        prompt: "The bar chart below shows the energy consumption in four countries from 2000 to 2020. Summarize the information by selecting and reporting the main features, and make comparisons where relevant.",
        tip: "Write at least 150 words. Describe trends, compare data points, and highlight key features."
    }
];

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
    const [selectedPrompt, setSelectedPrompt] = useState(WRITING_PROMPTS[0]);
    const [essay, setEssay] = useState("");
    const [timeLeft, setTimeLeft] = useState(40 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showPromptList, setShowPromptList] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [feedback, setFeedback] = useState<AIFeedback | null>(null);

    const wordCount = essay.trim() ? essay.trim().split(/\s+/).length : 0;

    useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const formatTime = useCallback((s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    }, []);

    const handleStartWriting = () => {
        setIsTimerRunning(true);
        setFeedback(null);
    };

    const handleSubmit = async () => {
        if (wordCount < 50) return alert("Bài viết của bạn quá ngắn. Vui lòng viết ít nhất 50 từ.");
        setIsSubmitting(true);
        setIsTimerRunning(false);

        try {
            const res = await fetch("/api/ai/writing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    taskNumber: selectedPrompt.type === 'Task 1' ? 1 : 2,
                    prompt: selectedPrompt.prompt,
                    userText: essay,
                    practiceSetId: null
                })
            });
            const data = await res.json();
            if (res.ok) {
                setFeedback(data.evaluation);
            } else {
                alert("Lỗi: " + data.error);
                setIsTimerRunning(true);
            }
        } catch (error) {
            alert("Lỗi kết nối khi chấm điểm");
            setIsTimerRunning(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getScoreColor = (score: number) => {
        if (score >= 7) return "text-emerald-600 bg-emerald-50 border-emerald-200";
        if (score >= 6) return "text-blue-600 bg-blue-50 border-blue-200";
        if (score >= 5) return "text-amber-600 bg-amber-50 border-amber-200";
        return "text-red-600 bg-red-50 border-red-200";
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-indigo-50/20">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

                {/* Header */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-200 rounded-lg transition">
                            <ArrowLeft className="h-5 w-5 text-slate-600" />
                        </Link>
                        <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                            <PenTool className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Writing Practice</h1>
                            <p className="text-sm text-slate-500">Luyện viết IELTS với AI chấm điểm</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg border font-mono text-lg ${timeLeft < 300 && isTimerRunning ? 'bg-red-50 border-red-200 text-red-600' : 'bg-white border-slate-200 text-slate-700'}`}>
                            <Clock className="h-4 w-4" />
                            <span className="font-bold">{formatTime(timeLeft)}</span>
                        </div>
                        <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white border border-slate-200">
                            <FileText className="h-4 w-4 text-slate-500" />
                            <span className={`font-bold ${wordCount >= 250 ? 'text-emerald-600' : wordCount >= 150 ? 'text-blue-600' : 'text-slate-600'}`}>{wordCount}</span>
                            <span className="text-slate-400 text-sm">từ</span>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                    {/* Left: Prompt + Editor */}
                    <div className="lg:col-span-3 space-y-4">

                        {/* Prompt Selector */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            <button
                                onClick={() => setShowPromptList(!showPromptList)}
                                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition"
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-2 py-1 rounded">{selectedPrompt.type}</span>
                                    <span className="text-xs text-slate-400">{selectedPrompt.topic}</span>
                                </div>
                                {showPromptList ? <ChevronUp className="h-4 w-4 text-slate-400" /> : <ChevronDown className="h-4 w-4 text-slate-400" />}
                            </button>

                            {showPromptList && (
                                <div className="border-t border-slate-100 divide-y divide-slate-100">
                                    {WRITING_PROMPTS.map(p => (
                                        <button key={p.id} onClick={() => { setSelectedPrompt(p); setShowPromptList(false); }}
                                            className={`w-full text-left p-4 hover:bg-blue-50/50 transition ${selectedPrompt.id === p.id ? 'bg-blue-50' : ''}`}>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-xs font-bold text-indigo-600">{p.type}</span>
                                                <span className="text-xs text-slate-400">{p.topic}</span>
                                            </div>
                                            <p className="text-sm font-medium text-slate-800">{p.title}</p>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>

                        {/* Prompt Display */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h2 className="text-lg font-bold text-slate-900 mb-3">{selectedPrompt.title}</h2>
                            <p className="text-slate-700 leading-relaxed mb-4">{selectedPrompt.prompt}</p>
                            <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                                <p className="text-sm text-amber-700"><strong>💡 Tip:</strong> {selectedPrompt.tip}</p>
                            </div>
                        </div>

                        {/* Text Editor */}
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                            {!isTimerRunning && !feedback ? (
                                <div className="p-12 text-center">
                                    <PenTool className="h-12 w-12 text-indigo-300 mx-auto mb-4" />
                                    <h3 className="text-lg font-semibold text-slate-700 mb-2">Sẵn sàng viết?</h3>
                                    <p className="text-sm text-slate-500 mb-6">Bấm nút bên dưới để bắt đầu đồng hồ và viết bài.</p>
                                    <Button onClick={handleStartWriting} className="bg-indigo-600 hover:bg-indigo-700 px-8 py-3">
                                        Bắt đầu viết
                                    </Button>
                                </div>
                            ) : (
                                <>
                                    <textarea
                                        value={essay}
                                        onChange={(e) => setEssay(e.target.value)}
                                        disabled={isSubmitting || !!feedback}
                                        placeholder="Bắt đầu viết essay của bạn ở đây..."
                                        className="w-full min-h-[400px] p-6 text-slate-800 leading-relaxed resize-none focus:outline-none border-none text-base disabled:bg-slate-50"
                                    />
                                    {!feedback && (
                                        <div className="border-t border-slate-100 p-4 flex items-center justify-between bg-slate-50">
                                            <p className="text-sm text-slate-500">
                                                {wordCount < 250 ? `Cần thêm ${250 - wordCount} từ nữa để đạt yêu cầu cơ bản` : '✅ Đã đạt yêu cầu tối thiểu 250 từ'}
                                            </p>
                                            <Button onClick={handleSubmit} disabled={isSubmitting || wordCount < 50} className="bg-emerald-600 hover:bg-emerald-700 flex items-center gap-2">
                                                {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> AI đang chấm...</> : <><Send className="h-4 w-4" /> Nộp bài</>}
                                            </Button>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Right: AI Feedback Panel */}
                    <div className="lg:col-span-2 space-y-4">
                        {feedback ? (
                            <>
                                {/* Overall Score */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 text-center">
                                    <p className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-2">Band Score</p>
                                    <div className="inline-flex items-center justify-center h-20 w-20 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white mx-auto">
                                        <span className="text-3xl font-bold">{feedback.bandScore}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-1 mt-3">
                                        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(i => (
                                            <Star key={i} className={`h-4 w-4 ${i <= Math.round(feedback.bandScore) ? 'text-yellow-400 fill-yellow-400' : 'text-slate-200'}`} />
                                        ))}
                                    </div>
                                </div>

                                {/* Sub-scores */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                    <h3 className="text-sm font-bold text-slate-700 mb-3">Điểm chi tiết</h3>
                                    <div className="space-y-2">
                                        {[
                                            { label: "Task Achievement", score: feedback.taskAchievementScore, abbr: "TA" },
                                            { label: "Coherence & Cohesion", score: feedback.cohesionScore, abbr: "CC" },
                                            { label: "Lexical Resource", score: feedback.vocabularyScore, abbr: "LR" },
                                            { label: "Grammar", score: feedback.grammarScore, abbr: "GRA" },
                                        ].map(item => (
                                            <div key={item.abbr} className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-xs font-bold text-slate-400 w-8">{item.abbr}</span>
                                                    <span className="text-sm text-slate-600">{item.label}</span>
                                                </div>
                                                <span className={`text-sm font-bold px-2 py-0.5 rounded border ${getScoreColor(item.score)}`}>{item.score}</span>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Score Bar */}
                                    <div className="mt-4 space-y-1.5">
                                        {[
                                            { label: "TA", score: feedback.taskAchievementScore, color: "bg-blue-500" },
                                            { label: "CC", score: feedback.cohesionScore, color: "bg-emerald-500" },
                                            { label: "LR", score: feedback.vocabularyScore, color: "bg-violet-500" },
                                            { label: "GRA", score: feedback.grammarScore, color: "bg-amber-500" },
                                        ].map(item => (
                                            <div key={item.label} className="flex items-center gap-2">
                                                <span className="text-xs text-slate-400 w-7">{item.label}</span>
                                                <div className="flex-1 bg-slate-100 rounded-full h-2">
                                                    <div className={`${item.color} h-2 rounded-full transition-all`} style={{ width: `${(item.score / 9) * 100}%` }} />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                {/* Detailed Feedback */}
                                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-4">
                                    <h3 className="text-sm font-bold text-slate-700 mb-3 md:mb-4">📝 Nhận xét chi tiết từ AI</h3>
                                    <div
                                        className="prose prose-sm max-w-none text-slate-700 leading-relaxed space-y-3 mb-6 font-medium"
                                        dangerouslySetInnerHTML={{ __html: feedback.feedback }}
                                    />

                                    {feedback.improvements && feedback.improvements.length > 0 && (
                                        <>
                                            <h4 className="text-sm font-bold text-slate-700 mb-3 border-t border-slate-100 pt-4">Gợi ý cách sửa (Actionable Improvements):</h4>
                                            <ul className="space-y-3">
                                                {feedback.improvements.map((imp: string, idx: number) => (
                                                    <li key={idx} className="flex gap-3 bg-blue-50/50 p-4 rounded-xl border border-blue-100/50 shadow-sm items-start">
                                                        <span className="text-blue-600 font-bold bg-blue-100 h-6 w-6 flex items-center justify-center rounded-full text-xs shrink-0 mt-0.5">{idx + 1}</span>
                                                        <div
                                                            className="text-sm text-slate-700 leading-relaxed font-medium"
                                                            dangerouslySetInnerHTML={{ __html: imp }}
                                                        />
                                                    </li>
                                                ))}
                                            </ul>
                                        </>
                                    )}
                                </div>

                                {/* Actions */}
                                <div className="flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => { setFeedback(null); setEssay(""); setTimeLeft(40 * 60); setIsTimerRunning(false); }}>
                                        Viết lại
                                    </Button>
                                    <Link href="/dashboard" className="flex-1">
                                        <Button className="w-full bg-blue-600 hover:bg-blue-700">Về Dashboard</Button>
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <h3 className="text-sm font-bold text-slate-700 mb-3">🤖 AI Examiner</h3>
                                <p className="text-sm text-slate-500 leading-relaxed">
                                    Sau khi bạn nộp bài, AI sẽ chấm điểm theo 4 tiêu chí IELTS Writing:
                                </p>
                                <ul className="mt-3 space-y-2 text-sm text-slate-600">
                                    <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-blue-500" /> Task Achievement (TR)</li>
                                    <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Coherence & Cohesion (CC)</li>
                                    <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-violet-500" /> Lexical Resource (LR)</li>
                                    <li className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-amber-500" /> Grammatical Range (GRA)</li>
                                </ul>
                                <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-xs text-blue-700">💡 Mẹo: Viết ít nhất 250 từ cho Task 2, 150 từ cho Task 1. Nên viết trong 40 phút.</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
