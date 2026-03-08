"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, CheckCircle2, XCircle, Clock } from "lucide-react";
import Link from "next/link";

interface Question {
    id: number;
    type: "fill" | "mcq" | "tf";
    text: string;
    options?: string[];
    answer: string;
    hint?: string;
}

interface PracticeSet {
    id: string;
    title: string;
    description?: string;
    content: string;
}

export default function ReadingPractice() {
    const [sets, setSets] = useState<PracticeSet[]>([]);
    const [selected, setSelected] = useState<PracticeSet | null>(null);
    const [parsed, setParsed] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(60 * 60);
    const [timerRunning, setTimerRunning] = useState(false);

    useEffect(() => {
        fetch("/api/practice?skill=reading")
            .then(r => r.json())
            .then(data => { if (Array.isArray(data) && data.length) { setSets(data); setSelected(data[0]); } setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) return;
        try { setParsed(JSON.parse(selected.content || "{}")); } catch { setParsed({}); }
        setAnswers({}); setSubmitted(false); setEvaluation(null);
    }, [selected]);

    useEffect(() => {
        if (!timerRunning || timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timerRunning, timeLeft]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
    const getAnswer = (qId: number) => answers[`${selected?.id}-${qId}`] || "";
    const handleAnswer = (qId: number, val: string) => { if (!submitted) setAnswers(p => ({ ...p, [`${selected?.id}-${qId}`]: val })); };
    const passages: any[] = parsed?.passages || (parsed?.passage ? [{ title: parsed.title, text: parsed.passage, questions: parsed.questions || [] }] : []);
    const allQuestions: Question[] = passages.flatMap((p: any) => p.questions || []);

    const getWrong = (qId: number) => evaluation?.wrongAnswers?.find((w: any) => w.questionId === qId);
    const isCorrect = (qId: number) => !getWrong(qId) && getAnswer(qId) !== "";

    const handleSubmit = async () => {
        setSubmitting(true); setTimerRunning(false);
        const formattedAnswers: Record<number, string> = {};
        allQuestions.forEach(q => { formattedAnswers[q.id] = getAnswer(q.id); });
        try {
            const res = await fetch("/api/ai/reading", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ practiceSetId: selected?.id, questions: allQuestions.map(q => ({ id: q.id, text: q.text, answerKey: q.answer, type: q.type })), userAnswers: formattedAnswers })
            });
            const data = await res.json();
            if (data.success) { setEvaluation(data.evaluation); setSubmitted(true); }
            else alert("Lỗi: " + data.error);
        } catch { alert("Lỗi hệ thống."); }
        finally { setSubmitting(false); }
    };

    if (loading) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" /></div>;

    if (!sets.length || !selected) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-center max-w-md mx-4">
                    <div className="w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><BookOpen className="h-10 w-10 text-blue-500" /></div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Chưa có bài Reading</h2>
                    <p className="text-slate-500 mb-6">Admin chưa đăng bài tập nào. Quay lại sau nhé!</p>
                    <Link href="/dashboard"><Button>← Về Dashboard</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-blue-50/20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center"><BookOpen className="h-5 w-5 text-blue-600" /></div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Reading Practice</h1>
                            <p className="text-sm text-slate-500">Luyện đọc IELTS</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-mono">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <span className={`font-bold ${timeLeft < 300 ? "text-red-600" : ""}`}>{formatTime(timeLeft)}</span>
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {sets.map(s => (
                        <button key={s.id} onClick={() => setSelected(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${selected?.id === s.id ? "bg-blue-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-blue-50"}`}>
                            {s.title}
                        </button>
                    ))}
                </div>

                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Passage */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                        {passages.map((p: any, i: number) => (
                            <div key={i}>
                                {p.title && <h3 className="font-bold text-slate-800 mb-3">{p.title}</h3>}
                                <p className="text-slate-700 leading-relaxed text-sm whitespace-pre-line">{p.text || p.passage || "Không có nội dung."}</p>
                            </div>
                        ))}
                    </div>

                    {/* Questions */}
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <div className="font-bold text-slate-800">Questions ({allQuestions.length})</div>
                        {allQuestions.map((q, idx) => (
                            <div key={q.id} className={`p-3 rounded-lg border ${submitted ? (isCorrect(q.id) ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200") : "bg-slate-50 border-slate-200"}`}>
                                <p className="text-sm font-medium text-slate-800 mb-2">{idx + 1}. {q.text}</p>
                                {q.type === "fill" && <input type="text" value={getAnswer(q.id)} onChange={e => handleAnswer(q.id, e.target.value)} disabled={submitted} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="Nhập câu trả lời..." />}
                                {q.type === "mcq" && q.options?.map((opt, i) => (
                                    <label key={i} className="flex items-center gap-2 p-2 rounded cursor-pointer hover:bg-white/50">
                                        <input type="radio" name={`q-${selected?.id}-${q.id}`} checked={getAnswer(q.id) === opt} onChange={() => handleAnswer(q.id, opt)} disabled={submitted} />
                                        <span className="text-sm">{String.fromCharCode(65 + i)}. {opt}</span>
                                    </label>
                                ))}
                                {q.type === "tf" && (
                                    <div className="flex gap-2 flex-wrap">
                                        {["TRUE", "FALSE", "NOT GIVEN"].map(opt => (
                                            <button key={opt} onClick={() => handleAnswer(q.id, opt)} disabled={submitted}
                                                className={`px-3 py-1 rounded text-xs font-bold border ${getAnswer(q.id) === opt ? "bg-blue-600 text-white" : "bg-white text-slate-600 border-slate-300"}`}>{opt}</button>
                                        ))}
                                    </div>
                                )}
                                {submitted && (
                                    isCorrect(q.id)
                                        ? <div className="mt-1 text-xs text-emerald-600 flex items-center gap-1"><CheckCircle2 className="h-3 w-3" /> Đúng</div>
                                        : <div className="mt-1 text-xs text-red-600 flex items-center gap-1"><XCircle className="h-3 w-3" /> Sai — Đáp án: <strong>{q.answer}</strong></div>
                                )}
                            </div>
                        ))}
                        {!submitted ? (
                            <Button onClick={() => { if (!timerRunning) { setTimerRunning(true); } handleSubmit(); }} disabled={submitting} className="w-full bg-emerald-600 hover:bg-emerald-700 mt-4 disabled:opacity-70">
                                {submitting ? "Đang chấm điểm..." : "Nộp bài"}
                            </Button>
                        ) : (
                            <div className="flex gap-3 mt-4">
                                <Button variant="outline" className="flex-1" onClick={() => { setSubmitted(false); setEvaluation(null); setAnswers({}); }}>Làm lại</Button>
                                <Link href="/dashboard" className="flex-1"><Button className="w-full bg-blue-600">Về Dashboard</Button></Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
