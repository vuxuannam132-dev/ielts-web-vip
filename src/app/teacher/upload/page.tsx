"use client";

import React, { useState, useEffect } from "react";
import { Upload, Plus, Trash2, Save, Loader2, CheckCircle2, ArrowLeft, GraduationCap, FileJson, X } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

interface Question {
    text: string; type: "fill" | "mcq" | "tf" | "multi-mcq" | "matching"; answer: string; options: string[]; answers?: string[];
}
interface Part {
    title: string; text: string; questions: Question[];
}

export default function TeacherPracticeUpload() {
    const { data: session } = useSession();
    const user = session?.user as any;

    const [skill, setSkill] = useState("reading");
    const [title, setTitle] = useState("");
    const [difficulty, setDifficulty] = useState("Medium");
    const [classId, setClassId] = useState("");
    const [publishMode, setPublishMode] = useState<"class" | "public">("class");

    const [classes, setClasses] = useState<any[]>([]);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    // Reading & Listening
    const [audioUrl, setAudioUrl] = useState("");
    const [parts, setParts] = useState<Part[]>([
        { title: "Passage 1", text: "", questions: [{ text: "", type: "fill", answer: "", options: ["", "", "", ""] }] }
    ]);

    // Speaking
    const [speaking, setSpeaking] = useState({ part1: "", part2: "", part3: "" });

    // Writing
    const [writing, setWriting] = useState({ task1Prompt: "", task1Image: "", task2Prompt: "" });

    // JSON Import Modal
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [jsonImportText, setJsonImportText] = useState("");

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('import') === 'true') {
            setShowJsonModal(true);
        }
    }, []);

    useEffect(() => {
        fetch("/api/teacher/classes").then(r => r.json()).then(data => {
            if (Array.isArray(data)) { setClasses(data); if (data.length) setClassId(data[0].id); }
        });
    }, []);

    const addPart = () => setParts(prev => [...prev, { title: `Part ${prev.length + 1}`, text: "", questions: [] }]);
    const removePart = (pIdx: number) => setParts(prev => prev.filter((_, i) => i !== pIdx));
    const addQuestion = (pIdx: number) => { const np = [...parts]; np[pIdx].questions.push({ text: "", type: "fill", answer: "", options: ["", "", "", ""] }); setParts(np); };
    const removeQuestion = (pIdx: number, qIdx: number) => { const np = [...parts]; np[pIdx].questions = np[pIdx].questions.filter((_, i) => i !== qIdx); setParts(np); };
    const updatePart = (pIdx: number, field: "title" | "text", val: string) => { const np = [...parts]; np[pIdx][field] = val; setParts(np); };
    const updateQuestion = (pIdx: number, qIdx: number, field: keyof Question, val: any) => { const np = [...parts]; np[pIdx].questions[qIdx] = { ...np[pIdx].questions[qIdx], [field]: val }; setParts(np); };
    const updateOption = (pIdx: number, qIdx: number, optIdx: number, val: string) => { const np = [...parts]; const opts = [...np[pIdx].questions[qIdx].options]; opts[optIdx] = val; np[pIdx].questions[qIdx].options = opts; setParts(np); };

    const handleAudioUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const formData = new FormData();
        formData.append("file", file);
        setSaving(true);
        try {
            const res = await fetch("/api/admin/upload-audio", {
                method: "POST",
                body: formData
            });
            const data = await res.json();
            if (data.success) {
                setAudioUrl(data.url);
            } else {
                alert("Lỗi upload: " + data.error);
            }
        } catch (err) {
            alert("Lỗi kết nối khi upload.");
        } finally {
            setSaving(false);
        }
    };

    const handleJsonImport = () => {
        try {
            const parsed = JSON.parse(jsonImportText);
            const content = parsed.content || parsed;
            
            if (parsed.title) setTitle(parsed.title);
            if (parsed.difficulty) setDifficulty(parsed.difficulty);
            
            let detectedSkill = parsed.skill?.toLowerCase();
            if (!detectedSkill) {
                if (content.passages && Array.isArray(content.passages)) detectedSkill = "reading";
                else if (content.parts || content.audioUrl || content.tapescript) detectedSkill = "listening";
                else if (content.writing || content.type === "TASK1" || content.task1Prompt) detectedSkill = "writing";
                else if (content.speaking || content.part1 || content.part2) detectedSkill = "speaking";
                else detectedSkill = "reading";
            }
            
            setSkill(detectedSkill);
            
            if (detectedSkill === "reading" && content.passages) setParts(content.passages);
            if (detectedSkill === "listening") {
                if (content.audioUrl) setAudioUrl(content.audioUrl);
                if (content.parts) setParts(content.parts);
            }
            if (detectedSkill === "writing" && content.writing) setWriting(content.writing);
            if (detectedSkill === "speaking" && content.speaking) setSpeaking(content.speaking);
            
            setShowJsonModal(false);
            setJsonImportText("");
        } catch (e) {
            alert("JSON không hợp lệ! Vui lòng kiểm tra lại cú pháp.");
        }
    };

    const handleSave = async () => {
        if (!title.trim()) { setError("Vui lòng nhập tiêu đề bộ đề."); return; }
        if (publishMode === "class" && !classId) { setError("Vui lòng chọn lớp để giao bộ đề."); return; }
        setSaving(true); setError("");

        const contentJSON: any = { difficulty };
        if (skill === "reading") contentJSON.passages = parts;
        else if (skill === "listening") { contentJSON.audioUrl = audioUrl; contentJSON.parts = parts; }
        else if (skill === "speaking") contentJSON.speaking = speaking;
        else if (skill === "writing") contentJSON.writing = writing;

        try {
            const res = await fetch("/api/teacher/practice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    skill, title, difficulty, contentJSON,
                    classId: publishMode === "class" ? classId : null,
                }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 4000);
                setTitle(""); setAudioUrl("");
                setParts([{ title: "Passage 1", text: "", questions: [{ text: "", type: "fill", answer: "", options: ["", "", "", ""] }] }]);
                setSpeaking({ part1: "", part2: "", part3: "" });
                setWriting({ task1Prompt: "", task1Image: "", task2Prompt: "" });
            } else {
                const d = await res.json();
                setError(d.error || "Lỗi khi lưu bộ đề.");
            }
        } catch { setError("Lỗi kết nối máy chủ."); }
        finally { setSaving(false); }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <Link href="/teacher?tab=assignments" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                    <div className="h-10 w-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-xl flex items-center justify-center shadow-md">
                        <GraduationCap className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900">Tạo bộ đề luyện tập</h1>
                        <p className="text-xs text-slate-500">Soạn bài tập chuẩn IELTS cho học sinh của bạn</p>
                    </div>
                    <button onClick={() => setShowJsonModal(true)} className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition">
                        <FileJson className="h-4 w-4" /> Nhập từ JSON
                    </button>
                </div>

                {/* Class & Visibility Selector */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-4">
                    <h2 className="font-bold text-slate-800">Phạm vi xuất bản</h2>
                    <div className="flex gap-3">
                        <button onClick={() => setPublishMode("class")}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${publishMode === "class" ? "bg-violet-600 text-white border-violet-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-violet-300"}`}>
                            🏫 Giao cho lớp cụ thể
                        </button>
                        <button onClick={() => setPublishMode("public")}
                            className={`flex-1 py-3 rounded-xl text-sm font-semibold border-2 transition-all ${publishMode === "public" ? "bg-blue-600 text-white border-blue-600" : "bg-slate-50 text-slate-600 border-slate-200 hover:border-blue-300"}`}>
                            🌐 Xuất bản công khai (tất cả học viên)
                        </button>
                    </div>

                    {publishMode === "class" && (
                        <div>
                            <label className="text-sm font-medium text-slate-700 mb-1 block">Chọn lớp *</label>
                            {classes.length === 0 ? (
                                <p className="text-sm text-slate-400 italic">Bạn chưa có lớp nào. <Link href="/teacher" className="text-blue-600 hover:underline">Tạo lớp trước</Link></p>
                            ) : (
                                <select value={classId} onChange={e => setClassId(e.target.value)}
                                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-violet-500 outline-none">
                                    {classes.map((c: any) => (
                                        <option key={c.id} value={c.id}>{c.name} ({c._count?.members || 0} học sinh)</option>
                                    ))}
                                </select>
                            )}
                        </div>
                    )}
                </div>

                {/* Skill Selector */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Kỹ năng</label>
                    <div className="flex gap-2 flex-wrap">
                        {[
                            { key: "reading", emoji: "📖" },
                            { key: "listening", emoji: "🎧" },
                            { key: "writing", emoji: "✍️" },
                            { key: "speaking", emoji: "🎤" },
                        ].map(s => (
                            <button key={s.key} onClick={() => setSkill(s.key)}
                                className={`px-6 py-2.5 rounded-lg text-sm font-bold capitalize transition-all ${skill === s.key ? "bg-violet-600 text-white shadow-md ring-2 ring-violet-600 ring-offset-2" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}>
                                {s.emoji} {s.key}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Basic Info */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                    <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">Thông Tin Cơ Bản</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tiêu Đề (VD: Cambridge 18 Test 1)</label>
                            <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500 focus:ring-1 focus:ring-violet-500" placeholder="Nhập tiêu đề bộ đề..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-slate-700 mb-1.5">Độ Khó</label>
                            <select value={difficulty} onChange={e => setDifficulty(e.target.value)}
                                className="w-full border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500">
                                <option>Easy</option><option>Medium</option><option>Hard</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Speaking Editor */}
                {skill === "speaking" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">🎤 Nội Dung Speaking</h2>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Part 1 (Câu hỏi giới thiệu - mỗi câu 1 dòng)</label>
                                <textarea value={speaking.part1} onChange={e => setSpeaking({ ...speaking, part1: e.target.value })} rows={4}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 resize-none"
                                    placeholder={"Do you work or study?\nWhat is your daily routine?"} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Part 2 (Cue Card)</label>
                                <textarea value={speaking.part2} onChange={e => setSpeaking({ ...speaking, part2: e.target.value })} rows={4}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 resize-none"
                                    placeholder={"Describe a book you read recently...\nYou should say:\n- What it was..."} />
                            </div>
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-1">Part 3 (Follow-up - mỗi câu 1 dòng)</label>
                                <textarea value={speaking.part3} onChange={e => setSpeaking({ ...speaking, part3: e.target.value })} rows={4}
                                    className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 resize-none"
                                    placeholder={"Do you think reading is important?\nHow have reading habits changed?"} />
                            </div>
                        </div>
                    </div>
                )}

                {/* Writing Editor */}
                {skill === "writing" && (
                    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-6">
                        <h2 className="font-bold text-lg text-slate-800 border-b border-slate-100 pb-2">✍️ Nội Dung Writing</h2>
                        <div className="space-y-6">
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                <h3 className="font-bold text-slate-700">Task 1</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Đề bài Task 1</label>
                                    <textarea value={writing.task1Prompt} onChange={e => setWriting({ ...writing, task1Prompt: e.target.value })} rows={3}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                                        placeholder="The chart below shows..." />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Link Ảnh Biểu Đồ (nếu có)</label>
                                    <input value={writing.task1Image} onChange={e => setWriting({ ...writing, task1Image: e.target.value })}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                                        placeholder="https://imgur.com/..." />
                                </div>
                            </div>
                            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
                                <h3 className="font-bold text-slate-700">Task 2</h3>
                                <div>
                                    <label className="block text-sm font-medium text-slate-600 mb-1">Đề bài Task 2</label>
                                    <textarea value={writing.task2Prompt} onChange={e => setWriting({ ...writing, task2Prompt: e.target.value })} rows={3}
                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none focus:border-violet-500"
                                        placeholder="Some people think that... To what extent do you agree or disagree?" />
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Reading & Listening Editor */}
                {(skill === "reading" || skill === "listening") && (
                    <div className="space-y-6">
                        {skill === "listening" && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <label className="block text-sm font-bold text-slate-800 mb-2">🔗 Link File Audio MP3 (Bắt buộc)</label>
                                <div className="flex gap-3 items-center">
                                    <input value={audioUrl} onChange={e => setAudioUrl(e.target.value)}
                                        className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-violet-500"
                                        placeholder="https://example.com/audio.mp3" />
                                    <label className="flex items-center gap-2 bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl cursor-pointer text-sm font-semibold transition">
                                        <Upload className="h-4 w-4" /> Tải MP3 lên
                                        <input type="file" accept="audio/*" onChange={handleAudioUpload} className="hidden" />
                                    </label>
                                </div>
                                {audioUrl && <audio controls src={audioUrl} className="mt-3 w-full h-10" />}
                            </div>
                        )}

                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-slate-900">Các phần (Passages / Sections)</h2>
                            <button onClick={addPart} className="flex items-center gap-2 bg-slate-900 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-slate-800">
                                <Plus className="h-4 w-4" /> Thêm Phần
                            </button>
                        </div>

                        {parts.map((part, pIdx) => (
                            <div key={pIdx} className="bg-white rounded-xl border border-slate-200 shadow-sm p-6 space-y-5">
                                <div className="flex items-center gap-4">
                                    <input type="text" value={part.title} onChange={e => updatePart(pIdx, "title", e.target.value)}
                                        className="text-lg font-bold border-b border-dashed border-slate-300 pb-1 outline-none text-violet-700 bg-transparent w-64"
                                        placeholder="Passage 1 / Part 1" />
                                    {parts.length > 1 && <button onClick={() => removePart(pIdx)} className="text-red-500 hover:text-red-700 p-2"><Trash2 className="h-5 w-5" /></button>}
                                </div>

                                {skill === "reading" && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Nội dung bài đọc</label>
                                        <textarea value={part.text} onChange={e => updatePart(pIdx, "text", e.target.value)} rows={6}
                                            className="w-full border border-slate-300 rounded-xl px-4 py-3 text-sm outline-none focus:border-violet-500 resize-none"
                                            placeholder="Dán nội dung bài đọc vào đây..." />
                                    </div>
                                )}

                                <div className="pt-4 border-t border-slate-100">
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-bold text-slate-800">Câu hỏi ({part.questions.length})</h3>
                                        <button onClick={() => addQuestion(pIdx)} className="flex items-center gap-1 bg-violet-50 text-violet-600 px-3 py-1.5 rounded-lg text-sm font-semibold hover:bg-violet-100">
                                            <Plus className="h-4 w-4" /> Thêm câu hỏi
                                        </button>
                                    </div>
                                    <div className="space-y-4">
                                        {part.questions.map((q, qIdx) => (
                                            <div key={qIdx} className="p-4 rounded-xl border border-slate-200 bg-slate-50 relative group flex gap-4">
                                                <div className="h-8 w-8 rounded-full bg-violet-600 text-white font-bold flex items-center justify-center shrink-0">{qIdx + 1}</div>
                                                <div className="flex-1 space-y-3">
                                                    <input type="text" value={q.text} onChange={e => updateQuestion(pIdx, qIdx, "text", e.target.value)}
                                                        className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none"
                                                        placeholder="Nội dung câu hỏi..." />
                                                    <div className="flex gap-4 items-center flex-wrap">
                                                        <select value={q.type} onChange={e => updateQuestion(pIdx, qIdx, "type", e.target.value)}
                                                            className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none font-medium">
                                                            <option value="fill">Điền từ (Fill in)</option>
                                                            <option value="mcq">Trắc nghiệm (A,B,C,D)</option>
                                                            <option value="tf">True/False/Not Given</option>
                                                        </select>
                                                        <input type="text" value={q.answer} onChange={e => updateQuestion(pIdx, qIdx, "answer", e.target.value)}
                                                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none font-bold text-violet-700"
                                                            placeholder="Đáp án ĐÚNG" />
                                                    </div>
                                                    {q.type === "mcq" && (
                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                            {q.options.map((opt, optIdx) => (
                                                                <input key={optIdx} type="text" value={opt} onChange={e => updateOption(pIdx, qIdx, optIdx, e.target.value)}
                                                                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none"
                                                                    placeholder={`Lựa chọn ${String.fromCharCode(65 + optIdx)}`} />
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

                {/* Save Bar */}
                <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm sticky bottom-6">
                    <div>
                        <p className="font-bold text-slate-800">Hoàn tất soạn bộ đề?</p>
                        <p className="text-xs text-slate-500">
                            {publishMode === "class"
                                ? `Bộ đề sẽ được giao cho lớp "${classes.find(c => c.id === classId)?.name || "..."}"`
                                : "Bộ đề sẽ xuất hiện cho tất cả học viên"}
                        </p>
                        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
                    </div>
                    <div className="flex items-center gap-4">
                        {saved && (
                            <span className="text-emerald-600 font-bold flex items-center gap-2 bg-emerald-50 px-4 py-2 rounded-lg">
                                <CheckCircle2 className="h-5 w-5" /> Đã lưu thành công!
                            </span>
                        )}
                        <button onClick={handleSave} disabled={saving || !title.trim()}
                            className="bg-violet-600 text-white font-bold hover:bg-violet-700 px-8 py-3 rounded-xl disabled:opacity-50 flex items-center gap-2 shadow-lg shadow-violet-500/30 transition-all hover:-translate-y-1">
                            {saving ? <Loader2 className="h-5 w-5 animate-spin" /> : <Save className="h-5 w-5" />}
                            Xuất bản bộ đề
                        </button>
                    </div>
                </div>
            </div>
            {/* JSON Import Modal */}
            {showJsonModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><FileJson className="h-5 w-5 text-violet-600"/> Nhập Dữ Liệu Từ JSON</h3>
                            <button onClick={() => setShowJsonModal(false)} className="p-1 hover:bg-slate-200 rounded-lg"><X className="h-5 w-5 text-slate-500"/></button>
                        </div>
                        <div className="p-6">
                            <p className="text-sm text-slate-500 mb-3">Dán đoạn mã JSON chứa nội dung bài tập của bạn vào đây. Hệ thống sẽ tự động phân tích và điền vào các ô nhập liệu.</p>
                            <textarea 
                                value={jsonImportText} 
                                onChange={e => setJsonImportText(e.target.value)}
                                className="w-full h-64 border border-slate-300 rounded-xl p-4 font-mono text-sm text-slate-700 bg-slate-50 focus:border-violet-500 outline-none resize-none"
                                placeholder='{"title": "Test 1", "skill": "reading", "passages": [...]}'
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button onClick={() => setShowJsonModal(false)} className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition text-sm">Hủy</button>
                            <button onClick={handleJsonImport} disabled={!jsonImportText.trim()} className="px-5 py-2 bg-violet-600 hover:bg-violet-700 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm flex items-center gap-2">
                                <CheckCircle2 className="h-4 w-4" /> Xác nhận Nhập
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
