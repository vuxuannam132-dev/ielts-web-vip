"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, Loader2, ArrowRight } from "lucide-react";

function LoginForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const res = await signIn("credentials", {
                redirect: false,
                email,
                password,
            });

            if (res?.error) {
                setError("Email hoặc mật khẩu không chính xác.");
            } else {
                router.push(callbackUrl);
                router.refresh(); // Crucial to update navbar session state
            }
        } catch (err) {
            setError("Đã xảy ra lỗi. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
                <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
                    {error}
                </div>
            )}

            <div>
                <label className="block text-sm font-medium text-slate-700 mb-1.5">Email</label>
                <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-slate-50 focus:bg-white text-sm"
                    placeholder="name@example.com"
                />
            </div>

            <div>
                <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-sm font-medium text-slate-700">Mật khẩu</label>
                    <Link href="#" className="text-xs font-semibold text-blue-600 hover:text-blue-700">Quên mật khẩu?</Link>
                </div>
                <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-slate-50 focus:bg-white text-sm"
                    placeholder="••••••••"
                />
            </div>

            <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-semibold py-3.5 rounded-xl hover:shadow-lg hover:shadow-blue-600/25 transition-all text-sm disabled:opacity-70"
            >
                {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Đăng nhập <ArrowRight className="h-4 w-4" /></>}
            </button>
        </form>
    );
}

export default function LoginPage() {
    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">
            {/* Left Column (Brand/Image) */}
            <div className="hidden lg:flex flex-col justify-between bg-slate-50 p-12 lg:p-16 border-r border-slate-100 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/5 to-indigo-600/10 pointer-events-none" />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-md">
                            <BrainCircuit className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-slate-900">
                            IELTS SKIBIDI
                        </span>
                    </Link>
                </div>

                <div className="relative z-10 max-w-md mt-auto">
                    <h1 className="text-3xl font-bold tracking-tight text-slate-900 mb-4 leading-tight">
                        Cải thiện band score <br /> IELTS của bạn ngay hôm nay.
                    </h1>
                    <p className="text-slate-600 text-lg leading-relaxed">
                        Tham gia cùng hàng ngàn học viên khác luyện tập theo format thi thật với AI chấm điểm chuyên sâu dựa trên 4 tiêu chí của IELTS.
                    </p>
                </div>
            </div>

            {/* Right Column (Form) */}
            <div className="flex flex-col justify-center px-6 py-12 lg:px-24">
                <div className="mx-auto w-full max-w-md">
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Chào mừng trở lại</h2>
                        <p className="text-slate-500">Đăng nhập để tiếp tục lộ trình học của bạn</p>
                    </div>

                    <Suspense fallback={<div className="flex justify-center py-6"><Loader2 className="h-6 w-6 animate-spin text-blue-600" /></div>}>
                        <LoginForm />
                    </Suspense>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        Chưa có tài khoản?{" "}
                        <Link href="/register" className="font-bold text-blue-600 hover:text-blue-700 transition">
                            Đăng ký miễn phí
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
