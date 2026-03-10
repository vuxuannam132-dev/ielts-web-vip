"use client";

import { useState } from "react";
import { Bug, X, Loader2, CheckCircle2 } from "lucide-react";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";

export function BugReportButton() {
    const [open, setOpen] = useState(false);
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [done, setDone] = useState(false);
    const pathname = usePathname();
    const { data: session } = useSession();

    const handleSubmit = async () => {
        if (!title.trim() || !description.trim()) return;
        setSubmitting(true);

        await fetch("/api/bug-report", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ title, description, url: pathname }),
        });

        setSubmitting(false);
        setDone(true);
        setTimeout(() => {
            setDone(false);
            setOpen(false);
            setTitle("");
            setDescription("");
        }, 2000);
    };

    return (
        <>
            <button
                onClick={() => setOpen(true)}
                title="Báo lỗi"
                className="flex items-center gap-1.5 text-sm font-medium text-slate-500 hover:text-red-500 hover:bg-red-50 px-2 py-1.5 rounded-lg transition-colors"
            >
                <Bug className="h-4 w-4" />
                <span className="hidden lg:block">Báo lỗi</span>
            </button>

            {open && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 animate-in fade-in zoom-in-95 duration-200">
                        {done ? (
                            <div className="text-center py-6">
                                <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto mb-3" />
                                <h3 className="text-lg font-bold text-slate-900">Đã gửi báo lỗi!</h3>
                                <p className="text-slate-500 text-sm mt-1">Cảm ơn bạn đã phản hồi. Chúng tôi sẽ kiểm tra sớm.</p>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-xl font-bold flex items-center gap-2">
                                        <Bug className="h-5 w-5 text-red-500" /> Báo lỗi
                                    </h2>
                                    <button onClick={() => setOpen(false)} className="p-2 hover:bg-slate-100 rounded-lg">
                                        <X className="h-4 w-4 text-slate-500" />
                                    </button>
                                </div>

                                {session?.user && (
                                    <div className="mb-3 px-3 py-2 bg-slate-50 rounded-lg text-xs text-slate-500">
                                        Gửi bởi: <span className="font-semibold text-slate-700">{(session.user as any).name || session.user.email}</span>
                                        {" · "}Trang: <span className="font-mono">{pathname}</span>
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">Tiêu đề lỗi *</label>
                                        <input
                                            autoFocus
                                            value={title}
                                            onChange={e => setTitle(e.target.value)}
                                            placeholder="VD: Nút bắt đầu bài tập không hoạt động"
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-400 outline-none transition-colors"
                                        />
                                    </div>
                                    <div>
                                        <label className="text-sm font-medium text-slate-700 mb-1 block">Mô tả chi tiết *</label>
                                        <textarea
                                            value={description}
                                            onChange={e => setDescription(e.target.value)}
                                            placeholder="Mô tả lỗi bạn gặp phải, các bước tái hiện lỗi..."
                                            rows={4}
                                            className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:border-red-400 outline-none transition-colors resize-none"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-5">
                                    <button
                                        onClick={() => setOpen(false)}
                                        className="flex-1 px-4 py-2.5 rounded-xl border-2 border-slate-200 text-sm font-medium text-slate-600 hover:bg-slate-50"
                                    >
                                        Huỷ
                                    </button>
                                    <button
                                        onClick={handleSubmit}
                                        disabled={submitting || !title.trim() || !description.trim()}
                                        className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 text-white text-sm font-medium hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                    >
                                        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Gửi báo lỗi"}
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            )}
        </>
    );
}
