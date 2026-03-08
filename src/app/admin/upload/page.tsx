"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Upload, Plus, Trash2, Save, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Question {
    text: string;
    type: "fill" | "mcq" | "tf";
    answer: string;
    options: string[];
}

export default function AdminPracticeUpload() {
    const [skill, setSkill] = useState("reading");
    const [title, setTitle] = useState("");
    const [section, setSection] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [content, setContent] = useState(""); // passage text or prompt
    const [questions, setQuestions] = useState<Question[]>([{ text: "", type: "fill", answer: "", options: ["", "", "", ""] }]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const addQuestion = () => {
        setQuestions(prev => [...prev, { text: "", type: "fill", answer: "", options: ["", "", "", ""] }]);
    };

    const removeQuestion = (idx: number) => {
        setQuestions(prev => prev.filter((_, i) => i !== idx));
    };

    const updateQuestion = (idx: number, field: keyof Question, value: string | string[]) => {
        setQuestions(prev => prev.map((q, i) => i === idx ? { ...q, [field]: value } : q));
    };

    const updateOption = (qIdx: number, optIdx: number, value: string) => {
        setQuestions(prev => prev.map((q, i) => {
            if (i !== qIdx) return q;
            const newOpts = [...q.options];
            newOpts[optIdx] = value;
            return { ...q, options: newOpts };
        }));
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/practice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skill, title, section, difficulty, content, questions }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                // Reset form
                setTitle(""); setSection(""); setContent("");
                setQuestions([{ text: "", type: "fill", answer: "", options: ["", "", "", ""] }]);
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <Link href="/admin" className="p-2 hover:bg-slate-200 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                    <Upload className="h-6 w-6 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Upload bài luyện tập</h1>
                        <p className="text-sm text-slate-500">Thêm bài tập mới cho học viên</p>
                    </div>
                </div>

                {/* Skill Selector */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-2">Chọn kỹ năng</label>
                    <div className="flex gap-2 flex-wrap">
                        {["reading", "listening", "writing", "speaking"].map(s => (
                            <button key={s} onClick={() => setSkill(s)}
                                className={`px-4 py-2 rounded-lg text-sm font-semibold capitalize transition ${skill === s ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h2 className="font-bold text-slate-800">Thông tin bài tập</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Tiêu đề</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. The Rise of Urban Farming" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-slate-600 mb-1">Section / Part</label>
                            <input type="text" value={section} onChange={(e) => setSection(e.target.value)}
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder="e.g. Reading Passage 1" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">Độ khó</label>
                        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none">
                            <option>Easy</option>
                            <option>Medium</option>
                            <option>Hard</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-slate-600 mb-1">
                            {skill === "writing" ? "Đề bài (Prompt)" : skill === "speaking" ? "Cue Card / Câu hỏi" : "Nội dung (Passage / Script)"}
                        </label>
                        <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={8}
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none"
                            placeholder="Nhập nội dung bài tập..." />
                    </div>
                </div>

                {/* Questions */}
                {(skill === "reading" || skill === "listening") && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                        <div className="flex items-center justify-between">
                            <h2 className="font-bold text-slate-800">Câu hỏi ({questions.length})</h2>
                            <Button variant="outline" size="sm" onClick={addQuestion} className="flex items-center gap-1">
                                <Plus className="h-4 w-4" /> Thêm câu
                            </Button>
                        </div>

                        {questions.map((q, idx) => (
                            <div key={idx} className="border border-slate-200 rounded-xl p-4 space-y-3 bg-slate-50">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-bold text-slate-600">Câu {idx + 1}</span>
                                    {questions.length > 1 && (
                                        <button onClick={() => removeQuestion(idx)} className="text-red-400 hover:text-red-600 p-1"><Trash2 className="h-4 w-4" /></button>
                                    )}
                                </div>

                                <input type="text" value={q.text} onChange={(e) => updateQuestion(idx, "text", e.target.value)}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Nội dung câu hỏi..." />

                                <div className="flex items-center gap-3">
                                    <select value={q.type} onChange={(e) => updateQuestion(idx, "type", e.target.value)}
                                        className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none">
                                        <option value="fill">Điền từ</option>
                                        <option value="mcq">Trắc nghiệm</option>
                                        <option value="tf">True/False/NG</option>
                                    </select>
                                    <input type="text" value={q.answer} onChange={(e) => updateQuestion(idx, "answer", e.target.value)}
                                        className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Đáp án đúng" />
                                </div>

                                {q.type === "mcq" && (
                                    <div className="grid grid-cols-2 gap-2">
                                        {q.options.map((opt, optIdx) => (
                                            <input key={optIdx} type="text" value={opt} onChange={(e) => updateOption(idx, optIdx, e.target.value)}
                                                className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder={`Đáp án ${String.fromCharCode(65 + optIdx)}`} />
                                        ))}
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                )}

                {/* Save */}
                <div className="flex items-center gap-3">
                    <Button onClick={handleSave} disabled={saving || !title} className="bg-blue-600 hover:bg-blue-700 px-8 py-3">
                        {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Đang lưu...</> : <><Save className="h-4 w-4 mr-2" /> Lưu bài tập</>}
                    </Button>
                    {saved && <span className="text-emerald-600 text-sm font-medium flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Đã lưu!</span>}
                </div>
            </div>
        </div>
    );
}
