"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Headphones, Clock, CheckCircle2, XCircle, ArrowLeft, Volume2, Play, Pause } from "lucide-react";
import Link from "next/link";

const LISTENING_SECTIONS = [
    {
        id: 1,
        title: "University Accommodation Office",
        section: "Section 1",
        difficulty: "Easy",
        description: "A conversation between a student and a housing officer about accommodation options.",
        questions: [
            { id: 1, type: "fill", text: "The student's last name is _____.", answer: "morrison", hint: "ONE WORD" },
            { id: 2, type: "fill", text: "The monthly rent for the studio apartment is $_____ .", answer: "850", hint: "A NUMBER" },
            { id: 3, type: "fill", text: "The deposit required is equivalent to _____ months' rent.", answer: "2", hint: "A NUMBER" },
            { id: 4, type: "mcq", text: "Which type of accommodation does the student prefer?", options: ["Shared house", "Studio apartment", "Hall of residence", "Home stay"], answer: "Studio apartment" },
            { id: 5, type: "mcq", text: "When is the accommodation available?", options: ["Immediately", "Next week", "Next month", "September"], answer: "September" },
        ]
    },
    {
        id: 2,
        title: "Museum Tour Guide",
        section: "Section 2",
        difficulty: "Medium",
        description: "A tour guide describing exhibits and facilities at a local history museum.",
        questions: [
            { id: 1, type: "fill", text: "The museum was originally built as a _____.", answer: "warehouse", hint: "ONE WORD" },
            { id: 2, type: "fill", text: "The museum has been open for _____ years.", answer: "35", hint: "A NUMBER" },
            { id: 3, type: "mcq", text: "What is located on the third floor?", options: ["Gift shop", "Café", "Exhibition hall", "Library"], answer: "Exhibition hall" },
            { id: 4, type: "tf", text: "Photography is allowed in all areas of the museum.", answer: "FALSE" },
            { id: 5, type: "tf", text: "The museum offers free guided tours on weekdays.", answer: "TRUE" },
        ]
    }
];

