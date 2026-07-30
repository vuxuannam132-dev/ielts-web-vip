import React, { useEffect, useRef } from "react";
import { AlertCircle, FileText, CheckCircle2, ChevronRight, PenTool, Lightbulb, Map, AlertTriangle, XCircle } from "lucide-react";
interface Props {
    feedback: any;
}

export default function WritingFeedbackView({ feedback }: Props) {
    const viewRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (feedback && viewRef.current) {
            viewRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }, [feedback]);

    if (!feedback) return null;

    return (
        <div ref={viewRef} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col mt-6 animate-in slide-in-from-bottom-4 duration-500">
            <div className="bg-gradient-to-r from-purple-600 to-blue-600 p-6 text-white">
                <div className="flex items-center gap-3 mb-2">
                    <div className="bg-white/20 p-2 rounded-xl backdrop-blur-sm"><PenTool className="h-6 w-6" /></div>
                    <h2 className="text-2xl font-bold">Phân Tích Chuyên Sâu Từ AI Examiner</h2>
                </div>
                <p className="text-purple-100 text-sm">Phân tích đa chiều dựa trên 4 tiêu chí chấm thi IELTS chuẩn.</p>
            </div>

            <div className="p-6 space-y-8">
                {/* 4 Criteria Scores */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ScoreCard title="Task Achievement" score={feedback.taskAchievementScore} />
                    <ScoreCard title="Coherence & Cohesion" score={feedback.cohesionScore} />
                    <ScoreCard title="Lexical Resource" score={feedback.vocabularyScore} />
                    <ScoreCard title="Grammatical Range" score={feedback.grammarScore} />
                </div>

                {/* Template Warnings */}
                {feedback.templateWarnings && feedback.templateWarnings.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
                        <h3 className="text-red-800 font-bold flex items-center gap-2 mb-3"><AlertTriangle className="h-5 w-5" /> Cảnh Báo Văn Mẫu / Clichés</h3>
                        <ul className="space-y-2">
                            {feedback.templateWarnings.map((warn: string, i: number) => (
                                <li key={i} className="flex items-start gap-2 text-sm text-red-700 bg-white p-3 rounded-xl border border-red-100 shadow-sm">
                                    <span className="text-red-500 mt-0.5">•</span> {warn}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}

                {/* Outline Analysis */}
                {feedback.outline && feedback.outline.length > 0 && (
                    <div className="bg-indigo-50 border border-indigo-200 rounded-2xl p-5">
                        <h3 className="text-indigo-800 font-bold flex items-center gap-2 mb-4"><Map className="h-5 w-5" /> Phân Tích Logic & Bố Cục (Outline)</h3>
                        <div className="space-y-3">
                            {feedback.outline.map((point: string, i: number) => (
                                <div key={i} className="flex items-start gap-3 bg-white p-3 rounded-xl border border-indigo-100 shadow-sm">
                                    <div className="bg-indigo-100 text-indigo-700 font-bold w-6 h-6 rounded-full flex items-center justify-center shrink-0 text-xs">{i + 1}</div>
                                    <div className="text-sm text-slate-700 pt-0.5">{point}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Paragraph Rewrites (Before & After) */}
                {feedback.paragraphRewrites && feedback.paragraphRewrites.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2"><FileText className="h-5 w-5 text-blue-500" /> Bậc Thầy Hành Văn (Nâng cấp toàn đoạn)</h3>
                        <div className="space-y-6">
                            {feedback.paragraphRewrites.map((pr: any, i: number) => (
                                <div key={i} className="border border-slate-200 rounded-2xl overflow-hidden bg-slate-50">
                                    <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-200">
                                        <div className="p-5 space-y-2">
                                            <div className="text-xs font-bold text-slate-500 uppercase tracking-widest flex items-center gap-1.5"><XCircle className="h-4 w-4 text-slate-400" /> Bài viết của bạn</div>
                                            <div className="text-sm text-slate-700 bg-white p-4 rounded-xl border border-slate-200 shadow-inner italic">
                                                {pr.original}
                                            </div>
                                        </div>
                                        <div className="p-5 space-y-2 bg-blue-50/50">
                                            <div className="text-xs font-bold text-blue-600 uppercase tracking-widest flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4" /> Band 8.0+ Rewrite</div>
                                            <div className="text-sm text-slate-800 font-medium bg-white p-4 rounded-xl border border-blue-200 shadow-sm">
                                                {pr.rewrite}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="bg-blue-100/50 p-4 border-t border-slate-200 text-sm text-slate-700 flex items-start gap-2">
                                        <Lightbulb className="h-4 w-4 text-amber-500 mt-0.5 shrink-0" /> 
                                        <span><b>Tại sao tốt hơn:</b> {pr.explanation}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Idea Expansion */}
                {feedback.ideaExpansion && feedback.ideaExpansion.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2"><Lightbulb className="h-5 w-5 text-amber-500" /> Phân Tích Lỗ Hổng Lập Luận</h3>
                        <div className="grid md:grid-cols-2 gap-4">
                            {feedback.ideaExpansion.map((exp: any, i: number) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3 relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-1 h-full bg-amber-400" />
                                    <div className="font-bold text-slate-800 text-sm">{exp.paragraph}</div>
                                    <div className="bg-red-50 text-red-800 text-xs p-3 rounded-xl border border-red-100">
                                        <b>Điểm yếu:</b> {exp.weakPoint}
                                    </div>
                                    <div className="bg-emerald-50 text-emerald-800 text-xs p-3 rounded-xl border border-emerald-100">
                                        <b>Khắc phục:</b> {exp.suggestion}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Inline Corrections */}
                {feedback.inlineCorrections && feedback.inlineCorrections.length > 0 && (
                    <div className="space-y-4">
                        <h3 className="text-slate-900 font-bold text-lg flex items-center gap-2"><CheckCircle2 className="h-5 w-5 text-emerald-500" /> Sửa Lỗi Chi Tiết (Câu / Từ vựng)</h3>
                        <div className="space-y-3">
                            {feedback.inlineCorrections.map((corr: any, i: number) => (
                                <div key={i} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
                                    <div className="flex items-center gap-2">
                                        <span className="px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 uppercase border border-slate-200">{corr.type}</span>
                                    </div>
                                    <div className="grid md:grid-cols-2 gap-4">
                                        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm text-slate-600 line-through decoration-red-400">
                                            {corr.originalText}
                                        </div>
                                        <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-sm text-emerald-800 font-medium">
                                            {corr.improvedText}
                                        </div>
                                    </div>
                                    <div className="text-xs text-slate-600 bg-slate-50 p-3 rounded-xl border border-slate-100">
                                        <b>Giải thích:</b> {corr.explanation}
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
            <div className="text-2xl sm:text-3xl font-black text-purple-600">{score ? score.toFixed(1) : "0.0"}</div>
        </div>
    );
}
