"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Layers, Plus, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function FlashcardsHomePage() {
    const [sets, setSets] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch('/api/flashcards')
            .then(res => res.json())
            .then(data => {
                setSets(data);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, []);

    return (
        <div className="max-w-5xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div>
                    <h1 className="text-3xl font-bold text-slate-900 flex items-center gap-3">
                        <Layers className="h-8 w-8 text-indigo-600" />
                        Thư Viện Flashcards
                    </h1>
                    <p className="text-slate-500 mt-1">Học từ vựng tiếng Anh qua thẻ lật thông minh và bài kiểm tra</p>
                </div>
                
                <Link href="/dashboard/practice/flashcards/admin">
                    <Button variant="outline" className="text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold rounded-xl flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Thêm Bộ Từ Mới
                    </Button>
                </Link>
            </div>

            {isLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {[1, 2, 3].map(i => (
                        <div key={i} className="h-40 bg-slate-100 rounded-2xl animate-pulse"></div>
                    ))}
                </div>
            ) : sets.length === 0 ? (
                <div className="text-center py-20">
                    <p className="text-slate-500 mb-4">Chưa có bộ từ vựng nào.</p>
                    <Link href="/dashboard/practice/flashcards/admin">
                        <Button className="bg-indigo-600 text-white rounded-xl">Tạo bộ đầu tiên</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {sets.map((set) => (
                        <Link key={set.id} href={`/dashboard/practice/flashcards/${set.id}`}>
                            <div className="bg-white border border-slate-200 hover:border-indigo-300 hover:shadow-lg hover:shadow-indigo-500/10 transition-all rounded-2xl p-6 group cursor-pointer h-full flex flex-col">
                                <h3 className="text-lg font-bold text-slate-800 group-hover:text-indigo-600 transition-colors mb-2">{set.title}</h3>
                                {set.description && <p className="text-sm text-slate-500 mb-4 flex-1">{set.description}</p>}
                                <div className="flex items-center justify-between mt-auto pt-4 border-t border-slate-100">
                                    <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full">
                                        {set._count?.cards || 0} từ vựng
                                    </span>
                                    <BookOpen className="h-5 w-5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}
