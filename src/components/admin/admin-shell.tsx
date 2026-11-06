import type { ReactNode } from "react";
import { AdminSidebar } from "./admin-sidebar";

/** 管理者の確認が済んだ後に使う、サイドバー付きの枠。 */
export function AdminShell({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col md:flex-row">
      <AdminSidebar />
      <main className="flex min-w-0 flex-1 flex-col gap-6 p-6">{children}</main>
    </div>
  );
}
