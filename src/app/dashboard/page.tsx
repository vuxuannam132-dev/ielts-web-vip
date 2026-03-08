"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";
import {
    BookOpen, Headphones, PenTool, Mic,
    Flame, Trophy, Target, Zap, CheckCircle2,
    Calendar, LayoutDashboard, TrendingUp, Settings, Edit2
} from "lucide-react";
import { getDailyMissions } from "@/lib/missions";

function DashboardContent() {
    const { data: session } = useSession();
    const searchParams = useSearchParams();
    const user = session?.user;

    const rank = (user as any)?.tier || "FREE";
    const name = user?.name?.split(" ")[0] || "Học viên";

    const [stats, setStats] = useState({ targetBand: null as number | null, lifetimePracticeCount: 0, currentStreak: 0 });
    const [isEditingTarget, setIsEditingTarget] = useState(false);
    const [newTarget, setNewTarget] = useState("");

    const [missions, setMissions] = useState<any[]>([]);
    const [completedMissions, setCompletedMissions] = useState<number[]>([]);
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);

    useEffect(() => {
        if (searchParams.get("upgraded") === "true") {
            const duration = 3 * 1000;
            const end = Date.now() + duration;

            const frame = () => {
                confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 }, colors: ['#3b82f6', '#10b981', '#f59e0b'] });
                confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 }, colors: ['#3b82f6', '#10b981', '#f59e0b'] });
                if (Date.now() < end) { requestAnimationFrame(frame); }
            };
            frame();
            setShowUpgradeModal(true);
            window.history.replaceState({}, '', '/dashboard');
        }
    }, [searchParams]);

    useEffect(() => {
        if (!user?.id) return;

        fetch('/api/user/stats').then(res => res.json()).then(data => {
            if (data && !data.error) {
                setStats(data);
                setNewTarget(data.targetBand?.toString() || "");
            }
        });

        const daily = getDailyMissions(user.id);
        setMissions(daily);

        const todayStr = new Date().toDateString();
        const storedKey = `missions_done_${user.id}_${todayStr}`;
        const stored = localStorage.getItem(storedKey);
        if (stored) setCompletedMissions(JSON.parse(stored));
    }, [user?.id]);

    const saveTarget = async () => {
        setIsEditingTarget(false);
        const val = parseFloat(newTarget);
        if (isNaN(val)) return;
        setStats(s => ({ ...s, targetBand: val }));
        await fetch('/api/user/stats', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ targetBand: val })
        });
    };

    const toggleMission = (id: number) => {
        const todayStr = new Date().toDateString();
        const storedKey = `missions_done_${user?.id}_${todayStr}`;
        setCompletedMissions(prev => {
            const next = prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
            localStorage.setItem(storedKey, JSON.stringify(next));
            return next;
        });
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50">
            {/* Sidebar Navigation */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200 md:h-[calc(100vh-4rem)] md:sticky top-16 hidden md:block">
                <div className="p-6">
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
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-10 space-y-8 max-w-6xl mx-auto w-full">

                {/* Header Welcome */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Chào mừng lại, {name} 👋</h1>
                        <p className="text-slate-500 mt-1">Hôm nay là cơ hội tuyệt vời để vượt band điểm hiện tại.</p>
                    </div>
                </div>

                {/* VIP Upsell Banner */}
                {rank === "FREE" && (
                    <div className="bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 rounded-2xl p-6 text-white shadow-lg shadow-orange-500/20 flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                        <div className="absolute right-0 top-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -mr-20 -mt-20"></div>
                        <div className="relative z-10">
                            <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><Zap className="h-5 w-5 fill-white" /> Khai phá tối đa tiềm năng AI</h2>
                            <p className="text-orange-50 text-sm md:max-w-xl leading-relaxed">Bạn đang sử dụng gói Basic giới hạn lượt chấm IELTS Writing & Speaking. Nâng cấp để nhận feedback không giới hạn chuẩn examiner từ AI.</p>
                        </div>
                        <Link href="/#pricing" className="shrink-0 bg-white text-orange-600 font-bold px-6 py-3 rounded-xl shadow-sm hover:scale-105 transition-transform relative z-10 w-full md:w-auto text-center">
                            Nâng cấp VIP ngay
                        </Link>
                    </div>
                )}

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4 relative group">
                        <div className="h-12 w-12 rounded-xl flex items-center justify-center bg-blue-50"><Target className="h-6 w-6 text-blue-600" /></div>
                        <div className="flex-1">
                            <p className="text-sm font-semibold text-slate-500">Mục tiêu</p>
                            {isEditingTarget ? (
                                <input
                                    autoFocus
                                    type="number" step="0.5" className="w-16 text-2xl font-extrabold text-slate-900 bg-slate-100 rounded px-1 outline-none"
                                    value={newTarget} onChange={e => setNewTarget(e.target.value)}
                                    onBlur={saveTarget} onKeyDown={e => e.key === 'Enter' && saveTarget()}
                                />
                            ) : (
                                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setIsEditingTarget(true)}>
                                    <p className="text-2xl font-extrabold text-slate-900">{stats.targetBand || "N/A"}</p>
                                    <Edit2 className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition" />
                                </div>
                            )}
                        </div>
                    </div>
                    <StatCard icon={Flame} title="Streak" value={`${stats.currentStreak} Ngày`} color="text-orange-500" bg="bg-orange-50" />
                    <StatCard icon={Trophy} title="Band Ước tính" value={stats.targetBand ? Math.max(0, stats.targetBand - 1.5).toString() : "N/A"} color="text-amber-500" bg="bg-amber-50" />
                    <StatCard icon={TrendingUp} title="Bài đã làm" value={stats.lifetimePracticeCount.toString()} color="text-emerald-600" bg="bg-emerald-50" />
                </div>

                {/* VIP UPGRADE CELEBRATION MODAL */}
                {showUpgradeModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4">
                        <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl transform animate-in zoom-in-95 duration-300 text-center relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-br from-amber-400 to-amber-600 -z-0"></div>
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto shadow-lg mb-6 relative z-10">
                                <Trophy className="h-10 w-10 text-amber-500" />
                            </div>
                            <h2 className="text-2xl font-black text-slate-900 mb-2 relative z-10">Chúc mừng bạn!</h2>
                            <p className="text-slate-600 mb-6 font-medium relative z-10">Tài khoản của bạn đã được nâng cấp lên hạng VIP. Hệ thống đã mở khóa toàn bộ kho đề đặc quyền cho bạn.</p>
                            <button onClick={() => setShowUpgradeModal(false)} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition relative z-10 border-2 border-slate-900 hover:border-slate-800 focus:ring-4 focus:ring-slate-200">
                                Bắt đầu ôn thi ngay
                            </button>
                        </div>
                    </div>
                )
                }

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Skills Quick Access */}
                    <div className="lg:col-span-2 space-y-6">
                        <h2 className="text-xl font-bold text-slate-900 border-b border-slate-200 pb-2">Luyện tập kỹ năng</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            <SkillCard href="/dashboard/practice/writing" icon={PenTool} title="Writing Practice" desc="Chấm essay Task 1 & 2 với AI" color="indigo" />
                            <SkillCard href="/dashboard/practice/speaking" icon={Mic} title="Speaking Room" desc="Ghi âm và nhận điểm phát âm" color="emerald" />
                            <SkillCard href="/dashboard/practice/reading" icon={BookOpen} title="Reading Tests" desc="Làm đề thi thật trực tuyến" color="blue" />
                            <SkillCard href="/dashboard/practice/listening" icon={Headphones} title="Listening Tests" desc="Nghe và điền đáp án tự động" color="amber" />
                        </div>
                    </div>

                    {/* Daily Recommendations */}
                    <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 lg:h-[fit-content]">
                        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                            <Calendar className="h-5 w-5 text-blue-600" /> Nhiệm vụ hôm nay
                        </h2>
                        <div className="space-y-4">
                            {missions.map(m => (
                                <TaskItem
                                    key={m.id}
                                    title={m.title}
                                    time={m.time}
                                    done={completedMissions.includes(m.id)}
                                    onClick={() => toggleMission(m.id)}
                                />
                            ))}
                            {missions.length === 0 && <p className="text-sm text-slate-500">Đang tải nhiệm vụ...</p>}
                        </div>
                        <div className="mt-8 bg-blue-50 rounded-xl p-4 border border-blue-100">
                            <p className="text-sm text-blue-800 font-medium">💡 Gợi ý thuật toán:</p>
                            <p className="text-xs text-blue-600 mt-1 leading-relaxed">Kỹ năng Writing của bạn đang yếu nhất (6.0). Hãy ưu tiên luyện thêm Writing Task 2 hôm nay.</p>
                        </div>
                    </div>
                </div>
            </main >
        </div >
    );
}

