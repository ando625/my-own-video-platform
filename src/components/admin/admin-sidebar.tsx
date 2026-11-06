"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NEW_COURSE_PATH = "/admin/courses/new";

const tabs = [
  {
    label: "講座一覧",
    href: "/admin",
    isActive: (pathname: string) =>
      pathname === "/admin" ||
      (pathname.startsWith("/admin/courses/") && pathname !== NEW_COURSE_PATH),
  },
  {
    label: "新規作成",
    href: NEW_COURSE_PATH,
    isActive: (pathname: string) => pathname === NEW_COURSE_PATH,
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="管理メニュー"
      className="shrink-0 border-b border-foreground/10 p-3 md:w-52 md:border-b-0 md:border-r"
    >
      <ul className="flex gap-1 md:flex-col">
        {tabs.map((tab) => {
          const active = tab.isActive(pathname);
          return (
            <li key={tab.href}>
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`block rounded-md px-3 py-2 text-sm font-medium ${
                  active
                    ? "bg-foreground text-background"
                    : "hover:bg-foreground/5"
                }`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
