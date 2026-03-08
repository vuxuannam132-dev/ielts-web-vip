import Link from 'next/link';
import { BrainCircuit, Star, BarChart3, Clock, Users, Shield, ArrowRight, CheckCircle2, Mic, PenTool, BookOpen, Headphones } from 'lucide-react';
import { prisma } from '@/lib/prisma';
import { auth } from '@/auth';

export default async function Home() {
  const session = await auth();
  const isLoggedIn = !!session?.user;

  const packages = await prisma.package.findMany({
    where: { isActive: true },
    orderBy: { price: 'asc' }
  });

  const getPackageStyle = (code: string) => {
    switch (code) {
      case 'PRO':
        return "bg-gradient-to-b from-blue-600 to-indigo-700 rounded-3xl p-8 border border-blue-600 shadow-xl shadow-blue-900/20 flex flex-col relative transform md:-translate-y-4 text-white";
      case 'PREMIUM':
        return "bg-slate-900 rounded-3xl p-8 shadow-xl flex flex-col text-white";
      default:
        return "bg-white rounded-3xl p-8 border border-slate-200 shadow-sm flex flex-col text-slate-900";
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans selection:bg-blue-200">
      {/* Hero Section */}
      <section className="relative pt-24 pb-32 overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] -z-10" />
        <div className="absolute top-0 right-0 -translate-y-1/4 translate-x-1/4 w-[800px] h-[800px] bg-blue-100 rounded-full blur-3xl opacity-50 -z-10 animate-pulse-soft" />
        <div className="absolute bottom-0 left-0 translate-y-1/4 -translate-x-1/4 w-[600px] h-[600px] bg-indigo-100 rounded-full blur-3xl opacity-50 -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-sm font-semibold mb-8 animate-float">
            <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
            Nền tảng luyện thi IELTS ứng dụng AI #1
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-loose mb-6 text-balance">
            Chinh phục <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">IELTS 8.0</span> <br className="hidden md:block" /> dễ dàng hơn bao giờ hết
          </h1>
          <p className="mt-4 text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed text-balance">
            Trải nghiệm không gian học chuẩn quốc tế với AI mô phỏng cựu giám khảo chấm điểm Writing & Speaking chi tiết theo 4 tiêu chí.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row justify-center gap-4">
            <Link href={isLoggedIn ? "/dashboard" : "/register"} className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-2xl hover:shadow-xl hover:shadow-blue-600/30 transition-all hover:-translate-y-1 flex items-center justify-center gap-2 text-lg">
              {isLoggedIn ? "Vào Dashboard" : "Bắt đầu luyện đề :)"} <ArrowRight className="h-5 w-5" />
            </Link>
            <Link href="#features" className="px-8 py-4 bg-white text-slate-700 font-bold rounded-2xl border border-slate-200 hover:border-slate-300 hover:bg-slate-50 transition-all flex items-center justify-center gap-2 text-lg">
              Tìm hiểu thêm
            </Link>
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto pt-8 border-t border-slate-200/60">
            <div>
              <p className="text-4xl font-extrabold text-slate-900">10k+</p>
              <p className="text-sm text-slate-500 font-medium mt-1">Học viên tin dùng</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-slate-900">50k+</p>
              <p className="text-sm text-slate-500 font-medium mt-1">Bài test đã chấm</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-slate-900">15%</p>
              <p className="text-sm text-slate-500 font-medium mt-1">Tăng điểm trung bình</p>
            </div>
            <div>
              <p className="text-4xl font-extrabold text-slate-900">4</p>
              <p className="text-sm text-slate-500 font-medium mt-1">Kỹ năng toàn diện</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Mọi thứ bạn cần để đạt điểm cao</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Công nghệ AI tiên tiến nhất được áp dụng để tối ưu hóa quá trình học tập của bạn.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Writing */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-transform hover:-translate-y-1">
              <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center mb-6">
                <PenTool className="h-7 w-7 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">AI Writing Examiner</h3>
              <p className="text-slate-600 leading-relaxed">Chấm điểm siêu tốc Task 1 & 2. Gợi ý từ vựng học thuật, sửa lỗi ngữ pháp và nhận xét theo 4 tiêu chí chuẩn.</p>
            </div>
            {/* Speaking */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-transform hover:-translate-y-1">
              <div className="h-14 w-14 rounded-2xl bg-emerald-100 flex items-center justify-center mb-6">
                <Mic className="h-7 w-7 text-emerald-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Speaking AI & Whisper</h3>
              <p className="text-slate-600 leading-relaxed">Phòng thi ảo với câu hỏi ngẫu nhiên. Ghi âm trực tiếp, AI nhận diện giọng nói và chấm điểm phát âm, lưu loát.</p>
            </div>
            {/* Reading */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-transform hover:-translate-y-1">
              <div className="h-14 w-14 rounded-2xl bg-blue-100 flex items-center justify-center mb-6">
                <BookOpen className="h-7 w-7 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Reading Format Thật</h3>
              <p className="text-slate-600 leading-relaxed">Giao diện chia đôi màn hình chuẩn thi máy. Highlight từ vựng trực tiếp trên bài khóa với giải thích chi tiết.</p>
            </div>
            {/* Listening */}
            <div className="bg-slate-50 rounded-3xl p-8 border border-slate-100 hover:shadow-lg transition-transform hover:-translate-y-1">
              <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center mb-6">
                <Headphones className="h-7 w-7 text-amber-600" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-3">Listening Trực Quan</h3>
              <p className="text-slate-600 leading-relaxed">Trình phát audio thông minh. Chấm điểm tự động và chỉ ra chính xác vị trí chứa đáp án trong tapescript.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Đầu tư vào tư duy, nhận kết quả thực</h2>
            <p className="text-lg text-slate-600 max-w-2xl mx-auto">Chọn gói phù hợp nhất với mục tiêu của bạn.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.map((pkg: any) => {
              const style = getPackageStyle(pkg.code);
              const isPro = pkg.code === 'PRO';
              const isPremium = pkg.code === 'PREMIUM';
              const benefits = JSON.parse(pkg.benefits);

              const btnClass = isPro
                ? "w-full py-3 px-4 bg-white hover:bg-blue-50 text-blue-700 font-bold rounded-xl text-center transition"
                : isPremium
                  ? "w-full py-3 px-4 bg-slate-800 hover:bg-slate-700 text-white font-bold rounded-xl text-center transition"
                  : "w-full py-3 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-center transition";

              const textDimClass = (isPro || isPremium) ? "text-slate-300" : "text-slate-500";
              const textIconClass = isPro ? "text-blue-300" : "text-emerald-500";
              const textBenefitClass = (isPro || isPremium) ? "text-slate-100" : "text-slate-600";

              return (
                <div key={pkg.id} className={style}>
                  {isPro && <div className="absolute top-0 right-8 -translate-y-1/2 bg-amber-400 text-amber-950 text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider">Phổ biến nhất</div>}
                  <h3 className={`text-xl font-bold mb-2`}>{pkg.name}</h3>
                  <div className="flex items-baseline gap-1 mb-6">
                    <span className="text-4xl font-extrabold">{pkg.price === 0 ? "0đ" : `${pkg.price.toLocaleString('vi-VN')}đ`}</span>
                    {pkg.durationDays && <span className={`text-sm ${textDimClass}`}>/ {pkg.durationDays} ngày</span>}
                  </div>
                  <p className={`text-sm mb-6 ${textDimClass}`}>{pkg.description}</p>
                  <ul className="space-y-4 mb-8 flex-1">
                    {benefits.map((b: string, i: number) => (
                      <li key={i} className="flex items-start gap-3">
                        <CheckCircle2 className={`h-5 w-5 shrink-0 ${textIconClass}`} />
                        <span className={`text-sm ${textBenefitClass}`}>{b}</span>
                      </li>
                    ))}
                  </ul>
                  <Link href={isLoggedIn ? `/checkout?pkg=${pkg.code}` : `/register?pkg=${pkg.code}`} className={btnClass}>
                    {pkg.price === 0 ? 'Bắt đầu ngay' : `Đăng ký ${pkg.name}`}
                  </Link>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between">
          <div className="flex items-center gap-2 mb-4 md:mb-0">
            <BrainCircuit className="h-6 w-6 text-blue-600" />
            <span className="font-bold text-slate-900 text-lg">IELTS Mastery</span>
          </div>
          <p className="text-slate-500 text-sm">© 2026 IELTS Mastery. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