function SidebarLink({ href, icon: Icon, label, active }: { href: string; icon: any; label: string; active?: boolean }) {
    return (
        <Link href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-colors ${active ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}`}>
            <Icon className="h-5 w-5" /> {label}
        </Link>
    );
}

function StatCard({ icon: Icon, title, value, color, bg }: any) {
    return (
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm flex items-center gap-4">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${bg}`}><Icon className={`h-6 w-6 ${color}`} /></div>
            <div><p className="text-sm font-semibold text-slate-500">{title}</p><p className="text-2xl font-extrabold text-slate-900">{value}</p></div>
        </div>
    );
}

function SkillCard({ href, icon: Icon, title, desc, color }: any) {
    const colorMap: any = {
        indigo: "bg-indigo-50 text-indigo-600 hover:border-indigo-200",
        emerald: "bg-emerald-50 text-emerald-600 hover:border-emerald-200",
        blue: "bg-blue-50 text-blue-600 hover:border-blue-200",
        amber: "bg-amber-50 text-amber-600 hover:border-amber-200"
    };
    return (
        <Link href={href} className="group block bg-white rounded-2xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-all hover:-translate-y-1">
            <div className={`h-12 w-12 rounded-xl flex items-center justify-center mb-4 transition-colors ${colorMap[color]}`}>
                <Icon className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 group-hover:text-blue-600 transition-colors">{title}</h3>
            <p className="text-sm text-slate-500 mt-1">{desc}</p>
        </Link>
    );
}

function TaskItem({ title, time, done, onClick }: any) {
    return (
        <div onClick={onClick} className="flex items-center gap-3 p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition cursor-pointer">
            <div className={`h-5 w-5 rounded-full border-2 flex items-center justify-center shrink-0 ${done ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'}`}>
                {done && <CheckCircle2 className="h-4 w-4 text-white" />}
            </div>
            <div className="flex-1">
                <p className={`text-sm font-semibold transition-all ${done ? 'text-slate-400 line-through' : 'text-slate-700'}`}>{title}</p>
            </div>
            <span className={`text-xs font-bold px-2 py-1 rounded-md transition-colors ${done ? 'text-slate-300 bg-slate-50' : 'text-slate-500 bg-slate-100'}`}>{time}</span>
        </div>
    );
}

export default function DashboardPage() {
    return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div></div>}>
            <DashboardContent />
        </Suspense>
    );
}
