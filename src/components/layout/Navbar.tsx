"use client";

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useState } from 'react';
import { BrainCircuit, LayoutDashboard, LogOut, User, ChevronDown, Shield, Menu, X, Zap, GraduationCap } from 'lucide-react';

export function Navbar() {
    const { data: session } = useSession();
    const [menuOpen, setMenuOpen] = useState(false);
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const user = session?.user as { name?: string; email?: string; role?: string; tier?: string } | undefined;

    const tierBadge: Record<string, { label: string; cls: string }> = {
        FREE: { label: 'Free', cls: 'bg-slate-100 text-slate-600' },
        PRO: { label: 'Pro', cls: 'bg-blue-100 text-blue-700' },
        PREMIUM: { label: 'Premium', cls: 'bg-gradient-to-r from-amber-400 to-orange-500 text-white' },
    };
    const badge = tierBadge[user?.tier ?? 'FREE'];

    return (
        <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80 shadow-sm">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex h-16 items-center justify-between">

                {/* Logo */}
                <Link href="/" className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center">
                        <BrainCircuit className="h-5 w-5 text-white" />
                    </div>
                    <span className="font-bold text-xl tracking-tight bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                        IELTS SKIBIDI
                    </span>
                </Link>

                {/* Desktop nav */}
                <nav className="hidden md:flex items-center gap-6">
                    {session ? (
                        <>
                            <Link href="/dashboard" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                                <LayoutDashboard className="h-4 w-4" /> Dashboard
                            </Link>
                            {user?.role === 'ADMIN' && (
                                <Link href="/admin" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                                    <Shield className="h-4 w-4" /> Admin
                                </Link>
                            )}
                            {(user?.role === 'TEACHER' || user?.role === 'ADMIN') && (
                                <Link href="/teacher" className="flex items-center gap-1.5 text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">
                                    <GraduationCap className="h-4 w-4" /> Lớp học
                                </Link>
                            )}
                            {/* User dropdown */}
                            <div className="relative">
                                <button
                                    onClick={() => setDropdownOpen(!dropdownOpen)}
                                    className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-100 transition-colors"
                                >
                                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white text-sm font-bold">
                                        {user?.name?.[0]?.toUpperCase() ?? 'U'}
                                    </div>
                                    <div className="text-left hidden lg:block">
                                        <p className="text-sm font-semibold text-slate-800 leading-none">{user?.name}</p>
                                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded mt-0.5 inline-block ${badge?.cls}`}>{badge?.label}</span>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-slate-400" />
                                </button>

                                {dropdownOpen && (
                                    <>
                                        <div className="fixed inset-0" onClick={() => setDropdownOpen(false)} />
                                        <div className="absolute right-0 mt-2 w-52 bg-white rounded-xl border border-slate-200 shadow-lg py-1 z-50">
                                            <div className="px-4 py-2 border-b border-slate-100">
                                                <p className="text-sm font-semibold text-slate-800">{user?.name}</p>
                                                <p className="text-xs text-slate-500 truncate">{user?.email}</p>
                                            </div>
                                            <Link href="/account" onClick={() => setDropdownOpen(false)}
                                                className="flex items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 transition">
                                                <User className="h-4 w-4" /> Tài khoản
                                            </Link>
                                            {user?.tier === 'FREE' && (
                                                <Link href="/#pricing" onClick={() => setDropdownOpen(false)}
                                                    className="flex items-center gap-2 px-4 py-2 text-sm text-amber-600 hover:bg-amber-50 transition font-medium">
                                                    <Zap className="h-4 w-4" /> Nâng cấp VIP
                                                </Link>
                                            )}
                                            <button
                                                onClick={() => { setDropdownOpen(false); signOut({ callbackUrl: '/' }); }}
                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition"
                                            >
                                                <LogOut className="h-4 w-4" /> Đăng xuất
                                            </button>
                                        </div>
                                    </>
                                )}
                            </div>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="text-sm font-medium text-slate-600 hover:text-blue-600 transition-colors">Đăng nhập</Link>
                            <Link href="/register" className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-sm font-semibold rounded-lg hover:opacity-90 transition">
                                Bắt đầu miễn phí
                            </Link>
                        </>
                    )}
                </nav>

                {/* Mobile hamburger */}
                <button className="md:hidden p-2 rounded-lg hover:bg-slate-100" onClick={() => setMenuOpen(!menuOpen)}>
                    {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
                </button>
            </div>

            {/* Mobile menu */}
            {menuOpen && (
                <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-2">
                    {session ? (
                        <>
                            <Link href="/dashboard" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                                <LayoutDashboard className="h-4 w-4" /> Dashboard
                            </Link>
                            <Link href="/account" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>
                                <User className="h-4 w-4" /> Tài khoản
                            </Link>
                            {user?.tier === 'FREE' && (
                                <Link href="/#pricing" className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-amber-600 hover:bg-amber-50" onClick={() => setMenuOpen(false)}>
                                    <Zap className="h-4 w-4" /> Nâng cấp VIP 🔥
                                </Link>
                            )}
                            <button onClick={() => signOut({ callbackUrl: '/' })} className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50">
                                <LogOut className="h-4 w-4" /> Đăng xuất
                            </button>
                        </>
                    ) : (
                        <>
                            <Link href="/login" className="block px-3 py-2 rounded-lg text-sm font-medium text-slate-700 hover:bg-slate-50" onClick={() => setMenuOpen(false)}>Đăng nhập</Link>
                            <Link href="/register" className="block px-3 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white text-center" onClick={() => setMenuOpen(false)}>Bắt đầu miễn phí</Link>
                        </>
                    )}
                </div>
            )}
        </header>
    );
}
