"use client";

import React, { useState, useEffect } from "react";
import { Upload, Plus, Trash2, Save, Loader2, CheckCircle2, ArrowLeft, FileJson, X, Sparkles } from "lucide-react";
import Link from "next/link";

interface Question {
    text: string;
    type: "fill" | "mcq" | "tf" | "multi-mcq" | "matching";
    answer: string;
    options: string[];
    answers?: string[]; // For multi-mcq
}

interface Part {
    title: string;
    text: string;
    mapImage?: string;
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

    // JSON Import Modal
    const [showJsonModal, setShowJsonModal] = useState(false);
    const [jsonImportText, setJsonImportText] = useState("");
    const [isParsingAI, setIsParsingAI] = useState(false);
    const [parseProgress, setParseProgress] = useState(0);
    const [parseElapsed, setParseElapsed] = useState(0);
    const [estimatedTotalTime, setEstimatedTotalTime] = useState(8);

    const [editId, setEditId] = useState<string | null>(null);

    useEffect(() => {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('import') === 'true') {
            setShowJsonModal(true);
        }
        const idParam = urlParams.get('editId');
        if (idParam) {
            setEditId(idParam);
            fetch(`/api/admin/practice?id=${idParam}`)
                .then(r => r.json())
                .then(data => {
                    if (data && data.content) {
                        setTitle(data.title || "");
                        setDifficulty(data.difficulty || "Medium");
                        setSkill(data.skill?.toLowerCase() || "reading");
                        try {
                            const parsed = JSON.parse(data.content);
                            applyParsedData(parsed);
                        } catch (e) {}
                    }
                });
        }
    }, []);

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

    const updatePart = (pIdx: number, field: "title" | "text" | "mapImage", val: string) => {
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

    const [parsedSkillsMap, setParsedSkillsMap] = useState<Record<string, any>>({});
    const [importStatus, setImportStatus] = useState<"" | "success" | "error">("");
    const [importMessage, setImportMessage] = useState("");

    const loadSkillFromData = (targetSkill: string, skillData: any) => {
        if (!skillData) return;
        setSkill(targetSkill);

        if (skillData.title) setTitle(skillData.title);
        if (skillData.difficulty) setDifficulty(skillData.difficulty);

        const content = skillData.content || skillData;

        if (targetSkill === "reading") {
            const passages = content.passages || (Array.isArray(content) ? content : null);
            if (passages && Array.isArray(passages)) {
                const safePassages = passages.map((p: any) => ({
                    ...p,
                    questions: p.questions?.map((q: any) => ({
                        ...q,
                        options: q.options || ["", "", "", ""]
                    })) || []
                }));
                setParts(safePassages);
            }
        } else if (targetSkill === "listening") {
            if (content.audioUrl) setAudioUrl(content.audioUrl);
            const lParts = content.parts || (Array.isArray(content) ? content : null);
            if (lParts && Array.isArray(lParts)) {
                const safeParts = lParts.map((p: any) => ({
                    ...p,
                    questions: p.questions?.map((q: any) => ({
                        ...q,
                        options: q.options || ["", "", "", ""]
                    })) || []
                }));
                setParts(safeParts);
            }
        } else if (targetSkill === "writing") {
            const w = content.writing || content;
            setWriting({
                task1Prompt: w.task1Prompt || "",
                task1Image: w.task1Image || "",
                task2Prompt: w.task2Prompt || ""
            });
        } else if (targetSkill === "speaking") {
            const sp = content.speaking || content;
            setSpeaking({
                part1: typeof sp.part1 === "string" ? sp.part1 : (Array.isArray(sp.part1) ? sp.part1.join("\n") : ""),
                part2: typeof sp.part2 === "string" ? sp.part2 : (Array.isArray(sp.part2) ? sp.part2.join("\n") : ""),
                part3: typeof sp.part3 === "string" ? sp.part3 : (Array.isArray(sp.part3) ? sp.part3.join("\n") : "")
            });
        }
    };

    const applyParsedData = (parsed: any) => {
        let items: any[] = [];
        if (Array.isArray(parsed)) {
            items = parsed;
        } else if (typeof parsed === "object" && parsed !== null) {
            if (parsed.reading || parsed.listening || parsed.writing || parsed.speaking) {
                if (parsed.reading) items.push({ skill: "reading", ...parsed.reading });
                if (parsed.listening) items.push({ skill: "listening", ...parsed.listening });
                if (parsed.writing) items.push({ skill: "writing", ...parsed.writing });
                if (parsed.speaking) items.push({ skill: "speaking", ...parsed.speaking });
            } else {
                items = [parsed];
            }
        }

        const newMap: Record<string, any> = {};

        items.forEach((item: any) => {
            const itemSkill = (item.skill || "").toLowerCase();
            const content = item.content || item;
            const itemTitle = item.title || content.title || title;
            const itemDifficulty = item.difficulty || content.difficulty || difficulty;

            let sType = itemSkill;
            if (!sType) {
                if (content.passages || Array.isArray(content.passages)) sType = "reading";
                else if (content.parts || content.audioUrl || content.tapescript) sType = "listening";
                else if (content.task1Prompt || content.task2Prompt || content.writing) sType = "writing";
                else if (content.part1 || content.part2 || content.part3 || content.speaking) sType = "speaking";
                else sType = skill;
            }

            newMap[sType] = {
                title: itemTitle,
                difficulty: itemDifficulty,
                content: content
            };

            // Pre-fill state for writing and speaking immediately
            if (sType === "writing") {
                const w = content.writing || content;
                setWriting({
                    task1Prompt: w.task1Prompt || "",
                    task1Image: w.task1Image || "",
                    task2Prompt: w.task2Prompt || ""
                });
            }
            if (sType === "speaking") {
                const sp = content.speaking || content;
                setSpeaking({
                    part1: typeof sp.part1 === "string" ? sp.part1 : (Array.isArray(sp.part1) ? sp.part1.join("\n") : ""),
                    part2: typeof sp.part2 === "string" ? sp.part2 : (Array.isArray(sp.part2) ? sp.part2.join("\n") : ""),
                    part3: typeof sp.part3 === "string" ? sp.part3 : (Array.isArray(sp.part3) ? sp.part3.join("\n") : "")
                });
            }
        });

        setParsedSkillsMap(newMap);

        const activeSkill = newMap[skill] ? skill : (Object.keys(newMap)[0] || skill);
        loadSkillFromData(activeSkill, newMap[activeSkill]);

        setShowJsonModal(false);
        setJsonImportText("");
    };

    const handleJsonImport = () => {
        setImportStatus(""); setImportMessage("");
        try {
            const parsed = JSON.parse(jsonImportText);
            applyParsedData(parsed);
            setImportStatus("success");
            setImportMessage("Đã điền dữ liệu vào form. Vui lòng kiểm tra và bấm Xuất bản.");
        } catch (e) {
            setImportStatus("error");
            setImportMessage("JSON không hợp lệ. Hãy thử dùng AI chuyển đổi.");
        }
    };

    const handleAIImport = async () => {
        if (!jsonImportText.trim()) return;
        setIsParsingAI(true);
        setImportStatus(""); setImportMessage("");

        const charCount = jsonImportText.trim().length;
        const estSec = Math.min(20, Math.max(5, Math.ceil(charCount / 300)));
        setEstimatedTotalTime(estSec);
        setParseProgress(3);
        setParseElapsed(0);

        const startTime = Date.now();
        const timerInterval = setInterval(() => {
            const elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            setParseElapsed(elapsedSeconds);

            const elapsedRatio = (Date.now() - startTime) / (estSec * 1000);
            const calculatedProgress = Math.min(93, Math.round(3 + 90 * (1 - Math.exp(-elapsedRatio * 1.5))));
            setParseProgress(calculatedProgress);
        }, 200);

        try {
            const res = await fetch("/api/ai/parse-practice", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text: jsonImportText })
            });
            const d = await res.json();
            clearInterval(timerInterval);

            if (res.ok && d.success) {
                setParseProgress(100);
                setTimeout(() => {
                    applyParsedData(d.data);
                    setImportStatus("success");
                    setImportMessage("AI đã phân tích thành công. Vui lòng kiểm tra nội dung bên dưới rồi bấm Xuất bản.");
                    setIsParsingAI(false);
                }, 350);
            } else {
                setImportStatus("error");
                setImportMessage(d.error || "AI không thể phân tích nội dung này.");
                setIsParsingAI(false);
            }
        } catch (e) {
            clearInterval(timerInterval);
            setImportStatus("error");
            setImportMessage("Lỗi kết nối. Vui lòng thử lại.");
            setIsParsingAI(false);
        }
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
            const endpoint = '/api/admin/practice';
            const method = editId ? 'PUT' : 'POST';
            const payload = editId 
                ? { id: editId, skill, title, difficulty, contentJSON }
                : { skill, title, difficulty, contentJSON };

            const res = await fetch(endpoint, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
                if (!editId) {
                    setTitle(""); setAudioUrl("");
                    setParts([{ title: "Passage 1", text: "", questions: [] }]);
                    setSpeaking({ part1: "", part2: "", part3: "" });
                    setWriting({ task1Prompt: "", task1Image: "", task2Prompt: "" });
                }
            } else {
                alert("Lỗi khi lưu bài tập");
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

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
        } catch (e) {
            alert("Lỗi kết nối khi upload.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-br from-slate-50 to-slate-100">
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
                    <Link href="/admin?tab=content" className="p-2 hover:bg-slate-100 rounded-lg"><ArrowLeft className="h-5 w-5 text-slate-600" /></Link>
                    <div className="flex-1">
                        <h1 className="text-xl font-bold text-slate-900">{editId ? "Chỉnh Sửa Bài Tập" : "Upload Bộ Đề Mới"}</h1>
                        <p className="text-xs text-slate-500">{editId ? "Cập nhật nội dung câu hỏi & đáp án trực tiếp" : "Soạn bài tập chuẩn IELTS cho hệ thống"}</p>
                    </div>
                    <button onClick={() => setShowJsonModal(true)} className="flex items-center gap-2 bg-blue-100 hover:bg-blue-200 text-blue-700 px-4 py-2 rounded-lg text-sm font-semibold transition">
                        <Sparkles className="h-4 w-4" /> Smart Import
                    </button>
                </div>

                {/* Import Success Banner */}
                {importStatus === "success" && (
                    <div className="flex items-center gap-3 bg-emerald-50 border border-emerald-200 p-4 rounded-xl">
                        <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                        <p className="text-sm text-emerald-800 font-medium">{importMessage}</p>
                        <button onClick={() => { setImportStatus(""); setImportMessage(""); }} className="ml-auto text-emerald-400 hover:text-emerald-600"><X className="h-4 w-4" /></button>
                    </div>
                )}

                {/* Skill Selector */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                    <label className="block text-sm font-semibold text-slate-700 mb-3">Chọn Kỹ Năng</label>
                    <div className="flex gap-2 flex-wrap">
                        {["reading", "listening", "writing", "speaking"].map(s => (
                            <button key={s} onClick={() => {
                                setSkill(s);
                                if (parsedSkillsMap[s]) {
                                    loadSkillFromData(s, parsedSkillsMap[s]);
                                }
                            }}
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

                {/* Reading & Listening Builder */}
                {(skill === "reading" || skill === "listening") && (
                    <div className="space-y-6">
                        {skill === "listening" && (
                            <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
                                <label className="block text-sm font-semibold text-slate-700 mb-1.5">File Audio / URL Audio</label>
                                <div className="flex gap-2">
                                    <input type="text" value={audioUrl} onChange={e => setAudioUrl(e.target.value)}
                                        className="flex-1 border border-slate-300 rounded-xl px-4 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500" placeholder="https://... hoặc upload file" />
                                    <label className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-4 py-2.5 rounded-xl cursor-pointer font-semibold flex items-center gap-2 border border-slate-200 transition">
                                        <Upload className="h-4 w-4" /> Upload MP3
                                        <input type="file" accept="audio/*" className="hidden" onChange={handleAudioUpload} disabled={saving} />
                                    </label>
                                </div>
                                {audioUrl && <audio controls src={audioUrl} className="mt-3 w-full h-10" />}
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
                                {skill === "listening" && (
                                    <div>
                                        <label className="block text-sm font-bold text-slate-700 mb-2">Link Ảnh Bản Đồ (Tuỳ chọn cho dạng Map Labeling)</label>
                                        <input value={part.mapImage || ""} onChange={e => updatePart(pIdx, "mapImage", e.target.value)} className="w-full border border-slate-300 rounded-xl px-4 py-2 text-sm outline-none focus:border-blue-500" placeholder="https://imgur.com/map..." />
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
                                                            <option value="fill">Điền từ (Fill)</option>
                                                            <option value="mcq">Trắc nghiệm (A,B,C,D)</option>
                                                            <option value="multi-mcq">Trắc nghiệm nhiều đáp án (Multi-MCQ)</option>
                                                            <option value="tf">True/False/Not Given</option>
                                                            <option value="matching">Nối đáp án (Matching)</option>
                                                        </select>
                                                        <input type="text" value={q.type === 'multi-mcq' && q.answers ? q.answers.join(",") : q.answer} 
                                                            onChange={e => {
                                                                if (q.type === 'multi-mcq') {
                                                                    updateQuestion(pIdx, qIdx, "answers", e.target.value.split(",").map(s => s.trim()));
                                                                } else {
                                                                    updateQuestion(pIdx, qIdx, "answer", e.target.value);
                                                                }
                                                            }}
                                                            className="flex-1 border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none font-bold text-blue-700" 
                                                            placeholder={q.type === 'multi-mcq' ? "Đáp án ĐÚNG (cách nhau dấu phẩy)" : "Đáp án ĐÚNG"} 
                                                        />
                                                    </div>

                                                    {(q.type === "mcq" || q.type === "multi-mcq" || q.type === "matching") && (
                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                            {q.options.map((opt, optIdx) => (
                                                                <input key={optIdx} type="text" value={opt} onChange={(e) => updateOption(pIdx, qIdx, optIdx, e.target.value)}
                                                                    className="border border-slate-300 rounded-lg px-3 py-2 text-sm outline-none" placeholder={`Lựa chọn ${optIdx + 1}`} />
                                                            ))}
                                                            <button onClick={() => {
                                                                const newParts = [...parts];
                                                                newParts[pIdx].questions[qIdx].options.push("");
                                                                setParts(newParts);
                                                            }} className="text-xs text-blue-600 font-semibold hover:underline">Thêm lựa chọn</button>
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
            {/* JSON Import Modal */}
            {showJsonModal && (
                <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-50">
                    <div className="bg-white rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
                        <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                            <h3 className="font-bold text-slate-800 flex items-center gap-2"><Sparkles className="h-5 w-5 text-blue-600"/> Smart Import</h3>
                            <button onClick={() => { setShowJsonModal(false); setImportStatus(""); setImportMessage(""); }} className="p-1 hover:bg-slate-200 rounded-lg"><X className="h-5 w-5 text-slate-500"/></button>
                        </div>
                        <div className="p-6 relative">
                            {isParsingAI && (
                                <div className="absolute inset-0 z-10 bg-white/95 backdrop-blur-md flex flex-col items-center justify-center p-6 rounded-b-2xl animate-fade-in">
                                    <div className="relative w-24 h-24 flex items-center justify-center mb-3">
                                        <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                                            <path
                                                className="text-blue-100"
                                                strokeWidth="3.5"
                                                stroke="currentColor"
                                                fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                            <path
                                                className="text-blue-600 transition-all duration-300 ease-out"
                                                strokeDasharray={`${parseProgress}, 100`}
                                                strokeWidth="3.5"
                                                strokeLinecap="round"
                                                stroke="currentColor"
                                                fill="none"
                                                d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                                            />
                                        </svg>
                                        <div className="absolute flex flex-col items-center justify-center">
                                            <span className="text-xl font-extrabold text-blue-700 font-mono tracking-tight">{parseProgress}%</span>
                                        </div>
                                    </div>
                                    <p className="text-slate-800 font-bold text-base mb-1">Đang phân tích cấu trúc bài tập...</p>
                                    <p className="text-slate-500 text-xs mb-3 text-center max-w-sm">AI đang nhận diện tiêu đề, bài đọc/nghe, danh sách câu hỏi & đáp án</p>
                                    <div className="flex items-center gap-2.5 bg-blue-50 border border-blue-100 px-3.5 py-1.5 rounded-full text-xs font-medium text-blue-800">
                                        <div className="flex items-center gap-1.5">
                                            <span className="relative flex h-2 w-2">
                                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                                                <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-600"></span>
                                            </span>
                                            <span>Đã chạy: <b>{parseElapsed}s</b></span>
                                        </div>
                                        <span className="text-blue-300">•</span>
                                        <div>Ước tính: ~<b>{Math.max(1, estimatedTotalTime - parseElapsed)}s</b> còn lại</div>
                                    </div>
                                </div>
                            )}
                            <p className="text-sm text-slate-500 mb-3">Dán <b>đoạn văn bản thô</b> (kèm câu hỏi), bài tập copy từ Word, hoặc đoạn JSON vào đây. AI sẽ tự động phân tích và điền vào form soạn thủ công để bạn kiểm tra trước khi lưu.</p>
                            {importStatus === "error" && (
                                <div className="mb-3 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">{importMessage}</div>
                            )}
                            <textarea 
                                value={jsonImportText} 
                                onChange={e => setJsonImportText(e.target.value)}
                                className="w-full h-64 border border-slate-300 rounded-xl p-4 font-mono text-sm text-slate-700 bg-slate-50 focus:border-blue-500 outline-none resize-none"
                                placeholder='Dán đề bài (Passage, Questions, Audio Transcript...) vào đây...'
                                disabled={isParsingAI}
                            />
                        </div>
                        <div className="p-4 border-t border-slate-100 flex justify-end gap-3 bg-slate-50">
                            <button onClick={() => { setShowJsonModal(false); setImportStatus(""); setImportMessage(""); }} disabled={isParsingAI} className="px-5 py-2 text-slate-600 font-semibold hover:bg-slate-200 rounded-xl transition text-sm">Hủy</button>
                            <button onClick={handleJsonImport} disabled={!jsonImportText.trim() || isParsingAI} className="px-5 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 font-semibold rounded-xl transition text-sm flex items-center gap-2">
                                JSON chuẩn
                            </button>
                            <button onClick={handleAIImport} disabled={!jsonImportText.trim() || isParsingAI} className="px-5 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white font-semibold rounded-xl transition text-sm flex items-center gap-2">
                                <Sparkles className="h-4 w-4" /> Dùng AI chuyển đổi
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
