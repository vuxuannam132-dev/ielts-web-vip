import React, { useEffect, useRef } from "react";
import { Mic, Activity, Zap, Headphones, CheckCircle2, AlertCircle, Quote } from "lucide-react";

interface Props {
    evaluation: any;
}

export default function SpeakingFeedbackView({ evaluation }: Props) {
    const viewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (evaluation && viewRef.current) {
            viewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [evaluation]);

    if (!evaluation) return null;

    return (
        <div ref={viewRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mt-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><Mic className="h-6 w-6" /></div>
                    <h2 className="text-2xl font-bold">Phân Tích Speaking Chuyên Sâu</h2>
                </div>
                <p className="text-emerald-100 text-sm">Báo cáo năng lực nói chi tiết từ AI Examiner.</p>
            </div>

            <div className="p-6 space-y-8">
                {/* 4 Criteria Scores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ScoreCard title="Fluency & Coherence" score={evaluation.fluencyScore} />
                    <ScoreCard title="Lexical Resource" score={evaluation.lexicalResourceScore} />
                    <ScoreCard title="Grammatical Range" score={evaluation.grammarScore} />
                    <ScoreCard title="Pronunciation" score={evaluation.pronunciationScore} />
                </div>

                {/* Discourse Markers */}
                {evaluation.discourseMarkers && evaluation.discourseMarkers.length > 0 && (
                    <div className="bg-teal-50 border border-teal-200 rounded-2xl p-5">
                        <h3 className="text-teal-800 font-bold flex items-center gap-2 mb-3"><Activity className="h-5 w-5" /> Discourse Markers (Từ nối đã dùng)</h3>
                        <div className="flex flex-wrap gap-2">
                            {evaluation.discourseMarkers.map((marker: string, i: number) => (
                                <span key={i} className="bg-white border border-teal-200 text-teal-700 px-3 py-1 rounded-full text-xs font-bold shadow-sm">
                                    {marker}
                                </span>
                            ))}
                        </div>
                    </div>
                )}

                {/* Transcript & Suggested Answer */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                        <h3 className="text-slate-900 font-bold flex items-center gap-2"><Quote className="h-4 w-4 text-slate-500" /> Tapescript Bài Nói (AI Nghe Được)</h3>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-sm text-slate-700 italic leading-relaxed shadow-inner">
                            "{evaluation.transcript}"
                        </div>
                    </div>
                    <div className="space-y-3">
                        <h3 className="text-emerald-800 font-bold flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-500" /> Câu Trả Lời Gợi Ý (Band 8.0+)</h3>
                        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-200 text-sm text-emerald-900 leading-relaxed shadow-sm">
                            {evaluation.suggestedAnswer}
                        </div>
                    </div>
                </div>

                {/* Pronunciation Errors */}
                {evaluation.pronunciationErrors && evaluation.pronunciationErrors.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-slate-900 font-bold flex items-center gap-2 text-lg"><Headphones className="h-5 w-5 text-rose-500" /> Lỗi Phát Âm Cần Khắc Phục</h3>
                        <div className="grid md:grid-cols-3 gap-3">
                            {evaluation.pronunciationErrors.map((err: any, i: number) => (
                                <div key={i} className="bg-white border border-rose-200 p-3 rounded-xl shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-rose-400" />
                                    <div className="font-bold text-rose-700">{err.word} <span className="text-slate-400 font-normal text-xs ml-1">/{err.phonetic}/</span></div>
                                    <div className="text-xs text-slate-600 mt-1">{err.error}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Vocabulary Upgrades */}
                {evaluation.vocabularyUpgrades && evaluation.vocabularyUpgrades.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-slate-900 font-bold flex items-center gap-2 text-lg"><Zap className="h-5 w-5 text-amber-500" /> Nâng Cấp Từ Vựng (Vocabulary Upgrades)</h3>
                        <div className="space-y-3">
                            {evaluation.vocabularyUpgrades.map((upg: any, i: number) => (
                                <div key={i} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                                    <div className="flex items-center gap-3 shrink-0">
                                        <div className="text-slate-500 line-through decoration-slate-400 text-sm font-medium bg-slate-50 px-2 py-1 rounded">{upg.originalWord}</div>
                                        <div className="text-emerald-500">→</div>
                                        <div className="text-emerald-700 font-bold text-sm bg-emerald-50 px-2 py-1 rounded border border-emerald-100">{upg.advancedWord}</div>
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="text-xs text-slate-600"><b>Ý nghĩa:</b> {upg.meaning}</div>
                                        <div className="text-xs text-slate-500 italic">" {upg.example} "</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function ScoreCard({ title, score }: { title: string; score: number }) {
    return (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center">
            <div className="text-[10px] sm:text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 h-8 flex items-center justify-center leading-tight">{title}</div>
            <div className="text-2xl sm:text-3xl font-black text-emerald-600">{score ? score.toFixed(1) : "0.0"}</div>
        </div>
    );
}
