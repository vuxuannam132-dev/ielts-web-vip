"use client";

import React, { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import CheckoutUI from "./CheckoutUI";
import { Suspense } from "react";

function CheckoutContent() {
    const { data: session, status } = useSession();
    const router = useRouter();
    const searchParams = useSearchParams();
    const pkgCode = searchParams.get("pkg") || "PRO";

    const [pkg, setPkg] = useState<any>(null);
    const [paymentConfig, setPaymentConfig] = useState<any>(null);
    const [userStatus, setUserStatus] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (status === "unauthenticated") {
            router.push(`/login?callbackUrl=/checkout?pkg=${pkgCode}`);
            return;
        }
        if (status === "authenticated") {
            Promise.all([
                fetch(`/api/packages?code=${pkgCode}`).then(r => r.json()),
                fetch("/api/payment/config").then(r => r.json()),
                fetch("/api/auth/status").then(r => r.json()),
            ]).then(([pkgData, configData, authStatus]) => {
                if (!pkgData || pkgData.error) {
                    router.push("/#pricing");
                    return;
                }
                if (pkgData.price === 0) {
                    router.push("/dashboard");
                    return;
                }
                setPkg(pkgData);
                setPaymentConfig(configData);
                setUserStatus(authStatus);
                setLoading(false);
            }).catch(() => setLoading(false));
        }
    }, [status, pkgCode, router]);

    if (status === "loading" || loading) {
        return (
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="h-10 w-10 animate-spin text-blue-600 mx-auto mb-3" />
                    <p className="text-slate-600 font-medium">Đang tải thông tin thanh toán...</p>
                </div>
            </div>
        );
    }

    if (!pkg) return null;

    const userId = (session?.user as any)?.id || "";
    const transferContent = `${pkgCode} NANGCAP${userId.substring(0, 6).toUpperCase()}`;
    const benefits = pkg.benefits ? JSON.parse(pkg.benefits) : [];

    const currentTier = userStatus?.tier || "FREE";
    const tierExpiresAt = userStatus?.tierExpiresAt ? new Date(userStatus.tierExpiresAt) : null;
    const isExpired = tierExpiresAt ? tierExpiresAt < new Date() : true;
    const hasActivePaidTier = currentTier !== "FREE" && !isExpired;
    const isSameTier = currentTier === pkg.code;
    const blockPurchase = hasActivePaidTier && !isSameTier;

    return (
        <div className="min-h-screen bg-slate-50 py-12">
            <div className="max-w-4xl mx-auto px-4 sm:px-6">

                <div className="mb-8">
                    <Link href="/#pricing" className="inline-flex items-center gap-2 text-slate-500 hover:text-slate-900 transition-colors font-medium">
                        <ArrowLeft className="h-4 w-4" /> Quay lại chọn gói
                    </Link>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    {/* Order Summary */}
                    <div className="space-y-6">
                        <div>
                            <h1 className="text-3xl font-bold text-slate-900 mb-2">Thanh toán an toàn</h1>
                            <p className="text-slate-600">Hoàn tất thanh toán để kích hoạt tài khoản VIP của bạn ngay lập tức.</p>
                        </div>

                        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-bl-full -z-0 opacity-50"></div>
                            
                            <div className="flex items-center gap-3 mb-4 relative z-10">
                                <h2 className="font-bold text-slate-900 text-lg">Tóm tắt đơn hàng</h2>
                                {hasActivePaidTier && isSameTier && (
                                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-xs font-bold rounded-full">Đang hoạt động (Gia hạn cộng dồn)</span>
                                )}
                            </div>

                            <div className="flex items-center justify-between mb-4 relative z-10">
                                <div>
                                    <p className="font-bold text-slate-800">Gói {pkg.name}</p>
                                    <p className="text-sm text-slate-500">Thời hạn: {pkg.durationDays} ngày</p>
                                </div>
                                <div className="text-right">
                                    <p className="font-black text-2xl text-blue-700">{pkg.price.toLocaleString("vi-VN")}đ</p>
                                </div>
                            </div>

                            <div className="h-px bg-slate-100 my-4"></div>

                            <ul className="space-y-3 relative z-10">
                                {benefits.map((b: string, i: number) => (
                                    <li key={i} className="flex items-start gap-2 text-sm text-slate-600">
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                                        <span>{b}</span>
                                    </li>
                                ))}
                            </ul>

                            <div className="mt-6 flex items-center gap-2 text-sm text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-100 relative z-10">
                                <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0" />
                                <span>Thanh toán của bạn được mã hóa an toàn 256-bit SSL.</span>
                            </div>
                        </div>
                    </div>

                    {/* Payment UI or Block Message */}
                    {blockPurchase ? (
                        <div className="bg-red-50 border border-red-200 rounded-2xl p-8 flex flex-col items-center justify-center text-center">
                            <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                                <ShieldCheck className="h-8 w-8 text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Chưa thể đăng ký gói này</h3>
                            <p className="text-slate-600">Bạn đang sử dụng gói <strong className="text-blue-600">{currentTier}</strong> (còn hạn đến {tierExpiresAt?.toLocaleDateString('vi-VN')}). Vui lòng đợi đến khi gói cũ hết hạn để có thể đăng ký gói khác, tránh việc xung đột quyền lợi và thời gian.</p>
                            <Link href="/dashboard" className="mt-6 px-6 py-2.5 bg-white border border-slate-200 rounded-xl font-bold text-slate-700 hover:bg-slate-50 transition">Về Dashboard</Link>
                        </div>
                    ) : (
                        <CheckoutUI
                            bankName={paymentConfig?.bankName || "N/A"}
                            accNumber={paymentConfig?.accNumber || "N/A"}
                            accName={paymentConfig?.accName || "N/A"}
                            qrUrl={paymentConfig?.qrUrl || null}
                            amount={pkg.price}
                            transferContent={transferContent}
                            packageId={pkg.id}
                            packageCode={pkg.code}
                            initialTier={currentTier}
                            initialExpiresAt={userStatus?.tierExpiresAt || null}
                        />
                    )}
                </div>
            </div>
        </div>
    );
}

export default function CheckoutPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-slate-50 flex items-center justify-center">
                <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
        }>
            <CheckoutContent />
        </Suspense>
    );
}
