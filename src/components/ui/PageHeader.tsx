
import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

export interface PageHeaderProps {
  title: string;
  description?: ReactNode;
  eyebrow?: string;
  icon?: LucideIcon;
  badge?: ReactNode;
  actions?: ReactNode;
  loading?: boolean;
  className?: string;
}

export function PageHeader({
  title,
  description,
  eyebrow,
  icon: Icon,
  badge,
  actions,
  loading = false,
  className = "",
}: PageHeaderProps) {
  if (loading) {
    return (
      <div
        className={`relative w-full rounded-2xl bg-white px-4 py-4 shadow-sm sm:px-5 sm:py-5 lg:px-6 ${className}`}
        aria-busy="true"
        aria-label="Loading page header"
      >
        <div className="flex animate-pulse items-start gap-3 sm:gap-4">
          <div className="h-10 w-1 shrink-0 rounded-full bg-gray-200 sm:h-12" />

          <div className="h-10 w-10 shrink-0 rounded-xl bg-gray-100 sm:h-11 sm:w-11" />

          <div className="min-w-0 flex-1 pt-0.5">
            <div className="mb-2 h-5 w-40 rounded-md bg-gray-200 sm:h-7 sm:w-56" />
            <div className="h-3.5 w-full max-w-sm rounded-md bg-gray-100 sm:h-4" />
          </div>

          <div className="hidden h-10 w-28 rounded-xl bg-gray-100 sm:block" />
        </div>
      </div>
    );
  }

  return (
    <header
      className={`relative w-full rounded-2xl bg-white px-4 py-4  sm:px-5 sm:py-5 lg:px-1 ${className}`}
    >
      {/* subtle background decoration */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-0 top-0 h-24 w-24 rounded-bl-[80px] bg-secondary/[0.035] sm:h-32 sm:w-32"
      />

      <div className="relative flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        {/* Left content */}
        <div className="flex min-w-0 flex-1 items-start gap-3 sm:gap-4">
          {/* Accent */}
          <div className="h-10 w-1 shrink-0 rounded-full bg-gradient-to-b from-secondary to-secondary/25 sm:h-12" />

          {/* Icon */}
          {Icon && (
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary/[0.07] sm:h-11 sm:w-11">
              <Icon
                className="h-5 w-5 text-secondary sm:h-[22px] sm:w-[22px]"
                strokeWidth={1.9}
                aria-hidden="true"
              />
            </div>
          )}

          {/* Text */}
          <div className="min-w-0 flex-1">
            {eyebrow && (
              <p className="mb-0.5 text-[10px] font-bold uppercase tracking-[0.14em] text-secondary/50 sm:text-[11px]">
                {eyebrow}
              </p>
            )}

            <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
              <h1 className="min-w-0 text-lg font-extrabold leading-tight tracking-tight text-secondary xs:text-xl sm:text-2xl lg:text-[28px]">
                {title}
              </h1>

              {badge && <div className="shrink-0">{badge}</div>}
            </div>

            {description && (
              <div className="mt-1 max-w-2xl text-xs leading-5 text-gray-500 sm:text-sm sm:leading-6">
                {description}
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        {actions && (
          <div className="flex w-full flex-wrap items-center gap-2 pl-4 sm:w-auto sm:shrink-0 sm:justify-end sm:pl-0">
            {actions}
          </div>
        )}
      </div>
    </header>
  );
}

export default PageHeader;