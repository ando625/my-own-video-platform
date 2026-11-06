import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { GoogleSignInButton } from "@/components/auth/google-sign-in-button";
import { getCurrentUser } from "@/lib/session";

export const metadata: Metadata = {
  title: "ようこそ",
};

export default function LoginPage() {
  return (
    <main className="flex flex-1 bg-gradient-to-br from-[#283593] via-accent to-[#5c6bc0] text-accent-foreground">
      <Suspense fallback={null}>
        <RedirectIfLoggedIn />
      </Suspense>
      <div className="mx-auto grid w-full max-w-6xl flex-1 items-center gap-12 px-6 py-14 sm:px-10 lg:grid-cols-2 lg:gap-16">
        <section className="flex max-w-xl flex-col gap-6">
          <h1 className="text-3xl font-bold leading-tight [word-break:keep-all] sm:text-5xl">
            動画講座
            <wbr />
            プラットフォームへ
            <wbr />
            ようこそ
          </h1>
          <p className="text-base leading-relaxed opacity-90 [word-break:keep-all] sm:text-lg">
            ログインすると、
            <wbr />
            公開中の講座を視聴できます。
          </p>
          <div className="mt-2 flex w-full max-w-xs flex-col gap-3">
            <h2 className="text-sm font-medium opacity-90">
              ログインして始める
            </h2>
            <GoogleSignInButton />
          </div>
        </section>
        <PlayerIllustration />
      </div>
    </main>
  );
}

/** 動画の講座だと伝えるための飾り。実際の講座のデータは表示しない。 */
function PlayerIllustration() {
  return (
    <div aria-hidden className="relative mx-auto w-full max-w-lg">
      <div className="overflow-hidden rounded-2xl bg-white/10 p-3 shadow-2xl ring-1 ring-white/20">
        <div className="flex aspect-video items-center justify-center rounded-lg bg-[#1a237e]">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-white text-accent shadow-lg">
            <svg viewBox="0 0 24 24" className="ml-1 h-8 w-8 fill-current">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/20">
          <div className="h-full w-2/5 rounded-full bg-white" />
        </div>
        <div className="mt-3 grid grid-cols-3 gap-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="aspect-video rounded-md bg-white/15" />
          ))}
        </div>
      </div>
    </div>
  );
}

async function RedirectIfLoggedIn() {
  const user = await getCurrentUser();
  if (user) {
    redirect("/");
  }
  return null;
}
