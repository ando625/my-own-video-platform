import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Suspense } from "react";
import { AuthStatus } from "@/components/auth/auth-status";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "動画講座プラットフォーム",
  description: "YouTube動画で学ぶ動画講座プラットフォーム",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="flex min-h-12 items-center justify-end gap-4 border-b border-foreground/10 px-6 py-2 text-sm">
          <Suspense fallback={null}>
            <AuthStatus />
          </Suspense>
        </header>
        {children}
      </body>
    </html>
  );
}
