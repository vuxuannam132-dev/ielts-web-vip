"use client";

import React, { useState, useEffect, useRef } from "react";
import { Highlighter, Trash2 } from "lucide-react";

interface FloatingTextHighlighterProps {
    children: React.ReactNode;
    className?: string;
}

export default function FloatingTextHighlighter({ children, className = "" }: FloatingTextHighlighterProps) {
    const containerRef = useRef<HTMLDivElement>(null);
    const [toolbarPos, setToolbarPos] = useState<{ top: number; left: number } | null>(null);
    const [selectedRange, setSelectedRange] = useState<Range | null>(null);

    const handleMouseUp = () => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.rangeCount) {
            setToolbarPos(null);
            setSelectedRange(null);
            return;
        }

        const range = selection.getRangeAt(0);
        if (!containerRef.current || !containerRef.current.contains(range.commonAncestorContainer)) {
            setToolbarPos(null);
            setSelectedRange(null);
            return;
        }

        const rect = range.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();

        setToolbarPos({
            top: rect.top - containerRect.top - 42,
            left: rect.left - containerRect.left + rect.width / 2 - 40,
        });
        setSelectedRange(range.cloneRange());
    };

    const applyHighlight = () => {
        if (!selectedRange) return;
        try {
            const span = document.createElement("mark");
            span.className = "bg-yellow-200/90 text-slate-900 rounded px-0.5 shadow-sm cursor-pointer border-b border-yellow-400 hover:bg-yellow-300 transition";
            span.title = "Ấn để xóa Highlight";
            span.onclick = (e) => {
                e.stopPropagation();
                const parent = span.parentNode;
                if (parent) {
                    while (span.firstChild) parent.insertBefore(span.firstChild, span);
                    parent.removeChild(span);
                }
            };
            selectedRange.surroundContents(span);
        } catch {
            // Fallback for multi-node selection
            const span = document.createElement("span");
            span.className = "bg-yellow-200/90 text-slate-900 rounded px-0.5";
            span.appendChild(selectedRange.extractContents());
            selectedRange.insertNode(span);
        }
        window.getSelection()?.removeAllRanges();
        setToolbarPos(null);
        setSelectedRange(null);
    };

    return (
        <div ref={containerRef} onMouseUp={handleMouseUp} className={`relative ${className}`}>
            {toolbarPos && (
                <div
                    style={{ top: `${Math.max(0, toolbarPos.top)}px`, left: `${Math.max(0, toolbarPos.left)}px` }}
                    className="absolute z-30 flex items-center gap-1 bg-slate-900 text-white px-2.5 py-1.5 rounded-lg shadow-xl border border-slate-700 animate-fade-in text-xs font-semibold">
                    <button
                        onClick={applyHighlight}
                        className="flex items-center gap-1 hover:text-amber-300 transition px-1.5 py-0.5 rounded hover:bg-slate-800">
                        <Highlighter className="h-3.5 w-3.5 text-amber-400" /> Highlight
                    </button>
                </div>
            )}
            {children}
        </div>
    );
}
