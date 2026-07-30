"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, ArrowLeft, Volume2, Sparkles } from "lucide-react";
import PracticeSetListView from "@/components/practice/PracticeSetListView";
import ComboCompletionModal from "@/components/practice/ComboCompletionModal";
import ResultsSummaryModal from "@/components/practice/ResultsSummaryModal";
import OverallScorecardModal from "@/components/practice/OverallScorecardModal";

interface PracticeSet {
    id: string;
    skill: string;
    title: string;
    description?: string;
    content: string;
}

/**
 * Parse speaking content from multiple possible JSON shapes:
 * Shape A (admin manual): { speaking: { part1: "Q1\nQ2", part2: "Cue card...", part3: "Q1\nQ2" } }
 * Shape B (AI import):    { part1: { questions: ["Q1","Q2"] }, part2: { cueCard: "..." }, part3: { questions: [...] } }
 * Shape C (flat array):   { part1: ["Q1","Q2"], part2: "cue card...", part3: [...] }
 *
 * Returns: { part1: string[], part2: string, part2Points: string[], part3: string[] }
 */
function parseSpeakingContent(parsed: any): {
    part1: string[];
    part2: string;
    part2Points: string[];
    part3: string[];
} {
    const empty = { part1: [], part2: "", part2Points: [], part3: [] };
    if (!parsed) return empty;

    // Unwrap if nested under "speaking" key
    const raw = parsed.speaking || parsed;

    const parseToStringArray = (val: any): string[] => {
        if (!val) return [];
        if (typeof val === "string") {
            const trimmed = val.trim();
            if (!trimmed) return [];

            // Try splitting by newlines first (preferred admin format: each question on a new line)
            const byNewline = trimmed.split(/\n+/).map(s => s.replace(/^\d+[\.\)]\s*/, "").trim()).filter(Boolean);
            if (byNewline.length > 1) return byNewline;

            // Fallback: try splitting by inline numbered pattern "2. " or "2) " 
            // e.g. "1. Q1 2. Q2 3. Q3" → ["Q1", "Q2", "Q3"]
            const inlineNumbered = trimmed.split(/\s+(?=\d+[\.\)]\s)/).map(s => s.replace(/^\d+[\.\)]\s*/, "").trim()).filter(Boolean);
            if (inlineNumbered.length > 1) return inlineNumbered;

            // Single question — return as-is after stripping leading number
            return [trimmed.replace(/^\d+[\.\)]\s*/, "").trim()].filter(Boolean);
        }
        if (Array.isArray(val)) {
            return val.flatMap((v: any) => {
                if (typeof v === "string") return v.replace(/^\d+[\.\)]\s*/, "").trim();
                if (typeof v === "object" && v !== null) return v.text || v.question || "";
                return "";
            }).filter(Boolean);
        }
        if (typeof val === "object") {
            // { questions: [...] }
            return parseToStringArray(val.questions || val.question || "");
        }
        return [];
    };

    const parseCueCard = (val: any): { text: string; points: string[] } => {
        if (!val) return { text: "", points: [] };
        if (typeof val === "string") {
            const lines = val.split(/\n+/).map(s => s.trim()).filter(Boolean);
            // First non-empty line is the main topic
            const mainLine = lines[0] || val;
            // Filter out "You should say:" header line and extract bullet points
            const bulletPoints = lines.slice(1)
                .filter(l => !/^you should say/i.test(l.trim()))
                .map(l => l.replace(/^[-•*]\s*/, "").trim())
                .filter(Boolean);
            return { text: mainLine, points: bulletPoints };
        }
        if (typeof val === "object") {
            const text = val.cueCard || val.text || val.topic || "";
            const points = val.points || val.bulletPoints || [];
            return {
                text: typeof text === "string" ? text : "",
                points: Array.isArray(points) ? points : parseToStringArray(points)
            };
        }
        return { text: "", points: [] };
    };

    const p1 = parseToStringArray(raw.part1);
    const { text: p2Text, points: p2Points } = parseCueCard(raw.part2);
    const p3 = parseToStringArray(raw.part3);

    return { part1: p1, part2: p2Text, part2Points: p2Points, part3: p3 };
}

