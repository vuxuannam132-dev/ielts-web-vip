"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Save, FileSpreadsheet, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import * as XLSX from 'xlsx';

export default function AdminFlashcardUpload() {
    const router = useRouter();
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [rawData, setRawData] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!title.trim() || !rawData.trim()) {
            alert("Vui lòng nhập đủ Tiêu đề và Dữ liệu từ vựng!");
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/flashcards/upload', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title, description, rawData })
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Failed to upload');

            alert(`Đã lưu thành công ${data.count} từ vựng!`);
            router.push('/dashboard/practice');
        } catch (error: any) {
            alert(error.message);
        } finally {
            setIsSubmitting(false);
            setIsSubmitting(false);
        }
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (evt) => {
            try {
                const bstr = evt.target?.result;
                const wb = XLSX.read(bstr, { type: 'binary' });
                const wsname = wb.SheetNames[0];
                const ws = wb.Sheets[wsname];
                
                // Convert to TSV (Tab Separated Values) since our logic expects tab-separated format
                const tsv = XLSX.utils.sheet_to_csv(ws, { FS: "\t", blankrows: false });
                
                // Strip the header row if it contains common header terms
                let lines = tsv.split("\n").filter(l => l.trim().length > 0);
                if (lines.length > 0) {
                    const firstLineLower = lines[0].toLowerCase();
                    if (firstLineLower.includes("tiếng anh") || firstLineLower.includes("english") || firstLineLower.includes("nghĩa") || firstLineLower.includes("từ vựng")) {
                        lines = lines.slice(1);
                    }
                }
                
                setRawData(lines.join("\n"));
            } catch (error) {
                alert("Lỗi đọc file Excel. Vui lòng đảm bảo file đúng định dạng.");
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8 animate-in fade-in duration-500">
            <div className="flex items-center gap-4 border-b border-slate-200 pb-4">
                <Link href="/dashboard/practice" className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Thêm Bộ Từ Vựng Flashcard</h1>
                    <p className="text-sm text-slate-500">Copy từ Google Sheets (3 cột: Tiếng Anh, Tiếng Việt, IPA) và dán vào ô bên dưới.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Tên bộ từ vựng (Chủ đề) <span className="text-red-500">*</span></label>
                        <input 
                            value={title} 
                            onChange={(e: any) => setTitle(e.target.value)} 
                            placeholder="Ví dụ: IELTS Vocabulary - Education" 
                            className="w-full px-3 py-2 border rounded-md bg-white border-slate-300 outline-none focus:border-indigo-500"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-slate-700 mb-1">Mô tả (Không bắt buộc)</label>
                        <input 
                            value={description} 
                            onChange={(e: any) => setDescription(e.target.value)} 
                            placeholder="Ví dụ: Các từ vựng chủ đề giáo dục thường gặp trong Writing Task 2" 
                            className="w-full px-3 py-2 border rounded-md bg-white border-slate-300 outline-none focus:border-indigo-500"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                        <FileSpreadsheet className="h-4 w-4 text-emerald-600" />
                        Dữ liệu từ vựng (Upload Excel hoặc Paste) <span className="text-red-500">*</span>
                    </label>
                    <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-xs text-amber-800 space-y-1 mb-2">
                        <p><strong>Cách 1 (Upload File):</strong> Chọn file Excel (.xlsx) có 3 cột: <code>Tiếng Anh | Tiếng Việt | Phiên âm IPA</code>. Hệ thống sẽ tự trích xuất dữ liệu.</p>
                        <p><strong>Cách 2 (Copy/Paste):</strong> Bôi đen 3 cột trong Google Sheets/Excel, sau đó Copy (Ctrl+C) và Paste (Ctrl+V) vào ô dưới đây.</p>
                        <p className="text-amber-600 italic">Mỗi dòng là một từ. Có thể bỏ qua cột IPA nếu không có.</p>
                    </div>
                    
                    <div className="mb-4">
                        <input 
                            type="file" 
                            accept=".xlsx, .xls, .csv" 
                            onChange={handleFileUpload}
                            className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-emerald-50 file:text-emerald-700 hover:file:bg-emerald-100 cursor-pointer"
                        />
                    </div>

                    <textarea 
                        value={rawData}
                        onChange={(e: any) => setRawData(e.target.value)}
                        placeholder="Paste dữ liệu vào đây..."
                        className="w-full p-3 h-64 font-mono text-sm bg-white border rounded-md border-slate-300 whitespace-pre outline-none focus:border-indigo-500"
                    />
                </div>

                <div className="flex justify-end">
                    <Button 
                        type="submit" 
                        disabled={isSubmitting}
                        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 px-6 rounded-xl shadow-md flex items-center gap-2">
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Đang lưu...' : 'Lưu Bộ Flashcard'}
                    </Button>
                </div>
            </form>
        </div>
    );
}
