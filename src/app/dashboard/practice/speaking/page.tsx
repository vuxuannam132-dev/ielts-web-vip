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

export default function SpeakingPractice() {
    const [sets, setSets] = useState<PracticeSet[]>([]);
    const [selected, setSelected] = useState<PracticeSet | null>(null);
    const [parsed, setParsed] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    const [selectedPart, setSelectedPart] = useState<"Part 1" | "Part 2" | "Part 3">("Part 1");
    const [currentQuestion, setCurrentQuestion] = useState(0);

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
        try { setParsed(JSON.parse(selected.content || "{}")); } catch { setParsed({}); }
        setEvaluation(null); setAudioUrl(null); setCurrentQuestion(0);
        setSelectedPart("Part 1"); setShowResultsModal(false); setShowComboModal(false); setShowOverallModal(false);
    }, [selected]);

    const speakQuestionText = (text: string) => {
        if ('speechSynthesis' in window) {
            window.speechSynthesis.cancel();
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'en-US';
            window.speechSynthesis.speak(utterance);
        }
    };

    const getQuestions = () => {
        if (!parsed) return [];
        if (selectedPart === "Part 1") return parsed?.part1?.questions || (parsed?.part1 ? [parsed.part1] : []);
        if (selectedPart === "Part 2") return parsed?.part2 ? [{ text: parsed.part2.cueCard || parsed.part2.text || "Speaking Cue Card Topic", points: parsed.part2.points || [] }] : [];
        if (selectedPart === "Part 3") return parsed?.part3?.questions || (parsed?.part3 ? [parsed.part3] : []);
        return [];
    };

    const questions = getQuestions();
    const currentQ = questions[currentQuestion] || { text: "Chưa có câu hỏi cho Part này." };

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

    const isComboTest = selected && (selected.skill === "COMBO" || selected.title?.toLowerCase().includes("combo") || selected.description?.toLowerCase().includes("combo"));

    const handleSubmit = async () => {
        if (!recordedChunks.length) return alert("Bạn chưa ghi âm bài nói.");
        setIsSubmitting(true);
        const blob = new Blob(recordedChunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "speaking.webm");
        formData.append("practiceSetId", selected?.id || "");
        formData.append("part", selectedPart);
        formData.append("questionContext", JSON.stringify(currentQ));

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
                alert("Lỗi: " + data.error);
            }
        } catch {
            alert("Lỗi kết nối.");
        } finally {
            setIsSubmitting(false);
        }
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
                onContinue={() => {
                    setShowComboModal(false);
                    setSelected(null);
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

            <div className="max-w-4xl mx-auto px-4 sm:px-6 space-y-6">
                {/* Header Navbar */}
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

                {/* Part Tabs Navigation */}
                <div className="flex border-b border-slate-200 bg-white p-2 rounded-2xl border shadow-sm">
                    {(["Part 1", "Part 2", "Part 3"] as const).map(p => (
                        <button
                            key={p}
                            onClick={() => { setSelectedPart(p); setCurrentQuestion(0); setAudioUrl(null); setEvaluation(null); }}
                            className={`flex-1 py-3 text-sm font-bold transition rounded-xl ${
                                selectedPart === p
                                    ? "bg-emerald-600 text-white shadow-md shadow-emerald-500/20"
                                    : "text-slate-600 hover:bg-slate-100"
                            }`}>
                            {p}
                        </button>
                    ))}
                </div>

                {/* Question & Audio Recording Area */}
                <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 text-center space-y-6">
                    <div className="max-w-2xl mx-auto space-y-4">
                        <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                            {selectedPart === "Part 1" ? "Part 1 — Trả lời câu hỏi ngắn" : selectedPart === "Part 2" ? "Part 2 — Thẻ bài phát biểu (Cue Card)" : "Part 3 — Thảo luận mở rộng"}
                        </span>

                        <h2 className="text-xl font-bold text-slate-900 leading-relaxed">
                            {typeof currentQ === "string" ? currentQ : currentQ.text}
                        </h2>

                        <button
                            onClick={() => speakQuestionText(typeof currentQ === "string" ? currentQ : currentQ.text)}
                            className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full hover:bg-emerald-100 transition">
                            <Volume2 className="h-4 w-4" /> Nghe phát âm câu hỏi
                        </button>

                        {/* Cue Card Bullet points if Part 2 */}
                        {selectedPart === "Part 2" && currentQ.points && currentQ.points.length > 0 && (
                            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-left space-y-2 text-xs text-slate-700">
                                <div className="font-bold text-slate-800">You should say:</div>
                                <ul className="list-disc list-inside space-y-1">
                                    {currentQ.points.map((pt: string, idx: number) => (
                                        <li key={idx}>{pt}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Microphone Action Button */}
                    <div className="py-6 flex flex-col items-center justify-center gap-4">
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

                    {/* Recorded Audio Preview Player */}
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
                                <span className="text-xs font-mono text-slate-500">Ghi âm hoàn tất!</span>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <div className="max-w-md mx-auto pt-4">
                        <Button
                            onClick={handleSubmit}
                            disabled={isSubmitting || !audioUrl}
                            className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50">
                            {isSubmitting ? "AI Examiner đang chấm phát âm & ngữ pháp..." : "Nộp Bài Nói Cho AI Chấm Điểm"}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
}
