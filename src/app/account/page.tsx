"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { Loader2, KeyRound, User as UserIcon, ShieldCheck, Zap, GraduationCap, Send } from "lucide-react";
import Link from "next/link";
import { useToast } from "@/contexts/ToastContext";

export default function AccountPage() {
    const { data: session, status } = useSession();
    const user = session?.user;
    const { addToast } = useToast();

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    const [showTeacherModal, setShowTeacherModal] = useState(false);
    const [teacherReason, setTeacherReason] = useState("");
    const [teacherReqLoading, setTeacherReqLoading] = useState(false);
    const [teacherReqMsg, setTeacherReqMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    if (status === "loading") {
        return <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center"><Loader2 className="h-8 w-8 animate-spin text-blue-600" /></div>;
    }

    if (!user) {
        return <div className="min-h-[calc(100vh-4rem)] flex justify-center items-center">Vui lòng đăng nhập</div>;
    }

    const tierBadge = ({
        FREE: "bg-slate-100 text-slate-700",
        PRO: "bg-blue-100 text-blue-700",
        PREMIUM: "bg-gradient-to-r from-amber-400 to-orange-500 text-white"
    } as Record<string, string>)[(user as any).tier || "FREE"];

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        setMessage(null);

        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: "Mật khẩu xác nhận không khớp." });
            return;
        }

        if (newPassword.length < 6) {
            setMessage({ type: 'error', text: "Mật khẩu mới phải có ít nhất 6 ký tự." });
            return;
        }

        setLoading(true);
        try {
            const res = await fetch("/api/account/change-password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ currentPassword, newPassword }),
            });
            const data = await res.json();

            if (res.ok) {
                setMessage({ type: 'success', text: "Đổi mật khẩu thành công!" });
                setCurrentPassword("");
                setNewPassword("");
                setConfirmPassword("");
            } else {
                setMessage({ type: 'error', text: data.error || "Đã xảy ra lỗi." });
            }
        } catch (err) {
            setMessage({ type: 'error', text: "Lỗi kết nối máy chủ." });
        } finally {
            setLoading(false);
        }
    };

    const handleRequestTeacher = async (e: React.FormEvent) => {
        e.preventDefault();
        setTeacherReqLoading(true);
        setTeacherReqMsg(null);
        try {
            const res = await fetch("/api/account/request-teacher", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ reason: teacherReason }),
            });
            const data = await res.json();
            if (res.ok) {
                addToast('success', "Đã gửi yêu cầu xin làm Giáo viên. Vui lòng chờ Ban quản trị duyệt!");
                setTeacherReqMsg({ type: 'success', text: "Đã gửi yêu cầu thành công!" });
                setTeacherReason("");
                setTimeout(() => setShowTeacherModal(false), 2000);
            } else {
                addToast('error', data.error || "Đã xảy ra lỗi.");
                setTeacherReqMsg({ type: 'error', text: data.error || "Đã xảy ra lỗi." });
            }
        } catch (err) {
            addToast('error', "Lỗi kết nối máy chủ.");
            setTeacherReqMsg({ type: 'error', text: "Lỗi kết nối máy chủ." });
        } finally {
            setTeacherReqLoading(false);
        }
    };

    return (
        <div className="min-h-[calc(100vh-4rem)] bg-slate-50 py-12 px-4 sm:px-6">
            <div className="max-w-4xl mx-auto space-y-8">

                {/* Header overview */}
                <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="h-24 w-24 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-4xl font-bold shadow-inner">
                        {user.name?.[0]?.toUpperCase() || "U"}
                    </div>
                    <div className="flex-1 text-center md:text-left">
                        <h1 className="text-3xl font-bold text-slate-900">{user.name}</h1>
                        <p className="text-slate-500">{user.email}</p>
                        <div className="mt-3 flex items-center justify-center md:justify-start gap-3">
                            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase shadow-sm ${tierBadge}`}>
                                Gói: {(user as any).tier || "FREE"}
                            </span>
                            {(user as any).role === "ADMIN" && (
                                <span className="bg-slate-900 text-white px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 shadow-sm">
                                    <ShieldCheck className="h-3.5 w-3.5" /> ADMIN
                                </span>
                            )}
                        </div>
                    </div>
                    {(user as any).tier === "FREE" && (
                        <div className="shrink-0 mt-4 md:mt-0">
                            <Link href="/#pricing" className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-xl font-bold hover:shadow-lg hover:shadow-orange-500/30 transition">
                                <Zap className="h-5 w-5" /> Nâng cấp VIP
                            </Link>
                        </div>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    {/* Left Column (Menu/Info) */}
                    <div className="col-span-1 space-y-4">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-2">
                            <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl bg-blue-50 text-blue-700 font-medium">
                                <KeyRound className="h-5 w-5" /> Đổi mật khẩu
                            </button>
                            {(user as any).role === "USER" && (
                                <button onClick={() => setShowTeacherModal(true)} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition">
                                    <GraduationCap className="h-5 w-5 text-violet-500" /> Xin cấp quyền Giáo viên
                                </button>
                            )}
                            <Link href="/dashboard" className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-slate-50 text-slate-600 font-medium transition">
                                <UserIcon className="h-5 w-5 text-slate-400" /> Quay lại Dashboard
                            </Link>
                        </div>
                    </div>

                    {/* Right Column (Change Password Form) */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8">
                            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-blue-600" /> Đổi mật khẩu
                            </h2>

                            {message && (
                                <div className={`px-4 py-3 rounded-xl mb-6 text-sm font-medium border ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                    {message.text}
                                </div>
                            )}

                            <form onSubmit={handleChangePassword} className="space-y-5 max-w-md">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu hiện tại</label>
                                    <input
                                        type="password" required
                                        value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-slate-50 focus:bg-white text-sm"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="border-t border-slate-100 pt-5 mt-5">
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu mới</label>
                                    <input
                                        type="password" required
                                        value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-slate-50 focus:bg-white text-sm"
                                        placeholder="Ít nhất 6 ký tự"
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1.5">Xác nhận mật khẩu mới</label>
                                    <input
                                        type="password" required
                                        value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-slate-50 focus:bg-white text-sm"
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white font-semibold py-3 rounded-xl hover:bg-blue-700 transition-all text-sm disabled:opacity-70 mt-2"
                                >
                                    {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                                    Cập nhật mật khẩu
                                </button>
                            </form>
                        </div>
                    </div>
                </div>

                {showTeacherModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6">
                            <h2 className="text-xl font-bold mb-2 flex items-center gap-2"><GraduationCap className="h-5 w-5 text-violet-600" /> Xin cấp quyền Giáo viên</h2>
                            <p className="text-sm text-slate-500 mb-4">Gửi yêu cầu tới Ban quản trị để nâng cấp tài khoản của bạn thành Giáo viên, giúp bạn tạo lớp học và giao bài tập.</p>
                            
                            {teacherReqMsg && (
                                <div className={`p-3 rounded-xl mb-4 text-sm font-medium border ${teacherReqMsg.type === 'success' ? 'bg-emerald-50 text-emerald-700 border-emerald-100' : 'bg-red-50 text-red-700 border-red-100'}`}>
                                    {teacherReqMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleRequestTeacher} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">Giới thiệu bản thân / Lý do *</label>
                                    <textarea 
                                        required 
                                        value={teacherReason} 
                                        onChange={e => setTeacherReason(e.target.value)} 
                                        placeholder="Ví dụ: Tôi là giáo viên tiếng Anh tại trung tâm..." 
                                        rows={4} 
                                        className="w-full border border-slate-200 rounded-xl px-4 py-3 text-sm focus:border-violet-500 outline-none resize-none bg-slate-50 focus:bg-white transition-colors" 
                                    />
                                </div>
                                <div className="flex gap-2 pt-2">
                                    <button type="button" onClick={() => setShowTeacherModal(false)} className="flex-1 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors">Hủy</button>
                                    <button type="submit" disabled={teacherReqLoading || !teacherReason.trim()} className="flex-1 bg-violet-600 hover:bg-violet-700 text-white font-medium py-2.5 rounded-xl transition-colors disabled:opacity-70 flex items-center justify-center gap-2">
                                        {teacherReqLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                                        Gửi yêu cầu
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
