import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { Navbar } from "@/components/layout/Navbar";
import { Providers } from "@/components/Providers";
import { ToastProvider } from "@/contexts/ToastContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "IELTS SKIBIDI - Practice & Succeed",
  description: "Nền tảng luyện thi IELTS ứng dụng AI #1 - IELTS SKIBIDI",
};

import { WelcomeModal } from "@/components/WelcomeModal";
import BugReportWidget from "@/components/ui/BugReportWidget";
import VerifyPromptModal from "@/components/ui/VerifyPromptModal";
import GlobalSessionSync from "@/components/ui/GlobalSessionSync";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${inter.className} min-h-screen bg-slate-50 flex flex-col`}>
        <Providers>
          <ToastProvider>
            <WelcomeModal />
            <VerifyPromptModal />
            <GlobalSessionSync />
            <Navbar />
            <main className="flex-1">
              {children}
              <BugReportWidget />
            </main>
          </ToastProvider>
        </Providers>
      </body>
    </html>
  );
}
