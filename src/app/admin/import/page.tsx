"use client";

import React, { useState, useRef } from "react";
import { Upload, CheckCircle2, ArrowLeft, Loader2, Save, X, AlertCircle } from "lucide-react";
import Link from "next/link";

interface DraftPracticeSet {
    id: string;
    skill: string;
    title: string;
    difficulty: string;
    contentJSON: any;
    status: 'pending' | 'uploading' | 'success' | 'error';
    errorMsg?: string;
}

export default function AdminPracticeImport() {
    const [drafts, setDrafts] = useState<DraftPracticeSet[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [globalUploading, setGlobalUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const autoDetectSkill = (content: any): string => {
        if (!content) return "reading";
        if (content.passages && Array.isArray(content.passages)) return "reading";
        if (content.parts || content.audioUrl || content.tapescript) return "listening";
        if (content.writing || content.type === "TASK1" || content.type === "TASK2" || content.task1Prompt || content.task2Prompt) return "writing";
        if (content.speaking || content.part1 || content.part2 || content.part3 || content.cueCard) return "speaking";
        return "reading"; // default fallback
    };

    const processJsonArray = (jsonArray: any[]) => {
        const newDrafts: DraftPracticeSet[] = jsonArray.map((item, index) => {
            const skill = item.skill?.toLowerCase() || autoDetectSkill(item.content || item);
            return {
                id: Math.random().toString(36).substring(7) + index,
                skill,
                title: item.title || `Imported ${skill} Test ${index + 1}`,
                difficulty: item.difficulty || 'Medium',
                contentJSON: item.content || item,
                status: 'pending'
            };
        });
        setDrafts(prev => [...prev, ...newDrafts]);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        readFile(file);
    };

    const readFile = (file: File) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const result = e.target?.result as string;
                let parsed = JSON.parse(result);
                // Handle both array of sets and single set
                if (!Array.isArray(parsed)) {
                    parsed = [parsed];
                }
                processJsonArray(parsed);
            } catch (err) {
                alert("File JSON không hợp lệ! Vui lòng kiểm tra lại cú pháp.");
                console.error(err);
            }
        };
        reader.readAsText(file);
        if (fileInputRef.current) fileInputRef.current.value = "";
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        const file = e.dataTransfer.files?.[0];
        if (file && file.type === "application/json") {
            readFile(file);
        } else {
            alert("Chỉ hỗ trợ file .json");
        }
    };

    const updateDraft = (id: string, field: keyof DraftPracticeSet, value: string) => {
        setDrafts(prev => prev.map(d => d.id === id ? { ...d, [field]: value } : d));
    };

    const removeDraft = (id: string) => {
        setDrafts(prev => prev.filter(d => d.id !== id));
    };

    const uploadSingle = async (draft: DraftPracticeSet) => {
        updateDraft(draft.id, 'status', 'uploading');
        try {
            const res = await fetch('/api/admin/practice', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    skill: draft.skill,
                    title: draft.title,
                    difficulty: draft.difficulty,
                    contentJSON: draft.contentJSON
                })
            });

            if (res.ok) {
                updateDraft(draft.id, 'status', 'success');
            } else {
                const err = await res.json();
                updateDraft(draft.id, 'status', 'error');
                updateDraft(draft.id, 'errorMsg', err.error || "Lỗi server");
            }
        } catch (err) {
            updateDraft(draft.id, 'status', 'error');
            updateDraft(draft.id, 'errorMsg', "Lỗi kết nối");
        }
    };

    const uploadAll = async () => {
        setGlobalUploading(true);
        const pending = drafts.filter(d => d.status === 'pending' || d.status === 'error');
        for (const draft of pending) {
            await uploadSingle(draft);
        }
        setGlobalUploading(false);
    };

    const pendingCount = drafts.filter(d => d.status === 'pending' || d.status === 'error').length;
    const successCount = drafts.filter(d => d.status === 'success').length;

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <Link href="/admin" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                        <div className="h-10 w-10 bg-emerald-100 text-emerald-600 rounded-lg flex items-center justify-center">
                            <Upload className="h-6 w-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Import Bài Tập (JSON)</h1>
                            <p className="text-sm text-slate-500">Tự động nhận diện kỹ năng (Reading, Listening, Writing, Speaking)</p>
                        </div>
                    </div>
                    {drafts.length > 0 && pendingCount > 0 && (
                        <button 
                            onClick={uploadAll} 
                            disabled={globalUploading}
                            className="bg-blue-600 text-white font-bold hover:bg-blue-700 px-6 py-2.5 rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-blue-500/30 transition-all hover:-translate-y-1"
                        >
                            {globalUploading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Đăng tất cả ({pendingCount})
                        </button>
                    )}
                </div>

                {/* Dropzone */}
                <div 
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={handleDrop}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-slate-300 bg-white hover:border-slate-400 hover:bg-slate-50'}`}
                >
                    <input type="file" accept=".json" className="hidden" ref={fileInputRef} onChange={handleFileUpload} />
                    <Upload className={`h-12 w-12 mx-auto mb-4 ${isDragging ? 'text-blue-500' : 'text-slate-400'}`} />
                    <h3 className="text-xl font-bold text-slate-700 mb-2">Kéo thả file JSON vào đây</h3>
                    <p className="text-slate-500">Hoặc click để chọn file từ máy tính</p>
                </div>

                {/* Preview List */}
                {drafts.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between px-2">
                            <h2 className="text-lg font-bold text-slate-800">Bản nháp ({drafts.length})</h2>
                            <div className="text-sm text-slate-500 flex gap-4">
                                <span>Thành công: <strong className="text-emerald-600">{successCount}</strong></span>
                                <span>Chưa đăng: <strong className="text-amber-600">{pendingCount}</strong></span>
                            </div>
                        </div>

                        {drafts.map((draft) => (
                            <div key={draft.id} className={`bg-white rounded-xl border p-5 shadow-sm transition-all ${draft.status === 'success' ? 'border-emerald-200 bg-emerald-50/30' : draft.status === 'error' ? 'border-red-200' : 'border-slate-200'}`}>
                                <div className="flex items-start justify-between gap-4">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4">
                                        
                                        {/* Skill (Auto-detected) */}
                                        <div className="md:col-span-3">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Kỹ Năng (Auto)</label>
                                            <select 
                                                disabled={draft.status === 'success' || draft.status === 'uploading'}
                                                value={draft.skill} 
                                                onChange={e => updateDraft(draft.id, 'skill', e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none font-semibold capitalize focus:border-blue-500 bg-slate-50"
                                            >
                                                <option value="reading">Reading</option>
                                                <option value="listening">Listening</option>
                                                <option value="writing">Writing</option>
                                                <option value="speaking">Speaking</option>
                                            </select>
                                        </div>

                                        {/* Title */}
                                        <div className="md:col-span-6">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Tiêu Đề</label>
                                            <input 
                                                disabled={draft.status === 'success' || draft.status === 'uploading'}
                                                type="text" 
                                                value={draft.title} 
                                                onChange={e => updateDraft(draft.id, 'title', e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" 
                                            />
                                        </div>

                                        {/* Difficulty */}
                                        <div className="md:col-span-3">
                                            <label className="block text-xs font-bold text-slate-500 mb-1 uppercase tracking-wider">Độ Khó</label>
                                            <select 
                                                disabled={draft.status === 'success' || draft.status === 'uploading'}
                                                value={draft.difficulty} 
                                                onChange={e => updateDraft(draft.id, 'difficulty', e.target.value)}
                                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none font-medium focus:border-blue-500"
                                            >
                                                <option value="Easy">Easy</option>
                                                <option value="Medium">Medium</option>
                                                <option value="Hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>

                                    {/* Actions / Status */}
                                    <div className="flex items-center gap-2 mt-6">
                                        {draft.status === 'success' ? (
                                            <span className="flex items-center gap-1 text-emerald-600 font-bold text-sm bg-emerald-100 px-3 py-2 rounded-lg">
                                                <CheckCircle2 className="h-4 w-4" /> Đã đăng
                                            </span>
                                        ) : draft.status === 'uploading' ? (
                                            <span className="flex items-center gap-1 text-blue-600 font-bold text-sm bg-blue-100 px-3 py-2 rounded-lg">
                                                <Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...
                                            </span>
                                        ) : (
                                            <>
                                                {draft.status === 'error' && (
                                                    <span className="flex items-center gap-1 text-red-600 font-bold text-xs max-w-[120px] truncate" title={draft.errorMsg}>
                                                        <AlertCircle className="h-4 w-4" /> {draft.errorMsg}
                                                    </span>
                                                )}
                                                <button 
                                                    onClick={() => uploadSingle(draft)}
                                                    className="bg-slate-900 text-white hover:bg-slate-800 px-4 py-2 rounded-lg text-sm font-semibold transition"
                                                >
                                                    Đăng
                                                </button>
                                                <button 
                                                    onClick={() => removeDraft(draft.id)}
                                                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition"
                                                    title="Xóa nháp"
                                                >
                                                    <X className="h-5 w-5" />
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
