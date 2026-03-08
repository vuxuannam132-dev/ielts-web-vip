"use client";

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Pause, UploadCloud, AlertCircle, ArrowLeft, MessageCircle, Loader2 } from "lucide-react";
import Link from "next/link";

const SPEAKING_PARTS = {
    "Part 1": {
        title: "Interview",
        description: "Trả lời các câu hỏi ngắn về bản thân, cuộc sống, sở thích.",
        topics: [
            {
                name: "Introduce Yourself",
                questions: ["Do you work or study?", "What do you do in a typical day?", "What hobbies do you have?", "Do you prefer indoor or outdoor activities?"]
            },
            {
                name: "Daily Routine",
                questions: ["What time do you usually wake up?", "What do you usually do in the morning?", "Do you have the same routine on weekends?", "Is there anything you would like to change about your daily routine?"]
            },
            {
                name: "Technology",
                questions: ["How often do you use technology?", "What is your favorite app?", "Do you think technology has improved our lives?", "What technology do you use for studying or working?"]
            },
            {
                name: "Travel",
                questions: ["Do you like traveling?", "Where was the last place you visited?", "Do you prefer traveling alone or with friends?", "What kind of place would you like to visit in the future?"]
            },
        ]
    },
    "Part 2": {
        title: "Cue Card",
        description: "Nói 1-2 phút về một chủ đề cụ thể theo gợi ý trên thẻ.",
        topics: [
            {
                name: "A Technology You Use",
                cueCard: "Describe a piece of technology you cannot live without.",
                points: ["What it is and how you got it", "How often you use it", "What you use it for", "And explain why you cannot live without it"]
            },
            {
                name: "A Place You Visited",
                cueCard: "Describe a place you visited that impressed you.",
                points: ["Where it was", "When you went there", "What you saw and did", "And explain why it impressed you"]
            },
            {
                name: "A Person Who Inspires You",
                cueCard: "Describe a person who has influenced you in a positive way.",
                points: ["Who this person is", "How you know them", "What they have done", "And explain how they have influenced you"]
            },
        ]
    },
    "Part 3": {
        title: "Discussion",
        description: "Thảo luận chuyên sâu về các chủ đề liên quan đến Part 2.",
        topics: [
            {
                name: "Technology & Society",
                questions: ["How has technology changed the way people communicate?", "Do you think technology creates more problems than it solves?", "What role should governments play in regulating technology?", "How do you think AI will change education in the future?"]
            },
            {
                name: "Education",
                questions: ["Is higher education necessary for success?", "Should education focus more on practical skills?", "How has online learning changed traditional education?", "What qualities make a good teacher?"]
            },
        ]
    }
};

type PartKey = keyof typeof SPEAKING_PARTS;

