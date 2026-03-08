"use client";

import React, { useState } from "react";
import { Save, CheckCircle2, Loader2, AlertCircle, ExternalLink } from "lucide-react";

interface AdminConfigFormProps {
    initialConfigs: Record<string, string>;
}

export default function AdminConfigForm({ initialConfigs }: AdminConfigFormProps) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState("");

    const handleChange = (key: string, value: string) => {
        setConfigs(prev => ({ ...prev, [key]: value }));
        setSaved(false);
        setError("");
    };

    const handleSave = async () => {
        setSaving(true); setError("");
        try {
            const configArray = Object.entries(configs).map(([key, value]) => ({ key, value }));
            const res = await fetch("/api/admin/config", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ configs: configArray }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            } else {
                const data = await res.json();
                setError(data.error || "Lưu thất bại");
            }
        } catch (err) {
            setError("Lỗi kết nối máy chủ");
        } finally {
            setSaving(false);
        }
    };

    const Field = ({ label, keyName, type = "text", placeholder = "", helpText = "" }: { label: string; keyName: string; type?: string; placeholder?: string; helpText?: string }) => (
        <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">{label}</label>
            {type === "textarea" ? (
                <textarea value={configs[keyName] || ""} onChange={e => handleChange(keyName, e.target.value)} rows={3}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none" placeholder={placeholder} />
            ) : (
                <input type={type} value={configs[keyName] || ""} onChange={e => handleChange(keyName, e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none" placeholder={placeholder} />
            )}
            {helpText && <p className="text-xs text-slate-400 mt-1">{helpText}</p>}
        </div>
    );

    return (
        <div className="space-y-8">
            {/* Casso Payment Gateway */}
            <div>
                <h3 className="font-bold text-slate-800 mb-1 flex items-center gap-2">💳 Casso Payment Gateway</h3>
                <p className="text-sm text-slate-500 mb-4">Kết nối Casso để tự động xác nhận thanh toán chuyển khoản ngân hàng.</p>
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 mb-4 text-sm text-blue-800">
                    <strong>Webhook URL:</strong>{" "}
                    <code className="bg-blue-100 px-2 py-0.5 rounded text-xs">{typeof window !== "undefined" ? window.location.origin : "https://your-domain.vercel.app"}/api/payment/webhook</code>
                    <br />
                    <span className="text-xs text-blue-600 mt-1 block">Cấu hình URL này trong Casso Dashboard → Webhook Settings</span>
                    <a href="https://casso.vn" target="_blank" className="text-blue-700 font-semibold text-xs flex items-center gap-1 mt-1 hover:underline">
                        Xem tài liệu Casso <ExternalLink className="h-3 w-3" />
                    </a>
                </div>
                <div className="space-y-4">
                    <Field label="🔑 Casso API Key" keyName="casso_api_key" type="password" placeholder="Casso API Key từ Dashboard" helpText="Lấy từ Casso Dashboard → API Keys" />
                    <Field label="🏦 Số tài khoản ngân hàng Casso theo dõi" keyName="casso_bank_account" placeholder="0708393751" helpText="Số tài khoản mà Casso sẽ monitoring" />
                    <Field label="🔐 Webhook Secret (để xác thực webhook)" keyName="casso_webhook_secret" type="password" placeholder="Casso Webhook Secret" helpText="Tạo secret ngẫu nhiên, cấu hình cùng giá trị trong Casso Dashboard" />
                </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Bank Transfer Info */}
            <div>
                <h3 className="font-bold text-slate-800 mb-4">🏦 Thông tin Ngân hàng (Để User chuyển khoản)</h3>
                <div className="space-y-4">
                    <Field label="Tên Ngân hàng (VD: Vietcombank)" keyName="payment_bank_name" placeholder="MBBank" />
                    <Field label="Số Tài Khoản" keyName="payment_account_number" placeholder="0708393751" />
                    <Field label="Chủ Tài Khoản" keyName="payment_account_name" placeholder="VU XUAN NAM" />
                    <Field label="Link Ảnh Mã QR Code" keyName="payment_qr_url" placeholder="https://img.vietqr.io/..." helpText='Gợi ý: Dùng VietQR API: https://api.vietqr.io/v2/generate (hoặc upload lên Imgur.com)' />
                </div>
            </div>

            <div className="h-px bg-slate-200" />

            {/* Other settings */}
            <div>
                <h3 className="font-bold text-slate-800 mb-4">⚙️ Các thông tin khác</h3>
                <div className="space-y-4">
                    <Field label="Tên Website" keyName="site_name" placeholder="IELTS Mastery" />
                    <Field label="🔗 Link nhóm cộng đồng" keyName="community_link" type="url" placeholder="https://facebook.com/groups/ielts-mastery" />
                    <Field label="📝 Tên nút cộng đồng" keyName="community_label" placeholder="Tham gia nhóm học IELTS" />
                    <Field label="💡 Mẹo học tập hàng ngày" keyName="daily_tip" type="textarea" placeholder="Luyện tập mỗi ngày 30 phút để cải thiện band score nhanh nhất!" />
                </div>
            </div>

            {error && (
                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg text-sm">
                    <AlertCircle className="h-4 w-4" /> {error}
                </div>
            )}

            <div className="flex items-center gap-3">
                <button onClick={handleSave} disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition">
                    {saving ? <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</> : <><Save className="h-4 w-4" /> Lưu cài đặt</>}
                </button>
                {saved && <span className="text-emerald-600 text-sm font-medium flex items-center gap-1"><CheckCircle2 className="h-4 w-4" /> Đã lưu thành công!</span>}
            </div>
        </div>
    );
}
