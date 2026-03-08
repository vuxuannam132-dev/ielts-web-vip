"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, CheckCircle2, XCircle, ArrowLeft, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

const PASSAGES = [
    {
        id: 1,
        title: "The Rise of Urban Farming",
        section: "Reading Passage 1",
        difficulty: "Medium",
        text: `Urban farming has experienced remarkable growth in recent years, transforming cityscapes worldwide. From rooftop gardens in New York to vertical farms in Singapore, the movement represents a fundamental shift in how we think about food production.

The concept is not entirely new. During World War II, "victory gardens" were planted in urban areas across the United States and United Kingdom to supplement food supplies. However, modern urban farming goes far beyond simple gardening. Today's urban farms employ sophisticated technologies including hydroponics, aquaponics, and aeroponics to maximize yields in limited spaces.

Hydroponics, the practice of growing plants without soil using mineral nutrient solutions, has become particularly popular in urban settings. Studies have shown that hydroponic systems can produce up to 10 times more crops per square meter than traditional farming methods. Furthermore, these systems use approximately 90% less water, making them especially valuable in water-scarce urban environments.

The benefits of urban farming extend beyond food production. Research conducted by Columbia University has demonstrated that urban farms can reduce the "heat island effect" - the phenomenon where urban areas experience significantly higher temperatures than surrounding rural areas. Green rooftops can lower building temperatures by up to 7 degrees Celsius, reducing energy consumption for air conditioning.

Social benefits are equally significant. Community gardens have been linked to reduced crime rates, improved mental health, and stronger neighborhood connections. A 2019 study published in The Lancet found that residents with access to community gardens reported 62% lower stress levels compared to those without such access.

However, urban farming faces significant challenges. Land costs in cities remain prohibitively high, and contaminated soil in former industrial areas poses health risks. Critics also argue that urban farming cannot realistically replace rural agriculture at scale, as the total caloric output remains a fraction of what traditional farming produces.

Despite these challenges, investment in urban agriculture continues to grow. The global vertical farming market alone is projected to reach $12.77 billion by 2026, suggesting that urban farming will play an increasingly important role in our food systems.`,
        questions: [
            { id: 1, type: "fill", text: 'During World War II, urban gardens were known as "_____ gardens".', answer: "victory" },
            { id: 2, type: "fill", text: "Hydroponic systems can produce up to _____ times more crops per square meter.", answer: "10" },
            { id: 3, type: "fill", text: "Hydroponic systems use approximately _____% less water than traditional methods.", answer: "90" },
            { id: 4, type: "mcq", text: "What effect can green rooftops reduce?", options: ["Water pollution", "Heat island effect", "Noise pollution", "Air pollution"], answer: "Heat island effect" },
            { id: 5, type: "mcq", text: "According to the Lancet study, how much lower were stress levels for those with garden access?", options: ["42%", "52%", "62%", "72%"], answer: "62%" },
            { id: 6, type: "tf", text: "Urban farming is a completely new concept.", answer: "FALSE" },
            { id: 7, type: "tf", text: "The global vertical farming market is expected to reach $12.77 billion by 2026.", answer: "TRUE" },
            { id: 8, type: "tf", text: "Contaminated soil is not a concern for urban farming.", answer: "FALSE" },
        ]
    }
];

