"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Headphones, ArrowLeft, CheckCircle2, XCircle, Clock, Play, Pause, ChevronRight, ChevronLeft } from "lucide-react";
import PracticeSetListView from "@/components/practice/PracticeSetListView";
import ComboCompletionModal from "@/components/practice/ComboCompletionModal";
import ResultsSummaryModal from "@/components/practice/ResultsSummaryModal";
import OverallScorecardModal from "@/components/practice/OverallScorecardModal";
import MotivationalScreen from "@/components/practice/MotivationalScreen";

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

interface Part {
    title?: string;
    mapImage?: string;
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

export default function ListeningPractice() {
    const [sets, setSets] = useState<PracticeSet[]>([]);
    const [selectedSet, setSelectedSet] = useState<PracticeSet | null>(null);
    const [parsedContent, setParsedContent] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activePartIdx, setActivePartIdx] = useState(0);
    const [answers, setAnswers] = useState<Record<string, any>>({});
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);

    // Audio Player states
    const [audioProgress, setAudioProgress] = useState(0);
    const [isPlaying, setIsPlaying] = useState(false);
    const [audioDuration, setAudioDuration] = useState(0);
    const [currentTime, setCurrentTime] = useState(0);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    // Timer states
    const [timeLeft, setTimeLeft] = useState(40 * 60);
    const [isTimerRunning, setIsTimerRunning] = useState(false);

    // Modals
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showComboModal, setShowComboModal] = useState(false);
    const [showOverallModal, setShowOverallModal] = useState(false);
    const [overallBand, setOverallBand] = useState(0);
    const [skillScores, setSkillScores] = useState<any>({});
    const [showMotivational, setShowMotivational] = useState(false);

    useEffect(() => {
        fetch("/api/practice?skill=listening")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setSets(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selectedSet) {
            if (Math.random() < 0.3) {
                const settings = localStorage.getItem('hideMotivational');
                if (settings !== 'true') {
                    setShowMotivational(true);
                }
            }
            return;
        }
        try { setParsedContent(JSON.parse(selectedSet.content || "{}")); } catch { setParsedContent({}); }
        setAnswers({}); setIsSubmitted(false); setEvaluation(null); setAudioProgress(0); setIsPlaying(false);
        setActivePartIdx(0); setShowResultsModal(false); setShowComboModal(false); setShowOverallModal(false);
        if (audioRef.current) audioRef.current.load();
    }, [selectedSet]);

    useEffect(() => {
        if (!isTimerRunning || timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [isTimerRunning, timeLeft]);

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

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${Math.floor(s % 60).toString().padStart(2, "0")}`;

    // Normalize parts & generate 100% sequential globalId (1..N) and qKey (q_1..q_N)
    const normalizedParts = useMemo(() => {
        if (!parsedContent) return [];

        let rawParts: any[] = [];
        if (Array.isArray(parsedContent.parts) && parsedContent.parts.length > 0) {
            rawParts = parsedContent.parts;
        } else if (Array.isArray(parsedContent.questions)) {
            rawParts = [{ title: "Part 1", questions: parsedContent.questions }];
        }

        let globalCounter = 1;
        return rawParts.map((p, pIdx) => ({
            ...p,
            partIdx: pIdx,
            questions: (p.questions || []).map((q: any, qIdx: number) => {
                const currentGlobalId = globalCounter++;
                return {
                    ...q,
                    globalId: currentGlobalId,
                    qKey: `q_${currentGlobalId}`,
                    partIdx: pIdx,
                    qIdxInPart: qIdx
                };
            })
        }));
    }, [parsedContent]);

    const currentPart = normalizedParts[activePartIdx] || { questions: [] };
    const allQuestionsFlat = useMemo(() => normalizedParts.flatMap(p => p.questions), [normalizedParts]);

    const getAnswer = (qKey: string) => answers[qKey] || "";
    const getMultiAnswer = (qKey: string): string[] => answers[qKey] || [];

    const handleAnswer = (qKey: string, val: string) => {
        if (!isSubmitted && !isSubmitting) {
            setAnswers(prev => ({ ...prev, [qKey]: val }));
            if (!isTimerRunning) setIsTimerRunning(true);
        }
    };

    const handleMultiAnswer = (qKey: string, val: string) => {
        if (isSubmitted || isSubmitting) return;
        if (!isTimerRunning) setIsTimerRunning(true);
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

    const isComboTest = selectedSet && (selectedSet.skill === "COMBO" || selectedSet.title?.toLowerCase().includes("combo") || selectedSet.description?.toLowerCase().includes("combo"));

    const handleSubmit = async () => {
        setIsSubmitting(true);
        setIsTimerRunning(false);
        setIsPlaying(false);
        if (audioRef.current) audioRef.current.pause();

        const formattedUserAnswers: Record<number, any> = {};
        allQuestionsFlat.forEach(q => {
            formattedUserAnswers[q.globalId] = q.type === "multi-mcq" ? getMultiAnswer(q.qKey) : getAnswer(q.qKey);
        });

        try {
            const res = await fetch("/api/ai/listening", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    practiceSetId: selectedSet?.id,
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
                setIsSubmitted(true);
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
                setIsTimerRunning(true);
            }
        } catch {
            alert("Lỗi kết nối.");
            setIsTimerRunning(true);
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-orange-500 border-t-transparent" />
            </div>
        );
    }

    if (!selectedSet) {
        return (
            <>
                <MotivationalScreen isOpen={showMotivational} onClose={() => setShowMotivational(false)} />
                <PracticeSetListView
                    skillName="listening"
                    sets={sets}
                    onSelectSet={(s) => setSelectedSet(s)}
                />
            </>
        );
    }

    const audioUrl = parsedContent?.audioUrl || "";

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-orange-50/20 py-6">
            <ResultsSummaryModal
                isOpen={showResultsModal}
                skill="listening"
                evaluation={{ ...evaluation, totalQuestions: allQuestionsFlat.length }}
                onReviewDetails={() => setShowResultsModal(false)}
                onRetry={() => {
                    setIsSubmitted(false); setEvaluation(null); setAnswers({}); setTimeLeft(40 * 60); setAudioProgress(0); setShowResultsModal(false);
                }}
                onBackToList={() => {
                    setShowResultsModal(false);
                    const settings = localStorage.getItem('hideMotivational');
                    if (settings !== 'true') {
                        setShowMotivational(true);
                        setTimeout(() => setSelectedSet(null), 500);
                    } else {
                        setSelectedSet(null);
                    }
                }}
            />

            <MotivationalScreen isOpen={showMotivational} onClose={() => { setShowMotivational(false); if (showResultsModal === false) setSelectedSet(null); }} />

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

            <OverallScorecardModal
                isOpen={showOverallModal}
                overallBand={overallBand}
                skillScores={skillScores}
                onClose={() => setShowOverallModal(false)}
                onGoToDashboard={() => window.location.href = "/dashboard"}
            />

            <div className="max-w-5xl mx-auto px-4 sm:px-6 space-y-6">
                {/* Header Navbar */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelectedSet(null)} className="p-2 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 text-slate-700 font-medium text-sm bg-slate-50 border border-slate-200">
                            <ArrowLeft className="h-4 w-4" /> Danh sách bài
                        </button>
                        <div className="h-10 w-10 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                            <Headphones className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{selectedSet.title}</h1>
                            <p className="text-xs text-slate-500">Luyện nghe IELTS — Tổng số câu: <b>{allQuestionsFlat.length} câu</b></p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className={timeLeft < 120 ? "text-red-600 animate-pulse" : "text-slate-700"}>{formatTime(timeLeft)}</span>
                        </div>
                        {isSubmitted && (
                            <Button onClick={() => setShowResultsModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md">
                                📊 Xem Bảng Điểm
                            </Button>
                        )}
                    </div>
                </div>

                {/* Audio Player Bar */}
                {audioUrl && (
                    <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm space-y-3">
                        <audio ref={audioRef} src={audioUrl} onTimeUpdate={handleTimeUpdate} onEnded={() => setIsPlaying(false)} />
                        <div className="flex items-center gap-4">
                            <button onClick={togglePlay} className="h-12 w-12 rounded-full bg-orange-600 hover:bg-orange-700 text-white flex items-center justify-center shadow-md transition shrink-0">
                                {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-0.5" />}
                            </button>
                            <div className="flex-1 space-y-1">
                                <input type="range" min="0" max="100" value={audioProgress || 0} onChange={handleSeek} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-orange-600" />
                                <div className="flex justify-between text-xs font-mono text-slate-500 font-bold">
                                    <span>{formatTime(currentTime)}</span>
                                    <span>{formatTime(audioDuration)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Part Navigation Tabs */}
                {normalizedParts.length > 1 && (
                    <div className="flex gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl border shadow-sm overflow-x-auto">
                        {normalizedParts.map((p, pIdx) => (
                            <button
                                key={pIdx}
                                onClick={() => setActivePartIdx(pIdx)}
                                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 whitespace-nowrap ${
                                    activePartIdx === pIdx
                                        ? "bg-orange-600 text-white shadow-md shadow-orange-500/20"
                                        : "text-slate-600 hover:bg-slate-100"
                                }`}>
                                Part {pIdx + 1}
                                <span className={`text-xs px-2 py-0.5 rounded-full ${activePartIdx === pIdx ? "bg-white/20 text-white" : "bg-slate-200 text-slate-700"}`}>
                                    {p.questions?.length || 0} câu
                                </span>
                            </button>
                        ))}
                    </div>
                )}

                {/* Main Questions Section */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-6">
                    <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                        <h3 className="font-bold text-slate-800 text-sm">
                            {currentPart.title || `Part ${activePartIdx + 1}`} ({currentPart.questions?.length || 0} câu)
                        </h3>
                        <span className="text-xs text-slate-400">Part {activePartIdx + 1}/{normalizedParts.length}</span>
                    </div>

                    {currentPart.mapImage && (
                        <div className="rounded-2xl border border-slate-200 overflow-hidden bg-slate-50 p-3">
                            <img src={currentPart.mapImage} alt="Listening Map/Diagram" className="w-full max-w-xl mx-auto rounded-xl object-contain" />
                        </div>
                    )}

                    {(!currentPart.questions || currentPart.questions.length === 0) ? (
                        <p className="text-xs text-slate-400 italic py-4">Không có câu hỏi cho Part này.</p>
                    ) : (
                        <div className="space-y-5">
                            {currentPart.questions.map((q: Question) => {
                                const wrong = getWrongByQKey(q.qKey);
                                const correctState = isCorrect(q.qKey);

                                return (
                                    <div
                                        key={q.qKey}
                                        className={`p-4 rounded-xl border transition-all ${
                                            isSubmitted
                                                ? correctState
                                                    ? "bg-emerald-50/80 border-emerald-300"
                                                    : "bg-red-50/80 border-red-300"
                                                : "bg-slate-50 border-slate-200"
                                        }`}>
                                        <div className="flex items-start gap-3">
                                            <span className="flex-shrink-0 h-6 w-6 rounded-full bg-orange-600 text-white text-xs font-bold flex items-center justify-center">
                                                {q.globalId}
                                            </span>
                                            <div className="flex-1 space-y-3">
                                                <p className="text-sm font-semibold text-slate-800">{q.text}</p>

                                                {/* Fill */}
                                                {q.type === "fill" && (
                                                    <input
                                                        type="text"
                                                        value={getAnswer(q.qKey)}
                                                        onChange={e => handleAnswer(q.qKey, e.target.value)}
                                                        disabled={isSubmitted}
                                                        className="w-full max-w-md border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium"
                                                        placeholder="Nhập câu trả lời..."
                                                    />
                                                )}

                                                {/* Single MCQ */}
                                                {q.type === "mcq" && q.options && (
                                                    <div className="space-y-1.5">
                                                        {q.options.map((opt: string, i: number) => (
                                                            <label key={i} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white transition border ${getAnswer(q.qKey) === opt ? "bg-orange-50 border-orange-300 font-semibold" : "border-transparent"}`}>
                                                                <input
                                                                    type="radio"
                                                                    name={`radio-${selectedSet.id}-${q.globalId}`}
                                                                    checked={getAnswer(q.qKey) === opt}
                                                                    onChange={() => handleAnswer(q.qKey, opt)}
                                                                    disabled={isSubmitted}
                                                                    className="h-4 w-4 text-orange-600"
                                                                />
                                                                <span className="text-sm text-slate-700">{String.fromCharCode(65 + i)}. {cleanOptText(opt)}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* TF */}
                                                {q.type === "tf" && (
                                                    <div className="flex gap-2 flex-wrap">
                                                        {["TRUE", "FALSE", "NOT GIVEN"].map(opt => (
                                                            <button
                                                                key={opt}
                                                                onClick={() => handleAnswer(q.qKey, opt)}
                                                                disabled={isSubmitted}
                                                                className={`px-4 py-2 rounded-xl text-xs font-bold border transition ${
                                                                    getAnswer(q.qKey) === opt
                                                                        ? "bg-orange-600 text-white border-orange-600 shadow-sm"
                                                                        : "bg-white text-slate-600 border-slate-300 hover:bg-slate-100"
                                                                }`}>
                                                                {opt}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Multi MCQ */}
                                                {q.type === "multi-mcq" && q.options && (
                                                    <div className="space-y-1.5">
                                                        {q.options.map((opt: string, i: number) => (
                                                            <label key={i} className={`flex items-center gap-3 p-2.5 rounded-xl cursor-pointer hover:bg-white transition border ${getMultiAnswer(q.qKey).includes(opt) ? "bg-orange-50 border-orange-300 font-semibold" : "border-transparent"}`}>
                                                                <input
                                                                    type="checkbox"
                                                                    checked={getMultiAnswer(q.qKey).includes(opt)}
                                                                    onChange={() => handleMultiAnswer(q.qKey, opt)}
                                                                    disabled={isSubmitted}
                                                                    className="h-4 w-4 text-orange-600 rounded"
                                                                />
                                                                <span className="text-sm text-slate-700">{String.fromCharCode(65 + i)}. {cleanOptText(opt)}</span>
                                                            </label>
                                                        ))}
                                                    </div>
                                                )}

                                                {/* Matching */}
                                                {q.type === "matching" && (
                                                    <select
                                                        value={getAnswer(q.qKey)}
                                                        onChange={e => handleAnswer(q.qKey, e.target.value)}
                                                        disabled={isSubmitted}
                                                        className="w-full border border-slate-300 rounded-xl px-3.5 py-2 text-sm focus:ring-2 focus:ring-orange-500 outline-none bg-white font-medium">
                                                        <option value="">-- Chọn đáp án --</option>
                                                        {q.options?.map((opt: string, i: number) => (
                                                            <option key={i} value={opt}>{cleanOptText(opt)}</option>
                                                        ))}
                                                    </select>
                                                )}

                                                {/* Answer Review Section */}
                                                {isSubmitted && (
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
                                                                    <div className="text-slate-600 bg-white p-3 rounded-lg border border-red-100 mt-2 text-sm leading-relaxed" dangerouslySetInnerHTML={{ __html: wrong.reason }} />
                                                                )}
                                                                {wrong?.distractorAnalysis && (
                                                                    <div className="mt-2 bg-purple-50 p-3 rounded-lg border border-purple-100">
                                                                        <div className="text-xs font-bold text-purple-800 mb-1">⚠️ Phân tích bẫy (Distractor Analysis):</div>
                                                                        <div className="text-xs text-purple-700">{wrong.distractorAnalysis}</div>
                                                                    </div>
                                                                )}
                                                                {wrong?.sourceQuote && (
                                                                    <div className="mt-2 bg-amber-50 p-3 rounded-lg border border-amber-100">
                                                                        <div className="text-xs font-bold text-amber-800 mb-1">📍 Tapescript Quote:</div>
                                                                        <div className="text-xs text-amber-700 italic">"{wrong.sourceQuote}"</div>
                                                                    </div>
                                                                )}
                                                                {wrong?.paraphrasePairs && wrong.paraphrasePairs.length > 0 && (
                                                                    <div className="mt-2 bg-indigo-50 p-3 rounded-lg border border-indigo-100">
                                                                        <div className="text-xs font-bold text-indigo-800 mb-2">🔄 Paraphrase Analysis:</div>
                                                                        <div className="grid grid-cols-2 gap-2">
                                                                            {wrong.paraphrasePairs.map((pair: any, i: number) => (
                                                                                <div key={i} className="flex flex-col bg-white p-2 rounded border border-indigo-50 text-[11px]">
                                                                                    <span className="text-slate-500 font-medium">Câu hỏi: <span className="text-indigo-600 font-bold">{pair.questionWord}</span></span>
                                                                                    <span className="text-slate-500 font-medium mt-1">Bài nghe: <span className="text-emerald-600 font-bold">{pair.transcriptWord}</span></span>
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}

                    {/* Part Pagination Controls & Submit Button */}
                    <div className="pt-4 border-t border-slate-100 flex flex-col gap-3">
                        <div className="flex items-center justify-between">
                            <Button
                                disabled={activePartIdx === 0}
                                onClick={() => setActivePartIdx(p => p - 1)}
                                variant="outline"
                                className="text-xs font-semibold px-3.5 py-2 rounded-xl">
                                <ChevronLeft className="h-4 w-4" /> Part trước
                            </Button>

                            <span className="text-xs text-slate-500 font-bold">Part {activePartIdx + 1}/{normalizedParts.length}</span>

                            <Button
                                disabled={activePartIdx === normalizedParts.length - 1}
                                onClick={() => setActivePartIdx(p => p + 1)}
                                variant="outline"
                                className="text-xs font-semibold px-3.5 py-2 rounded-xl">
                                Part tiếp <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>

                        {!isSubmitted ? (
                            <Button
                                onClick={handleSubmit}
                                disabled={isSubmitting}
                                className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-3 rounded-xl shadow-lg shadow-orange-500/20 transition-all">
                                {isSubmitting ? "Đang chấm điểm bằng AI..." : "Nộp Bài Thi Listening"}
                            </Button>
                        ) : (
                            <div className="flex gap-2">
                                <Button
                                    variant="outline"
                                    onClick={() => { setIsSubmitted(false); setEvaluation(null); setAnswers({}); setTimeLeft(40 * 60); setAudioProgress(0); }}
                                    className="flex-1 text-xs font-bold rounded-xl py-2.5">
                                    Làm lại
                                </Button>
                                <Button
                                    onClick={() => setSelectedSet(null)}
                                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs rounded-xl py-2.5">
                                    Danh sách bài
                                </Button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