export default function SpeakingPractice() {
    const [sets, setSets] = useState<PracticeSet[]>([]);
    const [selected, setSelected] = useState<PracticeSet | null>(null);
    const [speakingData, setSpeakingData] = useState<ReturnType<typeof parseSpeakingContent> | null>(null);
    const [loading, setLoading] = useState(true);

    const [selectedPart, setSelectedPart] = useState<1 | 2 | 3>(1);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);

    const [isRecording, setIsRecording] = useState(false);
    const [isPlayingPreview, setIsPlayingPreview] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioPreviewRef = useRef<HTMLAudioElement | null>(null);

    const [evaluation, setEvaluation] = useState<any>(null);
    const [showResultsModal, setShowResultsModal] = useState(false);
    const [showComboModal, setShowComboModal] = useState(false);
    const [showOverallModal, setShowOverallModal] = useState(false);
    const [overallBand, setOverallBand] = useState(0);
    const [skillScores, setSkillScores] = useState<any>({});

    useEffect(() => {
        fetch("/api/practice?skill=speaking")
            .then(r => r.json())
            .then(data => {
                if (Array.isArray(data)) setSets(data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) return;
        try {
            const parsed = JSON.parse(selected.content || "{}");
            setSpeakingData(parseSpeakingContent(parsed));
        } catch {
            setSpeakingData({ part1: [], part2: "", part2Points: [], part3: [] });
        }
        setEvaluation(null); setAudioUrl(null); setCurrentQuestionIdx(0);
        setSelectedPart(1); setShowResultsModal(false); setShowComboModal(false); setShowOverallModal(false);
        setRecordedChunks([]);
    }, [selected]);

    const speakQuestionText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    // Get current question text based on selected part
    const getCurrentQuestion = (): string => {
        if (!speakingData) return "";
        if (selectedPart === 1) return speakingData.part1[currentQuestionIdx] || "";
        if (selectedPart === 2) return speakingData.part2;
        if (selectedPart === 3) return speakingData.part3[currentQuestionIdx] || "";
        return "";
    };

    const getCurrentQuestions = (): string[] => {
        if (!speakingData) return [];
        if (selectedPart === 1) return speakingData.part1;
        if (selectedPart === 2) return speakingData.part2 ? [speakingData.part2] : [];
        if (selectedPart === 3) return speakingData.part3;
        return [];
    };

    const currentQ = getCurrentQuestion();
    const allQuestions = getCurrentQuestions();

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const mr = new MediaRecorder(stream);
            const chunks: BlobPart[] = [];
            mr.ondataavailable = e => chunks.push(e.data);
            mr.onstop = () => {
                setRecordedChunks(chunks);
                const blob = new Blob(chunks, { type: "audio/webm" });
                setAudioUrl(URL.createObjectURL(blob));
            };
            mr.start();
            mediaRecorderRef.current = mr;
            setIsRecording(true); setAudioUrl(null); setEvaluation(null);
        } catch {
            alert("Không thể truy cập microphone. Vui lòng cấp quyền truy cập thiết bị.");
        }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

    const togglePlayPreview = () => {
        if (!audioPreviewRef.current) return;
        if (isPlayingPreview) {
            audioPreviewRef.current.pause();
            setIsPlayingPreview(false);
        } else {
            audioPreviewRef.current.play();
            setIsPlayingPreview(true);
        }
    };

    const handleSubmit = async () => {
        if (!recordedChunks.length) return alert("Bạn chưa ghi âm bài nói.");
        if (!currentQ) return alert("Không có câu hỏi để nộp.");

        setIsSubmitting(true);
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "speaking.webm");
        formData.append("practiceSetId", selected?.id || "");
        formData.append("partNumber", String(selectedPart)); // API expects "partNumber" as number string
        formData.append("prompt", currentQ);                  // API expects "prompt" as string

        try {
            const res = await fetch("/api/ai/speaking", { method: "POST", body: formData });
            const data = await res.json();
            if (data.success) {
                setEvaluation(data.evaluation);
                setShowResultsModal(true);

                // Fetch latest user stats
                fetch("/api/user/stats")
                    .then(r => r.json())
                    .then(stats => {
                        if (stats.completedSkills && stats.completedSkills.length === 4) {
                            setOverallBand(stats.estimatedBand || 0);
                            setSkillScores(stats.skillScores || {});
                            setShowOverallModal(true);
                        }
                    })
                    .catch(() => {});
            } else {
                alert("Lỗi: " + (data.error || "Không thể chấm bài"));
            }
        } catch {
            alert("Lỗi kết nối.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePartChange = (part: 1 | 2 | 3) => {
        setSelectedPart(part);
        setCurrentQuestionIdx(0);
        setAudioUrl(null);
        setEvaluation(null);
        setRecordedChunks([]);
    };

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-emerald-500 border-t-transparent" />
            </div>
        );
    }

    if (!selected) {
        return (
            <PracticeSetListView
                skillName="speaking"
                sets={sets}
                onSelectSet={(s) => setSelected(s)}
            />
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-emerald-50/20 py-6">
            <ResultsSummaryModal
                isOpen={showResultsModal}
                skill="speaking"
                evaluation={{ bandScore: evaluation?.bandScore || 0, feedback: evaluation?.feedback || "" }}
                onReviewDetails={() => setShowResultsModal(false)}
                onRetry={() => {
                    setEvaluation(null); setAudioUrl(null); setShowResultsModal(false); setRecordedChunks([]);
                }}
                onBackToList={() => setSelected(null)}
            />

            <ComboCompletionModal
                isOpen={showComboModal}
                completedCount={4}
                totalCount={4}
                onContinue={() => { setShowComboModal(false); setSelected(null); }}
                onClose={() => { setShowComboModal(false); setSelected(null); }}
            />

            <OverallScorecardModal
                isOpen={showOverallModal}
                overallBand={overallBand}
                skillScores={skillScores}
                onClose={() => setShowOverallModal(false)}
                onGoToDashboard={() => window.location.href = "/dashboard"}
            />

            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                {/* Header */}
                <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button onClick={() => setSelected(null)} className="p-2 hover:bg-slate-100 rounded-xl transition flex items-center gap-1.5 text-slate-700 font-medium text-sm bg-slate-50 border border-slate-200">
                            <ArrowLeft className="h-4 w-4" /> Danh sách bài
                        </button>
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center shrink-0">
                            <Mic className="h-5 w-5 text-emerald-600" />
                        </div>
                        <div>
                            <h1 className="text-lg font-bold text-slate-900 line-clamp-1">{selected.title}</h1>
                            <p className="text-xs text-slate-500">Luyện nói IELTS — Ghi âm và AI Phân tích phát âm & Ngữ pháp</p>
                        </div>
                    </div>
                    {evaluation && (
                        <Button onClick={() => setShowResultsModal(true)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs px-4 py-2 rounded-xl shadow-md">
                            📊 Xem Bảng Điểm
                        </Button>
                    )}
                </div>

                {/* Part Tabs */}
                <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl border shadow-sm">
                    {([1, 2, 3] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => handlePartChange(p)}
                            className={`flex-1 py-3 text-sm font-bold transition rounded-xl ${
                                selectedPart === p
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}>
                            Part {p}
                            {speakingData && (
                                <span className={`ml-2 text-xs px-2 py-0.5 rounded-full ${selectedPart === p ? "bg-white/20 text-white" : "bg-slate-100 text-slate-500"}`}>
                                    {p === 1 ? speakingData.part1.length : p === 2 ? (speakingData.part2 ? 1 : 0) : speakingData.part3.length} câu
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Question Area */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {selectedPart === 1 ? "Part 1 — Trả lời câu hỏi ngắn" : selectedPart === 2 ? "Part 2 — Thẻ bài phát biểu (Cue Card)" : "Part 3 — Thảo luận mở rộng"}
                        </span>

                        {/* No questions fallback */}
                        {allQuestions.length === 0 ? (
                            <div className="py-8 text-slate-400 text-sm font-medium">
                                Chưa có câu hỏi cho Part {selectedPart} trong bộ đề này.
                            </div>
                        ) : (
                            <>
                                {/* Question navigation for Part 1 & 3 */}
                                {(selectedPart === 1 || selectedPart === 3) && allQuestions.length > 1 && (
                                    <div className="flex items-center justify-center gap-2 flex-wrap pb-2">
                                        {allQuestions.map((_, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => { setCurrentQuestionIdx(idx); setAudioUrl(null); setEvaluation(null); setRecordedChunks([]); }}
                                                className={`h-8 w-8 rounded-full text-xs font-bold transition ${currentQuestionIdx === idx ? "bg-emerald-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-emerald-100"}`}>
                                                {idx + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Main question text */}
                                <h2 className="text-xl font-bold text-slate-900 leading-relaxed">
                                    {selectedPart === 1 || selectedPart === 3
                                        ? `${currentQuestionIdx + 1}. ${currentQ}`
                                        : currentQ}
                                </h2>

                                {/* Cue card bullet points */}
                                {selectedPart === 2 && speakingData && speakingData.part2Points.length > 0 && (
                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-sm text-slate-700 max-w-lg mx-auto">
                                        <div className="font-bold text-slate-800 text-xs uppercase tracking-wider">You should say:</div>
                                        <ul className="list-disc list-inside space-y-1">
                                            {speakingData.part2Points.map((pt, idx) => (
                                                <li key={idx}>{pt}</li>
                                            ))}
                                        </ul>
                                    </div>
                                )}

                                <button
                                    onClick={() => speakQuestionText(currentQ)}
                                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition">
                                    <Volume2 className="h-4 w-4" /> Nghe phát âm câu hỏi
                                </button>
                            </>
                        )}
                    </div>

                    {/* Microphone */}
                    <div className="py-4 flex flex-col items-center justify-center gap-4">
                        {!isRecording ? (
                            <button
                                onClick={startRecording}
                                className="h-20 w-20 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-xl shadow-emerald-500/30 transition-all hover:scale-105 active:scale-95">
                                <Mic className="h-10 w-10" />
                            </button>
                        ) : (
                            <button
                                onClick={stopRecording}
                                className="h-20 w-20 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center shadow-xl shadow-red-500/30 transition-all animate-pulse">
                                <Square className="h-8 w-8" />
                            </button>
                        )}
                        <p className="text-xs font-bold text-slate-500">
                            {isRecording ? "🔴 Đang ghi âm... Bấm nút đỏ để dừng." : "Bấm micro để bắt đầu trả lời."}
                        </p>
                    </div>

                    {/* Audio Preview */}
                    {audioUrl && (
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 max-w-md mx-auto space-y-3 animate-fade-in">
                            <div className="text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5">
                                <Sparkles className="h-4 w-4 text-emerald-600" /> Nghe lại đoạn ghi âm bài nói
                            </div>
                            <audio ref={audioPreviewRef} src={audioUrl} onEnded={() => setIsPlayingPreview(false)} />
                            <div className="flex items-center justify-center gap-3">
                                <button
                                    onClick={togglePlayPreview}
                                    className="h-10 w-10 rounded-full bg-emerald-600 text-white flex items-center justify-center shadow transition hover:bg-emerald-700">
                                    {isPlayingPreview ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                                </button>
                                <span className="text-xs font-mono text-slate-500 font-bold">Ghi âm hoàn tất!</span>
                                <button
                                    onClick={() => { setAudioUrl(null); setRecordedChunks([]); setIsPlayingPreview(false); }}
                                    className="text-xs text-red-500 hover:text-red-700 font-bold underline">
                                    Ghi lại
                                </button>
                            </div>
                        </div>
                    )}

                    {/* Submit */}
                    <div className="max-w-md mx-auto pt-2">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !audioUrl || allQuestions.length === 0}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                            {isSubmitting ? "AI Examiner đang chấm phát âm & ngữ pháp..." : "Nộp Bài Nói Cho AI Chấm Điểm"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
