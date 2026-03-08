"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
    BookOpen, Headphones, PenTool, Mic,
    Flame, Trophy, Target, Zap, CheckCircle2,
    Calendar, LayoutDashboard, Settings, Edit2, Star,
    ArrowRight, AlertCircle, Loader2, Clock
} from "lucide-react";
import { getDailyMissions } from "@/lib/missions";
import OnboardingModal from "@/components/OnboardingModal";

const skillRoutes: Record<string, string> = {
    "Listening": "/dashboard/practice/listening",
    "Reading": "/dashboard/practice/reading",
    "Writing": "/dashboard/practice/writing",
    "Speaking": "/dashboard/practice/speaking",
    "LISTENING": "/dashboard/practice/listening",
    "READING": "/dashboard/practice/reading",
    "WRITING": "/dashboard/practice/writing",
    "SPEAKING": "/dashboard/practice/speaking",
};

function getMissionRoute(missionTitle: string): string {
    const title = missionTitle.toLowerCase();
    if (title.includes("listen") || title.includes("nghe")) return "/dashboard/practice/listening";
    if (title.includes("read") || title.includes("đọc")) return "/dashboard/practice/reading";
    if (title.includes("writ") || title.includes("viết") || title.includes("essay")) return "/dashboard/practice/writing";
    if (title.includes("speak") || title.includes("nói") || title.includes("phát âm")) return "/dashboard/practice/speaking";
    return "/dashboard";
}

