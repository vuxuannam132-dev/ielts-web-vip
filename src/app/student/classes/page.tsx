"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import {
    GraduationCap, BookOpen, Loader2, Calendar, Clock, Headphones,
    PenTool, Mic, Users, ChevronRight, CheckCircle2
} from "lucide-react";

const skillIcons: Record<string, any> = {
    LISTENING: Headphones,
    READING: BookOpen,
    WRITING: PenTool,
    SPEAKING: Mic,
};

const skillColors: Record<string, string> = {
    LISTENING: "text-orange-600 bg-orange-50",
    READING: "text-blue-600 bg-blue-50",
    WRITING: "text-purple-600 bg-purple-50",
    SPEAKING: "text-emerald-600 bg-emerald-50",
};

export default function StudentClassesPage() {
    const { data: session, status } = useSession();
    const user = session?.user as any;
    const [memberships, setMemberships] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeClass, setActiveClass] = useState<any>(null);

    useEffect(() => {
        if (status === "authenticated") {
            fetch("/api/student/classes")
                .then(r => r.json())
                .then(data => { if (Array.isArray(data)) { setMemberships(data); if (data.length) setActiveClass(data[0]); } })
                .finally(() => setLoading(false));
        }
    }, [status]);

    if (status === "loading" || loading) {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex items-center gap-3 mb-8">
                    <div className="h-12 w-12 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center shadow-md">
                        <GraduationCap className="h-6 w-6 text-white" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Lớp học của tôi</h1>
                        <p className="text-slate-500 text-sm">Xem bài tập và tiến độ từ giáo viên</p>
                    </div>
                </div>

                {memberships.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-16 text-center">
                        <GraduationCap className="h-14 w-14 text-slate-200 mx-auto mb-4" />
                        <h2 className="text-xl font-bold text-slate-700 mb-2">Bạn chưa trong lớp nào</h2>
                        <p className="text-slate-500 text-sm mb-6">Nhờ giáo viên thêm bạn vào lớp hoặc nhập mã mời từ giáo viên.</p>
                        <Link href="/dashboard" className="text-blue-600 text-sm font-medium hover:underline">← Quay về Dashboard</Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Class List */}
                        <div className="space-y-3">
                            <h2 className="font-semibold text-slate-600 text-xs uppercase tracking-wide">Danh sách lớp ({memberships.length})</h2>
                            {memberships.map(m => (
                                <div key={m.id}
                                    onClick={() => setActiveClass(m)}
                                    className={`bg-white rounded-xl border-2 p-4 cursor-pointer transition-all ${activeClass?.id === m.id ? "border-emerald-500 shadow-md" : "border-slate-200 hover:border-emerald-200"}`}>
                                    <h3 className="font-bold text-slate-900">{m.class.name}</h3>
                                    <p className="text-xs text-slate-500 mt-1">👨‍🏫 {m.class.teacher.name || m.class.teacher.email}</p>
                                    <div className="flex items-center justify-between mt-2 text-xs text-slate-400">
                                        <span><Users className="h-3 w-3 inline mr-1" />{m.class._count.members} thành viên</span>
                                        <span>{m.class.assignments.length} bài tập</span>
                                    </div>
                                    <ChevronRight className={`h-4 w-4 mt-2 transition-transform ${activeClass?.id === m.id ? "text-emerald-600 rotate-90" : "text-slate-300"}`} />
                                </div>
                            ))}
                        </div>

                        {/* Class Detail */}
                        <div className="lg:col-span-2">
                            {activeClass && (
                                <div className="space-y-4">
                                    {/* Class Info */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-6">
                                        <h2 className="text-xl font-bold text-slate-900">{activeClass.class.name}</h2>
                                        {activeClass.class.description && <p className="text-slate-500 text-sm mt-1">{activeClass.class.description}</p>}
                                        <div className="flex items-center gap-4 mt-3 text-sm text-slate-600">
                                            <span>👨‍🏫 Giáo viên: <strong>{activeClass.class.teacher.name}</strong></span>
                                            <span><Users className="h-4 w-4 inline" /> {activeClass.class._count.members} học sinh</span>
                                        </div>
                                        <div className="mt-3 px-4 py-2 bg-emerald-50 rounded-xl inline-flex items-center gap-2 text-xs text-emerald-700 font-semibold">
                                            <CheckCircle2 className="h-4 w-4" /> Bạn đang là thành viên của lớp này
                                        </div>
                                    </div>

                                    {/* Assignments */}
                                    <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                                        <div className="p-4 border-b border-slate-100">
                                            <h3 className="font-bold text-slate-900 flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-blue-600" />
                                                Bài tập được giao ({activeClass.class.assignments.length})
                                            </h3>
                                        </div>
                                        {activeClass.class.assignments.length === 0 ? (
                                            <div className="p-8 text-center text-slate-400 text-sm">Giáo viên chưa giao bài tập nào.</div>
                                        ) : (
                                            <div className="divide-y divide-slate-100">
                                                {activeClass.class.assignments.map((a: any) => {
                                                    const SkillIcon = a.skill ? skillIcons[a.skill] : BookOpen;
                                                    const skillCls = a.skill ? skillColors[a.skill] : "text-blue-600 bg-blue-50";
                                                    return (
                                                        <div key={a.id} className="p-4">
                                                            <div className="flex items-start gap-3">
                                                                <div className={`h-9 w-9 rounded-xl flex items-center justify-center ${skillCls}`}>
                                                                    <SkillIcon className="h-4 w-4" />
                                                                </div>
                                                                <div className="flex-1">
                                                                    <h4 className="font-semibold text-slate-900">{a.title}</h4>
                                                                    {a.description && <p className="text-sm text-slate-500 mt-0.5">{a.description}</p>}
                                                                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-400">
                                                                        {a.skill && <span className={`px-2 py-0.5 rounded-md font-bold ${skillCls}`}>{a.skill}</span>}
                                                                        {a.dueDate && (
                                                                            <span className="flex items-center gap-1">
                                                                                <Calendar className="h-3 w-3" />
                                                                                Hạn: {new Date(a.dueDate).toLocaleDateString("vi-VN")}
                                                                            </span>
                                                                        )}
                                                                        <span className="flex items-center gap-1">
                                                                            <Clock className="h-3 w-3" />
                                                                            {new Date(a.createdAt).toLocaleDateString("vi-VN")}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                                {a.skill && (
                                                                    <Link href={`/dashboard/practice/${a.skill.toLowerCase()}`}
                                                                        className="shrink-0 text-xs font-semibold text-blue-600 hover:underline px-3 py-1.5 bg-blue-50 rounded-lg hover:bg-blue-100">
                                                                        Làm bài →
                                                                    </Link>
                                                                )}
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Practice Links */}
                                    <div className="bg-white rounded-2xl border border-slate-200 p-5">
                                        <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
                                            <Mic className="h-4 w-4 text-emerald-600" /> Luyện tập (không giới hạn)
                                        </h3>
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { href: "/dashboard/practice/listening", icon: Headphones, label: "Listening", color: "orange" },
                                                { href: "/dashboard/practice/reading", icon: BookOpen, label: "Reading", color: "blue" },
                                                { href: "/dashboard/practice/writing", icon: PenTool, label: "Writing", color: "purple" },
                                                { href: "/dashboard/practice/speaking", icon: Mic, label: "Speaking", color: "emerald" },
                                            ].map(s => (
                                                <Link key={s.href} href={s.href}
                                                    className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50 transition-all group">
                                                    <s.icon className="h-5 w-5 text-slate-500 group-hover:text-emerald-600" />
                                                    <span className="font-semibold text-sm text-slate-700 group-hover:text-emerald-700">{s.label}</span>
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
