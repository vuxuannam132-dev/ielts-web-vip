"use client";

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { AlertCircle, CheckCircle2, Info, X } from 'lucide-react';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
    id: string;
    type: ToastType;
    message: string;
}

interface ToastContextType {
    addToast: (type: ToastType, message: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((type: ToastType, message: string) => {
        const id = Math.random().toString(36).substring(2, 9);
        setToasts(prev => [...prev, { id, type, message }]);
        setTimeout(() => {
            setToasts(prev => prev.filter(t => t.id !== id));
        }, 5000);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    return (
        <ToastContext.Provider value={{ addToast }}>
            {children}
            <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 pointer-events-none">
                {toasts.map(toast => {
                    const bg = toast.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                             : toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800'
                             : 'bg-blue-50 border-blue-200 text-blue-800';
                    const Icon = toast.type === 'success' ? CheckCircle2 
                               : toast.type === 'error' ? AlertCircle 
                               : Info;
                    return (
                        <div key={toast.id} className={`flex items-start gap-3 p-4 rounded-xl border shadow-lg pointer-events-auto min-w-[300px] max-w-sm animate-in slide-in-from-right-8 duration-300 ${bg}`}>
                            <Icon className="h-5 w-5 flex-shrink-0 mt-0.5" />
                            <p className="text-sm font-semibold flex-1">{toast.message}</p>
                            <button onClick={() => removeToast(toast.id)} className="text-slate-400 hover:text-slate-600 transition-colors">
                                <X className="h-4 w-4" />
                            </button>
                        </div>
                    );
                })}
            </div>
        </ToastContext.Provider>
    );
}

export function useToast() {
    const context = useContext(ToastContext);
    if (!context) throw new Error('useToast must be used within ToastProvider');
    return context;
}
