"use client";

import { useState, useEffect } from "react";
import { Users, FileText, Settings, Shield, Edit2, KeyRound, Loader2, Trash2, Banknote, LayoutDashboard, Plus, Flame, Bug, Activity, BrainCircuit, Save, AlertCircle } from "lucide-react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useToast } from "@/contexts/ToastContext";

export default function AdminDashboard() {
    const { data: session, status } = useSession();
    const [activeTab, setActiveTab] = useState("dashboard");
    const { addToast } = useToast();

    // Simulate incoming notifications for demo purposes
    useEffect(() => {
        if (status !== "authenticated" || (session?.user as any)?.role !== "ADMIN") return;
        const msgs = [
            "Học sinh 'Nguyễn Văn A' vừa báo lỗi ở bài nghe Test 3.",
            "Có 3 học sinh mới đăng ký tài khoản.",
            "Yêu cầu nâng cấp VIP từ user 'tranhieu@...'",
        ];
        let i = 0;
        const interval = setInterval(() => {
            addToast('info', msgs[i % msgs.length]);
            i++;
        }, 25000); // every 25 seconds
        return () => clearInterval(interval);
    }, [status, session, addToast]);

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
                        { id: "bugs", label: "Báo lỗi", icon: Bug },
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
                {activeTab === "content" && <PracticeManager />}
            </main>
        </div>
    );
}

// ───────────────────────────────────────────────
// SUB-COMPONENTS
// ───────────────────────────────────────────────

