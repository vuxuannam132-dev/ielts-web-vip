"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
    Headphones, Clock, CheckCircle2, XCircle, ArrowLeft, Volume2,
    Play, Pause, RotateCcw, RotateCw, BookOpen, AlertCircle
} from "lucide-react";
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
    content: string; // JSON
}

export default function ListeningPractice() {
    const [sets, setSets] = useState<PracticeSet[]>([]);
    const [selectedSet, setSelectedSet] = useState<PracticeSet | null>(null);
    const [parsedContent, setParsedContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [audioDuration, setAudioDuration] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const audioRef = React.useRef<HTMLAudioElement>(null);

    useEffect(() => {
        fetch("/api/practice?skill=listening")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data) && data.length > 0) {
                    setSets(data);
                    setSelectedSet(data[0]);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedSet) return;
        try {
            setParsedContent(JSON.parse(selectedSet.content || "{}"));
        } catch {
            setParsedContent({});
        }
        setAnswers({});
        setIsSubmitted(false);
        setEvaluation(null);
        setAudioProgress(0);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.load();
    }, [selectedSet]);

    useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const handlePlayPause = () => {
        if (!audioRef.current) return;
        if (isPlaying) { audioRef.current.pause(); }
        else { audioRef.current.play(); if (!isTimerRunning) setIsTimerRunning(true); }
        setIsPlaying(!isPlaying);
    };

    const skipAudio = (s: number) => {
        if (audioRef.current) {
            audioRef.current.currentTime = Math.max(0, Math.min(audioRef.current.currentTime + s, audioDuration));
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

    const allQuestions: Question[] = parsedContent?.parts
        ? parsedContent.parts.flatMap((p: any) => p.questions || [])
        : parsedContent?.questions || [];

    const getAnswer = (qId: number) => answers[`${selectedSet?.id}-${qId}`] || "";
    const handleAnswer = (qId: number, val: string) => {
        if (isSubmitted || isSubmitting) return;
        setAnswers(prev => ({ ...prev, [`${selectedSet?.id}-${qId}`]: val }));
    };

    const getWrongAnswer = (qId: number) => evaluation?.wrongAnswers?.find((w: any) => w.questionId === qId);
    const isCorrect = (qId: number) => !getWrongAnswer(qId) && getAnswer(qId) !== "";

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setIsTimerRunning(false);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        const formattedAnswers: Record<number, string> = {};
        allQuestions.forEach(q => { formattedAnswers[q.id] = getAnswer(q.id); });

        try {
            const res = await fetch("/api/ai/listening", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    practiceSetId: selectedSet?.id,
                    questions: allQuestions.map(q => ({ id: q.id, text: q.text, answerKey: q.answer, type: q.type })),
                    userAnswers: formattedAnswers
                })
            });
            const data = await res.json();
            if (data.success) { setEvaluation(data.evaluation); setIsSubmitted(true); }
            else { alert("Lỗi: " + data.error); setIsTimerRunning(true); }
        } catch { alert("Lỗi hệ thống."); setIsTimerRunning(true); }
        finally { setIsSubmitting(false); }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent mx-auto mb-4" />
                    <p className="text-slate-600">Đang tải bài luyện tập...</p>
                </div>
            </div>
        );
    }

    if (!sets.length || !selectedSet) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-center max-w-md mx-4">
                    <div className="w-20 h-20 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <BookOpen className="h-10 w-10 text-orange-500" />
                    </div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Chưa có bài Listening</h2>
                    <p className="text-slate-500 mb-6">Admin chưa đăng bài tập nào. Quay lại sau nhé!</p>
                    <Link href="/dashboard"><Button>← Về Dashboard</Button></Link>
                </div>
            </div>
        );
    }

    const audioUrl = parsedContent?.audioUrl || "";

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-orange-50/20">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center"><Headphones className="h-5 w-5 text-orange-600" /></div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Listening Practice</h1>
                            <p className="text-sm text-slate-500">Luyện nghe IELTS với câu hỏi đa dạng</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-mono">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className={`font-bold ${timeLeft < 120 ? "text-red-600" : ""}`}>{formatTime(timeLeft)}</span>
                        </div>
                        {isSubmitted && evaluation && (
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold">
                                {evaluation.totalCorrect}/{allQuestions.length} đúng — Band {evaluation.bandScore}
                            </div>
                        )}
                    </div>
                </div>

                {/* Section Tabs */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {sets.map(s => (
                        <button key={s.id}
                            disabled={isSubmitting}
                            onClick={() => setSelectedSet(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition disabled:opacity-50 ${selectedSet?.id === s.id ? "bg-orange-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-orange-50"}`}>
                            {s.title}
                        </button>
                    ))}
                </div>

                {/* Audio Player */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    {audioUrl ? (
                        <audio ref={audioRef} src={audioUrl}
                            onTimeUpdate={() => { if (audioRef.current) setAudioProgress((audioRef.current.currentTime / (audioRef.current.duration || 1)) * 100); }}
                            onLoadedMetadata={() => { if (audioRef.current) setAudioDuration(audioRef.current.duration); }}
                            onEnded={() => setIsPlaying(false)} />
                    ) : null}
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <button onClick={() => skipAudio(-5)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition" title="Lùi 5 giây" disabled={!audioUrl}>
                                <RotateCcw className="h-6 w-6" />
                            </button>
                            <button onClick={handlePlayPause} disabled={!audioUrl}
                                className="h-16 w-16 bg-orange-600 hover:bg-orange-700 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg disabled:opacity-50">
                                {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                            </button>
                            <button onClick={() => skipAudio(5)} className="p-2 text-slate-400 hover:text-orange-600 hover:bg-orange-50 rounded-full transition" title="Tiến 5 giây" disabled={!audioUrl}>
                                <RotateCw className="h-6 w-6" />
                            </button>
                        </div>
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-slate-800">{selectedSet.title}</h3>
                                <div className="flex items-center gap-2">
                                    <Volume2 className="h-4 w-4 text-slate-400" />
                                    <input type="range" className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" defaultValue={80}
                                        onChange={e => { if (audioRef.current) audioRef.current.volume = Number(e.target.value) / 100; }} />
                                </div>
                            </div>
                            {!audioUrl && (
                                <div className="flex items-center gap-2 text-sm text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mb-2">
                                    <AlertCircle className="h-4 w-4" /> Bài này chưa có file audio
                                </div>
                            )}
                            <div className="relative h-3 bg-slate-100 rounded-full overflow-hidden cursor-pointer"
                                onClick={e => {
                                    if (audioRef.current) {
                                        const b = e.currentTarget.getBoundingClientRect();
                                        audioRef.current.currentTime = ((e.clientX - b.left) / b.width) * audioDuration;
                                    }
                                }}>
                                <div className="absolute h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-100" style={{ width: `${audioProgress}%` }} />
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-slate-400 font-mono">{formatTime(audioRef.current?.currentTime || 0)}</span>
                                <span className="text-xs text-slate-400 font-mono">{formatTime(audioDuration)}</span>
                            </div>
                        </div>
                    </div>
                    {selectedSet.description && <p className="mt-4 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">ℹ️ {selectedSet.description}</p>}
                </div>

                {/* Questions */}
                {allQuestions.length > 0 && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-bold">Questions 1–{allQuestions.length}</div>
                            <span className="text-sm text-slate-500">Hoàn thành các câu hỏi bên dưới</span>
                        </div>
                        <div className="space-y-5">
                            {allQuestions.map((q, idx) => (
                                <div key={q.id} className={`p-4 rounded-lg border ${isSubmitted ? (isCorrect(q.id) ? "bg-emerald-50 border-emerald-200" : "bg-red-50 border-red-200") : "bg-slate-50 border-slate-200"}`}>
                                    <div className="flex items-start gap-3">
                                        <span className="flex-shrink-0 h-6 w-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                                        <div className="flex-1">
                                            <p className="text-sm font-medium text-slate-800 mb-2">{q.text}</p>
                                            {q.type === "fill" && (
                                                <div className="flex items-center gap-2">
                                                    <input type="text" value={getAnswer(q.id)} onChange={e => handleAnswer(q.id, e.target.value)} disabled={isSubmitted}
                                                        className="flex-1 max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Nhập câu trả lời..." />
                                                    {q.hint && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">{q.hint}</span>}
                                                </div>
                                            )}
                                            {q.type === "mcq" && q.options && (
                                                <div className="space-y-2">
                                                    {q.options.map((opt, i) => (
                                                        <label key={i} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/50 ${getAnswer(q.id) === opt ? "bg-orange-50 ring-1 ring-orange-200" : ""}`}>
                                                            <input type="radio" name={`q-${selectedSet?.id}-${q.id}`} checked={getAnswer(q.id) === opt} onChange={() => handleAnswer(q.id, opt)} disabled={isSubmitted} className="h-4 w-4 text-orange-600" />
                                                            <span className="text-sm">{String.fromCharCode(65 + i)}. {opt}</span>
                                                        </label>
                                                    ))}
                                                </div>
                                            )}
                                            {q.type === "tf" && (
                                                <div className="flex gap-2">
                                                    {["TRUE", "FALSE", "NOT GIVEN"].map(opt => (
                                                        <button key={opt} onClick={() => !isSubmitted && handleAnswer(q.id, opt)}
                                                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getAnswer(q.id) === opt ? "bg-orange-600 text-white border-orange-600" : "bg-white text-slate-600 border-slate-300"}`}>
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {isSubmitted && (
                                                <div className="mt-2 text-sm">
                                                    {isCorrect(q.id) ? (
                                                        <div className="text-emerald-600 flex items-center gap-1 bg-emerald-50 px-3 py-2 rounded border border-emerald-100"><CheckCircle2 className="h-4 w-4" /> Chính xác</div>
                                                    ) : (
                                                        <div className="text-red-700 flex flex-col gap-2 bg-red-50 p-4 rounded-xl border border-red-100">
                                                            <div className="flex items-center gap-1 font-semibold"><XCircle className="h-4 w-4" /> Sai. Đáp án đúng: {q.answer}</div>
                                                            {getWrongAnswer(q.id)?.reason && (
                                                                <div className="text-sm text-red-800 bg-white/60 p-3 rounded-lg border border-red-100/50">
                                                                    <strong className="text-slate-800 block mb-1">💡 Lý do:</strong>
                                                                    <div dangerouslySetInnerHTML={{ __html: getWrongAnswer(q.id).reason }} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        {isSubmitted && evaluation && (
                            <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-5">
                                <h4 className="font-bold text-orange-900 mb-4">📝 AI Examiner Feedback</h4>
                                <div className="prose prose-sm max-w-none text-orange-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: evaluation.feedback }} />
                            </div>
                        )}
                        {!isSubmitted ? (
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 py-3 disabled:opacity-70">
                                {isSubmitting ? "Đang chấm điểm bằng AI..." : "Nộp bài"}
                            </Button>
                        ) : (
                            <div className="mt-6 flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => { setIsSubmitted(false); setEvaluation(null); setAnswers({}); setTimeLeft(30 * 60); setAudioProgress(0); }}>Làm lại</Button>
                                <Link href="/dashboard" className="flex-1"><Button className="w-full bg-blue-600">Về Dashboard</Button></Link>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