export default function ListeningPractice() {
    const [selectedSection, setSelectedSection] = useState(LISTENING_SECTIONS[0]);
    const [answers, setAnswers] = useState<Record<string, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioProgress, setAudioProgress] = useState(0);
    const [timeLeft, setTimeLeft] = useState(30 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    React.useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    React.useEffect(() => {
        if (!isPlaying) return;
        const interval = setInterval(() => setAudioProgress(prev => prev >= 100 ? 100 : prev + 0.5), 100);
        return () => clearInterval(interval);
    }, [isPlaying]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const handleAnswer = (qId: number, val: string) => {
        if (isSubmitted || isSubmitting) return;
        setAnswers(prev => ({ ...prev, [`${selectedSection.id}-${qId}`]: val }));
    };

    const getAnswer = (qId: number) => answers[`${selectedSection.id}-${qId}`] || "";

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setIsTimerRunning(false);
        setIsPlaying(false);

        const formattedAnswers: Record<number, string> = {};
        selectedSection.questions.forEach(q => {
            formattedAnswers[q.id] = getAnswer(q.id);
        });

        try {
            const res = await fetch("/api/ai/listening", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    practiceSetId: 1, // mock
                    questions: selectedSection.questions.map(q => ({
                        id: q.id, text: q.text, answerKey: q.answer, type: q.type
                    })),
                    userAnswers: formattedAnswers
                })
            });
            const data = await res.json();
            if (data.success) {
                setEvaluation(data.evaluation);
                setIsSubmitted(true);
            } else {
                alert("Lỗi chấm bài: " + data.error);
                setIsTimerRunning(true);
            }
        } catch (error) {
            console.error(error);
            alert("Đã xảy ra lỗi hệ thống.");
            setIsTimerRunning(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    const getWrongAnswer = (qId: number) => {
        return evaluation?.wrongAnswers?.find((w: any) => w.questionId === qId);
    };

    const isCorrect = (qId: number) => {
        if (!evaluation) return false;
        return !getWrongAnswer(qId) && getAnswer(qId) !== "";
    };

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
                            <span className="font-bold">{formatTime(timeLeft)}</span>
                        </div>
                        {isSubmitted && evaluation && (
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold">{evaluation.totalCorrect}/{selectedSection.questions.length} đúng - Band {evaluation.bandScore}</div>
                        )}
                    </div>
                </div>

                <div className="flex gap-2 overflow-x-auto pb-1">
                    {LISTENING_SECTIONS.map(sec => (
                        <button key={sec.id}
                            disabled={isSubmitting}
                            onClick={() => { setSelectedSection(sec); setIsSubmitted(false); setEvaluation(null); setAnswers({}); }}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition disabled:opacity-50 ${selectedSection.id === sec.id ? 'bg-orange-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200 hover:bg-orange-50'}`}>
                            {sec.section}: {sec.title}
                        </button>
                    ))}
                </div>

                {/* Audio Player */}
                <div className="bg-white rounded-2xl shadow-lg border border-slate-100 p-6">
                    <div className="flex flex-col sm:flex-row items-center gap-6">
                        <button
                            onClick={() => { setIsPlaying(!isPlaying); if (!isTimerRunning) setIsTimerRunning(true); }}
                            className="h-16 w-16 bg-orange-600 hover:bg-orange-700 text-white rounded-full flex items-center justify-center transition-all hover:scale-105 active:scale-95 shadow-lg flex-shrink-0">
                            {isPlaying ? <Pause className="h-8 w-8" /> : <Play className="h-8 w-8 ml-1" />}
                        </button>
                        <div className="flex-1 w-full">
                            <div className="flex items-center justify-between mb-2">
                                <h3 className="font-bold text-slate-800">{selectedSection.section}: {selectedSection.title}</h3>
                                <div className="flex items-center gap-2">
                                    <Volume2 className="h-4 w-4 text-slate-400" />
                                    <input type="range" className="w-20 h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer" defaultValue={80} />
                                </div>
                            </div>
                            <div className="relative h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div className="absolute h-full bg-gradient-to-r from-orange-500 to-amber-500 rounded-full transition-all duration-100" style={{ width: `${audioProgress}%` }} />
                            </div>
                            <div className="flex justify-between mt-1">
                                <span className="text-xs text-slate-400 font-mono">{formatTime(Math.floor(audioProgress * 2.7))}</span>
                                <span className="text-xs text-slate-400 font-mono">04:30</span>
                            </div>
                        </div>
                    </div>
                    <p className="mt-4 text-sm text-slate-500 bg-slate-50 rounded-lg p-3">ℹ️ {selectedSection.description}</p>
                </div>

                {/* Questions */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-sm font-bold">Questions 1-{selectedSection.questions.length}</div>
                        <span className="text-sm text-slate-500">Hoàn thành các câu hỏi dưới đây</span>
                    </div>

                    <div className="space-y-5">
                        {selectedSection.questions.map((q, idx) => (
                            <div key={q.id} className={`p-4 rounded-lg border ${isSubmitted ? (isCorrect(q.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200') : 'bg-slate-50 border-slate-200'}`}>
                                <div className="flex items-start gap-3">
                                    <span className="flex-shrink-0 h-6 w-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-slate-800 mb-2">{q.text}</p>

                                        {q.type === "fill" && (
                                            <div className="flex items-center gap-2">
                                                <input type="text" value={getAnswer(q.id)} onChange={(e) => handleAnswer(q.id, e.target.value)} disabled={isSubmitted}
                                                    className="flex-1 max-w-xs border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-white" placeholder="Nhập câu trả lời..." />
                                                {q.hint && <span className="text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded">{q.hint}</span>}
                                            </div>
                                        )}

                                        {q.type === "mcq" && q.options && (
                                            <div className="space-y-2">
                                                {q.options.map((opt, i) => (
                                                    <label key={i} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/50 ${getAnswer(q.id) === opt ? 'bg-orange-50 ring-1 ring-orange-200' : ''}`}>
                                                        <input type="radio" name={`q-${selectedSection.id}-${q.id}`} checked={getAnswer(q.id) === opt}
                                                            onChange={() => handleAnswer(q.id, opt)} disabled={isSubmitted} className="h-4 w-4 text-orange-600" />
                                                        <span className="text-sm">{String.fromCharCode(65 + i)}. {opt}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        )}

                                        {q.type === "tf" && (
                                            <div className="flex gap-2">
                                                {["TRUE", "FALSE", "NOT GIVEN"].map(opt => (
                                                    <button key={opt} onClick={() => !isSubmitted && handleAnswer(q.id, opt)}
                                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold border ${getAnswer(q.id) === opt ? 'bg-orange-600 text-white border-orange-600' : 'bg-white text-slate-600 border-slate-300'}`}>
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
                                                    <div className="text-red-700 flex flex-col gap-2 bg-red-50 p-4 rounded-xl border border-red-100 shadow-sm">
                                                        <div className="flex items-center gap-1 font-semibold"><XCircle className="h-4 w-4" /> Sai. Đáp án đúng: {q.answer}</div>
                                                        <div className="text-sm text-red-800 bg-white/60 p-3 rounded-lg block mt-1 border border-red-100/50">
                                                            <strong className="text-slate-800 block mb-1">💡 Lý do bị trừ điểm:</strong>
                                                            <div className="leading-relaxed font-medium" dangerouslySetInnerHTML={{ __html: getWrongAnswer(q.id)?.reason || "Câu trả lời không chính xác." }} />
                                                        </div>
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
                        <div className="mt-6 bg-orange-50 border border-orange-200 rounded-xl p-5 shadow-sm">
                            <h4 className="font-bold text-orange-900 mb-4">📝 Đánh giá chung (AI Examiner)</h4>
                            <div
                                className="prose prose-sm max-w-none text-orange-900 leading-relaxed font-medium space-y-3"
                                dangerouslySetInnerHTML={{ __html: evaluation.feedback }}
                            />
                        </div>
                    )}

                    {!isSubmitted ? (
                        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 py-3 disabled:opacity-70">
                            {isSubmitting ? "Đang chấm điểm khắt khe bằng AI..." : "Nộp bài"}
                        </Button>
                    ) : (
                        <div className="mt-6 flex gap-3">
                            <Button variant="outline" className="flex-1" onClick={() => { setIsSubmitted(false); setEvaluation(null); setAnswers({}); setTimeLeft(30 * 60); setAudioProgress(0); }}>Làm lại</Button>
                            <Link href="/dashboard" className="flex-1"><Button className="w-full bg-blue-600">Về Dashboard</Button></Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
