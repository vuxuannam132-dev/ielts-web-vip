"use client";

import { useState, useEffect } from "react";
import { Users, FileText, Settings, Shield, Edit2, KeyRound, Loader2, Trash2, Banknote, LayoutDashboard, Plus } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState("dashboard");

    if (status === "loading") {
        return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    if (!session || (session.user as any)?.role !== "ADMIN") {
        return (
            <div className="min-h-screen flex items-center justify-center text-center">
                <div>
                    <Shield className="h-16 w-16 text-red-500 mx-auto mb-4" />
                    <h1 className="text-2xl font-bold">Truy cập bị từ chối</h1>
                    <p className="text-slate-500 mt-2">Tính năng này chỉ dành cho Admin.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-4rem)] flex flex-col md:flex-row bg-slate-50">
            {/* Sidebar */}
            <aside className="w-full md:w-64 bg-white border-r border-slate-200">
                <div className="p-6">
                    <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="h-5 w-5 text-blue-600" /> Admin Panel
                    </h2>
                </div>
                <nav className="px-4 space-y-1">
                    {[
                        { id: "dashboard", label: "Tổng quan", icon: LayoutDashboard },
                        { id: "users", label: "Quản lý người dùng", icon: Users },
                        { id: "content", label: "Quản lý bài tập", icon: FileText },
                        { id: "payment", label: "Thanh toán & Gói", icon: Banknote },
                        { id: "settings", label: "Cài đặt hệ thống", icon: Settings },
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`w-full flex items-center gap-3 px-4 py-3 text-sm font-medium rounded-xl transition ${activeTab === tab.id ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                                }`}
                        >
                            <tab.icon className="h-5 w-5" /> {tab.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className="flex-1 p-6 lg:p-10">
                {activeTab === "dashboard" && <WelcomeView />}
                {activeTab === "users" && <UsersManager />}
                {activeTab === "payment" && <PaymentConfig />}
                {activeTab === "settings" && <SystemSettings />}
                {activeTab === "content" && (
                    <div className="space-y-6">
                        <div className="flex justify-between items-center">
                            <h2 className="text-2xl font-bold">Bài tập (Practice Sets)</h2>
                            <Link href="/admin/upload" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                                <Plus className="h-4 w-4" /> Thêm bài mới
                            </Link>
                        </div>
                        <p className="text-slate-500">Quản lý kho bài tập cho học viên (Writing, Speaking, Reading, Listening).</p>
                    </div>
                )}
            </main>
        </div>
    );
}

// ───────────────────────────────────────────────
// SUB-COMPONENTS
// ───────────────────────────────────────────────

function WelcomeView() {
    return (
        <div className="space-y-6">
            <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
            <p className="text-slate-500">Chào mừng bạn trở lại hệ thống quản trị IELTS Mastery.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
                {/* Stats cards placeholder */}
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="h-6 w-6 text-blue-600" /></div>
                    <div><p className="text-3xl font-bold">50+</p><p className="text-sm text-slate-500">Người dùng</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center"><FileText className="h-6 w-6 text-emerald-600" /></div>
                    <div><p className="text-3xl font-bold">120</p><p className="text-sm text-slate-500">Nộp bài</p></div>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl bg-amber-100 flex items-center justify-center"><Banknote className="h-6 w-6 text-amber-600" /></div>
                    <div><p className="text-3xl font-bold">15</p><p className="text-sm text-slate-500">Thành viên VIP</p></div>
                </div>
            </div>
        </div>
    );
}

function UsersManager() {
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/users').then(res => res.json()).then(data => {
            setUsers(Array.isArray(data) ? data : []);
            setLoading(false);
        });
    }, []);

    const handleUpdate = async (id: string, field: string, value: string) => {
        const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: id, [field]: value })
        });
        if (res.ok) {
            setUsers(users.map(u => u.id === id ? { ...u, [field]: value } : u));
            alert("Cập nhật thành công!");
        }
    };

    const handleResetPassword = async (id: string, email: string) => {
        const newPass = prompt(`Nhập mật khẩu mới cho ${email}:`);
        if (!newPass) return;
        const res = await fetch('/api/admin/reset-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: id, newPassword: newPass })
        });
        if (res.ok) alert(`Đã reset mật khẩu cho ${email}`);
        else alert("Lỗi khi reset mật khẩu!");
    };

    if (loading) return <Loader2 className="text-blue-600 animate-spin mx-auto mt-20" />;

    return (
        <div className="space-y-6">
            <h2 className="text-2xl font-bold">Quản lý người dùng</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-600">
                        <tr>
                            <th className="px-6 py-4 font-semibold">Email / Tên</th>
                            <th className="px-6 py-4 font-semibold">Role</th>
                            <th className="px-6 py-4 font-semibold">Mức Rank (Tier)</th>
                            <th className="px-6 py-4 font-semibold text-right">Thao tác</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {users.map(u => (
                            <tr key={u.id} className="hover:bg-slate-50/50">
                                <td className="px-6 py-4">
                                    <p className="font-bold text-slate-900">{u.email}</p>
                                    <p className="text-slate-500 text-xs">{u.name}</p>
                                </td>
                                <td className="px-6 py-4">
                                    <select value={u.role} onChange={e => handleUpdate(u.id, 'role', e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold outline-none">
                                        <option value="USER">USER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <select value={u.tier} onChange={e => handleUpdate(u.id, 'tier', e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold outline-none">
                                        <option value="FREE">FREE</option>
                                        <option value="PRO">PRO</option>
                                        <option value="PREMIUM">PREMIUM</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 flex justify-end gap-2">
                                    <button onClick={() => handleResetPassword(u.id, u.email)} title="Đổi mật khẩu" className="p-2 text-slate-400 hover:text-amber-500 hover:bg-amber-50 rounded-lg">
                                        <KeyRound className="h-4 w-4" />
                                    </button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function PaymentConfig() {
    const [packages, setPackages] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editingPkg, setEditingPkg] = useState<any>(null);
    const [formData, setFormData] = useState({ code: '', name: '', price: 0, durationDays: '', description: '', benefits: '', isActive: true });

    useEffect(() => {
        fetchPackages();
    }, []);

    const fetchPackages = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/packages');
            if (res.ok) {
                const data = await res.json();
                setPackages(data);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (pkg: any) => {
        setEditingPkg(pkg);
        setFormData({
            ...pkg,
            durationDays: pkg.durationDays || '',
            benefits: JSON.parse(pkg.benefits).join('\n')
        });
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa gói này?')) return;
        await fetch(`/api/admin/packages/${id}`, { method: 'DELETE' });
        fetchPackages();
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = {
            ...formData,
            durationDays: formData.durationDays ? parseInt(formData.durationDays as string) : null,
            benefits: formData.benefits.split('\n').filter(b => b.trim() !== '')
        };

        const url = editingPkg ? `/api/admin/packages/${editingPkg.id}` : '/api/admin/packages';
        const method = editingPkg ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (res.ok) {
            setEditingPkg(null);
            setFormData({ code: '', name: '', price: 0, durationDays: '', description: '', benefits: '', isActive: true });
            fetchPackages();
        } else {
            const err = await res.json();
            alert(err.error || 'Có lỗi xảy ra');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">Quản lý Gói (Packages)</h2>
                    <p className="text-slate-500">Cấu hình các gói thành viên hiển thị trên website.</p>
                </div>
                {!editingPkg && (
                    <button onClick={() => setEditingPkg({})} className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Thêm Gói Mới
                    </button>
                )}
            </div>

            {editingPkg ? (
                <form onSubmit={handleSubmit} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 space-y-4">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="font-bold text-lg">{editingPkg.id ? 'Sửa' : 'Thêm'} Gói</h3>
                        <button type="button" onClick={() => setEditingPkg(null)} className="text-slate-400 hover:text-slate-700">Hủy</button>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1">Mã (Tier, vd: FREE, PRO)</label>
                            <input required value={formData.code} onChange={e => setFormData({ ...formData, code: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Tên Gói</label>
                            <input required value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Giá (VND)</label>
                            <input required type="number" value={formData.price} onChange={e => setFormData({ ...formData, price: parseInt(e.target.value) })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1">Thời hạn (ngày, bỏ trống = vĩnh viễn)</label>
                            <input type="number" value={formData.durationDays} onChange={e => setFormData({ ...formData, durationDays: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Mô tả ngắn</label>
                        <input required value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full px-4 py-2 border rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold mb-1">Quyền lợi (Mỗi dòng 1 quyền lợi)</label>
                        <textarea required value={formData.benefits} onChange={e => setFormData({ ...formData, benefits: e.target.value })} className="w-full px-4 py-2 border rounded-lg h-32" />
                    </div>
                    <div className="flex items-center gap-2">
                        <input type="checkbox" id="isActive" checked={formData.isActive} onChange={e => setFormData({ ...formData, isActive: e.target.checked })} />
                        <label htmlFor="isActive" className="font-semibold text-sm">Đang kích hoạt</label>
                    </div>
                    <button type="submit" className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg font-bold">Lưu Gói</button>
                </form>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {loading ? <p>Đang tải...</p> : packages.map(pkg => (
                        <div key={pkg.id} className={`bg-white rounded-2xl border ${pkg.isActive ? 'border-emerald-200' : 'border-slate-200'} p-6 relative`}>
                            {!pkg.isActive && <span className="absolute top-4 right-4 text-xs font-bold text-slate-400 bg-slate-100 px-2 py-1 rounded">Ẩn</span>}
                            <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 mb-1">{pkg.name}</h3>
                            <p className="text-2xl font-black mb-4">{pkg.price.toLocaleString('vi-VN')}đ <span className="text-sm font-normal text-slate-500">/{pkg.durationDays ? `${pkg.durationDays} ngày` : 'vĩnh viễn'}</span></p>
                            <p className="text-sm text-slate-600 mb-4">{pkg.description}</p>
                            <ul className="text-sm space-y-2 mb-6">
                                {JSON.parse(pkg.benefits).map((b: string, i: number) => (
                                    <li key={i} className="flex gap-2 text-slate-700">✓ {b}</li>
                                ))}
                            </ul>
                            <div className="flex gap-2">
                                <button onClick={() => handleEdit(pkg)} className="flex-1 bg-slate-100 text-slate-700 py-2 rounded-lg font-semibold flex items-center justify-center gap-1 hover:bg-slate-200">
                                    <Edit2 className="h-4 w-4" /> Sửa
                                </button>
                                <button onClick={() => handleDelete(pkg.id)} className="px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function SystemSettings() {
    return (
        <div className="space-y-6 max-w-3xl">
            <h2 className="text-2xl font-bold">Cài đặt chung</h2>
            <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-5">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Tên Website</label>
                    <input type="text" defaultValue="IELTS Mastery" className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">Link Group Cộng Đồng (Zalo/FB)</label>
                    <input type="text" placeholder="https://zalo.me/g/..." className="w-full px-4 py-2 border border-slate-200 rounded-lg text-sm outline-none" />
                </div>
                <button className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-blue-700 mt-4">
                    Lưu thông tin
                </button>
            </div>
        </div>
    );
}
