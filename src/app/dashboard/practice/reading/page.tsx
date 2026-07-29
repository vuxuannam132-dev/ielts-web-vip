"use client";

import React, { useState, useEffect, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { BookOpen, ArrowLeft, CheckCircle2, XCircle, Clock, ChevronRight, ChevronLeft } from "lucide-react";
import PracticeSetListView from "@/components/practice/PracticeSetListView";
import ComboCompletionModal from "@/components/practice/ComboCompletionModal";
import ResultsSummaryModal from "@/components/practice/ResultsSummaryModal";
import OverallScorecardModal from "@/components/practice/OverallScorecardModal";
import FloatingTextHighlighter from "@/components/practice/FloatingTextHighlighter";

interface Question {
    id?: number;
    globalId: number;
    qKey: string;
    type: "fill" | "mcq" | "tf" | "multi-mcq" | "matching";
    text: string;
    options?: string[];
    answer?: string;
    answers?: string[];
    hint?: string;
}

interface Passage {
    title?: string;
    text?: string;
    passage?: string;
    questions: Question[];
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

export default function ReadingPractice() {
    const [sets, setSets] = useState<PracticeSet[]>([]);
    const [selected, setSelected] = useState<PracticeSet | null>(null);
    const [parsed, setParsed] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activePassageIdx, setActivePassageIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [timeLeft, setTimeLeft] = useState(60 * 60);
    const [timerRunning, setTimerRunning] = useState(false);

    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showComboModal, setShowComboModal] = useState(false);
    const [showOverallModal, setShowOverallModal] = useState(false);
    const [overallBand, setOverallBand] = useState(0);
    const [skillScores, setSkillScores] = useState<any>({});

    useEffect(() => {
        fetch("/api/practice?skill=reading")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setSets(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) return;
        try { setParsed(JSON.parse(selected.content || "{}")); } catch { setParsed({}); }
        setAnswers({}); setSubmitted(false); setEvaluation(null);
        setActivePassageIdx(0); setShowResultsModal(false); setShowComboModal(false); setShowOverallModal(false);
    }, [selected]);

    useEffect(() => {
        if (!timerRunning || timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timerRunning, timeLeft]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    // Normalize passages & generate 100% sequential globalId (1..N) and qKey (q_1..q_N)
    const normalizedPassages = useMemo(() => {
        if (!parsed) return [];

        let rawPassages: any[] = [];
        if (Array.isArray(parsed.passages) && parsed.passages.length > 0) {
            rawPassages = parsed.passages;
        } else if (parsed.passage || parsed.text) {
            rawPassages = [{ title: parsed.title || "Passage 1", text: parsed.passage || parsed.text, questions: parsed.questions || [] }];
        } else if (Array.isArray(parsed.questions)) {
            rawPassages = [{ title: parsed.title || "Passage 1", text: "", questions: parsed.questions }];
        }

        let globalCounter = 1;
        return rawPassages.map((p, pIdx) => ({
            ...p,
            passageIdx: pIdx,
            questions: (p.questions || []).map((q: any, qIdx: number) => {
                const currentGlobalId = globalCounter++;
                return {
                    ...q,
                    globalId: currentGlobalId,
                    qKey: `q_${currentGlobalId}`,
                    passageIdx: pIdx,
                    qIdxInPassage: qIdx
                };
            })
        }));
    }, [parsed]);

    const currentPassage = normalizedPassages[activePassageIdx] || { title: "", text: "", questions: [] };
    const allQuestionsFlat = useMemo(() => normalizedPassages.flatMap(p => p.questions), [normalizedPassages]);

    const getAnswer = (qKey: string) => answers[qKey] || "";
    const getMultiAnswer = (qKey: string): string[] => answers[qKey] || [];

    const handleAnswer = (qKey: string, val: string) => {
        if (!submitted) {
            setAnswers(p => ({ ...p, [qKey]: val }));
            if (!timerRunning) setTimerRunning(true);
        }
    };

    const handleMultiAnswer = (qKey: string, val: string) => {
        if (submitted) return;
        if (!timerRunning) setTimerRunning(true);
        setAnswers(p => {
            const current = (p[qKey] || []) as string[];
            if (current.includes(val)) return { ...p, [qKey]: current.filter(x => x !== val) };
            return { ...p, [qKey]: [...current, val] };
        });
    };

    const getWrongByQKey = (qKey: string) => {
        if (!evaluation?.wrongAnswers) return null;
        const targetQ = allQuestionsFlat.find(x => x.qKey === qKey);
        if (!targetQ) return null;
        return evaluation.wrongAnswers.find((w: any) => w.questionId === targetQ.globalId);
    };

    const isCorrect = (qKey: string) => {
        const wrong = getWrongByQKey(qKey);
        const ans = getAnswer(qKey);
        return !wrong && (Array.isArray(ans) ? ans.length > 0 : ans !== "");
    };

    const isComboTest = selected && (selected.skill === "COMBO" || selected.title?.toLowerCase().includes("combo") || selected.description?.toLowerCase().includes("combo"));

    const handleSubmit = async () => {
        setSubmitting(true); setTimerRunning(false);

        // Format user answers payload strictly using unique sequential globalId
        const formattedUserAnswers: Record<number, any> = {};
        allQuestionsFlat.forEach(q => {
            formattedUserAnswers[q.globalId] = q.type === "multi-mcq" ? getMultiAnswer(q.qKey) : getAnswer(q.qKey);
        });

        try {
            const res = await fetch("/api/ai/reading", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    practiceSetId: selected?.id,
                    questions: allQuestionsFlat.map(q => ({
                        id: q.globalId,
                        text: q.text,
                        answerKey: q.type === "multi-mcq" ? q.answers : q.answer,
                        type: q.type
                    })),
                    userAnswers: formattedUserAnswers
                })
            });
            const data = await res.json();
            if (data.success) {
                setEvaluation(data.evaluation);
                setSubmitted(true);
                setShowResultsModal(true);

                fetch("/api/user/stats")
                    .then(r => r.json())
                    .then(stats => {
                        if (stats.completedSkills && stats.completedSkills.length === 4) {
                            setOverallBand(stats.estimatedBand || 0);
                            setSkillScores(stats.skillScores || {});
                        }
                    })
                    .catch(() => {});
            } else {
                alert("Lỗi: " + data.error);
            }
        } catch {
            alert("Lỗi kết nối hệ thống.");
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent" />
            </div>
        );
    }

    if (!selected) {
        return (
            <PracticeSetListView
                skillName="reading"
                sets={sets}
                onSelectSet={(s) => setSelected(s)}
            />
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-blue-50/20 py-6">
            <ResultsSummaryModal
                isOpen={showResultsModal}
                skill="reading"
                evaluation={{ ...evaluation, totalQuestions: allQuestionsFlat.length }}
                onReviewDetails={() => setShowResultsModal(false)}
                onRetry={() => {
                    setSubmitted(false); setEvaluation(null); setAnswers({}); setShowResultsModal(false); setTimeLeft(60 * 60);
                }}
                onBackToList={() => setSelected(null)}
            />

            <ComboCompletionModal
                isOpen={showComboModal}
                completedCount={1}
                totalCount={4}
                onContinue={() => {
                    setShowComboModal(false);
                    window.location.href = "/dashboard/practice/listening";
                }}
                onClose={() => {
                    setShowComboModal(false);
                    setSelected(null);
                }}
            />

            <OverallScorecardModal
                isOpen={showOverallModal}
                overallBand={overallBand}
                skillScores={skillScores}
                onClose={() => setShowOverallModal(false)}
                onGoToDashboard={() => window.location.href = "/dashboard"}
            />

            <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-6">
                {/* Header Navbar */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 text-slate-700 font-medium text-sm bg-slate-50 border border-slate-200">
                            <ArrowLeft className="h-4 w-4" /> Danh sách bài
                        </button>
                        <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center shrink-0">
                            <BookOpen className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{selected.title}</h1>
                            <p className="text-xs text-slate-500">Luyện đọc IELTS — Tổng số câu: <b>{allQuestionsFlat.length} câu</b></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className={timeLeft < 300 ? "text-red-600 animate-pulse" : "text-slate-700"}>{formatTime(timeLeft)}</span>
                        </div>
                        {submitted && (
                            <Button onClick={() => setShowResultsModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md">
                                📊 Xem Bảng Điểm
                            </Button>
                        )}
                    </div>
                </div>

                {/* Passage Tabs Navigation */}
                {normalizedPassages.length > 1 && (
                    <div className="flex gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl border shadow-sm overflow-x-auto">
                        {normalizedPassages.map((p, pIdx) => {
                            const qCount = p.questions?.length || 0;
                            return (
                                <button
                                    key={pIdx}
                                    onClick={() => setActivePassageIdx(pIdx)}
                                    className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                                        activePassageIdx === pIdx
                                            ? "bg-blue-600 text-white shadow-md shadow-blue-500/20"
                                            : "text-slate-600 hover:bg-slate-100"
                                    }`}>
                                    Passage {pIdx + 1}
                                    <span className={`text-xs px-2 py-0.5 rounded-full ${activePassageIdx === pIdx ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                                        {qCount} câu
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                )}

                {/* Main Split Layout */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Left: Passage Text */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col max-h-[75vh]">
                        <div className="bg-slate-50 border-b border-slate-200 p-3 px-6 flex justify-between items-center">
                            <h3 className="font-bold text-slate-800 text-sm flex items-center gap-2">
                                📖 {currentPassage.title || `Passage ${activePassageIdx + 1}`}
                            </h3>
                            <span className="text-xs text-slate-400">Bôi đen văn bản để Highlight</span>
                        </div>

                        <FloatingTextHighlighter className="p-6 overflow-y-auto max-h-[70vh] space-y-4">
                            <div className="prose prose-sm max-w-none text-slate-800 leading-relaxed font-sans whitespace-pre-line text-sm select-text">
                                {currentPassage.text || currentPassage.passage || "Không có nội dung văn bản bài đọc."}
                            </div>
                        </FloatingTextHighlighter>
                    </div>

                    {/* Right: Questions for Active Passage */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-5 overflow-y-auto max-h-[75vh] flex flex-col justify-between">
                        <div className="space-y-5">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <span className="font-bold text-slate-800 text-sm">
                                    Questions for Passage {activePassageIdx + 1} ({currentPassage.questions?.length || 0} câu)
                                </span>
                                <span className="text-xs text-slate-400">Trang {activePassageIdx + 1}/{normalizedPassages.length}</span>
                            </div>

                            {(!currentPassage.questions || currentPassage.questions.length === 0) ? (
                                <p className="text-xs text-slate-400 italic py-4">Không có câu hỏi cho Passage này.</p>
                            ) : (
                                currentPassage.questions.map((q: Question) => {
                                    const wrong = getWrongByQKey(q.qKey);
                                    const correctState = isCorrect(q.qKey);

                                    return (
                                        <div
                                            key={q.qKey}
                                            className={`p-4 rounded-xl border transition-all ${
                                                submitted
                                                    ? correctState
                                                        ? "bg-emerald-50/80 border-emerald-300"
                                                        : "bg-red-50/80 border-red-300"
                                                    : "bg-slate-50 border-slate-200"
                                            }`}>
                                            <p className="text-sm font-semibold text-slate-900 mb-3 leading-relaxed">
                                                {q.globalId}. {q.text}
                                            </p>

                                            {/* Fill-in-the-blank */}
                                            {q.type === "fill" && (
                                                <input
                                                    type="text"
                                                    value={getAnswer(q.qKey)}
                                                    onChange={e => handleAnswer(q.qKey, e.target.value)}
                                                    disabled={submitted}
                                                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium"
                                                    placeholder="Nhập câu trả lời..."
                                                />
                                            )}

                                            {/* Single MCQ */}
                                            {q.type === "mcq" && q.options?.map((opt: string, i: number) => (
                                                <label key={i} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white transition mb-1.5 border ${getAnswer(q.qKey) === opt ? "bg-blue-50 border-blue-300 font-semibold" : "border-transparent"}`}>
                                                    <input
                                                        type="radio"
                                                        name={`radio-${selected.id}-${q.globalId}`}
                                                        checked={getAnswer(q.qKey) === opt}
                                                        onChange={() => handleAnswer(q.qKey, opt)}
                                                        disabled={submitted}
                                                        className="h-4 w-4 text-blue-600"
                                                    />
                                                    <span className="text-sm text-slate-700">{String.fromCharCode(65 + i)}. {cleanOptText(opt)}</span>
                                                </label>
                                            ))}

                                            {/* True / False / Not Given */}
                                            {q.type === "tf" && (
                                                <div className="flex gap-2 flex-wrap">
                                                    {["TRUE", "FALSE", "NOT GIVEN"].map(opt => (
                                                        <button
                                                            key={opt}
                                                            onClick={() => handleAnswer(q.qKey, opt)}
                                                            disabled={submitted}
                                                            className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                                                                getAnswer(q.qKey) === opt
                                                                    ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                                                                    : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                                                            }`}>
                                                            {opt}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Multi-MCQ */}
                                            {q.type === "multi-mcq" && q.options?.map((opt: string, i: number) => (
                                                <label key={i} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white transition mb-1.5 border ${getMultiAnswer(q.qKey).includes(opt) ? "bg-blue-50 border-blue-300 font-semibold" : "border-transparent"}`}>
                                                    <input
                                                        type="checkbox"
                                                        checked={getMultiAnswer(q.qKey).includes(opt)}
                                                        onChange={() => handleMultiAnswer(q.qKey, opt)}
                                                        disabled={submitted}
                                                        className="h-4 w-4 text-blue-600 rounded"
                                                    />
                                                    <span className="text-sm text-slate-700">{String.fromCharCode(65 + i)}. {cleanOptText(opt)}</span>
                                                </label>
                                            ))}

                                            {/* Matching */}
                                            {q.type === "matching" && (
                                                <select
                                                    value={getAnswer(q.qKey)}
                                                    onChange={e => handleAnswer(q.qKey, e.target.value)}
                                                    disabled={submitted}
                                                    className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none bg-white font-medium mt-1">
                                                    <option value="">-- Chọn đáp án tương ứng --</option>
                                                    {q.options?.map((opt: string, i: number) => (
                                                        <option key={i} value={opt}>{cleanOptText(opt)}</option>
                                                    ))}
                                                </select>
                                            )}

                                            {/* Answer Review Section */}
                                            {submitted && (
                                                <div className="mt-3 pt-3 border-t border-slate-200/60">
                                                    {correctState ? (
                                                        <div className="text-xs font-bold text-emerald-600 flex items-center gap-1">
                                                            <CheckCircle2 className="h-4 w-4" /> Chính xác
                                                        </div>
                                                    ) : (
                                                        <div className="space-y-1 text-xs">
                                                            <div className="font-bold text-red-600 flex items-center gap-1">
                                                                <XCircle className="h-4 w-4" /> Sai — Đáp án đúng: <strong>{q.type === "multi-mcq" ? q.answers?.join(", ") : q.answer}</strong>
                                                            </div>
                                                            {wrong?.reason && (
                                                                <div className="text-slate-600 bg-white p-2 rounded-lg border border-red-100 mt-1" dangerouslySetInnerHTML={{ __html: wrong.reason }} />
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* Passage Pagination Controls & Submit Button */}
                        <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <Button
                                    disabled={activePassageIdx === 0}
                                    onClick={() => setActivePassageIdx(p => p - 1)}
                                    variant="outline"
                                    className="text-xs font-semibold px-3.5 py-2 rounded-xl">
                                    <ChevronLeft className="h-4 w-4" /> Trang trước
                                </Button>

                                <span className="text-xs text-slate-500 font-bold">Passage {activePassageIdx + 1}/{normalizedPassages.length}</span>

                                <Button
                                    disabled={activePassageIdx === normalizedPassages.length - 1}
                                    onClick={() => setActivePassageIdx(p => p + 1)}
                                    variant="outline"
                                    className="text-xs font-semibold px-3.5 py-2 rounded-xl">
                                    Trang tiếp <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>

                            {!submitted ? (
                                <Button
                                    onClick={handleSubmit}
                                    disabled={submitting}
                                    className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-emerald-500/20 transition-all">
                                    {submitting ? "Đang chấm điểm bằng AI..." : "Nộp Bài Thi Reading"}
                                </Button>
                            ) : (
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => { setSubmitted(false); setEvaluation(null); setAnswers({}); setTimeLeft(60 * 60); }}
                                        className="flex-1 text-xs font-bold rounded-xl py-2.5">
                                        Làm lại
                                    </Button>
                                    <Button
                                        onClick={() => setSelected(null)}
                                        className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl py-2.5">
                                        Danh sách bài
                                    </Button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