function SidebarLink({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) {
    return (
        <Link href={href}
            className={`flex items-center gap-3 px-4 py-2.5 text-sm font-medium rounded-xl transition-all ${active ? "bg-blue-50 text-blue-700 font-semibold" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"}`}>
            <Icon className={`h-4 w-4 ${active ? "text-blue-600" : ""}`} />
            {label}
        </Link>
    );
}

function DashboardContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const user = session?.user as any;

    const rank = user?.tier || "FREE";
    const name = user?.name?.split(" ")[0] || "Học viên";

    const [stats, setStats] = useState<any>({ targetBand: null, lifetimePracticeCount: 0, currentStreak: 0, estimatedBand: null, onboardingDone: false, completedSkills: [] as string[] });
    const [loadingStats, setLoadingStats] = useState(true);
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [newTarget, setNewTarget] = useState("");
    const [missions, setMissions] = useState<any[]>([]);
    const [completedMissions, setCompletedMissions] = useState<number[]>([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showBandReminder, setShowBandReminder] = useState(false);
    const [showOnboarding, setShowOnboarding] = useState(false);

    useEffect(() => {
        if (searchParams.get("upgraded") === "true") {
            const duration = 3 * 1000;
            const end = Date.now() + duration;
            const frame = () => {
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ["#3b82f6", "#10b981", "#f59e0b"] });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ["#3b82f6", "#10b981", "#f59e0b"] });
                if (Date.now() < end) requestAnimationFrame(frame);
            };
            frame();
            setShowUpgradeModal(true);
            window.history.replaceState({}, "", "/dashboard");
        }
    }, [searchParams]);

    useEffect(() => {
        if (!user?.id) return;
        fetch("/api/user/stats").then(r => r.json()).then(data => {
            if (data && !data.error) {
                setStats(data);
                setNewTarget(data.targetBand?.toString() || "");

                // Show onboarding if not done
                if (!data.onboardingDone) {
                    setShowOnboarding(true);
                } else {
                    // Check band reminder (after 2 days, if <4 skills done, only show once)
                    const coveredSkills = data.completedSkills || [];
                    if (!data.estimatedBand && coveredSkills.length < 4 && !data.bandReminderShown) {
                        const daysSinceJoin = data.createdAt
                            ? Math.floor((Date.now() - new Date(data.createdAt).getTime()) / (1000 * 60 * 60 * 24))
                            : 0;
                        if (daysSinceJoin >= 2) setShowBandReminder(true);
                    }
                }
            }
            setLoadingStats(false);
        }).catch(() => setLoadingStats(false));

        const daily = getDailyMissions(user.id);
        setMissions(daily);

        const todayStr = new Date().toDateString();
        const key = `missions_done_${user.id}_${todayStr}`;
        const stored = localStorage.getItem(key);
        if (stored) setCompletedMissions(JSON.parse(stored));
    }, [user?.id]);

    const saveTarget = async () => {
        const val = parseFloat(newTarget);
        if (isNaN(val) || val < 0.5 || val > 9.5) { setNewTarget(stats.targetBand?.toString() || ""); setIsEditingTarget(false); return; }
        const rounded = Math.round(val * 2) / 2;
        setStats((s: any) => ({ ...s, targetBand: rounded }));
        setIsEditingTarget(false);
        await fetch("/api/user/stats", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ targetBand: rounded }) });
    };

    const toggleMission = (id: number) => {
        const todayStr = new Date().toDateString();
        const key = `missions_done_${user?.id}_${todayStr}`;
        setCompletedMissions(prev => {
            const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            localStorage.setItem(key, JSON.stringify(next));
            return next;
        });
    };

    const dismissBandReminder = async () => {
        setShowBandReminder(false);
        await fetch("/api/user/stats", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ bandReminderShown: true }) });
    };

    const handleOnboardingComplete = (data: any) => {
        setShowOnboarding(false);
        setStats((s: any) => ({ ...s, targetBand: data.targetBand, currentBand: data.currentBand, onboardingDone: true }));
        setNewTarget(data.targetBand?.toString() || "");
    };

    const skillCards = [
        { href: "/dashboard/practice/listening", icon: Headphones, label: "Listening Practice", desc: "Luyện nghe với câu hỏi thực chiến", color: "orange" },
        { href: "/dashboard/practice/reading", icon: BookOpen, label: "Reading Practice", desc: "Luyện đọc đoạn văn dài và ngắn", color: "blue" },
        { href: "/dashboard/practice/writing", icon: PenTool, label: "Writing Practice", desc: "Chấm essay Task 1 & 2 với AI", color: "purple" },
        { href: "/dashboard/practice/speaking", icon: Mic, label: "Speaking Room", desc: "Ghi âm và nhận điểm phát âm", color: "green" },
    ];
    const colorMap: any = {
        orange: { bg: "bg-orange-50", text: "text-orange-600", badge: "bg-orange-100 text-orange-700", hover: "hover:border-orange-200" },
        blue: { bg: "bg-blue-50", text: "text-blue-600", badge: "bg-blue-100 text-blue-700", hover: "hover:border-blue-200" },
        purple: { bg: "bg-purple-50", text: "text-purple-600", badge: "bg-purple-100 text-purple-700", hover: "hover:border-purple-200" },
        green: { bg: "bg-emerald-50", text: "text-emerald-600", badge: "bg-emerald-100 text-emerald-700", hover: "hover:border-emerald-200" },
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50">
            {/* Onboarding Modal */}
            {showOnboarding && <OnboardingModal onComplete={handleOnboardingComplete} />}

            {/* Band reminder popup */}
            {showBandReminder && (
                <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
                        <div className="h-16 w-16 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-4">
                            <Trophy className="h-8 w-8 text-amber-500" />
                        </div>
                        <h3 className="font-bold text-lg text-slate-900 mb-2">Hãy làm đủ 4 kỹ năng!</h3>
                        <p className="text-slate-500 text-sm mb-5">Để chúng tôi ước tính band IELTS của bạn, hãy hoàn thành ít nhất 1 bài ở cả 4 kỹ năng: Listening, Reading, Writing, Speaking.</p>
                        <div className="grid grid-cols-2 gap-2 mb-5">
                            {["LISTENING", "READING", "WRITING", "SPEAKING"].map(s => {
                                const done = (stats.completedSkills || []).includes(s);
                                return (
                                    <div key={s} className={`flex items-center gap-2 p-2 rounded-lg text-xs font-semibold ${done ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>
                                        {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock className="h-4 w-4" />} {s}
                                    </div>
                                );
                            })}
                        </div>
                        <button onClick={dismissBandReminder} className="w-full bg-amber-500 hover:bg-amber-600 text-white font-bold py-2.5 rounded-xl transition">Đã hiểu, bắt đầu luyện!</button>
                    </div>
                </div>
            )}

            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 md:h-[calc(100vh-4rem)] md:sticky top-16 hidden md:flex md:flex-col">
                <div className="p-6 flex-1">
                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Luyện tập</h2>
                    <nav className="space-y-1">
                        <SidebarLink href="/dashboard" icon={LayoutDashboard} label="Tổng quan" active />
                        <SidebarLink href="/dashboard/practice/listening" icon={Headphones} label="Listening" />
                        <SidebarLink href="/dashboard/practice/reading" icon={BookOpen} label="Reading" />
                        <SidebarLink href="/dashboard/practice/writing" icon={PenTool} label="Writing" />
                        <SidebarLink href="/dashboard/practice/speaking" icon={Mic} label="Speaking" />
                    </nav>

                    <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 mt-8">Tài khoản</h2>
                    <nav className="space-y-1">
                        <SidebarLink href="/account" icon={Settings} label="Cài đặt tài khoản" />
                    </nav>
                </div>

                {/* VIP Upgrade button in sidebar */}
                {rank === "FREE" && (
                    <div className="p-4">
                        <Link href="/checkout?pkg=PRO"
                            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white text-sm font-bold shadow-md hover:shadow-lg hover:scale-[1.02] transition-all">
                            <Zap className="h-4 w-4" /> Nâng cấp VIP
                        </Link>
                    </div>
                )}
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-6xl mx-auto w-full">

                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chào mừng lại, {name} 👋</h1>
                        <p className="text-slate-500 mt-1">Hôm nay là cơ hội tuyệt vời để vượt band điểm hiện tại.</p>
                    </div>
                </div>

                {/* VIP Upsell Banner */}
                {rank === "FREE" && (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20" />
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Zap className="h-5 w-5 fill-white" /> Khai phá tối đa tiềm năng AI</h2>
                            <p className="text-orange-50 text-sm md:max-w-xl leading-relaxed">Bạn đang sử dụng gói Basic giới hạn lượt chấm IELTS Writing & Speaking. Nâng cấp để nhận feedback không giới hạn chuẩn examiner từ AI.</p>
                        </div>
                        <Link href="/checkout?pkg=PRO" className="shrink-0 bg-white text-orange-600 font-bold px-6 py-3 rounded-xl shadow-sm hover:scale-105 transition-transform relative z-10 w-full md:w-auto text-center">
                            Nâng cấp VIP ngay
                        </Link>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {/* Target Band */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 relative group">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-50"><Target className="h-6 w-6 text-blue-600" /></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-500">Mục tiêu</p>
                            {isEditingTarget ? (
                                <input autoFocus type="number" step="0.5" min="0.5" max="9.5"
                                    className="w-16 text-2xl font-extrabold text-slate-900 bg-slate-100 rounded px-1 outline-none"
                                    value={newTarget} onChange={e => setNewTarget(e.target.value)}
                                    onBlur={saveTarget} onKeyDown={e => e.key === "Enter" && saveTarget()} />
                            ) : (
                                <button onClick={() => setIsEditingTarget(true)} className="text-2xl font-extrabold text-slate-900 flex items-center gap-1 hover:text-blue-600 transition-colors">
                                    {stats.targetBand ?? "—"}
                                    <Edit2 className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 text-slate-400 transition-opacity" />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Streak */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-orange-50"><Flame className="h-6 w-6 text-orange-500" /></div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Streak</p>
                            <p className="text-2xl font-extrabold text-slate-900">{stats.currentStreak} <span className="text-sm font-medium text-slate-400">Ngày</span></p>
                        </div>
                    </div>

                    {/* Estimated Band */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-amber-50"><Trophy className="h-6 w-6 text-amber-500" /></div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Band Ước tính</p>
                            {loadingStats ? (
                                <div className="h-7 w-16 bg-slate-100 rounded animate-pulse mt-1" />
                            ) : stats.estimatedBand ? (
                                <p className="text-2xl font-extrabold text-slate-900">{stats.estimatedBand}</p>
                            ) : (
                                <div className="flex items-center gap-1.5">
                                    <p className="text-lg font-bold text-slate-400">?</p>
                                    <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                                        {(stats.completedSkills?.length || 0)}/4 skills
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Total exercises */}
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-emerald-50"><Star className="h-6 w-6 text-emerald-500" /></div>
                        <div>
                            <p className="text-sm font-semibold text-slate-500">Bài đã làm</p>
                            <p className="text-2xl font-extrabold text-slate-900">{stats.lifetimePracticeCount}</p>
                        </div>
                    </div>
                </div>

                {/* Skills + Daily Missions */}
                <div className="grid lg:grid-cols-3 gap-6">
                    {/* Skills */}
                    <div className="lg:col-span-2">
                        <h2 className="text-lg font-bold text-slate-900 mb-4">Luyện tập kỹ năng</h2>
                        <div className="grid sm:grid-cols-2 gap-4">
                            {skillCards.map(card => {
                                const c = colorMap[card.color];
                                return (
                                    <Link key={card.href} href={card.href}
                                        className={`bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md ${c.hover} transition-all group`}>
                                        <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${c.bg} mb-4`}>
                                            <card.icon className={`h-6 w-6 ${c.text}`} />
                                        </div>
                                        <h3 className="font-bold text-slate-900 mb-1">{card.label}</h3>
                                        <p className="text-sm text-slate-500">{card.desc}</p>
                                        <div className="mt-3 flex items-center gap-1 text-sm font-semibold text-slate-400 group-hover:text-slate-700 transition-colors">
                                            Bắt đầu <ArrowRight className="h-3.5 w-3.5" />
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    </div>

                    {/* Daily Missions */}
                    <div>
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" /> Nhiệm vụ hôm nay
                        </h2>
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 space-y-3">
                            {missions.map((m, i) => {
                                const done = completedMissions.includes(m.id);
                                const route = getMissionRoute(m.title);
                                return (
                                    <div key={m.id} className={`flex items-center gap-3 p-3 rounded-xl transition-all ${done ? "bg-emerald-50" : "bg-slate-50"}`}>
                                        <button onClick={() => toggleMission(m.id)}
                                            className={`h-5 w-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${done ? "bg-emerald-500 border-emerald-500" : "border-slate-300 hover:border-emerald-400"}`}>
                                            {done && <CheckCircle2 className="h-3 w-3 text-white" />}
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-semibold ${done ? "line-through text-slate-400" : "text-slate-700"}`}>{m.title}</p>
                                            <p className="text-xs text-slate-400">{m.xp} ph</p>
                                        </div>
                                        {!done && (
                                            <Link href={route}
                                                className="text-xs font-bold text-blue-600 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg flex items-center gap-1 transition-colors whitespace-nowrap">
                                                Làm ngay <ArrowRight className="h-3 w-3" />
                                            </Link>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </main>

            {/* VIP Upgrade Modal */}
            {showUpgradeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4" onClick={() => setShowUpgradeModal(false)}>
                    <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full text-center" onClick={e => e.stopPropagation()}>
                        <div className="text-6xl mb-4">🏆</div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Chào mừng VIP!</h2>
                        <p className="text-slate-500 mb-6">Tài khoản của bạn đã được nâng cấp. Hãy tận hưởng trải nghiệm học IELTS đỉnh cao!</p>
                        <button onClick={() => setShowUpgradeModal(false)} className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition-all">
                            Bắt đầu luyện tập! 🚀
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-[calc(100vh-4rem)] flex items-center justify-center"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>}>
            <DashboardContent />
        </Suspense>
    );
}