function WelcomeView() {
    const { addToast } = useToast();
    const [stats, setStats] = useState<{ totalUsers: number, vipUsers: number, totalSubmissions: number, activeUsersCount: number, topUsers?: any[], aiTokensUsed?: number }>({ totalUsers: 0, vipUsers: 0, totalSubmissions: 0, activeUsersCount: 0, aiTokensUsed: 0 });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/analytics').then(res => res.json()).then(data => {
            if (!data.error) setStats(data);
            setLoading(false);
        });
    }, []);

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900">Dashboard</h1>
                    <p className="text-slate-500">Chào mừng bạn trở lại hệ thống quản trị IELTS SKIBIDI.</p>
                </div>
                <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-4 py-2 rounded-lg shadow-sm transition-colors flex items-center gap-2" onClick={() => addToast('info', 'Thông báo thử nghiệm từ hệ thống Admin!')}>
                    <Activity className="h-4 w-4" /> Test Toast
                </button>
            </div>
            {loading ? <p className="text-slate-500">Đang tải dữ liệu...</p> : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-6">
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-blue-100 flex items-center justify-center"><Users className="h-6 w-6 text-blue-600" /></div>
                        <div><p className="text-3xl font-bold">{stats.totalUsers}</p><p className="text-sm text-slate-500">Tổng User</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-emerald-100 flex items-center justify-center"><FileText className="h-6 w-6 text-emerald-600" /></div>
                        <div><p className="text-3xl font-bold">{stats.totalSubmissions}</p><p className="text-sm text-slate-500">Nộp bài</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-amber-100 flex items-center justify-center"><Banknote className="h-6 w-6 text-amber-600" /></div>
                        <div><p className="text-3xl font-bold">{stats.vipUsers}</p><p className="text-sm text-slate-500">Thành viên VIP</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-indigo-100 flex items-center justify-center"><LayoutDashboard className="h-6 w-6 text-indigo-600" /></div>
                        <div><p className="text-3xl font-bold">{stats.activeUsersCount}</p><p className="text-sm text-slate-500">Active (7 ngày)</p></div>
                    </div>
                    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
                        <div className="h-14 w-14 rounded-xl bg-purple-100 flex items-center justify-center"><BrainCircuit className="h-6 w-6 text-purple-600" /></div>
                        <div><p className="text-3xl font-bold">{(stats.aiTokensUsed || 0).toLocaleString()}</p><p className="text-sm text-slate-500">AI Tokens</p></div>
                    </div>
                </div>
            )}

            {/* Top Users Leaderboard */}
            {!loading && stats.topUsers && stats.topUsers.length > 0 && (
                <div className="mt-8 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-slate-100">
                        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                            <Flame className="h-5 w-5 text-orange-500" /> Bảng Xếp Hạng Chăm Chỉ (Top 5)
                        </h2>
                    </div>
                    <table className="w-full text-left text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-6 py-4 font-semibold">Người dùng</th>
                                <th className="px-6 py-4 font-semibold text-center">Gói</th>
                                <th className="px-6 py-4 font-semibold text-right">Tổng Bài Giải</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {stats.topUsers.map((user: any, idx: number) => (
                                <tr key={user.id} className="hover:bg-slate-50/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="h-8 w-8 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0">
                                                {idx + 1}
                                            </div>
                                            <div>
                                                <p className="font-bold text-slate-900">{user.name || 'Học viên'}</p>
                                                <p className="text-xs text-slate-500">{user.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-center">
                                        <span className={`px-2 py-1 rounded-md text-xs font-bold ${user.tier === 'FREE' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-700'}`}>
                                            {user.tier}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-right font-black text-emerald-600 text-lg">
                                        {user.lifetimePracticeCount}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
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

    const handleUpdate = async (id: string, field: string, value: string | boolean) => {
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
                                    <div className="flex flex-col gap-1">
                                        <p className="font-bold text-slate-900">{u.email}</p>
                                        <p className="text-slate-500 text-xs">{u.name}</p>
                                        <div className="flex gap-1 mt-1">
                                            {u.isVerified ? (
                                                <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-700 rounded text-[10px] font-bold">Đã xác thực</span>
                                            ) : (
                                                <span className="px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded text-[10px] font-bold">Chưa xác thực</span>
                                            )}
                                            {u.isLocked && (
                                                <span className="px-1.5 py-0.5 bg-red-100 text-red-700 rounded text-[10px] font-bold">Bị khóa</span>
                                            )}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <select value={u.role} onChange={e => handleUpdate(u.id, 'role', e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold outline-none">
                                        <option value="USER">USER</option>
                                        <option value="TEACHER">TEACHER</option>
                                        <option value="ADMIN">ADMIN</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4">
                                    <select value={u.tier} onChange={e => handleUpdate(u.id, 'tier', e.target.value)} className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-bold outline-none">
                                        <option value="FREE">FREE</option>
                                        <option value="PRO">PRO</option>
                                        <option value="PREMIUM">PREMIUM</option>
                                        <option value="EDU">EDU</option>
                                        <option value="TEACHER">TEACHER</option>
                                    </select>
                                </td>
                                <td className="px-6 py-4 flex justify-end gap-2 items-center h-full">
                                    <button 
                                        onClick={() => handleUpdate(u.id, 'isLocked', !u.isLocked)} 
                                        className={`px-3 py-1.5 rounded-lg text-xs font-bold ${u.isLocked ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                                    >
                                        {u.isLocked ? 'Mở khóa' : 'Khóa'}
                                    </button>
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
    const [configs, setConfigs] = useState<Record<string, string>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch('/api/admin/config').then(res => res.json()).then(data => {
            if (!data.error) setConfigs(data);
            setLoading(false);
        });
    }, []);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        const payload = Object.keys(configs).map(key => ({ key, value: configs[key] }));
        await fetch('/api/admin/config', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ configs: payload })
        });
        alert('Đã lưu cấu hình!');
    };

    const handleReset = async (type: 'exercises' | 'users' | 'all') => {
        const msgs = {
            'exercises': 'Bạn có chắc muốn XÓA TOÀN BỘ bài tập và bài làm không?',
            'users': 'Bạn có chắc muốn XÓA TOÀN BỘ người dùng (trừ Admin) không?',
            'all': 'CẢNH BÁO ĐỎ: Khôi phục cài đặt gốc sẽ xóa SẠCH toàn bộ hệ thống (trừ Admin). Bạn chắc chứ?'
        };
        if (!confirm(msgs[type])) return;
        if (type === 'all' && prompt('Nhập "RESET" để xác nhận:') !== 'RESET') return;

        try {
            const res = await fetch('/api/admin/reset', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type })
            });
            const data = await res.json();
            if (data.success) alert(data.message);
            else alert('Lỗi: ' + data.error);
        } catch (e) {
            alert('Lỗi kết nối.');
        }
    };

    if (loading) return <p className="text-slate-500 mt-10 text-center">Đang tải cấu hình...</p>;

    return (
        <div className="space-y-6 max-w-3xl">
            <h2 className="text-2xl font-bold">Cài đặt chung & Thanh toán</h2>
            <form onSubmit={handleSave} className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 space-y-6">
                <div>
                    <h3 className="text-lg font-bold mb-4 text-blue-600">Thông tin Ngân hàng (Để User chuyển khoản)</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Tên Ngân hàng (VD: Vietcombank)</label>
                            <input value={configs.bankName || ''} onChange={e => setConfigs({ ...configs, bankName: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="Ngân hàng TMCP..." />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Số Tài Khoản</label>
                            <input value={configs.bankAccount || ''} onChange={e => setConfigs({ ...configs, bankAccount: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Chủ Tài Khoản</label>
                            <input value={configs.accountHolder || ''} onChange={e => setConfigs({ ...configs, accountHolder: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Link Ảnh Mã QR Code</label>
                            <input placeholder="https://..." value={configs.bankQRUrl || ''} onChange={e => setConfigs({ ...configs, bankQRUrl: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none" />
                            <p className="text-xs text-slate-500 mt-1">Gợi ý: Up ảnh QR lên Imgur hoặc các trang lưu ảnh, sau đó dán link trực tiếp có đuôi .png/.jpg vào đây.</p>
                        </div>
                    </div>
                </div>

                <div className="pt-6 border-t border-slate-200">
                    <h3 className="text-lg font-bold mb-4">Các thông tin khác</h3>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Tên Website</label>
                            <input value={configs.siteName || 'IELTS Mastery'} onChange={e => setConfigs({ ...configs, siteName: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold mb-1 text-slate-700">Link Group Cộng Đồng (Zalo/FB)</label>
                            <input value={configs.communityLink || ''} onChange={e => setConfigs({ ...configs, communityLink: e.target.value })} className="w-full px-4 py-2 border rounded-lg outline-none" placeholder="https://zalo.me/g/..." />
                        </div>
                    </div>
                </div>

                <button type="submit" className="bg-blue-600 text-white px-6 py-2.5 rounded-xl font-semibold shadow-sm hover:bg-blue-700 mt-4">
                    Lưu cấu hình
                </button>
            </form>

            <h2 className="text-2xl font-bold text-red-600 mt-10">Làm sạch hệ thống (Danger Zone)</h2>
            <div className="bg-red-50 rounded-2xl shadow-sm border border-red-200 p-8 space-y-6">
                <div>
                    <h3 className="text-lg font-bold mb-2 text-red-700">Tùy chọn Reset</h3>
                    <p className="text-sm text-red-600 mb-6">Hành động này không thể hoàn tác. Vui lòng cẩn trọng!</p>
                    
                    <div className="grid gap-4 md:grid-cols-3">
                        <button onClick={() => handleReset('exercises')} className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-red-200 hover:border-red-500 hover:bg-red-50 p-4 rounded-xl transition text-red-700 font-bold">
                            <Trash2 className="h-6 w-6" />
                            Xóa toàn bộ Bài Tập
                        </button>
                        <button onClick={() => handleReset('users')} className="flex flex-col items-center justify-center gap-2 bg-white border-2 border-red-200 hover:border-red-500 hover:bg-red-50 p-4 rounded-xl transition text-red-700 font-bold">
                            <Users className="h-6 w-6" />
                            Xóa toàn bộ Users
                        </button>
                        <button onClick={() => handleReset('all')} className="flex flex-col items-center justify-center gap-2 bg-red-600 border-2 border-red-600 hover:bg-red-700 text-white p-4 rounded-xl transition font-bold shadow-md">
                            <Shield className="h-6 w-6" />
                            Khôi phục Cài đặt gốc
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ───────────────────────────────────────────────
// ACTIVITY LOGS MANAGER
// ───────────────────────────────────────────────

function ActivityLogsManager() {
    const [logs, setLogs] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchLogs = async () => {
        setLoading(true);
        const res = await fetch("/api/admin/logs");
        if (res.ok) setLogs(await res.json());
        setLoading(false);
    };

    useEffect(() => { fetchLogs(); }, []);

    const getLogIcon = (type: string) => {
        switch (type) {
            case 'ACCOUNT': return <Users className="w-5 h-5 text-blue-500" />;
            case 'POST': return <FileText className="w-5 h-5 text-emerald-500" />;
            case 'SECURITY': return <Shield className="w-5 h-5 text-orange-500" />;
            case 'BUG': return <Bug className="w-5 h-5 text-red-500" />;
            default: return <Activity className="w-5 h-5 text-slate-500" />;
        }
    };

    const getLogColor = (type: string) => {
        switch (type) {
            case 'ACCOUNT': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'POST': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
            case 'SECURITY': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'BUG': return 'bg-red-100 text-red-700 border-red-200';
            default: return 'bg-slate-100 text-slate-700 border-slate-200';
        }
    };

    const getLogLabel = (type: string) => {
        switch (type) {
            case 'ACCOUNT': return 'Tài khoản';
            case 'POST': return 'Bài đăng';
            case 'SECURITY': return 'Bảo mật';
            case 'BUG': return 'Báo lỗi';
            default: return 'Khác';
        }
    };

    if (loading) return <div className="flex justify-center py-20"><Loader2 className="animate-spin h-8 w-8 text-blue-600" /></div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Activity className="h-6 w-6 text-slate-700" /> Nhật ký hoạt động ({logs.length})
                </h2>
                <button onClick={fetchLogs} className="text-sm text-blue-600 hover:underline">Làm mới</button>
            </div>
            {logs.length === 0 ? (
                <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center text-slate-400">
                    Chưa có nhật ký hoạt động nào.
                </div>
            ) : (
                <div className="space-y-3">
                    {logs.map(log => (
                        <div key={log.id} className="bg-white rounded-xl border border-slate-200 p-5 flex gap-4">
                            <div className="shrink-0 bg-slate-50 p-2 rounded-xl border border-slate-100">
                                {getLogIcon(log.type)}
                            </div>
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`px-2 py-0.5 rounded text-[11px] font-bold uppercase border ${getLogColor(log.type)}`}>
                                        {getLogLabel(log.type)}
                                    </span>
                                    <span className="text-xs text-slate-500">
                                        {new Date(log.createdAt).toLocaleString("vi-VN")}
                                    </span>
                                </div>
                                <p className="text-slate-700 text-sm whitespace-pre-wrap">{log.message}</p>
                                {log.userId && (
                                    <p className="text-xs text-slate-400 mt-1">ID Người dùng: {log.userId}</p>
                                )}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

function PracticeManager() {
    const [sets, setSets] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [tab, setTab] = useState<'SINGLE' | 'COMBO'>('SINGLE');
    const [editing, setEditing] = useState<any>(null);
    const [jsonStr, setJsonStr] = useState("");

    // Live parsing for preview
    let parsedPreview = null;
    try { parsedPreview = JSON.parse(jsonStr); } catch { }

    useEffect(() => {
        fetch('/api/admin/practice').then(r => r.json()).then(data => {
            if (Array.isArray(data)) setSets(data);
            setLoading(false);
        });
    }, []);

    const handleDelete = async (id: string) => {
        if (!confirm('Xóa bài tập này?')) return;
        await fetch(`/api/admin/practice?id=${id}`, { method: 'DELETE' });
        setSets(sets.filter(s => s.id !== id));
    };

    const handleEdit = (s: any) => {
        setEditing(s);
        setJsonStr(s.content);
    };

    const handleSave = async () => {
        try {
            JSON.parse(jsonStr); // validate
            // For saving, we can create a PUT endpoint or just delete and recreate.
            // Since we don't have PUT in practice API, let's just alert for now.
            // Wait, we can implement PUT in /api/admin/practice/route.ts
            const res = await fetch('/api/admin/practice', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: editing.id, contentJSON: JSON.parse(jsonStr) })
            });
            if (res.ok) {
                alert('Đã lưu thành công');
                setSets(sets.map(x => x.id === editing.id ? { ...x, content: jsonStr } : x));
                setEditing(null);
            } else {
                alert('Lỗi khi lưu');
            }
        } catch (e) {
            alert('JSON không hợp lệ');
        }
    };

    const singles = sets.filter(s => s.skill !== 'COMBO');
    const combos = sets.filter(s => s.skill === 'COMBO');

    if (editing) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <h2 className="text-xl font-bold">Sửa bài tập: {editing.title}</h2>
                    <div className="flex gap-2">
                        <button onClick={() => setEditing(null)} className="px-4 py-2 bg-slate-100 text-slate-700 rounded-lg">Hủy</button>
                        <button onClick={handleSave} className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2"><Save className="h-4 w-4" /> Lưu lại</button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-6 h-[70vh]">
                    <div className="flex flex-col h-full bg-slate-900 rounded-xl p-4 overflow-hidden">
                        <h3 className="text-white font-mono text-sm mb-2 opacity-80">Trình soạn thảo JSON</h3>
                        <textarea value={jsonStr} onChange={e => setJsonStr(e.target.value)}
                            className="flex-1 w-full bg-slate-800 text-emerald-400 font-mono text-sm p-4 outline-none rounded-lg resize-none" />
                    </div>
                    <div className="h-full bg-white rounded-xl border border-slate-200 overflow-y-auto p-6 shadow-inner">
                        <h3 className="font-bold text-slate-800 mb-4 border-b pb-2">Live Preview (Mô phỏng UI)</h3>
                        {!parsedPreview ? (
                            <p className="text-red-500 text-sm font-semibold flex items-center gap-2"><AlertCircle className="h-4 w-4"/> JSON lỗi cú pháp</p>
                        ) : (
                            <div className="space-y-6 pointer-events-none opacity-90">
                                {/* Basic Preview Renderer */}
                                {editing.skill === 'READING' && parsedPreview.passages?.map((p: any, i: number) => (
                                    <div key={i} className="border p-4 rounded-lg bg-slate-50">
                                        <h4 className="font-bold text-blue-800 mb-2">{p.title || `Passage ${i+1}`}</h4>
                                        <div className="text-sm text-slate-600 line-clamp-3 mb-4">{p.text}</div>
                                        <div className="space-y-2">
                                            {p.questions?.map((q: any, qi: number) => (
                                                <div key={qi} className="bg-white p-2 rounded border text-sm">
                                                    <span className="font-bold mr-2">{q.id || qi+1}.</span> {q.text}
                                                    <div className="text-emerald-600 text-xs font-bold mt-1">Đáp án: {q.type === 'multi-mcq' ? q.answers?.join(', ') : q.answer}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                                {editing.skill === 'LISTENING' && (
                                    <div className="border p-4 rounded-lg bg-slate-50">
                                        {parsedPreview.audioUrl && <audio controls src={parsedPreview.audioUrl} className="w-full mb-4" />}
                                        <div className="space-y-2">
                                            {parsedPreview.parts?.flatMap((p:any) => p.questions).map((q: any, qi: number) => q && (
                                                <div key={qi} className="bg-white p-2 rounded border text-sm">
                                                    <span className="font-bold mr-2">{q.id || qi+1}.</span> {q.text}
                                                    <div className="text-emerald-600 text-xs font-bold mt-1">Đáp án: {q.type === 'multi-mcq' ? q.answers?.join(', ') : q.answer}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                {(editing.skill === 'WRITING' || editing.skill === 'SPEAKING') && (
                                    <pre className="text-xs text-slate-700 whitespace-pre-wrap">{JSON.stringify(parsedPreview, null, 2)}</pre>
                                )}
                                {editing.skill === 'COMBO' && (
                                    <div className="grid grid-cols-2 gap-4">
                                        {['reading', 'listening', 'writing', 'speaking'].map(s => parsedPreview[s] && (
                                            <div key={s} className="p-4 border rounded bg-orange-50 capitalize font-bold text-orange-800">
                                                {s} Section <span className="text-xs font-normal text-slate-500 block">Đã có dữ liệu</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold">Bài tập (Practice Sets)</h2>
                <div className="flex gap-3">
                    <Link href="/admin/import" className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-emerald-700">
                        <FileText className="h-4 w-4" /> Import JSON
                    </Link>
                    <Link href="/admin/upload" className="flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700">
                        <Plus className="h-4 w-4" /> Thêm bài mới
                    </Link>
                </div>
            </div>
            
            <div className="flex gap-4 border-b border-slate-200 pb-2">
                <button onClick={() => setTab('SINGLE')} className={`px-4 py-2 font-bold ${tab === 'SINGLE' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-500'}`}>Bài tập Lẻ ({singles.length})</button>
                <button onClick={() => setTab('COMBO')} className={`px-4 py-2 font-bold ${tab === 'COMBO' ? 'text-orange-600 border-b-2 border-orange-600' : 'text-slate-500'}`}>Full Combo ({combos.length})</button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
                {loading ? <p>Đang tải...</p> : (tab === 'SINGLE' ? singles : combos).map(s => (
                    <div key={s.id} className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 relative">
                        <div className="flex justify-between items-start mb-3">
                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-bold rounded">{s.skill}</span>
                            <span className="text-xs text-slate-400">{new Date(s.createdAt).toLocaleDateString('vi-VN')}</span>
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg mb-1">{s.title}</h3>
                        <p className="text-slate-500 text-sm mb-4">{s.difficulty}</p>
                        <div className="flex gap-2">
                            <button onClick={() => handleEdit(s)} className="flex-1 bg-slate-100 text-slate-700 py-1.5 rounded-lg font-semibold flex items-center justify-center gap-1 hover:bg-slate-200 text-sm">
                                <Edit2 className="h-4 w-4" /> Sửa UI
                            </button>
                            <button onClick={() => handleDelete(s.id)} className="px-3 bg-red-50 text-red-600 rounded-lg hover:bg-red-100">
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
