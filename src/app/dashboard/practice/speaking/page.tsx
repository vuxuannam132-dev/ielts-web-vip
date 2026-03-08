"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, UploadCloud, AlertCircle, ArrowLeft, MessageCircle, Loader2, BookOpen } from "lucide-react";
import Link from "next/link";

interface PracticeSet {
    id: string;
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
    const [isPlaying, setIsPlaying] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [evaluation, setEvaluation] = useState<any>(null);
    const [recordedChunks, setRecordedChunks] = useState<BlobPart[]>([]);
    const [audioUrl, setAudioUrl] = useState<string | null>(null);
    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        fetch("/api/practice?skill=speaking")
            .then(r => r.json())
            .then(data => { if (Array.isArray(data) && data.length) { setSets(data); setSelected(data[0]); } setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    useEffect(() => {
        if (!selected) return;
        try { setParsed(JSON.parse(selected.content || "{}")); } catch { setParsed({}); }
        setEvaluation(null); setAudioUrl(null); setCurrentQuestion(0);
    }, [selected]);

    const getQuestions = () => {
        if (!parsed) return [];
        if (selectedPart === "Part 1") return parsed?.part1?.questions || [];
        if (selectedPart === "Part 2") return parsed?.part2 ? [{ text: parsed.part2.cueCard, points: parsed.part2.points }] : [];
        if (selectedPart === "Part 3") return parsed?.part3?.questions || [];
        return [];
    };

    const questions = getQuestions();
    const currentQ = questions[currentQuestion];

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
        } catch { alert("Không thể truy cập microphone. Vui lòng kiểm tra quyền."); }
    };

