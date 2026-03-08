"use client";

import React, { useState } from "react";
import { Upload, Plus, Trash2, Save, Loader2, CheckCircle2, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface Question {
    text: string;
    type: "fill" | "mcq" | "tf";
    answer: string;
    options: string[];
}

interface Part {
    title: string;
    text: string;
    questions: Question[];
}

export default function AdminPracticeUpload() {
    const [skill, setSkill] = useState("reading");
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");

    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    // Reading & Listening
    const [audioUrl, setAudioUrl] = useState("");
    const [parts, setParts] = useState<Part[]>([
        { title: "Passage 1", text: "", questions: [{ text: "", type: "fill", answer: "", options: ["", "", "", ""] }] }
    ]);

    // Speaking
    const [speaking, setSpeaking] = useState({ part1: "", part2: "", part3: "" });

    // Writing
    const [writing, setWriting] = useState({ task1Prompt: "", task1Image: "", task2Prompt: "" });

    const addPart = () => {
        setParts(prev => [...prev, { title: `Part ${prev.length + 1}`, text: "", questions: [] }]);
    };

    const removePart = (pIdx: number) => {
        setParts(prev => prev.filter((_, i) => i !== pIdx));
    };

    const addQuestion = (pIdx: number) => {
        const newParts = [...parts];
        newParts[pIdx].questions.push({ text: "", type: "fill", answer: "", options: ["", "", "", ""] });
        setParts(newParts);
    };

    const removeQuestion = (pIdx: number, qIdx: number) => {
        const newParts = [...parts];
        newParts[pIdx].questions = newParts[pIdx].questions.filter((_, i) => i !== qIdx);
        setParts(newParts);
    };

    const updatePart = (pIdx: number, field: "title" | "text", val: string) => {
        const newParts = [...parts];
        newParts[pIdx][field] = val;
        setParts(newParts);
    };

    const updateQuestion = (pIdx: number, qIdx: number, field: keyof Question, val: string | string[]) => {
        const newParts = [...parts];
        newParts[pIdx].questions[qIdx] = { ...newParts[pIdx].questions[qIdx], [field]: val };
        setParts(newParts);
    };

    const updateOption = (pIdx: number, qIdx: number, optIdx: number, val: string) => {
        const newParts = [...parts];
        const newOptions = [...newParts[pIdx].questions[qIdx].options];
        newOptions[optIdx] = val;
        newParts[pIdx].questions[qIdx].options = newOptions;
        setParts(newParts);
    };

    const handleSave = async () => {
        setSaving(true);
        const contentJSON: any = { difficulty };

        if (skill === "reading") {
            contentJSON.passages = parts;
        } else if (skill === "listening") {
            contentJSON.audioUrl = audioUrl;
            contentJSON.parts = parts;
        } else if (skill === "speaking") {
            contentJSON.speaking = speaking;
        } else if (skill === "writing") {
            contentJSON.writing = writing;
        }

        try {
            const res = await fetch('/api/admin/practice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ skill, title, difficulty, contentJSON }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                setTitle(""); setAudioUrl("");
                setParts([{ title: "Passage 1", text: "", questions: [] }]);
                setSpeaking({ part1: "", part2: "", part3: "" });
                setWriting({ task1Prompt: "", task1Image: "", task2Prompt: "" });
            } else {
                alert("Lỗi khi lưu bài tập");
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                    <Upload className="h-6 w-6 text-blue-600" />
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Upload Bài Luyện Tập (Chuẩn Form IELTS)</h1>
                        <p className="text-sm text-slate-500">Thêm bài tập chia theo cấu trúc thi thật</p>
                    </div>
                </div>

                {/* Skill Selector */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Chọn Kỹ Năng</label>
                    <div className="flex gap-2 flex-wrap">
                        {["reading", "listening", "writing", "speaking"].map(s => (
                            <button key={s} onClick={() => setSkill(s)}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${skill === s ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 ring-2 ring-blue-600 ring-offset-2' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>
                                {s}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">Thông Tin Cơ Bản</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tiêu Đề Bộ Đề (VD: Cambridge 18 Test 1)</label>
                            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-shadow" placeholder="Nhập tiêu đề..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Độ Khó</label>
                            <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500">
                                <option>Easy</option>
                                <option>Medium</option>
                                <option>Hard</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* DYNAMIC CONTENT EDITORS */}

                {/* 1. SPEAKING EDITOR */}
                {skill === "speaking" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">Nội Dung Speaking</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Part 1 (Các câu hỏi giới thiệu - mỗi câu 1 dòng)</label>
                                <textarea value={speaking.part1} onChange={e => setSpeaking({ ...speaking, part1: e.target.value })} rows={4} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" placeholder="VD: Do you work or study?&#10;What is your daily routine?" />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Part 2 (Cue Card)</label>
                                <textarea value={speaking.part2} onChange={e => setSpeaking({ ...speaking, part2: e.target.value })} rows={4} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Describe a book you read recently...&#10;You should say:&#10;- What it was...&#10;..." />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Part 3 (Các câu hỏi Follow-up - mỗi câu 1 dòng)</label>
                                <textarea value={speaking.part3} onChange={e => setSpeaking({ ...speaking, part3: e.target.value })} rows={4} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none" placeholder="Do you think reading is important?&#10;How have reading habits changed?" />
                            </div>
                        </div>
                    </div>
                )}

                {/* 2. WRITING EDITOR */}
                {skill === "writing" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">Nội Dung Writing</h2>
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                <h3 className="font-bold text-slate-700">Task 1</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Đề bài Task 1</label>
                                    <textarea value={writing.task1Prompt} onChange={e => setWriting({ ...writing, task1Prompt: e.target.value })} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="The chart below shows..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Link Ảnh Biểu Đồ (Bắt buộc cho Task 1)</label>
                                    <input value={writing.task1Image} onChange={e => setWriting({ ...writing, task1Image: e.target.value })} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="https://imgur.com/..." />
                                </div>
                            </div>

                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                <h3 className="font-bold text-slate-700">Task 2</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Đề bài Task 2</label>
                                    <textarea value={writing.task2Prompt} onChange={e => setWriting({ ...writing, task2Prompt: e.target.value })} rows={3} className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500" placeholder="Some people think that... To what extent do you agree or disagree?" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* 3. READING & LISTENING EDITOR */}
                {(skill === "reading" || skill === "listening") && (
                    <div className="space-y-6">
                        {skill === "listening" && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <label className="block text-sm font-bold text-slate-800 mb-2">Link File Audio MP3 (Bắt buộc)</label>
                                <input value={audioUrl} onChange={e => setAudioUrl(e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500" placeholder="https://example.com/audio.mp3 (Hoặc up lên host của bạn lấy link dán vào đây)" />
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Các phần (Passages / Sections)</h2>
                            <button onClick={addPart} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800">
                                <Plus className="h-4 w-4" /> Thêm Phần Mới
                            </button>
                        </div>

                        {parts.map((part, pIdx) => (
                            <div key={pIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                                <div className="flex items-center gap-4">
                                    <input type="text" value={part.title} onChange={e => updatePart(pIdx, "title", e.target.value)} className="text-lg font-bold border-b border-dashed border-slate-300 pb-1 outline-none text-blue-700 bg-transparent w-64" placeholder="Ví dụ: Passage 1 / Part 1" />
                                    {parts.length > 1 && <button onClick={() => removePart(pIdx)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="h-5 w-5" /></button>}
                                </div>

                                {skill === "reading" && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung bài đọc</label>
                                        <textarea value={part.text} onChange={e => updatePart(pIdx, "text", e.target.value)} rows={6} className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-blue-500 resize-none" placeholder="Dán nội dung bài đọc vào đây..." />
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between xl mb-4">
                                        <h3 className="font-bold text-slate-800">Câu hỏi của phần này ({part.questions.length})</h3>
                                        <button onClick={() => addQuestion(pIdx)} className="flex items-center gap-1 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-blue-100">
                                            <Plus className="h-4 w-4" /> Thêm câu hỏi
                                        </button>
                                    </div>

                                    <div className="space-y-4">
                                        {part.questions.map((q, qIdx) => (
                                            <div key={qIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative group flex gap-4">
                                                <div className="h-8 w-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center shrink-0">
                                                    {qIdx + 1}
                                                </div>
                                                <div className="flex-1 space-y-3">
                                                    <input type="text" value={q.text} onChange={e => updateQuestion(pIdx, qIdx, "text", e.target.value)}
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder="Nội dung câu hỏi..." />

                                                    <div className="flex gap-4 items-center">
                                                        <select value={q.type} onChange={e => updateQuestion(pIdx, qIdx, "type", e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none font-medium">
                                                            <option value="fill">Điền từ (Fill in the blank)</option>
                                                            <option value="mcq">Trắc nghiệm (A,B,C,D)</option>
                                                            <option value="tf">True/False/Not Given</option>
                                                        </select>
                                                        <input type="text" value={q.answer} onChange={e => updateQuestion(pIdx, qIdx, "answer", e.target.value)}
                                                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none font-bold text-blue-700" placeholder="Đáp án ĐÚNG" />
                                                    </div>

                                                    {q.type === "mcq" && (
                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                            {q.options.map((opt, optIdx) => (
                                                                <input key={optIdx} type="text" value={opt} onChange={(e) => updateOption(pIdx, qIdx, optIdx, e.target.value)}
                                                                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder={`Lựa chọn ${String.fromCharCode(65 + optIdx)}`} />
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <button onClick={() => removeQuestion(pIdx, qIdx)} className="absolute top-4 right-4 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition">
                                                    <Trash2 className="h-5 w-5" />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {/* Save Section */}
                <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky bottom-6">
                    <div>
                        <p className="font-bold text-slate-800">Hoàn tất cấu hình?</p>
                        <p className="text-xs text-slate-500">Kiểm tra lại kỹ đáp án trước khi xuất bản bộ đề.</p>
                    </div>
                    <div className="flex items-center gap-4">
                        {saved && <span className="text-emerald-600 font-bold flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg animate-pulse"><CheckCircle2 className="h-5 w-5" /> Đã lưu thành công!</span>}
                        <button onClick={handleSave} disabled={saving || !title} className="bg-blue-600 text-white font-bold hover:bg-blue-700 px-8 py-3 rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1">
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Xuất bản bộ đề
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
