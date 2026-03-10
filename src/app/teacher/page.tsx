"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    GraduationCap, Plus, Users, Copy, Trash2, Check, X, Clock,
    ChevronRight, BookOpen, Flame, Trophy, Loader2, RefreshCw, QrCode
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ClassMember {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    joinedAt: string;
    user: {
        id: string; name: string; email: string; tier: string;
        currentStreak: number; lifetimePracticeCount: number; estimatedBand: number | null;
    };
}

interface ClassRoom {
    id: string;
    name: string;
    description: string | null;
    inviteCode: string;
    createdAt: string;
    _count: { members: number };
    members: ClassMember[];
}

export default function TeacherDashboard() {
    const { data: session, status } = useSession();
    const user = session?.user as any;

    const [classes, setClasses] = useState<ClassRoom[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeClass, setActiveClass] = useState<ClassRoom | null>(null);
    const [showCreateForm, setShowCreateForm] = useState(false);
    const [newClassName, setNewClassName] = useState("");
    const [newClassDesc, setNewClassDesc] = useState("");
    const [creating, setCreating] = useState(false);
    const [copiedCode, setCopiedCode] = useState<string | null>(null);

    const fetchClasses = async () => {
        setLoading(true);
        const res = await fetch("/api/teacher/classes");
        const data = await res.json();
        if (Array.isArray(data)) {
            setClasses(data);
            if (activeClass) {
                const updated = data.find((c: ClassRoom) => c.id === activeClass.id);
                if (updated) setActiveClass(updated);
            }
        }
        setLoading(false);
    };

    useEffect(() => {
        if (status === "authenticated") fetchClasses();
    }, [status]);

    if (status === "loading") return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

    if (!user || (user.role !== "TEACHER" && user.role !== "ADMIN")) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center text-center p-8">
                <GraduationCap className="h-16 w-16 text-slate-300 mb-4" />
                <h1 className="text-2xl font-bold text-slate-900 mb-2">Bạn chưa có quyền Teacher</h1>
                <p className="text-slate-500 mb-6">Liên hệ admin để được cấp quyền Giáo viên.</p>
                <Link href="/dashboard" className="text-blue-600 underline text-sm">← Quay về Dashboard</Link>
            </div>
        );
    }

    const handleCreateClass = async () => {
        if (!newClassName.trim()) return;
        setCreating(true);
        const res = await fetch("/api/teacher/classes", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: newClassName, description: newClassDesc })
        });
        if (res.ok) {
            setNewClassName(""); setNewClassDesc(""); setShowCreateForm(false);
            await fetchClasses();
        }
        setCreating(false);
    };

    const handleMemberAction = async (memberId: string, action: "APPROVED" | "REJECTED") => {
        await fetch("/api/teacher/members", {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberId, status: action })
        });
        await fetchClasses();
    };

    const handleDeleteMember = async (memberId: string) => {
        if (!confirm("Xóa học sinh này khỏi lớp?")) return;
        await fetch(`/api/teacher/members?memberId=${memberId}`, { method: "DELETE" });
        await fetchClasses();
    };

    const handleDeleteClass = async (classId: string) => {
        if (!confirm("Xóa lớp này? Toàn bộ học sinh sẽ bị xóa khỏi lớp.")) return;
        await fetch(`/api/teacher/classes?classId=${classId}`, { method: "DELETE" });
        setActiveClass(null);
        await fetchClasses();
    };

    const copyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        setCopiedCode(code);
        setTimeout(() => setCopiedCode(null), 2000);
    };

    const pending = activeClass?.members.filter(m => m.status === "PENDING") || [];
    const approved = activeClass?.members.filter(m => m.status === "APPROVED") || [];

    const tierColor: Record<string, string> = {
        FREE: "bg-slate-100 text-slate-600",
        PRO: "bg-blue-100 text-blue-700",
        PREMIUM: "bg-amber-100 text-amber-700",
        EDU: "bg-purple-100 text-purple-700",
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-3">
                        <div className="h-12 w-12 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center shadow-md">
                            <GraduationCap className="h-6 w-6 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900">Teacher Dashboard</h1>
                            <p className="text-slate-500 text-sm">Quản lý lớp học và theo dõi tiến độ học sinh</p>
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={fetchClasses} className="gap-1">
                            <RefreshCw className="h-4 w-4" /> Làm mới
                        </Button>
                        <Button onClick={() => setShowCreateForm(true)} className="gap-2 bg-blue-600 hover:bg-blue-700">
                            <Plus className="h-4 w-4" /> Tạo lớp mới
                        </Button>
                    </div>
                </div>

                {/* Create Class Modal */}
                {showCreateForm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <Plus className="h-5 w-5 text-blue-600" /> Tạo lớp học mới
                            </h2>
                            <div className="space-y-3">
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">Tên lớp *</label>
                                    <input autoFocus value={newClassName} onChange={e => setNewClassName(e.target.value)}
                                        placeholder="VD: IELTS 7.0 - Khóa tháng 3"
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none" />
                                </div>
                                <div>
                                    <label className="text-sm font-medium text-slate-700 mb-1 block">Mô tả (tuỳ chọn)</label>
                                    <textarea value={newClassDesc} onChange={e => setNewClassDesc(e.target.value)}
                                        placeholder="Mô tả ngắn về lớp học..."
                                        rows={3}
                                        className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-blue-500 outline-none resize-none" />
                                </div>
                            </div>
                            <div className="flex gap-2 mt-5">
                                <Button variant="outline" onClick={() => setShowCreateForm(false)} className="flex-1">Huỷ</Button>
                                <Button onClick={handleCreateClass} disabled={creating || !newClassName.trim()} className="flex-1 bg-blue-600 hover:bg-blue-700">
                                    {creating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tạo lớp"}
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Class List */}
                    <div className="lg:col-span-1 space-y-3">
                        <h2 className="font-semibold text-slate-700 text-sm uppercase tracking-wide">
                            Danh sách lớp ({classes.length})
                        </h2>
                        {loading ? (
                            <div className="flex items-center justify-center py-10"><Loader2 className="animate-spin h-6 w-6 text-blue-600" /></div>
                        ) : classes.length === 0 ? (
                            <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-8 text-center">
                                <GraduationCap className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                <p className="text-slate-500 text-sm">Chưa có lớp nào.</p>
                                <button onClick={() => setShowCreateForm(true)} className="text-blue-600 text-sm font-medium mt-2 hover:underline">+ Tạo lớp đầu tiên</button>
                            </div>
                        ) : (
                            classes.map(cls => (
                                <div key={cls.id}
                                    onClick={() => setActiveClass(cls)}
                                    className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${activeClass?.id === cls.id ? "border-blue-500 shadow-md" : "border-slate-200 hover:border-blue-200"}`}
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-slate-900 truncate">{cls.name}</h3>
                                            {cls.description && <p className="text-xs text-slate-500 mt-0.5 truncate">{cls.description}</p>}
                                            <div className="flex items-center gap-3 mt-2 text-xs text-slate-500">
                                                <span className="flex items-center gap-1"><Users className="h-3 w-3" /> {cls._count.members} học sinh</span>
                                                <span className="flex items-center gap-1">
                                                    <QrCode className="h-3 w-3" />
                                                    <span className="font-mono font-bold text-blue-600">{cls.inviteCode}</span>
                                                </span>
                                            </div>
                                        </div>
                                        <ChevronRight className={`h-4 w-4 shrink-0 transition-transform ${activeClass?.id === cls.id ? "rotate-90 text-blue-600" : "text-slate-400"}`} />
                                    </div>
                                </div>
                            ))
                        )}
                    </div>

                    {/* Class Detail */}
                    <div className="lg:col-span-2">
                        {!activeClass ? (
                            <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
                                <BookOpen className="h-12 w-12 text-slate-200 mx-auto mb-3" />
                                <p className="text-slate-400">Chọn một lớp để xem chi tiết</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {/* Class Info Card */}
                                <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                    <div className="flex items-start justify-between">
                                        <div>
                                            <h2 className="text-xl font-bold text-slate-900">{activeClass.name}</h2>
                                            {activeClass.description && <p className="text-slate-500 text-sm mt-1">{activeClass.description}</p>}
                                        </div>
                                        <button onClick={() => handleDeleteClass(activeClass.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                                        <p className="text-xs text-blue-600 font-medium mb-1">🔑 Mã mời vào lớp</p>
                                        <div className="flex items-center gap-3">
                                            <span className="text-3xl font-black text-blue-700 font-mono tracking-widest">{activeClass.inviteCode}</span>
                                            <button onClick={() => copyCode(activeClass.inviteCode)}
                                                className="flex items-center gap-1 text-xs text-blue-600 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors">
                                                {copiedCode === activeClass.inviteCode ? <><Check className="h-3 w-3" /> Đã copy</> : <><Copy className="h-3 w-3" /> Copy</>}
                                            </button>
                                        </div>
                                        <p className="text-xs text-blue-500 mt-1">Chia sẻ mã này cho học sinh để vào lớp</p>
                                    </div>
                                </div>

                                {/* Pending Requests */}
                                {pending.length > 0 && (
                                    <div className="bg-white rounded-2xl border border-amber-200 p-6">
                                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Clock className="h-4 w-4 text-amber-500" />
                                            Chờ duyệt ({pending.length})
                                        </h3>
                                        <div className="space-y-3">
                                            {pending.map(m => (
                                                <div key={m.id} className="flex items-center justify-between p-3 bg-amber-50 rounded-xl">
                                                    <div>
                                                        <p className="font-semibold text-sm text-slate-900">{m.user.name || "Học sinh"}</p>
                                                        <p className="text-xs text-slate-500">{m.user.email}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => handleMemberAction(m.id, "APPROVED")}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 text-white text-xs rounded-lg hover:bg-emerald-700 font-medium">
                                                            <Check className="h-3 w-3" /> Duyệt
                                                        </button>
                                                        <button onClick={() => handleMemberAction(m.id, "REJECTED")}
                                                            className="flex items-center gap-1 px-3 py-1.5 bg-red-500 text-white text-xs rounded-lg hover:bg-red-600 font-medium">
                                                            <X className="h-3 w-3" /> Từ chối
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Approved Students */}
                                <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                    <div className="p-4 border-b border-slate-100 flex items-center justify-between">
                                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                            <Users className="h-4 w-4 text-blue-600" />
                                            Học sinh ({approved.length})
                                        </h3>
                                    </div>
                                    {approved.length === 0 ? (
                                        <div className="p-8 text-center text-slate-400 text-sm">Chưa có học sinh nào được duyệt.</div>
                                    ) : (
                                        <div className="overflow-x-auto">
                                            <table className="w-full text-sm">
                                                <thead className="bg-slate-50 text-slate-600 text-xs uppercase">
                                                    <tr>
                                                        <th className="px-4 py-3 text-left">Học sinh</th>
                                                        <th className="px-4 py-3 text-center">Tier</th>
                                                        <th className="px-4 py-3 text-center"><Flame className="h-3 w-3 inline" /> Streak</th>
                                                        <th className="px-4 py-3 text-center">Bài đã làm</th>
                                                        <th className="px-4 py-3 text-center"><Trophy className="h-3 w-3 inline" /> Band</th>
                                                        <th className="px-4 py-3 text-right">Thao tác</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-slate-100">
                                                    {approved.map(m => (
                                                        <tr key={m.id} className="hover:bg-slate-50/50">
                                                            <td className="px-4 py-3">
                                                                <p className="font-semibold text-slate-900">{m.user.name || "—"}</p>
                                                                <p className="text-xs text-slate-500">{m.user.email}</p>
                                                            </td>
                                                            <td className="px-4 py-3 text-center">
                                                                <span className={`px-2 py-0.5 rounded-md text-xs font-bold ${tierColor[m.user.tier] || "bg-slate-100 text-slate-600"}`}>{m.user.tier}</span>
                                                            </td>
                                                            <td className="px-4 py-3 text-center font-bold text-orange-500">{m.user.currentStreak}</td>
                                                            <td className="px-4 py-3 text-center text-slate-700">{m.user.lifetimePracticeCount}</td>
                                                            <td className="px-4 py-3 text-center font-bold text-blue-600">{m.user.estimatedBand ?? "—"}</td>
                                                            <td className="px-4 py-3 text-right">
                                                                <button onClick={() => handleDeleteMember(m.id)}
                                                                    className="p-1.5 text-red-400 hover:bg-red-50 rounded-lg transition-colors">
                                                                    <Trash2 className="h-4 w-4" />
                                                                </button>
                                                            </td>
                                                        </tr>
                                                    ))}
                                                </tbody>
                                            </table>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
