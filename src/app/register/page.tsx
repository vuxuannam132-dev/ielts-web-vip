"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BrainCircuit, Loader2, ArrowRight } from "lucide-react";

export default function RegisterPage() {
    const router = useRouter();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        if (password.length < 6) {
            setError("Mật khẩu phải có ít nhất 6 ký tự.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name, email, password }),
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || "Đăng ký thất bại. Email đã tồn tại hoặc có lỗi xảy ra.");
            } else {
                // Redirect straight to login after successful register
                router.push("/login?registered=true");
            }
        } catch (err) {
            setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-white">

            {/* Left Column (Brand/Image) */}
            <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-indigo-600 to-blue-700 p-12 lg:p-16 relative overflow-hidden text-white">
                <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-white/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-400/10 rounded-full blur-3xl translate-y-1/3 -translate-x-1/4" />

                <div className="relative z-10">
                    <Link href="/" className="inline-flex items-center gap-2.5">
                        <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center shadow-lg">
                            <BrainCircuit className="h-6 w-6 text-white" />
                        </div>
                        <span className="font-bold text-2xl tracking-tight text-white drop-shadow-sm">
                            IELTS SKIBIDI
                        </span>
                    </Link>
                </div>

                <div className="relative z-10 max-w-md mt-auto mb-10">
                    <h1 className="text-4xl font-extrabold tracking-tight text-white mb-6 leading-tight drop-shadow-sm">
                        Bắt đầu hành trình <br /> chinh phục 8.0 IELTS.
                    </h1>
                    <div className="space-y-4">
                        <div className="flex items-start gap-3">
                            <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-blue-500/50 flex flex-col justify-center items-center backdrop-blur"><div className="h-2 w-2 rounded-full bg-white" /></div>
                            <p className="text-blue-100 leading-relaxed text-sm">Chấm điểm 4 kỹ năng chuẩn theo public band descriptors của IELTS.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-blue-500/50 flex flex-col justify-center items-center backdrop-blur"><div className="h-2 w-2 rounded-full bg-white" /></div>
                            <p className="text-blue-100 leading-relaxed text-sm">Phân tích chi tiết lỗi sai và đưa ra gợi ý nâng cấp từ vựng, ngữ pháp.</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="mt-1 h-5 w-5 shrink-0 rounded-full bg-blue-500/50 flex flex-col justify-center items-center backdrop-blur"><div className="h-2 w-2 rounded-full bg-white" /></div>
                            <p className="text-blue-100 leading-relaxed text-sm">Thực hành Speaking thật sự với công nghệ Whisper nhận diện giọng nói cực chuẩn.</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Right Column (Form) */}
            <div className="flex flex-col justify-center px-6 py-12 lg:px-24">
                <div className="mx-auto w-full max-w-md">
                    <div className="text-center lg:text-left mb-8">
                        <h2 className="text-3xl font-bold tracking-tight text-slate-900 mb-2">Tạo tài khoản mới</h2>
                        <p className="text-slate-500">Miễn phí trải nghiệm tính năng AI chấm điểm đỉnh cao</p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 px-4 py-3 rounded-xl border border-red-100 text-sm font-medium">
                                {error}
                            </div>
                        )}

                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Họ và tên</label>
                            <input
                                type="text"
                                required
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-slate-50 focus:bg-white text-sm"
                                placeholder="Nguyễn Văn A"
                            />
                        </div>

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
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">Mật khẩu</label>
                            <input
                                type="password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:ring-2 focus:ring-blue-600/20 focus:border-blue-600 outline-none transition bg-slate-50 focus:bg-white text-sm"
                                placeholder="Ít nhất 6 ký tự"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full flex items-center justify-center gap-2 bg-slate-900 text-white font-semibold py-3.5 rounded-xl hover:bg-slate-800 transition-all text-sm disabled:opacity-70 mt-2"
                        >
                            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <>Tạo tài khoản ngay <ArrowRight className="h-4 w-4" /></>}
                        </button>

                        <p className="text-xs text-center text-slate-500 mt-4 leading-relaxed">
                            Bằng việc tạo tài khoản, bạn đồng ý với Điều khoản dịch vụ và Chính sách bảo mật của chúng tôi.
                        </p>
                    </form>

                    <p className="mt-8 text-center text-sm text-slate-600">
                        Đã có tài khoản?{" "}
                        <Link href="/login" className="font-bold text-slate-900 hover:text-blue-600 transition">
                            Đăng nhập
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
