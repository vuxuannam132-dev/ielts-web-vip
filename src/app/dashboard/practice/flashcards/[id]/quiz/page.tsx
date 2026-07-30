"use client";

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ArrowLeft, CheckCircle2, XCircle } from 'lucide-react';
import Link from 'next/link';
import MotivationalScreen from '@/components/practice/MotivationalScreen';
import confetti from 'canvas-confetti';

type QuestionType = 'mcq' | 'typing';

interface QuizQuestion {
    id: string;
    type: QuestionType;
    term: string;
    meaning: string;
    ipa: string | null;
    options?: string[]; // For MCQ: 4 meanings
}

export default function FlashcardQuizPage() {
    const { id } = useParams();
    const router = useRouter();
    
    const [cards, setCards] = useState<any[]>([]);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    
    const [typingInput, setTypingInput] = useState('');
    const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
    const [feedback, setFeedback] = useState<'correct' | 'incorrect' | null>(null);
    
    const [score, setScore] = useState(0);
    const [isFinished, setIsFinished] = useState(false);
    const [showMotivational, setShowMotivational] = useState(false);

    useEffect(() => {
        fetch(`/api/flashcards?id=${id}`)
            .then(res => res.json())
            .then(data => {
                if (data.cards) {
                    setCards(data.cards);
                    generateQuiz(data.cards);
                }
                setIsLoading(false);
            })
            .catch(err => {
                console.error(err);
                setIsLoading(false);
            });
    }, [id]);

    const generateQuiz = (sourceCards: any[]) => {
        // Create 2 questions per card: 1 MCQ and 1 Typing
        let generated: QuizQuestion[] = [];
        
        sourceCards.forEach(card => {
            // Generate MCQ (find 3 wrong meanings)
            let wrongMeanings = sourceCards
                .filter(c => c.id !== card.id)
                .map(c => c.meaning)
                .sort(() => 0.5 - Math.random())
                .slice(0, 3);
            
            // If we don't have enough wrong meanings (e.g., small deck), duplicate some or just use what we have
            if (wrongMeanings.length === 0) wrongMeanings = ["Không có nghĩa", "Nghĩa sai 1", "Nghĩa sai 2"];
            
            const options = [...wrongMeanings, card.meaning].sort(() => 0.5 - Math.random());
            
            generated.push({
                id: card.id + '_mcq',
                type: 'mcq',
                term: card.term,
                meaning: card.meaning,
                ipa: card.ipa,
                options
            });
            
            generated.push({
                id: card.id + '_typing',
                type: 'typing',
                term: card.term,
                meaning: card.meaning,
                ipa: card.ipa
            });
        });

        // Shuffle all questions
        generated = generated.sort(() => 0.5 - Math.random());
        setQuestions(generated);
    };

    const handleAnswerMCQ = (option: string) => {
        if (feedback !== null) return;
        
        setSelectedAnswer(option);
        const q = questions[currentIndex];
        
        if (option === q.meaning) {
            setFeedback('correct');
            setScore(prev => prev + 1);
            setTimeout(nextQuestion, 1500);
        } else {
            setFeedback('incorrect');
            setTimeout(nextQuestion, 2000);
        }
    };

    const handleAnswerTyping = (e: React.FormEvent) => {
        e.preventDefault();
        if (feedback !== null || !typingInput.trim()) return;
        
        const q = questions[currentIndex];
        const isCorrect = typingInput.trim().toLowerCase() === q.term.toLowerCase();
        
        if (isCorrect) {
            setFeedback('correct');
            setScore(prev => prev + 1);
            setTimeout(nextQuestion, 1500);
        } else {
            setFeedback('incorrect');
            setTimeout(nextQuestion, 2000);
        }
    };

    const nextQuestion = () => {
        if (currentIndex + 1 >= questions.length) {
            finishQuiz();
        } else {
            setCurrentIndex(prev => prev + 1);
            setFeedback(null);
            setSelectedAnswer(null);
            setTypingInput('');
        }
    };

    const finishQuiz = () => {
        setIsFinished(true);
        confetti({
            particleCount: 150,
            spread: 80,
            origin: { y: 0.6 },
            colors: ['#10b981', '#3b82f6', '#f59e0b']
        });
    };

    const handleCloseResults = () => {
        const settings = localStorage.getItem('hideMotivational');
        if (settings !== 'true') {
            setShowMotivational(true);
        } else {
            router.push('/dashboard/practice/flashcards');
        }
    };

    if (isLoading) return <div className="p-20 text-center animate-pulse">Đang tải bài kiểm tra...</div>;
    if (questions.length === 0) return <div className="p-20 text-center">Không có câu hỏi nào.</div>;

    if (isFinished) {
        const percentage = Math.round((score / questions.length) * 100);
        return (
            <div className="max-w-2xl mx-auto p-6 mt-10">
                <div className="bg-white p-10 rounded-3xl border border-slate-200 shadow-xl text-center space-y-6 animate-in zoom-in duration-500">
                    <div className="relative w-48 h-48 mx-auto flex items-center justify-center rounded-full border-8 border-slate-100">
                        <div className="absolute inset-0 rounded-full border-8 border-emerald-500" style={{ clipPath: `polygon(0 0, 100% 0, 100% ${percentage}%, 0 ${percentage}%)`, transform: 'rotate(-90deg)' }} />
                        <div className="text-5xl font-black text-slate-800">{percentage}%</div>
                    </div>
                    <div>
                        <h2 className="text-2xl font-bold text-slate-800">Hoàn thành bài kiểm tra!</h2>
                        <p className="text-slate-500 mt-2">Bạn trả lời đúng {score} / {questions.length} câu hỏi.</p>
                    </div>
                    <Button onClick={handleCloseResults} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3 px-8 rounded-xl shadow-lg mt-4">
                        Hoàn tất & Quay lại
                    </Button>
                </div>

                <MotivationalScreen 
                    isOpen={showMotivational} 
                    onClose={() => router.push('/dashboard/practice/flashcards')} 
                />
            </div>
        );
    }

    const q = questions[currentIndex];

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8 space-y-8">
            <div className="flex items-center gap-4">
                <Link href={`/dashboard/practice/flashcards/${id}`} className="p-2 hover:bg-slate-100 rounded-full transition text-slate-500">
                    <ArrowLeft className="h-5 w-5" />
                </Link>
                <div className="flex-1">
                    <div className="flex justify-between text-xs font-bold text-slate-500 mb-2">
                        <span>Câu {currentIndex + 1} / {questions.length}</span>
                        <span>Điểm: {score}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-indigo-500 transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
                    </div>
                </div>
            </div>

            <div className={`bg-white p-8 rounded-3xl border border-slate-200 shadow-sm relative ${feedback === 'incorrect' ? 'animate-shake border-red-300' : ''}`}>
                
                {/* Feedback Animations overlay */}
                {feedback && (
                    <div className="absolute top-4 right-4 z-10 animate-in zoom-in duration-300">
                        {feedback === 'correct' 
                            ? <CheckCircle2 className="h-10 w-10 text-emerald-500 bg-white rounded-full drop-shadow-md" /> 
                            : <XCircle className="h-10 w-10 text-red-500 bg-white rounded-full drop-shadow-md" />
                        }
                    </div>
                )}

                {q.type === 'mcq' ? (
                    <div className="space-y-8 text-center">
                        <div>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Chọn nghĩa của từ</h2>
                            <div className="text-4xl md:text-5xl font-black text-slate-900">{q.term}</div>
                            {q.ipa && <div className="text-indigo-500 font-mono mt-2">/{q.ipa}/</div>}
                        </div>
                        
                        <div className="grid gap-3">
                            {q.options?.map((opt, i) => {
                                let btnClass = "border-slate-200 text-slate-700 hover:border-indigo-300 hover:bg-indigo-50";
                                if (feedback !== null) {
                                    if (opt === q.meaning) {
                                        btnClass = "border-emerald-500 bg-emerald-50 text-emerald-700 font-bold";
                                    } else if (opt === selectedAnswer) {
                                        btnClass = "border-red-500 bg-red-50 text-red-700";
                                    } else {
                                        btnClass = "border-slate-100 text-slate-300 opacity-50";
                                    }
                                }

                                return (
                                    <button 
                                        key={i}
                                        onClick={() => handleAnswerMCQ(opt)}
                                        disabled={feedback !== null}
                                        className={`w-full p-4 rounded-2xl border-2 text-left font-medium transition-all ${btnClass}`}
                                    >
                                        {opt}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    <div className="space-y-8 text-center">
                        <div>
                            <h2 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Nhập từ vựng tiếng Anh</h2>
                            <div className="text-3xl md:text-4xl font-bold text-slate-900">{q.meaning}</div>
                        </div>

                        <form onSubmit={handleAnswerTyping} className="space-y-4">
                            <input
                                type="text"
                                value={typingInput}
                                onChange={(e) => setTypingInput(e.target.value)}
                                disabled={feedback !== null}
                                autoFocus
                                placeholder="Gõ từ tiếng Anh..."
                                className={`w-full text-center text-2xl font-bold p-4 rounded-2xl border-2 outline-none transition-all ${
                                    feedback === 'correct' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' :
                                    feedback === 'incorrect' ? 'border-red-500 bg-red-50 text-red-700' :
                                    'border-slate-300 focus:border-indigo-500'
                                }`}
                            />
                            {feedback === 'incorrect' && (
                                <div className="text-emerald-600 font-bold bg-emerald-50 py-2 rounded-xl border border-emerald-100 animate-in fade-in">
                                    Đáp án đúng: {q.term}
                                </div>
                            )}
                            <Button type="submit" disabled={feedback !== null || !typingInput.trim()} className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-6 rounded-2xl shadow-xl">
                                Kiểm Tra
                            </Button>
                        </form>
                    </div>
                )}
            </div>
            
            {/* Custom animation for shake */}
            <style dangerouslySetInnerHTML={{__html: `
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
                    20%, 40%, 60%, 80% { transform: translateX(5px); }
                }
                .animate-shake { animation: shake 0.5s ease-in-out; }
            `}} />
        </div>
    );
}
