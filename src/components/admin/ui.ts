// 管理画面で共通に使う Tailwind のクラス。
export const inputClass =
  "w-full rounded-md border border-foreground/20 bg-background px-3 py-2 text-sm";
export const primaryButtonClass =
  "rounded-md bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50";
export const secondaryButtonClass =
  "rounded-md border border-foreground/20 px-3 py-1.5 text-sm hover:bg-foreground/5 disabled:cursor-not-allowed disabled:opacity-40";
export const dangerButtonClass =
  "rounded-md border border-red-500/50 px-3 py-1.5 text-sm text-red-700 hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-50 dark:text-red-400";
export const errorTextClass = "text-sm text-red-700 dark:text-red-400";
