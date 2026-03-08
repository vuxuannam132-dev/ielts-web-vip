"use client";

import React, { useState } from "react";
import { Save, CheckCircle2, Loader2 } from "lucide-react";

interface AdminConfigFormProps {
    initialConfigs: Record<string, string>;
}

export default function AdminConfigForm({ initialConfigs }: AdminConfigFormProps) {
    const [configs, setConfigs] = useState(initialConfigs);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);

    const handleChange = (key: string, value: string) => {
        setConfigs(prev => ({ ...prev, [key]: value }));
        setSaved(false);
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const configArray = Object.entries(configs).map(([key, value]) => ({ key, value }));
            const res = await fetch('/api/admin/config', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ configs: configArray }),
            });
            if (res.ok) {
                setSaved(true);
                setTimeout(() => setSaved(false), 3000);
            }
        } catch (err) {
            console.error('Save failed:', err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="space-y-5">
            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    🔗 Link nhóm cộng đồng (Facebook, Telegram, Zalo...)
                </label>
                <input
                    type="url"
                    value={configs.community_link || ''}
                    onChange={(e) => handleChange('community_link', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="https://facebook.com/groups/ielts-mastery"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    📝 Tên hiển thị nút cộng đồng
                </label>
                <input
                    type="text"
                    value={configs.community_label || ''}
                    onChange={(e) => handleChange('community_label', e.target.value)}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
                    placeholder="Tham gia nhóm học IELTS"
                />
            </div>

            <div>
                <label className="block text-sm font-semibold text-slate-700 mb-1.5">
                    💡 Mẹo học tập hàng ngày (Daily Tip)
                </label>
                <textarea
                    value={configs.daily_tip || ''}
                    onChange={(e) => handleChange('daily_tip', e.target.value)}
                    rows={3}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none"
                    placeholder="Luyện tập mỗi ngày 30 phút để cải thiện band score nhanh nhất!"
                />
            </div>

            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-2.5 rounded-lg text-sm font-semibold flex items-center gap-2 transition"
                >
                    {saving ? (
                        <><Loader2 className="h-4 w-4 animate-spin" /> Đang lưu...</>
                    ) : (
                        <><Save className="h-4 w-4" /> Lưu cài đặt</>
                    )}
                </button>
                {saved && (
                    <span className="text-emerald-600 text-sm font-medium flex items-center gap-1">
                        <CheckCircle2 className="h-4 w-4" /> Đã lưu thành công!
                    </span>
                )}
            </div>
        </div>
    );
}
