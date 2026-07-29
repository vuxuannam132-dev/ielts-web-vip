"use client";

import React from "react";
import { BookOpen, Headphones, PenTool, Mic, Sparkles, ChevronRight, Layers, Award } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

interface PracticeSet {
    id: string;
    skill: string;
    title: string;
    description?: string;
    difficulty?: string;
    content: string;
    createdAt?: string;
}

interface PracticeSetListViewProps {
    skillName: "reading" | "listening" | "writing" | "speaking";
    sets: PracticeSet[];
    onSelectSet: (set: PracticeSet) => void;
}

const skillMeta = {
    reading: { title: "Luyện Tập Reading", subtitle: "Rèn luyện kỹ năng đọc hiểu và tìm kiếm thông tin", icon: BookOpen, color: "blue" },
    listening: { title: "Luyện Tập Listening", subtitle: "Nâng cao khả năng nghe hiểu theo các dạng bài chuẩn IELTS", icon: Headphones, color: "purple" },
    writing: { title: "Luyện Tập Writing", subtitle: "Luyện viết Task 1 & Task 2 với phân tích phản hồi AI", icon: PenTool, color: "emerald" },
    speaking: { title: "Luyện Tập Speaking", subtitle: "Luyện nói Part 1, 2, 3 cùng phản hồi chi tiết từ AI", icon: Mic, color: "amber" },
};

export default function PracticeSetListView({ skillName, sets, onSelectSet }: PracticeSetListViewProps) {
    const meta = skillMeta[skillName];
    const Icon = meta.icon;

    const getDifficultyBadge = (diff?: string) => {
        const d = (diff || "Medium").toLowerCase();
        if (d === "easy") return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">🟢 Dễ</span>;
        if (d === "hard") return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">🔴 Khó</span>;
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 font-medium">🟡 Trung bình</span>;
    };

    const isCombo = (set: PracticeSet) => {
        const s = (set.skill || "").toUpperCase();
        const t = (set.title || "").toLowerCase();
        const d = (set.description || "").toLowerCase();
        return s === "COMBO" || t.includes("combo") || d.includes("combo");
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 via-slate-100/50 to-blue-50/30 py-8 px-4 sm:px-6">
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <Link href="/dashboard" className="p-2 hover:bg-slate-100 rounded-xl transition text-slate-500 text-sm font-semibold">
                            ← Dashboard
                        </Link>
                        <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-inner shrink-0">
                            <Icon className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">{meta.title}</h1>
                            <p className="text-sm text-slate-500">{meta.subtitle}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 bg-slate-50 px-4 py-2 rounded-xl border border-slate-200">
                        <Award className="h-4 w-4 text-blue-600" />
                        <span>Tổng số bài tập: <b>{sets.length} bài</b></span>
                    </div>
                </div>

                {/* List Grid */}
                {sets.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center max-w-md mx-auto shadow-sm">
                        <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4 text-slate-400">
                            <Layers className="h-8 w-8" />
                        </div>
                        <h3 className="text-lg font-bold text-slate-800 mb-2">Chưa có bài tập</h3>
                        <p className="text-slate-500 text-sm mb-6">Hiện chưa có bài tập nào cho kỹ năng này. Vui lòng quay lại sau!</p>
                        <Link href="/dashboard"><Button>← Về Dashboard</Button></Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {sets.map(s => {
                            const combo = isCombo(s);
                            return (
                                <div key={s.id} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group hover:-translate-y-1">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-2">
                                            {/* Tag: Bài Combo vs Bài Lẻ */}
                                            {combo ? (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-800 border border-orange-200 flex items-center gap-1.5 shadow-sm">
                                                    <Sparkles className="h-3.5 w-3.5 text-orange-600" /> Bài Combo
                                                </span>
                                            ) : (
                                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1.5">
                                                    <BookOpen className="h-3.5 w-3.5 text-blue-600" /> Bài Lẻ
                                                </span>
                                            )}
                                            {getDifficultyBadge(s.difficulty)}
                                        </div>

                                        <div>
                                            <h3 className="font-bold text-lg text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2">
                                                {s.title}
                                            </h3>
                                            <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                                {s.description || "Bài tập rèn luyện kỹ năng chuẩn IELTS"}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="pt-6 mt-6 border-t border-slate-100 flex items-center justify-between">
                                        <span className="text-xs text-slate-400 font-mono">ID: #{s.id.slice(-6)}</span>
                                        <Button
                                            onClick={() => onSelectSet(s)}
                                            className="bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs px-4 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-md shadow-blue-500/20">
                                            Làm bài ngay <ChevronRight className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
