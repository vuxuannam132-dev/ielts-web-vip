"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    GraduationCap, Plus, Users, Copy, Trash2, Check, X, Clock,
    ChevronRight, BookOpen, Flame, Trophy, Loader2, RefreshCw, QrCode,
    UserPlus, CalendarDays, Headphones, PenTool, Mic, ClipboardList
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassMember {
    id: string; status: "PENDING" | "APPROVED" | "REJECTED"; joinedAt: string;
    user: { id: string; name: string; email: string; tier: string; currentStreak: number; lifetimePracticeCount: number; estimatedBand: number | null; };
}
interface Assignment {
    id: string; title: string; description: string | null; dueDate: string | null; skill: string | null; createdAt: string;
}
interface ClassRoom {
    id: string; name: string; description: string | null; inviteCode: string; createdAt: string;
    _count: { members: number }; members: ClassMember[]; assignments?: Assignment[];
}

export default function TeacherDashboard() {
    const { data: session, status } = useSession();
    const user = session?.user as any;
    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeClass, setActiveClass] = useState<ClassRoom | null>(null);
    const [tab, setTab] = useState<"students" | "assignments">("students");
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newClassName, setNewClassName] = useState(""); const [newClassDesc, setNewClassDesc] = useState(""); const [creating, setCreating] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    // Add student by email
    const [addEmail, setAddEmail] = useState(""); const [addingStudent, setAddingStudent] = useState(false); const [addResult, setAddResult] = useState<{ ok: boolean; msg: string } | null>(null);

    // Create assignment
    const [assignTitle, setAssignTitle] = useState(""); const [assignDesc, setAssignDesc] = useState("");
    const [assignSkill, setAssignSkill] = useState(""); const [assignDue, setAssignDue] = useState("");
    const [creatingAssign, setCreatingAssign] = useState(false);
    const [assignments, setAssignments] = useState<Assignment[]>([]);

    const fetchClasses = async () => {
        setLoading(true);
        const res = await fetch("/api/teacher/classes"); const data = await res.json();
        if (Array.isArray(data)) { setClasses(data); if (activeClass) { const updated = data.find((c: ClassRoom) => c.id === activeClass.id); if (updated) setActiveClass(updated); } }
        setLoading(false);
    };

    const fetchAssignments = async (classId: string) => {
        const res = await fetch(`/api/teacher/assignments?classId=${classId}`);
        if (res.ok) setAssignments(await res.json());
    };

    useEffect(() => { if (status === "authenticated") fetchClasses(); }, [status]);
    useEffect(() => { if (activeClass) fetchAssignments(activeClass.id); }, [activeClass]);

    if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
            <GraduationCap className="h-16 w-16 text-slate-300 mb-4" />
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Bạn chưa có quyền Teacher</h1>
            <Link href="/dashboard" className="text-blue-600 underline text-sm">← Quay về Dashboard</Link>
        </div>
    );

    const handleCreateClass = async () => {
        if (!newClassName.trim()) return; setCreating(true);
        const res = await fetch("/api/teacher/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newClassName, description: newClassDesc }) });
        if (res.ok) { setNewClassName(""); setNewClassDesc(""); setShowCreateForm(false); await fetchClasses(); }
        setCreating(false);
    };

    const handleMemberAction = async (memberId: string, action: "APPROVED" | "REJECTED") => {
        await fetch("/api/teacher/members", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ memberId, status: action }) });
        await fetchClasses();
    };

    const handleDeleteMember = async (memberId: string) => {
        if (!confirm("Xóa học sinh này?")) return;
        await fetch(`/api/teacher/members?memberId=${memberId}`, { method: "DELETE" });
        await fetchClasses();
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm("Xóa lớp này? Toàn bộ học sinh sẽ bị xóa.")) return;
        await fetch(`/api/teacher/classes?classId=${classId}`, { method: "DELETE" });
        setActiveClass(null); await fetchClasses();
    };

    const handleAddByEmail = async () => {
        if (!addEmail.trim() || !activeClass) return;
        setAddingStudent(true); setAddResult(null);
        const res = await fetch("/api/teacher/add-student", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: addEmail.trim(), classId: activeClass.id }) });
        const data = await res.json();
        setAddResult({ ok: res.ok, msg: res.ok ? `✅ Đã thêm ${data.student?.name || addEmail} (role: STUDENT, tier: EDU)` : `❌ ${data.error}` });
        if (res.ok) { setAddEmail(""); await fetchClasses(); }
        setAddingStudent(false);
    };

    const handleCreateAssignment = async () => {
        if (!assignTitle.trim() || !activeClass) return;
        setCreatingAssign(true);
        const res = await fetch("/api/teacher/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ classId: activeClass.id, title: assignTitle, description: assignDesc, skill: assignSkill || null, dueDate: assignDue || null }) });
        if (res.ok) { setAssignTitle(""); setAssignDesc(""); setAssignSkill(""); setAssignDue(""); await fetchAssignments(activeClass.id); }
        setCreatingAssign(false);
    };

    const handleDeleteAssignment = async (id: string) => {
        await fetch(`/api/teacher/assignments?id=${id}`, { method: "DELETE" });
        await fetchAssignments(activeClass!.id);
    };

    const copyCode = (code: string) => { navigator.clipboard.writeText(code); setCopiedCode(code); setTimeout(() => setCopiedCode(null), 2000); };

    const pending = activeClass?.members.filter(m => m.status === "PENDING") || [];
    const approved = activeClass?.members.filter(m => m.status === "APPROVED") || [];
    const tierColor: Record<string, string> = { FREE: "bg-slate-100 text-slate-600", PRO: "bg-blue-100 text-blue-700", PREMIUM: "bg-amber-100 text-amber-700", EDU: "bg-purple-100 text-purple-700", STUDENT: "bg-emerald-100 text-emerald-700" };
    const skillIcons: Record<string, any> = { LISTENING: Headphones, READING: BookOpen, WRITING: PenTool, SPEAKING: Mic };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div><h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1><p className="text-slate-500 text-sm">Quản lý lớp học và theo dõi học sinh</p></div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchClasses} className="gap-1"><RefreshCw className="h-4 w-4" /> Làm mới</Button>
                        <Button onClick={() => setShowCreateForm(true)} className="gap-2 bg-blue-600 hover:bg-blue-700"><Plus className="h-4 w-4" /> Tạo lớp mới</Button>
                    </div>
                </div>

                {/* Create Class Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><Plus className="h-5 w-5 text-blue-600" /> Tạo lớp học mới</h2>
                            <div className="space-y-3">
                                <div><label className="text-sm font-medium text-slate-700 mb-1 block">Tên lớp *</label><input autoFocus value={newClassName} onChange={e => setNewClassName(e.target.value)} placeholder="VD: IELTS 7.0 - Khóa tháng 3" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" /></div>
                                <div><label className="text-sm font-medium text-slate-700 mb-1 block">Mô tả (tuỳ chọn)</label><textarea value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)} placeholder="Mô tả ngắn..." rows={3} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none resize-none" /></div>
                            </div>
                            <div className="flex gap-2 mt-5">
                                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">Huỷ</Button>
                                <Button onClick={handleCreateClass} disabled={creating || !newClassName.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700">{creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo lớp"}</Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Class List */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">Danh sách lớp ({classes.length})</h2>
                        {loading ? <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>
                            : classes.length === 0 ? (
                                <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                                    <GraduationCap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                    <p className="text-slate-500 text-sm">Chưa có lớp nào.</p>
                                    <button onClick={() => setShowCreateForm(true)} className="text-blue-600 text-sm font-medium mt-2 hover:underline">+ Tạo lớp đầu tiên</button>
                                </div>
                            ) : classes.map(cls => (
                                <div key={cls.id} onClick={() => { setActiveClass(cls); setTab("students"); }} className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${activeClass?.id === cls.id ? "border-blue-500 shadow-md" : "border-slate-200 hover:border-blue-200"}`}>
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 truncate">{cls.name}</h3>
                                            {cls.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{cls.description}</p>}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {cls._count.members} học sinh</span>
                                                <span className="flex items-center gap-1"><QrCode className="h-3 w-3" /><span className="font-mono font-bold text-blue-600">{cls.inviteCode}</span></span>
                                            </div>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${activeClass?.id === cls.id ? "rotate-90 text-blue-600" : "text-slate-400"}`} />
                                    </div>
                                </div>
                            ))}
                    </div>

                    {/* Class Detail */}
                    <div className="lg:col-span-2">
                        {!activeClass ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center"><BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-3" /><p className="text-slate-400">Chọn một lớp để xem chi tiết</p></div>
                        ) : (
                            <div className="space-y-4">
                                {/* Class Info */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <div className="flex items-start justify-between">
                                        <div><h2 className="text-xl font-bold text-slate-900">{activeClass.name}</h2>{activeClass.description && <p className="text-slate-500 text-sm mt-1">{activeClass.description}</p>}</div>
                                        <button onClick={() => handleDeleteClass(activeClass.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
                                    </div>
                                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                        <p className="text-xs text-blue-600 font-medium mb-1">🔑 Mã mời</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-black text-blue-700 font-mono tracking-widest">{activeClass.inviteCode}</span>
                                            <button onClick={() => copyCode(activeClass.inviteCode)} className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                {copiedCode === activeClass.inviteCode ? <><Check className="h-3 w-3" /> Đã copy</> : <><Copy className="h-3 w-3" /> Copy</>}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Tabs */}
                                <div className="flex gap-2">
                                    <button onClick={() => setTab("students")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "students" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-blue-200"}`}>
                                        <Users className="h-4 w-4" /> Học sinh
                                    </button>
                                    <button onClick={() => setTab("assignments")} className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === "assignments" ? "bg-blue-600 text-white" : "bg-white border border-slate-200 text-slate-600 hover:border-blue-200"}`}>
                                        <ClipboardList className="h-4 w-4" /> Bài tập ({assignments.length})
                                    </button>
                                </div>

                                {/* Students Tab */}
                                {tab === "students" && (
                                    <div className="space-y-4">
                                        {/* Add by email */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><UserPlus className="h-4 w-4 text-blue-600" /> Thêm học sinh qua email</h3>
                                            <div className="flex gap-2">
                                                <input value={addEmail} onChange={e => setAddEmail(e.target.value)} onKeyDown={e => e.key === "Enter" && handleAddByEmail()} placeholder="email@example.com" className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                                                <Button onClick={handleAddByEmail} disabled={addingStudent || !addEmail.trim()} className="bg-blue-600 hover:bg-blue-700 px-4">
                                                    {addingStudent ? <Loader2 className="h-4 w-4 animate-spin" /> : "Thêm"}
                                                </Button>
                                            </div>
                                            {addResult && <p className={`text-sm mt-2 ${addResult.ok ? "text-emerald-600" : "text-red-500"}`}>{addResult.msg}</p>}
                                            <p className="text-xs text-slate-400 mt-2">💡 Học sinh được thêm sẽ tự động nhận quyền STUDENT + EDU tier</p>
                                        </div>

                                        {/* Pending */}
                                        {pending.length > 0 && (
                                            <div className="bg-white rounded-2xl border border-amber-200 p-5">
                                                <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2"><Clock className="h-4 w-4 text-amber-500" /> Chờ duyệt ({pending.length})</h3>
                                                <div className="space-y-3">
                                                    {pending.map(m => (
                                                        <div key={m.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                                            <div><p className="font-semibold text-sm text-slate-900">{m.user.name || "Học sinh"}</p><p className="text-xs text-slate-500">{m.user.email}</p></div>
                                                            <div className="flex gap-2">
                                                                <button onClick={() => handleMemberAction(m.id, "APPROVED")} className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 font-medium"><Check className="h-3 w-3" /> Duyệt</button>
                                                                <button onClick={() => handleMemberAction(m.id, "REJECTED")} className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 font-medium"><X className="h-3 w-3" /> Từ chối</button>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        {/* Approved Students Table */}
                                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                            <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-900 flex items-center gap-2"><Users className="h-4 w-4 text-blue-600" /> Học sinh ({approved.length})</h3></div>
                                            {approved.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">Chưa có học sinh nào. Thêm bằng email ở trên.</div> : (
                                                <div className="overflow-x-auto">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                                                            <tr><th className="px-4 py-3 text-left">Học sinh</th><th className="px-4 py-3 text-center">Tier</th><th className="px-4 py-3 text-center"><Flame className="h-3 w-3 inline" /> Streak</th><th className="px-4 py-3 text-center">Bài đã làm</th><th className="px-4 py-3 text-center"><Trophy className="h-3 w-3 inline" /> Band</th><th className="px-4 py-3 text-right">Xóa</th></tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-slate-100">
                                                            {approved.map(m => (
                                                                <tr key={m.id} className="hover:bg-slate-50/50">
                                                                    <td className="px-4 py-3"><p className="font-semibold text-slate-900">{m.user.name || "—"}</p><p className="text-xs text-slate-500">{m.user.email}</p></td>
                                                                    <td className="px-4 py-3 text-center"><span className={`px-2 py-0.5 rounded-md text-xs font-bold ${tierColor[m.user.tier] || "bg-slate-100 text-slate-600"}`}>{m.user.tier}</span></td>
                                                                    <td className="px-4 py-3 text-center font-bold text-orange-500">{m.user.currentStreak}</td>
                                                                    <td className="px-4 py-3 text-center text-slate-700">{m.user.lifetimePracticeCount}</td>
                                                                    <td className="px-4 py-3 text-center font-bold text-blue-600">{m.user.estimatedBand ?? "—"}</td>
                                                                    <td className="px-4 py-3 text-right"><button onClick={() => handleDeleteMember(m.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button></td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {/* Assignments Tab */}
                                {tab === "assignments" && (
                                    <div className="space-y-4">
                                        {/* Create Assignment */}
                                        <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                            <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2"><Plus className="h-4 w-4 text-blue-600" /> Giao bài mới</h3>
                                            <div className="space-y-3">
                                                <input value={assignTitle} onChange={e => setAssignTitle(e.target.value)} placeholder="Tiêu đề bài tập *" className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                                                <textarea value={assignDesc} onChange={e => setAssignDesc(e.target.value)} placeholder="Mô tả / hướng dẫn (tuỳ chọn)" rows={2} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none resize-none" />
                                                <div className="flex gap-3">
                                                    <select value={assignSkill} onChange={e => setAssignSkill(e.target.value)} className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none">
                                                        <option value="">Kỹ năng (tuỳ chọn)</option>
                                                        <option value="LISTENING">Listening</option>
                                                        <option value="READING">Reading</option>
                                                        <option value="WRITING">Writing</option>
                                                        <option value="SPEAKING">Speaking</option>
                                                    </select>
                                                    <input type="date" value={assignDue} onChange={e => setAssignDue(e.target.value)} className="flex-1 border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                                                </div>
                                                <Button onClick={handleCreateAssignment} disabled={creatingAssign || !assignTitle.trim()} className="w-full bg-blue-600 hover:bg-blue-700">
                                                    {creatingAssign ? <Loader2 className="h-4 w-4 animate-spin" /> : "Giao bài"}
                                                </Button>
                                            </div>
                                        </div>

                                        {/* Assignment List */}
                                        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                            <div className="p-4 border-b border-slate-100"><h3 className="font-bold text-slate-900">Danh sách bài tập đã giao ({assignments.length})</h3></div>
                                            {assignments.length === 0 ? <div className="p-8 text-center text-slate-400 text-sm">Chưa có bài tập nào.</div>
                                                : <div className="divide-y divide-slate-100">
                                                    {assignments.map(a => {
                                                        const SkillIcon = a.skill ? skillIcons[a.skill] : BookOpen;
                                                        return (
                                                            <div key={a.id} className="p-4 flex items-start gap-3">
                                                                <div className="h-9 w-9 bg-blue-50 rounded-xl flex items-center justify-center shrink-0"><SkillIcon className="h-4 w-4 text-blue-600" /></div>
                                                                <div className="flex-1">
                                                                    <h4 className="font-semibold text-slate-900">{a.title}</h4>
                                                                    {a.description && <p className="text-xs text-slate-500 mt-0.5">{a.description}</p>}
                                                                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
                                                                        {a.skill && <span className="bg-blue-50 text-blue-600 px-2 py-0.5 rounded font-semibold">{a.skill}</span>}
                                                                        {a.dueDate && <span className="flex items-center gap-1"><CalendarDays className="h-3 w-3" />Hạn: {new Date(a.dueDate).toLocaleDateString("vi-VN")}</span>}
                                                                    </div>
                                                                </div>
                                                                <button onClick={() => handleDeleteAssignment(a.id)} className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg"><Trash2 className="h-4 w-4" /></button>
                                                            </div>
                                                        );
                                                    })}
                                                </div>
                                            }
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
