"use client";

import React, { useEffect, useState } from 'react';

const quotes = [
    { author: "Chủ tịch Hồ Chí Minh", text: "Non sông Việt Nam có trở nên tươi đẹp hay không, dân tộc Việt Nam có bước tới đài vinh quang để sánh vai với các cường quốc năm châu được hay không, chính là nhờ một phần lớn ở công học tập của các em." },
    { author: "Chủ tịch Hồ Chí Minh", text: "Không có việc gì khó / Chỉ sợ lòng không bền / Đào núi và lấp biển / Quyết chí ắt làm nên." },
    { author: "Chủ tịch Hồ Chí Minh", text: "Học để làm việc, làm người, làm cán bộ. Học để phụng sự đoàn thể, giai cấp và nhân dân, Tổ quốc và nhân loại." },
    { author: "Chủ tịch Hồ Chí Minh", text: "Một năm khởi đầu từ mùa xuân. Một đời khởi đầu từ tuổi trẻ. Tuổi trẻ là mùa xuân của xã hội." },
    { author: "Chủ tịch Hồ Chí Minh", text: "Đường đời là một chiếc thang không có nấc chót; học tập là một quyển vở không có trang cuối cùng." },
    { author: "Đại tướng Võ Nguyên Giáp", text: "Thế hệ cha anh đã rửa được nỗi nhục mất nước, thế hệ thanh niên ngày nay phải rửa được nỗi nhục nghèo nàn, lạc hậu." },
    { author: "Đại tướng Nguyễn Chí Thanh", text: "Cứ đánh, đánh rồi khắc biết." },
    { author: "Tổng Bí thư Nguyễn Phú Trọng", text: "Đời người chỉ sống có một lần, phải sống sao cho có ý nghĩa, để không phải xót xa ân hận vì những năm tháng đã sống hoài, sống phí..." },
    { author: "Cố Thủ tướng Phạm Văn Đồng", text: "Trường học của chúng ta là trường học của thế hệ trẻ, chuẩn bị cho tương lai. Làm tốt việc giáo dục là thiết thực xây dựng đất nước." },
    { author: "Danh nhân văn hóa Nguyễn Trãi", text: "Nên thợ nên thầy vì có học / No ăn no mặc bởi hay làm." },
    { author: "V.I. Lênin", text: "Học, học nữa, học mãi." },
    { author: "Nelson Mandela", text: "Giáo dục là vũ khí mạnh nhất mà bạn có thể dùng để thay đổi thế giới." },
    { author: "Albert Einstein", text: "Đừng cố gắng trở thành một người thành công, hãy cố gắng trở thành một người có giá trị." },
    { author: "Mahatma Gandhi", text: "Hãy sống như thể bạn sẽ chết ngày mai. Hãy học như thể bạn sẽ sống mãi mãi." },
    { author: "Thomas Edison", text: "Thiên tài chỉ có 1% là cảm hứng, 99% còn lại là mồ hôi và nước mắt." },
    { author: "Benjamin Franklin", text: "Đầu tư vào tri thức luôn mang lại lợi tức cao nhất." },
    { author: "Leonardo da Vinci", text: "Học tập không bao giờ làm cạn kiệt trí tuệ." },
    { author: "Malcolm X", text: "Giáo dục là tấm hộ chiếu cho tương lai, bởi vì ngày mai thuộc về những người chuẩn bị cho nó ngay từ hôm nay." },
    { author: "Aristotle", text: "Gốc rễ của việc học hành thì đắng cay, nhưng quả của nó thì ngọt ngào." },
    { author: "Steve Jobs", text: "Hãy cứ khát khao, hãy cứ dại khờ. (Stay hungry, stay foolish)." }
];

interface Props {
    isOpen: boolean;
    onClose: () => void;
}

export default function MotivationalScreen({ isOpen, onClose }: Props) {
    const [quote, setQuote] = useState(quotes[0]);
    const [progress, setProgress] = useState(100);

    useEffect(() => {
        if (isOpen) {
            // Pick a random quote
            const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
            setQuote(randomQuote);
            
            setProgress(100);

            const startTime = Date.now();
            const duration = 8000; // 8 seconds

            const timer = setInterval(() => {
                const elapsed = Date.now() - startTime;
                const remaining = Math.max(0, 100 - (elapsed / duration) * 100);
                setProgress(remaining);
                
                if (elapsed >= duration) {
                    clearInterval(timer);
                    onClose();
                }
            }, 50);

            return () => clearInterval(timer);
        }
    }, [isOpen, onClose]);

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900 text-white animate-in fade-in duration-500 p-6">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-600/20 blur-[100px]" />
                <div className="absolute top-[60%] -right-[10%] w-[40%] h-[40%] rounded-full bg-blue-600/20 blur-[100px]" />
            </div>

            <div className="max-w-4xl w-full z-10 flex flex-col items-center text-center space-y-8 animate-in slide-in-from-bottom-8 duration-700">
                <div className="text-3xl md:text-4xl lg:text-5xl font-bold italic text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-white to-blue-300 leading-snug drop-shadow-lg" style={{ fontFamily: "'Segoe UI', 'Roboto', 'Helvetica Neue', Arial, sans-serif" }}>
                    &ldquo;{quote.text}&rdquo;
                </div>
                
                <div className="text-xl md:text-2xl font-light text-slate-300 border-t border-slate-700 pt-6 mt-6 uppercase tracking-widest">
                    — {quote.author} —
                </div>

                <div className="w-full max-w-md mt-12 flex flex-col items-center space-y-4">
                    <button 
                        onClick={onClose}
                        className="px-8 py-3 bg-white/10 hover:bg-white/20 border border-white/20 rounded-full transition-all font-medium"
                    >
                        Bỏ qua và Tiếp tục
                    </button>
                    
                    {/* Progress bar */}
                    <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden mt-4">
                        <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-75 ease-linear"
                            style={{ width: `${progress}%` }}
                        />
                    </div>
                </div>
                
                <div className="absolute bottom-8 text-sm text-slate-500 font-light">
                    *Bạn có thể tắt tính năng nhắc nhở (motivational) này trong phần Cài đặt
                </div>
            </div>
        </div>
    );
}
