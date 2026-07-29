"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Headphones, ArrowLeft, CheckCircle2, XCircle, Clock, Play, Pause, Volume2, Highlighter, PenTool, Eraser } from "lucide-react";
import Link from "next/link";
import PracticeSetListView from "@/components/practice/PracticeSetListView";
import ComboCompletionModal from "@/components/practice/ComboCompletionModal";

interface Question {
    id: number;
    type: "fill" | "mcq" | "tf" | "multi-mcq" | "matching";
    text: string;
    options?: string[];
    answer?: string;
    answers?: string[];
    hint?: string;
}

interface PracticeSet {
    id: string;
    skill: string;
    title: string;
    description?: string;
    difficulty?: string;
    content: string;
}

const cleanOptText = (opt: string) => opt ? opt.replace(/^[A-Z][.\)]\s*/i, "") : "";

export default function ListeningPractice() {
    const [sets, setSets] = useState<PracticeSet[]>([]);
    const [selectedSet, setSelectedSet] = useState<PracticeSet | null>(null);
    const [parsedContent, setParsedContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [showComboModal, setShowComboModal] = useState(false);

    // Audio Player states
    const [audioProgress, setAudioProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Timer states
    const [timeLeft, setTimeLeft] = useState(40 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Canvas drawing states
    const [drawMode, setDrawMode] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const questionsRef = useRef<HTMLDivElement>(null);
    const [isDrawing, setIsDrawing] = useState(false);
    const ctxRef = useRef<CanvasRenderingContext2D | null>(null);

    useEffect(() => {
        fetch("/api/practice?skill=listening")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) {
                    setSets(data);
                }
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedSet) return;
        try { setParsedContent(JSON.parse(selectedSet.content || "{}")); } catch { setParsedContent({}); }
        setAnswers({}); setIsSubmitted(false); setEvaluation(null); setAudioProgress(0); setIsPlaying(false); setShowComboModal(false);
        if (audioRef.current) audioRef.current.load();
    }, [selectedSet]);

    useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [isTimerRunning, timeLeft]);

    // Canvas setup
    useEffect(() => {
        if (!drawMode || !canvasRef.current || !questionsRef.current) return;
        const canvas = canvasRef.current;
        canvas.width = questionsRef.current.scrollWidth;
        canvas.height = questionsRef.current.scrollHeight;
        const ctx = canvas.getContext("2d");
        if (ctx) {
            ctx.lineCap = "round";
            ctx.strokeStyle = "rgba(239, 68, 68, 0.6)";
            ctx.lineWidth = 3;
            ctxRef.current = ctx;
        }
    }, [drawMode, selectedSet]);

    const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!drawMode || !ctxRef.current || !canvasRef.current) return;
        setIsDrawing(true);
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        ctxRef.current.beginPath();
        ctxRef.current.moveTo(clientX - rect.left, clientY - rect.top);
    };

    const draw = (e: React.MouseEvent | React.TouchEvent) => {
        if (!isDrawing || !ctxRef.current || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const clientX = 'touches' in e ? e.touches[0].clientX : (e as React.MouseEvent).clientX;
        const clientY = 'touches' in e ? e.touches[0].clientY : (e as React.MouseEvent).clientY;
        ctxRef.current.lineTo(clientX - rect.left, clientY - rect.top);
        ctxRef.current.stroke();
    };

    const stopDraw = () => {
        if (ctxRef.current) ctxRef.current.closePath();
        setIsDrawing(false);
    };

    const clearCanvas = () => {
        if (canvasRef.current && ctxRef.current) {
            ctxRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
        }
    };

    const togglePlay = () => {
        if (!audioRef.current) return;
        if (!isTimerRunning) setIsTimerRunning(true);
        if (isPlaying) audioRef.current.pause();
        else audioRef.current.play();
        setIsPlaying(!isPlaying);
    };

    const handleTimeUpdate = () => {
        if (!audioRef.current) return;
        const current = audioRef.current.currentTime;
        const duration = audioRef.current.duration || 1;
        setCurrentTime(current); setAudioDuration(duration);
        setAudioProgress((current / duration) * 100);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!audioRef.current) return;
        const seekTime = (parseFloat(e.target.value) / 100) * audioDuration;
        audioRef.current.currentTime = seekTime;
        setAudioProgress(parseFloat(e.target.value));
    };

    const formatTime = (s: number) => {
        const mins = Math.floor(s / 60);
        const secs = Math.floor(s % 60);
        return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    };

    const getAnswer = (qId: number) => answers[`${selectedSet?.id}-${qId}`] || "";
    const getMultiAnswer = (qId: number): string[] => answers[`${selectedSet?.id}-${qId}`] || [];
    const handleAnswer = (qId: number, val: string) => {
        if (isSubmitted || isSubmitting) return;
        setAnswers(prev => ({ ...prev, [`${selectedSet?.id}-${qId}`]: val }));
    };
    const handleMultiAnswer = (qId: number, val: string) => {
        if (isSubmitted || isSubmitting) return;
        setAnswers(p => {
            const current = (p[`${selectedSet?.id}-${qId}`] || []) as string[];
            if (current.includes(val)) return { ...p, [`${selectedSet?.id}-${qId}`]: current.filter(x => x !== val) };
            return { ...p, [`${selectedSet?.id}-${qId}`]: [...current, val] };
        });
    };

    const getWrongAnswer = (qId: number) => evaluation?.wrongAnswers?.find((w: any) => w.questionId === qId);
    const isCorrect = (qId: number) => !getWrongAnswer(qId) && getAnswer(qId) !== "";

    const parts: any[] = parsedContent?.parts || [];
    const allQuestions: Question[] = parts.flatMap((p: any) => p.questions || []);

    const isComboTest = selectedSet && (selectedSet.skill === "COMBO" || selectedSet.title?.toLowerCase().includes("combo") || selectedSet.description?.toLowerCase().includes("combo"));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setIsTimerRunning(false);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        const formattedAnswers: Record<number, any> = {};
        allQuestions.forEach(q => { formattedAnswers[q.id] = q.type === "multi-mcq" ? getMultiAnswer(q.id) : getAnswer(q.id); });

        try {
            const res = await fetch("/api/ai/listening", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    practiceSetId: selectedSet?.id,
                    questions: allQuestions.map(q => ({ id: q.id, text: q.text, answerKey: q.type === "multi-mcq" ? q.answers : q.answer, type: q.type })),
                    userAnswers: formattedAnswers
                })
            });
            const data = await res.json();
            if (data.success) {
                setEvaluation(data.evaluation);
                setIsSubmitted(true);
                if (isComboTest) {
                    setShowComboModal(true);
                }
            } else { alert("Lỗi: " + data.error); setIsTimerRunning(true); }
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

    if (!selectedSet) {
        return (
            <PracticeSetListView
                skillName="listening"
                sets={sets}
                onSelectSet={(s) => setSelectedSet(s)}
            />
        );
    }

    const audioUrl = parsedContent?.audioUrl || "";
    const mapImages = parsedContent?.parts?.map((p: any) => p.mapImage).filter(Boolean) || [];

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-orange-50/20">
            <ComboCompletionModal
                isOpen={showComboModal}
                completedCount={2}
                totalCount={4}
                onContinue={() => {
                    setShowComboModal(false);
                    window.location.href = "/dashboard/practice/writing";
                }}
                onClose={() => {
                    setShowComboModal(false);
                    setSelectedSet(null);
                }}
            />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedSet(null)} className="p-2 hover:bg-slate-200 rounded-xl transition flex items-center gap-1.5 text-slate-700 font-medium text-sm bg-white border border-slate-200 shadow-sm">
                            <ArrowLeft className="h-4 w-4" /> Danh sách bài
                        </button>
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center"><Headphones className="h-5 w-5 text-orange-600" /></div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">{selectedSet.title}</h1>
                            <p className="text-xs text-slate-500">Luyện nghe IELTS</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-sm font-mono shadow-sm">
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

                {/* Audio Player Bar */}
                {audioUrl && (
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm space-y-3">
                        <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />
                        <div className="flex items-center gap-4">
                            <button onClick={togglePlay} className="h-12 w-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-md transition shrink-0">
                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                            </button>
                            <div className="flex-1 space-y-1">
                                <input type="range" min="0" max="100" value={audioProgress || 0} onChange={handleSeek} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600" />
                                <div className="flex justify-between text-xs font-mono text-slate-500">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(audioDuration)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Question Section */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="bg-slate-50 border-b border-slate-200 p-2 flex justify-between items-center px-6">
                        <h3 className="font-bold text-slate-800">Questions ({allQuestions.length})</h3>
                        <div className="flex gap-2">
                            <button onClick={() => setDrawMode(!drawMode)} className={`p-2 rounded-lg transition ${drawMode ? 'bg-orange-100 text-orange-700' : 'text-slate-600 hover:bg-slate-200'}`} title="Bật/Tắt bút vẽ">
                                <PenTool className="h-4 w-4" />
                            </button>
                            <button onClick={clearCanvas} className="p-2 text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition" title="Xóa nét vẽ">
                                <Eraser className="h-4 w-4" />
                            </button>
                        </div>
                    </div>

                    <div ref={questionsRef} className="relative p-6">
                        {drawMode && (
                            <canvas
                                ref={canvasRef}
                                onMouseDown={startDraw} onMouseMove={draw} onMouseUp={stopDraw} onMouseLeave={stopDraw}
                                onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={stopDraw}
                                className="absolute top-0 left-0 w-full h-full z-10 cursor-crosshair touch-none"
                            />
                        )}
                        <div className={`space-y-6 ${drawMode ? 'select-none pointer-events-none' : ''}`}>
                            {mapImages.length > 0 && (
                                <div className="mb-6 space-y-4">
                                    {mapImages.map((img: string, i: number) => (
                                        <div key={i} className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2">
                                            <img src={img} alt="Map Labeling" className="w-full max-w-2xl mx-auto rounded-lg object-contain" />
                                        </div>
                                    ))}
                                </div>
                            )}

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
                                                                <span className="text-sm">{String.fromCharCode(65 + i)}. {cleanOptText(opt)}</span>
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
                                                {q.type === "multi-mcq" && q.options && (
                                                    <div className="space-y-2 mt-2">
                                                        {q.options.map((opt, i) => (
                                                            <label key={i} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/50 ${getMultiAnswer(q.id).includes(opt) ? "bg-orange-50 ring-1 ring-orange-200" : ""}`}>
                                                                <input type="checkbox" checked={getMultiAnswer(q.id).includes(opt)} onChange={() => handleMultiAnswer(q.id, opt)} disabled={isSubmitted} className="h-4 w-4 text-orange-600 rounded" />
                                                                <span className="text-sm">{String.fromCharCode(65 + i)}. {cleanOptText(opt)}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}
                                                {q.type === "matching" && (
                                                    <div className="space-y-2 mt-2">
                                                        {q.options?.map((opt, i) => (
                                                            <div key={i} className="flex items-center gap-3 p-2 bg-slate-50 border border-slate-100 rounded-lg">
                                                                <span className="text-sm font-bold text-slate-500 w-6">{String.fromCharCode(65 + i)}</span>
                                                                <span className="text-sm flex-1">{cleanOptText(opt)}</span>
                                                            </div>
                                                        ))}
                                                        <div className="flex items-center gap-2 mt-3">
                                                            <input type="text" value={getAnswer(q.id)} onChange={e => handleAnswer(q.id, e.target.value)} disabled={isSubmitted}
                                                                className="w-20 border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none text-center font-bold" placeholder="VD: A" />
                                                            <span className="text-xs text-slate-400">Nhập chữ cái tương ứng</span>
                                                        </div>
                                                    </div>
                                                )}
                                                {isSubmitted && (
                                                    <div className="mt-3 p-3 rounded-lg bg-slate-50 border border-slate-200">
                                                        {isCorrect(q.id) ? (
                                                            <div className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                                                                <CheckCircle2 className="h-4 w-4" /> Chính xác!
                                                            </div>
                                                        ) : (
                                                            <div className="space-y-2">
                                                                <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                                                                    <XCircle className="h-4 w-4" /> Sai rồi. Đáp án đúng là: {q.type === "multi-mcq" ? q.answers?.join(", ") : q.answer}
                                                                </div>
                                                                {getWrongAnswer(q.id)?.explanation && (
                                                                    <p className="text-sm text-slate-600 border-l-2 border-red-300 pl-3">
                                                                        <span className="font-semibold text-slate-700">Giải thích: </span>
                                                                        {getWrongAnswer(q.id)?.explanation}
                                                                    </p>
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
                        </div>
                    </div>

                    {isSubmitted && evaluation && (
                        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-5 m-6">
                            <h4 className="font-bold text-orange-900 mb-4">📝 AI Examiner Feedback</h4>
                            <div className="prose prose-sm max-w-none text-orange-900 leading-relaxed" dangerouslySetInnerHTML={{ __html: evaluation.feedback }} />
                        </div>
                    )}
                    <div className="p-6 pt-0">
                        {!isSubmitted ? (
                            <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full bg-emerald-600 hover:bg-emerald-700 py-3 disabled:opacity-70 font-bold">
                                {isSubmitting ? "Đang chấm điểm bằng AI..." : "Nộp bài"}
                            </Button>
                        ) : (
                            <div className="flex gap-3">
                                <Button variant="outline" className="flex-1" onClick={() => { setIsSubmitted(false); setEvaluation(null); setAnswers({}); setTimeLeft(30 * 60); setAudioProgress(0); }}>Làm lại</Button>
                                <Button className="flex-1 bg-blue-600" onClick={() => setSelectedSet(null)}>Danh sách bài</Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
