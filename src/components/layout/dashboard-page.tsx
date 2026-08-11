import type {
  ReactNode,
} from "react";

interface DashboardPageProps {
  children: ReactNode;
  className?: string;
}

export function DashboardPage({
  children,
  className,
}: DashboardPageProps) {
  return (
    <main className="min-h-screen pt-16 lg:pl-60">
      <div
        className={[
          "mx-auto flex max-w-[1600px] flex-col gap-7 px-4 pb-12 pt-6",
          "sm:px-6 sm:pt-8 lg:px-8",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {children}
      </div>
    </main>
  );
}
