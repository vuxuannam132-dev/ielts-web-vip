"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { Copy, CheckCircle2, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

interface CheckoutUIProps {
    bankName: string;
    accNumber: string;
    accName: string;
    qrUrl: string | null;
    amount: number;
    transferContent: string;
    packageId: string;
    packageCode: string;
    initialTier: string;
    initialExpiresAt: string | null;
}

export default function CheckoutUI({
    bankName,
    accNumber,
    accName,
    qrUrl,
    amount,
    transferContent,
    packageId,
    packageCode,
    initialTier,
    initialExpiresAt
}: CheckoutUIProps) {
    const router = useRouter();
    const [verifying, setVerifying] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [copiedContent, setCopiedContent] = useState<string | null>(null);

    const { update } = useSession();

    const handleCopy = (content: string, type: string) => {
        navigator.clipboard.writeText(content);
        setCopiedContent(type);
        setTimeout(() => setCopiedContent(null), 2000);
    };

    const defaultQrUrl = `https://img.vietqr.io/image/${bankName}-${accNumber}-compact2.jpg?amount=${amount}&addInfo=${encodeURIComponent(transferContent)}&accountName=${encodeURIComponent(accName)}`;
    const finalQrUrl = qrUrl || defaultQrUrl;

    useEffect(() => {
        // Poll every 3 seconds to check if webhook has upgraded the user
        const interval = setInterval(async () => {
            try {
                const res = await fetch("/api/user/stats");
                if (res.ok) {
                    const data = await res.json();
                    
                    let upgraded = false;
                    if (data && data.tier) {
                        if (initialTier.toUpperCase() !== packageCode.toUpperCase()) {
                            // If they are buying a DIFFERENT tier, just check if tier changed to packageCode
                            if (data.tier.toUpperCase() === packageCode.toUpperCase()) {
                                upgraded = true;
                            }
                        } else {
                            // If they are buying the SAME tier (accumulate), check if expiresAt has increased
                            if (data.tier.toUpperCase() === packageCode.toUpperCase()) {
                                const initialDate = initialExpiresAt ? new Date(initialExpiresAt) : new Date(0);
                                const newDate = data.tierExpiresAt ? new Date(data.tierExpiresAt) : new Date(0);
                                if (newDate.getTime() > initialDate.getTime()) {
                                    upgraded = true;
                                }
                            }
                        }
                    }

                    if (upgraded) {
                        clearInterval(interval);
                        // Force session refresh before redirect
                        await update({ tier: data.tier });
                        window.location.href = "/dashboard?upgraded=true";
                    }
                }
            } catch (err) {
                // ignore network errors during polling
            }
        }, 3000);

        return () => clearInterval(interval);
    }, [packageCode]);

    return (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden flex flex-col h-full">
            <div className="bg-blue-600 text-white p-6 text-center shadow-inner">
                <h3 className="font-bold text-xl mb-1">Cách thức thanh toán</h3>
                <p className="text-blue-100 text-sm">Quét mã QR qua ứng dụng ngân hàng của bạn</p>
            </div>

            <div className="p-8 flex-1 flex flex-col items-center justify-center bg-[url('/grid.svg')] bg-center rounded-b-2xl">

                <div className="p-4 bg-white rounded-2xl shadow-lg border border-slate-100 relative mb-6">
                    <div className="absolute -top-3 -right-3 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-full shadow-sm animate-bounce">
                        Nhanh nhất
                    </div>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={finalQrUrl}
                        alt="Mã QR Thanh Toán"
                        className="w-48 h-48 object-contain rounded-xl"
                    />
                </div>

                <div className="w-full space-y-3 mb-8">
                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Ngân hàng</p>
                            <p className="font-bold text-slate-900">{bankName}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl group relative">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Số tài khoản</p>
                            <p className="font-bold text-slate-900 font-mono tracking-wide">{accNumber}</p>
                        </div>
                        <button
                            onClick={() => handleCopy(accNumber, 'acc')}
                            className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition"
                        >
                            {copiedContent === 'acc' ? <CheckCircle2 className="h-5 w-5 text-emerald-500" /> : <Copy className="h-5 w-5" />}
                        </button>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-slate-50 border border-slate-200 rounded-xl">
                        <div>
                            <p className="text-xs text-slate-500 font-medium">Chủ tài khoản</p>
                            <p className="font-bold text-slate-900 uppercase">{accName}</p>
                        </div>
                    </div>

                    <div className="flex justify-between items-center p-3 bg-blue-50 border border-blue-200 rounded-xl group relative overflow-hidden">
                        <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>
                        <div className="pl-2">
                            <p className="text-xs text-blue-600 font-bold mb-0.5 flex items-center gap-1">
                                Nội dung chuyển khoản <span className="text-[10px] bg-red-100 text-red-600 px-1.5 rounded uppercase font-black">Bắt buộc</span>
                            </p>
                            <p className="font-black text-blue-900 text-lg uppercase tracking-wider">{transferContent}</p>
                        </div>
                        <button
                            onClick={() => handleCopy(transferContent, 'content')}
                            className="p-2 bg-blue-100 text-blue-700 hover:bg-blue-200 rounded-lg transition"
                        >
                            {copiedContent === 'content' ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <Copy className="h-5 w-5" />}
                        </button>
                    </div>
                </div>

                <div className="w-full bg-slate-900 text-white font-bold py-4 px-6 text-lg rounded-xl shadow-lg flex items-center justify-center gap-3">
                    <Loader2 className="h-6 w-6 animate-spin text-blue-400" />
                    Đang chờ thanh toán...
                </div>
                <p className="text-sm text-slate-500 mt-4 text-center">Hệ thống sẽ tự động kích hoạt tài khoản trong vòng 1-3 phút sau khi nhận được thanh toán.</p>
            </div>
        </div>
    );
}
