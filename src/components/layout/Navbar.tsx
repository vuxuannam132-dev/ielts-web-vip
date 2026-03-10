"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { BrainCircuit, LayoutDashboard, LogOut, User, ChevronDown, Shield, Menu, X, Zap, GraduationCap, BookOpen, Loader2 } from 'lucide-react';
import { BugReportButton } from './BugReportButton';

function JoinClassModal({ onClose }: { onClose: () => void }) {
    const [code, setCode] = useState("");
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{ ok: boolean; msg: string } | null>(null);

    const handleJoin = async () => {
        if (!code.trim()) return;
        setLoading(true); setResult(null);
        const res = await fetch("/api/teacher/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ inviteCode: code.trim().toUpperCase() }) });
        const data = await res.json();
        setResult({ ok: res.ok, msg: res.ok ? `✅ Đã gửi yêu cầu vào lớp "${data.className}"! Đợi giáo viên duyệt.` : `❌ ${data.error}` });
        setLoading(false);
    };

    return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold flex items-center gap-2"><GraduationCap className="h-5 w-5 text-blue-600" /> Tham gia lớp học</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg"><X className="h-4 w-4 text-slate-400" /></button>
                </div>
                <p className="text-sm text-slate-500 mb-4">Nhập mã mời từ giáo viên của bạn.</p>
                <input autoFocus value={code} onChange={e => setCode(e.target.value.toUpperCase())} onKeyDown={e => e.key === "Enter" && handleJoin()}
                    placeholder="Mã mời (VD: AB3X9Z)" maxLength={10}
                    className="w-full border-2 border-slate-200 rounded-xl px-4 py-3 text-lg font-mono font-bold tracking-widest text-center focus:border-blue-500 outline-none mb-3" />
                {result && <p className={`text-sm mb-3 ${result.ok ? "text-emerald-600" : "text-red-500"}`}>{result.msg}</p>}
                <div className="flex gap-2">
                    <button onClick={onClose} className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50">Đóng</button>
                    <button onClick={handleJoin} disabled={loading || !code.trim()} className="flex-1 px-4 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2">
                        {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Tham gia"}
                    </button>
                </div>
            </div>
        </div>
    );
}

export function Navbar() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [showJoinModal, setShowJoinModal] = useState(false);
    const [studentClasses, setStudentClasses] = useState<any[]>([]);

    const user = session?.user as { name?: string; email?: string; role?: string; tier?: string } | undefined;

    const tierBadge: Record<string, { label: string; cls: string }> = {
        FREE: { label: 'Free', cls: 'bg-slate-100 text-slate-600' },
        PRO: { label: 'Pro', cls: 'bg-blue-100 text-blue-700' },
        PREMIUM: { label: 'Premium', cls: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' },
        EDU: { label: 'EDU', cls: 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white' },
        TEACHER: { label: 'Teacher', cls: 'bg-gradient-to-r from-violet-600 to-purple-600 text-white' },
    };
    const badge = tierBadge[user?.tier ?? 'FREE'] || tierBadge['FREE'];

    // For STUDENT role, fetch their classes to show shortcuts
    useEffect(() => {
        if (user?.role === 'STUDENT') {
            fetch("/api/student/classes").then(r => r.json()).then(data => { if (Array.isArray(data)) setStudentClasses(data.slice(0, 3)); }).catch(() => { });
        }
    }, [user?.role]);

    const isStudentOrUser = user?.role === 'USER' || user?.role === 'STUDENT';

    return (
        <>
            {showJoinModal && <JoinClassModal onClose={() => setShowJoinModal(false)} />}
            <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">

                    {/* Logo */}
                    <Link href="/" className="flex items-center gap-2">
                        <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                            <BrainCircuit className="h-5 w-5 text-white" />
                        </div>
                        <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                            IELTS SKIBIDI
                        </span>
                    </Link>

                    {/* Desktop nav */}
                    <nav className="hidden md:flex items-center gap-5">
                        {session ? (
                            <>
                                <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                                </Link>

                                {/* STUDENT: show class shortcuts */}
                                {user?.role === 'STUDENT' && studentClasses.length > 0 && (
                                    <div className="relative group">
                                        <button className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-emerald-600 transition-colors">
                                            <GraduationCap className="h-4 w-4" /> Lớp học <ChevronDown className="h-3 w-3" />
                                        </button>
                                        <div className="absolute left-0 top-full mt-1 w-56 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50 hidden group-hover:block">
                                            {studentClasses.map((m: any) => (
                                                <Link key={m.id} href="/student/classes"
                                                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition">
                                                    <BookOpen className="h-4 w-4 text-emerald-600" />
                                                    <div>
                                                        <p className="font-semibold leading-none">{m.class.name}</p>
                                                        <p className="text-xs text-slate-400">{m.class.teacher.name}</p>
                                                    </div>
                                                </Link>
                                            ))}
                                            <Link href="/student/classes" className="flex items-center gap-2 px-4 py-2 text-xs text-blue-600 hover:bg-blue-50 border-t border-slate-100 mt-1">
                                                Xem tất cả lớp →
                                            </Link>
                                        </div>
                                    </div>
                                )}

                                {/* Regular user: show "Tham gia lớp" button */}
                                {isStudentOrUser && studentClasses.length === 0 && (
                                    <button onClick={() => setShowJoinModal(true)}
                                        className="flex items-center gap-1.5 text-sm font-medium text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 px-2.5 py-1.5 rounded-lg transition-colors border border-emerald-200">
                                        <GraduationCap className="h-4 w-4" /> Tham gia lớp
                                    </button>
                                )}

                                {user?.role === 'ADMIN' && (
                                    <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                                        <Shield className="h-4 w-4" /> Admin
                                    </Link>
                                )}
                                {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                                    <Link href="/teacher" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                                        <GraduationCap className="h-4 w-4" /> Lớp học
                                    </Link>
                                )}
                                <BugReportButton />

                                {/* User dropdown */}
                                <div className="relative">
                                    <button onClick={() => setDropdownOpen(!dropdownOpen)} className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors">
                                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                            {user?.name?.[0]?.toUpperCase() ?? 'U'}
                                        </div>
                                        <div className="text-left hidden lg:block">
                                            <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
                                            <span className={`text-xs font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block ${badge?.cls}`}>{badge?.label}</span>
                                        </div>
                                        <ChevronDown className="h-4 w-4 text-slate-400" />
                                    </button>

                                    {dropdownOpen && (
                                        <>
                                            <div className="fixed inset-0" onClick={() => setDropdownOpen(false)} />
                                            <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                                                <div className="px-4 py-2 border-b border-slate-100">
                                                    <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                                                    <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                                    {user?.role && user.role !== 'USER' && (
                                                        <span className="text-xs font-bold text-blue-600 uppercase">{user.role}</span>
                                                    )}
                                                </div>
                                                <Link href="/account" onClick={() => setDropdownOpen(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                                                    <User className="h-4 w-4" /> Tài khoản
                                                </Link>
                                                {user?.role === 'STUDENT' && (
                                                    <Link href="/student/classes" onClick={() => setDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-emerald-700 hover:bg-emerald-50 transition">
                                                        <GraduationCap className="h-4 w-4" /> Lớp học của tôi
                                                    </Link>
                                                )}
                                                {isStudentOrUser && (
                                                    <button onClick={() => { setDropdownOpen(false); setShowJoinModal(true); }}
                                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:bg-blue-50 transition font-medium">
                                                        <GraduationCap className="h-4 w-4" /> Tham gia lớp học
                                                    </button>
                                                )}
                                                {user?.tier === 'FREE' && (
                                                    <Link href="/#pricing" onClick={() => setDropdownOpen(false)}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition font-medium">
                                                        <Zap className="h-4 w-4" /> Nâng cấp VIP
                                                    </Link>
                                                )}
                                                <button onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: '/' }); }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition">
                                                    <LogOut className="h-4 w-4" /> Đăng xuất
                                                </button>
                                            </div>
                                        </>
                                    )}
                                </div>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Đăng nhập</Link>
                                <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
                                    Bắt đầu miễn phí
                                </Link>
                            </>
                        )}
                    </nav>

                    {/* Mobile hamburger */}
                    <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>
                        {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                    </button>
                </div>

                {/* Mobile menu */}
                {menuOpen && (
                    <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
                        {session ? (
                            <>
                                <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                                    <LayoutDashboard className="h-4 w-4" /> Dashboard
                                </Link>
                                {user?.role === 'STUDENT' && (
                                    <Link href="/student/classes" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-emerald-700 hover:bg-emerald-50" onClick={() => setMenuOpen(false)}>
                                        <GraduationCap className="h-4 w-4" /> Lớp học của tôi
                                    </Link>
                                )}
                                {isStudentOrUser && (
                                    <button onClick={() => { setMenuOpen(false); setShowJoinModal(true); }} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 hover:bg-blue-50">
                                        <GraduationCap className="h-4 w-4" /> Tham gia lớp học
                                    </button>
                                )}
                                {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                                    <Link href="/teacher" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                                        <GraduationCap className="h-4 w-4" /> Lớp học
                                    </Link>
                                )}
                                <Link href="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                                    <User className="h-4 w-4" /> Tài khoản
                                </Link>
                                {user?.tier === 'FREE' && (
                                    <Link href="/#pricing" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50" onClick={() => setMenuOpen(false)}>
                                        <Zap className="h-4 w-4" /> Nâng cấp VIP 🔥
                                    </Link>
                                )}
                                <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                                    <LogOut className="h-4 w-4" /> Đăng xuất
                                </button>
                            </>
                        ) : (
                            <>
                                <Link href="/login" className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>
                                <Link href="/register" className="block px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white text-center" onClick={() => setMenuOpen(false)}>Bắt đầu miễn phí</Link>
                            </>
                        )}
                    </div>
                )}
            </header>
        </>
    );
}