export default function ReadingPractice() {
    const [passage] = useState(PASSAGES[0]);
    const [answers, setAnswers] = useState<Record<number, string>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(20 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);
    const [showPassage, setShowPassage] = useState(true);

    React.useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        const interval = setInterval(() => setTimeLeft(prev => prev - 1), 1000);
        return () => clearInterval(interval);
    }, [isTimerRunning, timeLeft]);

    const formatTime = (s: number) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
    };

    const handleAnswerChange = (qId: number, val: string) => {
        if (isSubmitted || isSubmitting) return;
        setAnswers(prev => ({ ...prev, [qId]: val }));
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setIsTimerRunning(false);

        try {
            const res = await fetch("/api/ai/reading", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    practiceSetId: 1, // mock
                    questions: passage.questions.map(q => ({
                        id: q.id, text: q.text, answerKey: q.answer, type: q.type
                    })),
                    userAnswers: answers
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
        return !getWrongAnswer(qId) && answers[qId] !== undefined && answers[qId] !== "";
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-blue-50/20">
            {/* Header */}
            <div className="sticky top-16 z-20 bg-white/95 backdrop-blur border-b border-slate-200 px-4 sm:px-6 py-3">
                <div className="max-w-7xl mx-auto flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                        <div className="h-8 w-8 rounded-lg bg-blue-100 flex items-center justify-center"><BookOpen className="h-4 w-4 text-blue-600" /></div>
                        <div>
                            <h1 className="text-sm font-bold text-slate-900">{passage.section}</h1>
                            <p className="text-xs text-slate-500">{passage.title}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <button onClick={() => setShowPassage(!showPassage)} className="lg:hidden p-2 bg-slate-100 rounded-lg text-xs font-medium text-slate-600">
                            {showPassage ? <><ChevronLeft className="h-4 w-4 inline" /> Câu hỏi</> : <><ChevronRight className="h-4 w-4 inline" /> Bài đọc</>}
                        </button>
                        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-sm font-mono">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className="font-bold">{formatTime(timeLeft)}</span>
                        </div>
                        {!isTimerRunning && !isSubmitted && !isSubmitting && (
                            <Button onClick={() => setIsTimerRunning(true)} size="sm" className="bg-blue-600">Bắt đầu</Button>
                        )}
                        {isSubmitted && evaluation && (
                            <div className="px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-sm font-bold">{evaluation.totalCorrect}/{passage.questions.length} đúng - Band {evaluation.bandScore}</div>
                        )}
                    </div>
                </div>
            </div>

            {/* Split Layout */}
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

                    {/* Passage */}
                    <div className={`${showPassage ? 'block' : 'hidden lg:block'}`}>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 lg:p-8 sticky top-32 max-h-[calc(100vh-10rem)] overflow-y-auto">
                            <div className="flex items-center gap-2 mb-4">
                                <span className="text-xs font-bold bg-blue-100 text-blue-700 px-2 py-1 rounded">{passage.section}</span>
                                <span className="text-xs text-slate-400">{passage.difficulty}</span>
                            </div>
                            <h2 className="text-xl font-bold text-slate-900 mb-4">{passage.title}</h2>
                            <div className="prose prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-line">
                                {passage.text}
                            </div>
                        </div>
                    </div>

                    {/* Questions */}
                    <div className={`${!showPassage ? 'block' : 'hidden lg:block'} space-y-4`}>
                        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                            <h3 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider">Questions 1-{passage.questions.length}</h3>

                            <div className="space-y-6">
                                {passage.questions.map((q, idx) => (
                                    <div key={q.id} className={`p-4 rounded-lg border ${isSubmitted ? (isCorrect(q.id) ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200') : 'bg-slate-50 border-slate-200'}`}>
                                        <div className="flex items-start gap-3">
                                            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center">{idx + 1}</span>
                                            <div className="flex-1">
                                                <p className="text-sm font-medium text-slate-800 mb-2">{q.text}</p>

                                                {q.type === "fill" && (
                                                    <input
                                                        type="text"
                                                        value={answers[q.id] || ""}
                                                        onChange={(e) => handleAnswerChange(q.id, e.target.value)}
                                                        disabled={isSubmitted}
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none disabled:bg-white"
                                                        placeholder="Nhập câu trả lời..."
                                                    />
                                                )}

                                                {q.type === "mcq" && q.options && (
                                                    <div className="space-y-2">
                                                        {q.options.map((opt, i) => (
                                                            <label key={i} className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/50 transition ${answers[q.id] === opt ? 'bg-blue-50 ring-1 ring-blue-200' : ''}`}>
                                                                <input type="radio" name={`q-${q.id}`} value={opt} checked={answers[q.id] === opt}
                                                                    onChange={() => handleAnswerChange(q.id, opt)} disabled={isSubmitted}
                                                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500" />
                                                                <span className="text-sm text-slate-700">{String.fromCharCode(65 + i)}. {opt}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}

                                                {q.type === "tf" && (
                                                    <div className="flex gap-3">
                                                        {["TRUE", "FALSE", "NOT GIVEN"].map(opt => (
                                                            <button key={opt} onClick={() => !isSubmitted && handleAnswerChange(q.id, opt)}
                                                                className={`px-4 py-1.5 rounded-lg text-xs font-bold border transition ${answers[q.id] === opt ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-600 border-slate-300 hover:border-blue-400'} ${isSubmitted ? 'cursor-default' : 'cursor-pointer'}`}>
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
                                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                                    <h4 className="font-bold text-blue-900 mb-4">📝 Đánh giá chung (AI Examiner)</h4>
                                    <div
                                        className="prose prose-sm max-w-none text-blue-900 leading-relaxed font-medium space-y-3"
                                        dangerouslySetInnerHTML={{ __html: evaluation.feedback }}
                                    />
                                </div>
                            )}

                            {!isSubmitted && (
                                <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full mt-6 bg-emerald-600 hover:bg-emerald-700 py-3 disabled:opacity-70">
                                    {isSubmitting ? "Đang chấm điểm khắt khe bằng AI..." : "Nộp bài"}
                                </Button>
                            )}

                            {isSubmitted && (
                                <div className="mt-6 flex gap-3">
                                    <Button variant="outline" className="flex-1" onClick={() => { setIsSubmitted(false); setEvaluation(null); setAnswers({}); setTimeLeft(20 * 60); }}>Làm lại</Button>
                                    <Link href="/dashboard" className="flex-1"><Button className="w-full bg-blue-600">Về Dashboard</Button></Link>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