export default function SpeakingPractice() {
    const [selectedPart, setSelectedPart] = useState<PartKey>("Part 1");
    const [selectedTopicIdx, setSelectedTopicIdx] = useState(0);
    const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
    const [isRecording, setIsRecording] = useState(false);
    const [recordingTime, setRecordingTime] = useState(0);
    const [hasRecorded, setHasRecorded] = useState(false);
    const [isPlaying, setIsPlaying] = useState(false);
    const [isEvaluating, setIsEvaluating] = useState(false);
    const [permissionDenied, setPermissionDenied] = useState(false);
    const [feedback, setFeedback] = useState<any | null>(null);

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const audioBlobRef = useRef<Blob | null>(null);
    const audioUrlRef = useRef<string | null>(null);
    const audioElementRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);

    const partData = SPEAKING_PARTS[selectedPart];
    const selectedTopic = partData.topics[selectedTopicIdx];

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (isRecording) {
            interval = setInterval(() => setRecordingTime(prev => prev + 1), 1000);
        }
        return () => clearInterval(interval);
    }, [isRecording]);

    useEffect(() => {
        return () => {
            if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
            if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
        };
    }, []);

    const startRecording = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;
            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4'
            });
            mediaRecorderRef.current = mediaRecorder;
            audioChunksRef.current = [];

            mediaRecorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
            mediaRecorder.onstop = () => {
                const blob = new Blob(audioChunksRef.current, { type: mediaRecorder.mimeType });
                audioBlobRef.current = blob;
                if (audioUrlRef.current) URL.revokeObjectURL(audioUrlRef.current);
                audioUrlRef.current = URL.createObjectURL(blob);
                audioElementRef.current = new Audio(audioUrlRef.current);
                audioElementRef.current.onended = () => setIsPlaying(false);
                stream.getTracks().forEach(t => t.stop());
            };

            mediaRecorder.start(100);
            setIsRecording(true);
            setHasRecorded(false);
            setRecordingTime(0);
            setPermissionDenied(false);
            setFeedback(null);
        } catch {
            setPermissionDenied(true);
        }
    };

    const stopRecording = () => {
        if (mediaRecorderRef.current?.state !== 'inactive') mediaRecorderRef.current?.stop();
        setIsRecording(false);
        setHasRecorded(true);
    };

    const togglePlayback = () => {
        if (!audioElementRef.current) return;
        if (isPlaying) { audioElementRef.current.pause(); setIsPlaying(false); }
        else { audioElementRef.current.play(); setIsPlaying(true); }
    };

    const submitAudio = async () => {
        if (!audioBlobRef.current) return;
        setIsEvaluating(true);
        setFeedback(null);

        const formData = new FormData();
        formData.append("audio", audioBlobRef.current, "audio.webm");
        formData.append("partNumber", selectedPart.replace('Part ', ''));

        let promptText = "";
        if ('questions' in selectedTopic) {
            promptText = selectedTopic.questions[currentQuestionIdx];
        } else if ('cueCard' in selectedTopic) {
            promptText = selectedTopic.cueCard + "\nPoints to cover:\n" + selectedTopic.points.join("\n");
        }
        formData.append("prompt", promptText);

        try {
            const res = await fetch("/api/ai/speaking", {
                method: "POST",
                body: formData
            });
            const data = await res.json();

            if (res.ok) {
                setFeedback(data.evaluation);
            } else {
                alert("Lỗi: " + data.error);
            }
        } catch (error) {
            alert("Lỗi kết nối khi chấm điểm");
        } finally {
            setIsEvaluating(false);
        }
    };

    const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, '0')}:${(s % 60).toString().padStart(2, '0')}`;

    const resetRecording = () => {
        setHasRecorded(false);
        setFeedback(null);
        setRecordingTime(0);
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-emerald-50/20">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                        <div className="h-10 w-10 rounded-xl bg-emerald-100 flex items-center justify-center"><Mic className="h-5 w-5 text-emerald-600" /></div>
                        <div>
                            <h1 className="text-xl font-bold text-slate-900">Speaking Practice</h1>
                            <p className="text-sm text-slate-500">Luyện nói IELTS với AI chấm điểm</p>
                        </div>
                    </div>
                </div>

                {/* Part Tabs */}
                <div className="flex gap-2">
                    {(Object.keys(SPEAKING_PARTS) as PartKey[]).map(part => (
                        <button key={part}
                            onClick={() => { setSelectedPart(part); setSelectedTopicIdx(0); setCurrentQuestionIdx(0); resetRecording(); }}
                            className={`px-5 py-2.5 rounded-xl text-sm font-bold transition ${selectedPart === part ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white text-slate-600 border border-slate-200 hover:bg-emerald-50'}`}>
                            {part}
                        </button>
                    ))}
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                    {/* Left: Topic List */}
                    <div className="lg:col-span-1 space-y-3">
                        <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-2">{partData.title} — Chọn chủ đề</h3>
                        {partData.topics.map((topic, idx) => (
                            <button key={idx}
                                onClick={() => { setSelectedTopicIdx(idx); setCurrentQuestionIdx(0); resetRecording(); }}
                                className={`w-full text-left p-4 rounded-xl border transition ${selectedTopicIdx === idx ? 'bg-emerald-50 border-emerald-300 shadow-sm' : 'bg-white border-slate-200 hover:border-emerald-200'}`}>
                                <p className="font-semibold text-slate-800 text-sm">{topic.name}</p>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    {'questions' in topic ? `${topic.questions.length} câu hỏi` : 'Cue Card'}
                                </p>
                            </button>
                        ))}
                    </div>

                    {/* Right: Question + Recorder */}
                    <div className="lg:col-span-2 space-y-4">

                        {/* Question / Cue Card Display */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
                            {'questions' in selectedTopic ? (
                                <>
                                    <div className="flex items-center justify-between mb-4">
                                        <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{selectedPart} — {selectedTopic.name}</span>
                                        <span className="text-xs text-slate-400">Câu {currentQuestionIdx + 1}/{selectedTopic.questions.length}</span>
                                    </div>
                                    <div className="bg-slate-50 rounded-xl p-6 mb-4">
                                        <MessageCircle className="h-6 w-6 text-emerald-500 mb-3" />
                                        <p className="text-lg font-semibold text-slate-800">{selectedTopic.questions[currentQuestionIdx]}</p>
                                    </div>
                                    <div className="flex gap-2">
                                        {selectedTopic.questions.map((_, i) => (
                                            <button key={i} onClick={() => { setCurrentQuestionIdx(i); resetRecording(); }}
                                                className={`h-8 w-8 rounded-lg text-xs font-bold transition ${currentQuestionIdx === i ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-500 hover:bg-emerald-100'}`}>
                                                {i + 1}
                                            </button>
                                        ))}
                                    </div>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-1 rounded">{selectedPart} — Cue Card</span>
                                    <h3 className="text-xl font-bold text-slate-800 mt-4 mb-4">{'cueCard' in selectedTopic ? selectedTopic.cueCard : ''}</h3>
                                    {'points' in selectedTopic && (
                                        <div className="bg-slate-50 rounded-xl p-5">
                                            <p className="font-semibold text-slate-700 mb-2 text-sm">You should say:</p>
                                            <ul className="list-disc ml-5 space-y-1.5 text-slate-600 text-sm">
                                                {selectedTopic.points.map((p: string, i: number) => <li key={i}>{p}</li>)}
                                            </ul>
                                        </div>
                                    )}
                                    <p className="mt-3 text-xs text-slate-400 italic text-center">1 phút chuẩn bị — 1-2 phút để nói</p>
                                </>
                            )}
                        </div>

                        {/* Permission denied */}
                        {permissionDenied && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-semibold text-red-800 text-sm">Không thể truy cập microphone</h4>
                                    <p className="text-red-600 text-sm mt-1">Vui lòng cho phép truy cập microphone trong cài đặt trình duyệt.</p>
                                </div>
                            </div>
                        )}

                        {/* Recorder */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 flex flex-col items-center">
                            <div className="relative flex items-center justify-center mb-6">
                                {isRecording && (
                                    <>
                                        <div className="absolute rounded-full bg-red-100 animate-ping opacity-75 h-28 w-28" />
                                        <div className="absolute rounded-full bg-red-50 animate-pulse h-36 w-36" />
                                    </>
                                )}
                                <button
                                    onClick={isRecording ? stopRecording : startRecording}
                                    className={`relative z-10 h-20 w-20 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center justify-center ${isRecording ? 'bg-red-500' : 'bg-emerald-600 hover:bg-emerald-700'}`}>
                                    {isRecording ? <Square className="h-8 w-8 text-white fill-current" /> : <Mic className="h-10 w-10 text-white" />}
                                </button>
                            </div>

                            <span className={`font-mono text-3xl font-light ${isRecording ? 'text-red-500' : 'text-slate-700'}`}>{formatTime(recordingTime)}</span>
                            <p className="text-slate-400 mt-1 text-xs uppercase tracking-widest">
                                {isRecording ? '🔴 Đang ghi âm...' : hasRecorded ? '✅ Đã ghi âm xong' : '🎙️ Nhấn để ghi âm'}
                            </p>

                            {hasRecorded && !isRecording && (
                                <div className="flex gap-3 mt-5 w-full max-w-sm">
                                    <Button variant="outline" onClick={togglePlayback} className="flex-1 py-4">
                                        {isPlaying ? <><Pause className="h-4 w-4 mr-1" /> Dừng</> : <><Play className="h-4 w-4 mr-1" /> Nghe lại</>}
                                    </Button>
                                    <Button variant="outline" onClick={startRecording} className="flex-1 py-4 border-orange-300 text-orange-600 hover:bg-orange-50">
                                        <Mic className="h-4 w-4 mr-1" /> Ghi lại
                                    </Button>
                                    <Button onClick={submitAudio} disabled={isEvaluating} className="flex-1 py-4 bg-emerald-600 hover:bg-emerald-700">
                                        {isEvaluating ? <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Chấm...</> : <><UploadCloud className="h-4 w-4 mr-1" /> Nộp bài</>}
                                    </Button>
                                </div>
                            )}
                        </div>

                        {/* AI Feedback */}
                        {feedback && (
                            <div className="bg-white rounded-2xl border border-emerald-200 shadow-sm p-6 space-y-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="font-bold text-slate-800 flex items-center gap-2">🤖 Nhận xét từ AI</h3>
                                    <span className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold px-3 py-1 rounded-full text-sm shadow-sm md:hidden">Band {feedback.bandScore}</span>
                                </div>

                                {feedback.isOffTopicOrVietnamese ? (
                                    <div className="bg-red-50 border border-red-200 rounded-xl p-5 text-red-700 mt-4">
                                        <div className="flex items-center gap-2 font-bold mb-2">
                                            <AlertCircle className="h-5 w-5" /> Cảnh báo: Lạc đề hoặc sai ngôn ngữ
                                        </div>
                                        <p className="text-sm leading-relaxed">{feedback.feedback}</p>
                                        <p className="text-sm mt-3 italic text-red-600 opacity-80">Transcript ghi nhận: "{feedback.transcript}"</p>
                                    </div>
                                ) : (
                                    <>
                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                                            <div className="hidden md:flex p-3 rounded-xl flex-col items-center justify-center bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md col-span-2 md:col-span-1 border border-indigo-400">
                                                <p className="text-3xl font-extrabold drop-shadow-sm">{feedback.bandScore}</p>
                                                <p className="text-xs font-bold uppercase tracking-wider mt-1 opacity-90">Overall</p>
                                            </div>
                                            {[
                                                { label: "Fluency", score: feedback.fluencyScore, color: "text-blue-600 bg-blue-50 border border-blue-100" },
                                                { label: "Vocabulary", score: feedback.lexicalResourceScore, color: "text-violet-600 bg-violet-50 border border-violet-100" },
                                                { label: "Grammar", score: feedback.grammarScore, color: "text-amber-600 bg-amber-50 border border-amber-100" },
                                                { label: "Pronunciation", score: feedback.pronunciationScore, color: "text-emerald-600 bg-emerald-50 border border-emerald-100" },
                                            ].map(item => (
                                                <div key={item.label} className={`p-3 rounded-xl text-center shadow-sm ${item.color}`}>
                                                    <p className="text-2xl font-bold">{item.score}</p>
                                                    <p className="text-[11px] font-bold uppercase mt-1 tracking-wide">{item.label}</p>
                                                </div>
                                            ))}
                                        </div>

                                        <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 text-sm text-slate-600 leading-relaxed mt-4 space-y-6">
                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-2">Lời giải băng (Transcript):</h4>
                                                <p className="italic text-slate-500 bg-white p-3 rounded border border-slate-100 mb-2">"{feedback.transcript}"</p>
                                            </div>

                                            {feedback.pronunciationErrors && feedback.pronunciationErrors.length > 0 && (
                                                <div>
                                                    <h4 className="font-bold text-slate-800 mb-2 border-t border-slate-200 pt-4 flex items-center gap-2">
                                                        <Mic className="h-4 w-4 text-emerald-600" /> Sửa lỗi phát âm
                                                    </h4>
                                                    <div className="space-y-3 mt-2">
                                                        {feedback.pronunciationErrors.map((err: any, idx: number) => (
                                                            <div key={idx} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex flex-col md:flex-row md:items-start gap-2">
                                                                <div className="shrink-0 pt-0.5">
                                                                    <span className="font-bold text-red-600 bg-red-50 px-2 py-1 rounded text-base">{err.word}</span>
                                                                    <span className="ml-2 font-mono text-slate-600 opacity-80 text-xs">{err.phonetic}</span>
                                                                </div>
                                                                <div className="text-slate-700 text-sm flex-1 md:mt-1">{err.error}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}

                                            <div>
                                                <h4 className="font-bold text-slate-800 mb-2 border-t border-slate-200 pt-4">Nhận xét chi tiết (Examiner Note):</h4>
                                                <div
                                                    className="prose prose-sm max-w-none bg-white p-4 rounded-xl text-slate-700 border border-slate-100 shadow-sm font-medium leading-relaxed"
                                                    dangerouslySetInnerHTML={{ __html: feedback.feedback }}
                                                />
                                            </div>

                                            {feedback.suggestedAnswer && (
                                                <div>
                                                    <h4 className="font-bold text-emerald-700 mb-2 border-t border-emerald-100 pt-4 flex items-center gap-2">
                                                        <MessageCircle className="h-4 w-4" /> Gợi ý trả lời (Band 8.0+)
                                                    </h4>
                                                    <div className="bg-emerald-50 p-4 rounded-xl text-emerald-900 border border-emerald-200 shadow-sm transition-all hover:shadow-md">
                                                        {feedback.suggestedAnswer}
                                                    </div>
                                                </div>
                                            )}

                                            {feedback.improvements && feedback.improvements.length > 0 && (
                                                <div>
                                                    <h4 className="font-bold text-slate-800 mb-2 border-t border-slate-200 pt-4">Mẹo nâng Band (Actionable Tips & Rewrites):</h4>
                                                    <ul className="space-y-3 mt-2">
                                                        {feedback.improvements.map((imp: string, idx: number) => (
                                                            <li key={idx} className="flex items-start gap-3 bg-white p-4 rounded-xl border border-indigo-100 shadow-sm">
                                                                <span className="text-indigo-600 bg-indigo-50 h-7 w-7 flex items-center justify-center rounded-full text-sm font-bold shrink-0">💡</span>
                                                                <div className="text-slate-700 font-medium leading-relaxed prose prose-sm max-w-none" dangerouslySetInnerHTML={{ __html: imp }} />
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            )}
                                        </div>
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