    const stopRecording = () => {
        mediaRecorderRef.current?.stop();
        setIsRecording(false);
    };

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
            if (data.success) setEvaluation(data.evaluation);
            else alert("Lỗi: " + data.error);
        } catch { alert("Lỗi hệ thống."); }
        finally { setIsSubmitting(false); }
    };

    if (loading) return <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent" /></div>;

    if (!sets.length || !selected) {
        return (
            <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
                <div className="text-center max-w-md mx-4">
                    <div className="w-20 h-20 bg-green-100 rounded-2xl flex items-center justify-center mx-auto mb-6"><Mic className="h-10 w-10 text-green-500" /></div>
                    <h2 className="text-2xl font-bold text-slate-900 mb-3">Chưa có bài Speaking</h2>
                    <p className="text-slate-500 mb-6">Admin chưa đăng bài tập nào. Quay lại sau nhé!</p>
                    <Link href="/dashboard"><Button>← Về Dashboard</Button></Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-green-50/20">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-6">
                <div className="flex items-center gap-3">
                    <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                    <div className="h-10 w-10 rounded-xl bg-green-100 flex items-center justify-center"><Mic className="h-5 w-5 text-green-600" /></div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Speaking Practice</h1>
                        <p className="text-sm text-slate-500">Ghi âm và nhận điểm phát âm từ AI</p>
                    </div>
                </div>

                {/* Set selector */}
                <div className="flex gap-2 overflow-x-auto pb-1">
                    {sets.map(s => (
                        <button key={s.id} onClick={() => setSelected(s)}
                            className={`px-4 py-2 rounded-lg text-sm font-semibold whitespace-nowrap transition ${selected?.id === s.id ? "bg-green-600 text-white shadow-md" : "bg-white text-slate-600 border border-slate-200 hover:bg-green-50"}`}>
                            {s.title}
                        </button>
                    ))}
                </div>

                {/* Part Tabs */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex border-b border-slate-200">
                        {(["Part 1", "Part 2", "Part 3"] as const).map(p => (
                            <button key={p} onClick={() => { setSelectedPart(p); setCurrentQuestion(0); setAudioUrl(null); setEvaluation(null); }}
                                className={`flex-1 py-3 text-sm font-semibold transition ${selectedPart === p ? "text-green-700 border-b-2 border-green-600 bg-green-50/50" : "text-slate-500 hover:text-slate-700"}`}>
                                {p}
                            </button>
                        ))}
                    </div>
                    <div className="p-6">
                        {/* Part description */}
                        <div className="mb-4">
                            {selectedPart === "Part 1" && <p className="text-sm text-slate-500">Trả lời các câu hỏi ngắn về bản thân, cuộc sống, sở thích.</p>}
                            {selectedPart === "Part 2" && <p className="text-sm text-slate-500">Nói 1-2 phút về một chủ đề cụ thể theo gợi ý trên thẻ.</p>}
                            {selectedPart === "Part 3" && <p className="text-sm text-slate-500">Thảo luận các câu hỏi mở rộng, phức tạp hơn về chủ đề Part 2.</p>}
                        </div>

                        {questions.length === 0 ? (
                            <div className="text-center py-8 text-slate-500">
                                <AlertCircle className="h-8 w-8 mx-auto mb-2 text-slate-300" />
                                <p>Không có câu hỏi cho phần này.</p>
                            </div>
                        ) : (
                            <>
                                {/* Navigation */}
                                {questions.length > 1 && (
                                    <div className="flex gap-2 mb-4 flex-wrap">
                                        {questions.map((_: any, i: number) => (
                                            <button key={i} onClick={() => { setCurrentQuestion(i); setAudioUrl(null); setEvaluation(null); }}
                                                className={`px-3 py-1.5 rounded text-sm font-bold ${currentQuestion === i ? "bg-green-600 text-white" : "bg-slate-100 text-slate-600"}`}>
                                                Q{i + 1}
                                            </button>
                                        ))}
                                    </div>
                                )}

                                {/* Question Card */}
                                <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-100 mb-6">
                                    {selectedPart === "Part 2" ? (
                                        <>
                                            <p className="text-lg font-semibold text-slate-800 mb-4">{currentQ?.text}</p>
                                            {currentQ?.points && (
                                                <ul className="space-y-1">
                                                    {currentQ.points.map((pt: string, i: number) => (
                                                        <li key={i} className="text-sm text-slate-600 flex items-start gap-2"><span className="text-green-500 mt-0.5">•</span>{pt}</li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    ) : (
                                        <p className="text-lg font-semibold text-slate-800">{typeof currentQ === "string" ? currentQ : currentQ?.text}</p>
                                    )}
                                </div>

                                {/* Recording controls */}
                                <div className="flex flex-col items-center gap-5">
                                    <button onClick={isRecording ? stopRecording : startRecording}
                                        className={`relative h-20 w-20 rounded-full flex items-center justify-center transition-all active:scale-95 shadow-xl ${isRecording ? "bg-red-500 hover:bg-red-600 animate-pulse" : "bg-green-600 hover:bg-green-700"} text-white`}>
                                        {isRecording ? <Square className="h-8 w-8" /> : <Mic className="h-8 w-8" />}
                                        {isRecording && <span className="absolute -top-1 -right-1 h-4 w-4 bg-red-400 rounded-full animate-ping" />}
                                    </button>
                                    <p className="text-sm text-slate-500">{isRecording ? "Đang ghi âm... Nhấn ■ để dừng" : "Nhấn 🎙 để bắt đầu ghi âm"}</p>

                                    {audioUrl && (
                                        <div className="w-full bg-slate-50 rounded-xl p-4 border border-slate-200">
                                            <audio ref={audioRef} src={audioUrl} controls className="w-full h-10" />
                                        </div>
                                    )}

                                    {audioUrl && !evaluation && (
                                        <Button onClick={handleSubmit} disabled={isSubmitting} className="w-full max-w-sm bg-emerald-600 hover:bg-emerald-700 gap-2 disabled:opacity-70">
                                            {isSubmitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang phân tích...</> : <><UploadCloud className="h-4 w-4" /> Gửi để AI chấm điểm</>}
                                        </Button>
                                    )}
                                </div>

                                {evaluation && (
                                    <div className="mt-6 bg-white rounded-xl border border-slate-200 p-5 space-y-4">
                                        <h4 className="font-bold text-slate-900 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-green-600" /> AI Feedback</h4>
                                        <div className="text-center">
                                            <div className="text-4xl font-black text-green-700">{evaluation.bandScore}</div>
                                            <div className="text-sm text-slate-500">Band Score</div>
                                        </div>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { label: "Fluency", score: evaluation.fluencyScore },
                                                { label: "Pronunciation", score: evaluation.pronunciationScore },
                                                { label: "Lexical Resource", score: evaluation.vocabularyScore },
                                                { label: "Grammar", score: evaluation.grammarScore },
                                            ].map(item => item.score != null && (
                                                <div key={item.label} className="bg-slate-50 rounded-lg p-3">
                                                    <div className="text-xs text-slate-500 mb-1">{item.label}</div>
                                                    <div className="font-bold text-lg">{item.score}</div>
                                                    <div className="h-1.5 bg-slate-200 rounded-full mt-1"><div className="h-full bg-green-500 rounded-full" style={{ width: `${(item.score / 9) * 100}%` }} /></div>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="bg-slate-50 rounded-lg p-4 text-sm text-slate-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: evaluation.feedback }} />
                                        <Button variant="outline" className="w-full" onClick={() => { setAudioUrl(null); setEvaluation(null); setRecordedChunks([]); }}>Ghi âm lại</Button>
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
