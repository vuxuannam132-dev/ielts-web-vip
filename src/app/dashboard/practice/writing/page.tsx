"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { PenTool, Clock, ArrowLeft, Send, Sparkles } from "lucide-react";
import PracticeSetListView from "@/components/practice/PracticeSetListView";
import ComboCompletionModal from "@/components/practice/ComboCompletionModal";
import ResultsSummaryModal from "@/components/practice/ResultsSummaryModal";
import MotivationalScreen from "@/components/practice/MotivationalScreen";
import OverallScorecardModal from "@/components/practice/OverallScorecardModal";
import WritingFeedbackView from "@/components/practice/WritingFeedbackView";

interface PracticeSet {
    id: string;
    skill: string;
    title: string;
    description?: string;
    content: string;
}

interface AIFeedback {
    bandScore: number;
    taskAchievementScore?: number;
    cohesionScore?: number;
    vocabularyScore?: number;
    grammarScore?: number;
    feedback: string;
    inlineCorrections?: {
        originalText: string;
        improvedText: string;
        type: string;
        explanation: string;
    }[];
    ideaExpansion?: {
        paragraph: string;
        weakPoint: string;
        suggestion: string;
    }[];
    improvements?: string[];
}

export default function WritingPractice() {
    const [sets, setSets] = useState<PracticeSet[]>([]);
    const [selected, setSelected] = useState<PracticeSet | null>(null);
    const [parsed, setParsed] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [activeTask, setActiveTask] = useState<"task1" | "task2">("task1");
    const [essayTask1, setEssayTask1] = useState("");
    const [essayTask2, setEssayTask2] = useState("");

    const [timeLeft, setTimeLeft] = useState(60 * 60);
    const [timerRunning, setTimerRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showMotivational, setShowMotivational] = useState(false);

    const [feedback, setFeedback] = useState<AIFeedback | null>(null);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showComboModal, setShowComboModal] = useState(false);
    const [showOverallModal, setShowOverallModal] = useState(false);
    const [overallBand, setOverallBand] = useState(0);
    const [skillScores, setSkillScores] = useState<any>({});

    useEffect(() => {
        fetch("/api/practice?skill=writing")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setSets(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) {
            if (Math.random() < 0.3) {
                const settings = localStorage.getItem('hideMotivational');
                if (settings !== 'true') {
                    setShowMotivational(true);
                }
            }
            return;
        }
        try { setParsed(JSON.parse(selected.content || "{}")); } catch { setParsed({}); }
        setEssayTask1(""); setEssayTask2(""); setFeedback(null);
        setActiveTask("task1"); setShowResultsModal(false); setShowComboModal(false); setShowOverallModal(false);
    }, [selected]);

    useEffect(() => {
        if (!timerRunning || timeLeft <= 0) return;
        const t = setInterval(() => setTimeLeft(p => p - 1), 1000);
        return () => clearInterval(t);
    }, [timerRunning, timeLeft]);

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;

    const currentEssay = activeTask === "task1" ? essayTask1 : essayTask2;
    const setCurrentEssay = (val: string) => {
        if (activeTask === "task1") setEssayTask1(val);
        else setEssayTask2(val);
        if (!timerRunning && val.length > 0) setTimerRunning(true);
    };

    const wordCount = currentEssay.trim() ? currentEssay.trim().split(/\s+/).length : 0;
    const task1Data = parsed?.task1 || (parsed?.writing?.task1Prompt ? parsed.writing : null);
    const task2Data = parsed?.task2 || (parsed?.writing?.task2Prompt ? parsed.writing : null);
    const hasBothTasks = task1Data && task2Data;

    const currentPrompt = activeTask === "task1"
        ? (task1Data?.prompt || task1Data?.task1Prompt || "Đề bài Task 1")
        : (task2Data?.prompt || task2Data?.task2Prompt || parsed?.prompt || "Đề bài Task 2");

    const currentImageUrl = activeTask === "task1" ? (task1Data?.imageUrl || task1Data?.task1Image) : null;
    const minWords = activeTask === "task1" ? 150 : 250;

    const handleSubmit = async () => {
        const taskNum = activeTask === "task1" ? 1 : 2;
        const currentEssayText = activeTask === "task1" ? essayTask1 : essayTask2;

        if (!currentPrompt || currentPrompt === "Đề bài Task 1" && activeTask === "task1") {
            return alert("Không tìm thấy đề bài. Vui lòng chọn lại bộ đề.");
        }
        if (!currentEssayText.trim()) return alert("Vui lòng nhập bài viết trước khi nộp.");
        if (wordCount < minWords) return alert(`Bài viết cần ít nhất ${minWords} từ. Hiện tại bạn mới viết ${wordCount} từ.`);

        setIsSubmitting(true); setTimerRunning(false);
        try {
            const res = await fetch("/api/ai/writing", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    practiceSetId: selected?.id,
                    taskNumber: taskNum,
                    prompt: currentPrompt,
                    userText: currentEssayText
                })
            });
            const data = await res.json();
            if (data.success || data.evaluation) {
                setFeedback(data.evaluation || data.feedback);
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
                alert("Lỗi chấm bài: " + (data.error || "Không xác định. Vui lòng thử lại."));
            }
        } catch {
            alert("Lỗi kết nối. Vui lòng thử lại sau.");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-purple-500 border-t-transparent" />
            </div>
        );
    }

    if (!selected) {
        return (
            <>
                <MotivationalScreen isOpen={showMotivational} onClose={() => setShowMotivational(false)} />
                <PracticeSetListView
                    skillName="writing"
                    sets={sets}
                    onSelectSet={(s) => setSelected(s)}
                />
            </>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-purple-50/20 py-6">
            <ResultsSummaryModal
                isOpen={showResultsModal}
                skill="writing"
                evaluation={{ bandScore: feedback?.bandScore || 0, feedback: feedback?.feedback || "" }}
                onReviewDetails={() => setShowResultsModal(false)}
                onRetry={() => {
                    setEssayTask1(""); setEssayTask2(""); setFeedback(null); setShowResultsModal(false); setTimeLeft(60 * 60);
                }}
                onBackToList={() => {
                    setShowResultsModal(false);
                    const settings = localStorage.getItem('hideMotivational');
                    if (settings !== 'true') {
                        setShowMotivational(true);
                        setTimeout(() => setSelected(null), 500);
                    } else {
                        setSelected(null);
                    }
                }}
            />

            <MotivationalScreen isOpen={showMotivational} onClose={() => { setShowMotivational(false); if (showResultsModal === false) setSelected(null); }} />

            <ComboCompletionModal
                isOpen={showComboModal}
                completedCount={3}
                totalCount={4}
                onContinue={() => {
                    setShowComboModal(false);
                    window.location.href = "/dashboard/practice/speaking";
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

            <div className="max-w-6xl mx-auto px-4 sm:px-6 space-y-6">
                {/* Header Navbar */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 text-slate-700 font-medium text-sm bg-slate-50 border border-slate-200">
                            <ArrowLeft className="h-4 w-4" /> Danh sách bài
                        </button>
                        <div className="h-10 w-10 rounded-xl bg-purple-100 flex items-center justify-center shrink-0">
                            <PenTool className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{selected.title}</h1>
                            <p className="text-xs text-slate-500">Luyện viết IELTS — AI Examiners chấm 4 tiêu chí</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-mono font-bold">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <span className={timeLeft < 300 ? "text-red-600 animate-pulse" : "text-slate-700"}>{formatTime(timeLeft)}</span>
                        </div>
                        {feedback && (
                            <Button onClick={() => setShowResultsModal(true)} className="bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md">
                                📊 Xem Bảng Điểm
                            </Button>
                        )}
                    </div>
                </div>

                {/* Task 1 / Task 2 Tabs Navigation */}
                {hasBothTasks && (
                    <div className="flex gap-2 border-b border-slate-200 bg-white p-2 rounded-2xl border shadow-sm">
                        <button
                            onClick={() => setActiveTask("task1")}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                                activeTask === "task1" ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "text-slate-600 hover:bg-slate-100"
                            }`}>
                            Task 1 (Report/Letter)
                        </button>
                        <button
                            onClick={() => setActiveTask("task2")}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition flex items-center gap-2 ${
                                activeTask === "task2" ? "bg-purple-600 text-white shadow-md shadow-purple-500/20" : "text-slate-600 hover:bg-slate-100"
                            }`}>
                            Task 2 (Essay)
                        </button>
                    </div>
                )}

                {/* Main Split Layout: Prompt Left | Textarea Right */}
                <div className="grid lg:grid-cols-2 gap-6">
                    {/* Prompt Left */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between max-h-[75vh] overflow-y-auto">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 border border-purple-200">
                                    {activeTask === "task1" ? "Task 1 (Viết ít nhất 150 từ)" : "Task 2 (Viết ít nhất 250 từ)"}
                                </span>
                            </div>

                            {currentImageUrl && (
                                <div className="rounded-xl border border-slate-200 overflow-hidden bg-slate-50 p-2">
                                    <img src={currentImageUrl} alt="Task 1 Chart/Diagram" className="w-full max-h-60 object-contain rounded-lg mx-auto" />
                                </div>
                            )}

                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-800 leading-relaxed text-sm font-medium whitespace-pre-line">
                                {currentPrompt}
                            </div>
                        </div>

                        <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl text-xs text-amber-900 font-medium">
                            💡 <strong>Gợi ý:</strong> Chia bài viết thành 4 đoạn chuẩn: Mở bài, Tổng quan (Overview), 2 Thân bài chi tiết.
                        </div>
                    </div>

                    {/* Textarea Right */}
                    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4 flex flex-col justify-between max-h-[75vh]">
                        <div className="space-y-3 flex-1 flex flex-col">
                            <div className="flex items-center justify-between text-xs font-bold text-slate-500">
                                <span>Soạn thảo bài làm</span>
                                <span className={wordCount >= minWords ? "text-emerald-600" : "text-amber-600"}>
                                    Đã viết: <b>{wordCount} từ</b> (Yêu cầu &ge; {minWords} từ)
                                </span>
                            </div>

                            <textarea
                                value={currentEssay}
                                onChange={e => setCurrentEssay(e.target.value)}
                                placeholder={`Gõ bài viết của bạn tại đây... (${activeTask === "task1" ? "Task 1" : "Task 2"})`}
                                className="flex-1 w-full p-4 border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500 outline-none font-sans text-sm text-slate-800 leading-relaxed min-h-[300px] resize-none"
                            />
                        </div>

                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !currentEssay.trim()}
                            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-purple-500/20 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
                            {isSubmitting ? "AI Examiner đang chấm bài..." : <><Send className="h-4 w-4" /> Nộp Bài Viết Cho AI Chấm Điểm</>}
                        </Button>
                    </div>
                </div>

                {/* AI Feedback View */}
                {feedback && <WritingFeedbackView feedback={feedback} />}
            </div>
        </div>
    );
}
