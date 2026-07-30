"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, RotateCw, ChevronRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function FlashcardStudyPage() {
    const { id } = useParams();
    const router = useRouter();
    const [setInfo, setSetInfo] = useState<any>(null);
    const [cards, setCards] = useState<any[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isFlipped, setIsFlipped] = useState(false);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetch(`/api/flashcards?id=${id}`)
            .then(res => res.json())
            .then(data => {
                setSetInfo(data);
                setCards(data.cards || []);
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [id]);

    const handleNext = () => {
        if (isFlipped) {
            setIsFlipped(false);
            setTimeout(() => {
                setCurrentIndex(prev => prev + 1);
            }, 300); // Wait for unflip before changing content
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    if (isLoading) {
        return <div className="p-20 text-center animate-pulse">Loading Flashcards...</div>;
    }

    if (!setInfo || cards.length === 0) {
        return <div className="p-20 text-center text-slate-500">Không tìm thấy bộ từ vựng hoặc chưa có từ nào!</div>;
    }

    const isFinished = currentIndex >= cards.length;

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-8 min-h-[80vh] flex flex-col">
            <div className="flex items-center gap-4">
                <Link href="/dashboard/practice/flashcards" className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div>
                    <h1 className="text-xl font-bold text-slate-900">{setInfo.title}</h1>
                    <p className="text-xs text-slate-500">Học từ vựng (Thẻ {isFinished ? cards.length : currentIndex + 1} / {cards.length})</p>
                </div>
            </div>

            <div className="flex-1 flex flex-col items-center justify-center w-full">
                {isFinished ? (
                    <div className="text-center space-y-6 animate-in slide-in-from-bottom-8 duration-700 bg-white p-10 rounded-3xl border border-slate-200 shadow-xl w-full max-w-lg">
                        <div className="w-24 h-24 bg-emerald-100 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle2 className="h-12 w-12 text-emerald-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-bold text-slate-800">Hoàn thành bài học!</h2>
                            <p className="text-slate-500 mt-2">Bạn đã xem qua tất cả {cards.length} từ vựng. Đã đến lúc kiểm tra trí nhớ của bạn.</p>
                        </div>
                        <div className="pt-4 flex flex-col gap-3">
                            <Button 
                                onClick={() => router.push(`/dashboard/practice/flashcards/${id}/quiz`)}
                                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-6 rounded-2xl shadow-lg shadow-indigo-500/30 text-lg">
                                Ôn Tập (Quiz Mode)
                            </Button>
                            <Button 
                                onClick={() => { setCurrentIndex(0); setIsFlipped(false); }}
                                variant="outline" 
                                className="w-full py-6 rounded-2xl font-bold text-slate-600">
                                Học lại từ đầu
                            </Button>
                        </div>
                    </div>
                ) : (
                    <div className="w-full max-w-lg perspective-1000">
                        {/* The 3D Flipping Card */}
                        <div 
                            className={`relative w-full aspect-[4/3] transition-all duration-500 transform-style-3d cursor-pointer shadow-xl rounded-3xl ${isFlipped ? 'rotate-y-180' : ''}`}
                            onClick={() => setIsFlipped(!isFlipped)}
                        >
                            {/* Front of card (English) */}
                            <div className="absolute inset-0 backface-hidden bg-white rounded-3xl border-2 border-indigo-100 flex flex-col items-center justify-center p-8 text-center space-y-4">
                                <span className="text-4xl md:text-5xl font-black text-slate-800 tracking-tight">{cards[currentIndex].term}</span>
                                {cards[currentIndex].ipa && (
                                    <span className="text-lg md:text-xl font-mono text-indigo-500 bg-indigo-50 px-4 py-1.5 rounded-full">/{cards[currentIndex].ipa}/</span>
                                )}
                                <div className="absolute bottom-6 text-xs text-slate-400 font-medium flex items-center gap-1 opacity-60">
                                    <RotateCw className="h-3 w-3" /> Chạm để lật
                                </div>
                            </div>

                            {/* Back of card (Vietnamese) */}
                            <div className="absolute inset-0 backface-hidden bg-indigo-600 rounded-3xl flex flex-col items-center justify-center p-8 text-center space-y-4 rotate-y-180 shadow-inner">
                                <span className="text-3xl md:text-4xl font-bold text-white leading-tight">{cards[currentIndex].meaning}</span>
                                <div className="absolute bottom-6 text-xs text-indigo-200 font-medium flex items-center gap-1 opacity-80">
                                    <RotateCw className="h-3 w-3" /> Chạm để lật lại
                                </div>
                            </div>
                        </div>

                        <div className="mt-8 flex justify-center gap-4">
                            <Button 
                                onClick={handleNext}
                                className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-2xl shadow-xl flex items-center gap-2 transition-transform active:scale-95">
                                Trượt sang thẻ tiếp theo <ChevronRight className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>
                )}
            </div>
            
            {/* Custom CSS for 3D Flips */}
            <style dangerouslySetInnerHTML={{__html: `
                .perspective-1000 { perspective: 1000px; }
                .transform-style-3d { transform-style: preserve-3d; }
                .backface-hidden { backface-visibility: hidden; }
                .rotate-y-180 { transform: rotateY(180deg); }
            `}} />
        </div>
    );
}
