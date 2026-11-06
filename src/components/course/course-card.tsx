import Link from "next/link";
import type { ReactNode } from "react";
import { getCourseThumbnailSrc } from "@/lib/course-thumbnail";

type CourseCardProps = {
  href: string;
  ariaLabel: string;
  course: {
    title: string;
    thumbnailFileName: string | null;
    youtubeVideoId: string;
  };
  /** タイトルの下に出す表示（視聴済み、公開状態など）。 */
  footer?: ReactNode;
};

/** 画像とタイトルの四角いカード。カード全体を押すと移動する。 */
export function CourseCard({ href, ariaLabel, course, footer }: CourseCardProps) {
  return (
    <li
      aria-label={ariaLabel}
      className="overflow-hidden rounded-lg border border-foreground/10 transition hover:border-foreground/30 hover:shadow-md"
    >
      <Link href={href} className="block">
        {/* 画像の場所は講座ごとに違い、外部のYouTubeの画像も使うので、そのまま表示する。 */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={getCourseThumbnailSrc(course)}
          alt=""
          className="aspect-video w-full bg-foreground/5 object-cover"
        />
        <span className="block px-3 pt-3 font-medium">{course.title}</span>
      </Link>
      <div className="min-h-9 px-3 pb-3 pt-1 text-sm text-foreground/60">
        {footer}
      </div>
    </li>
  );
}

export function CourseCardGrid({ children }: { children: ReactNode }) {
  return (
    <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {children}
    </ul>
  );
}
