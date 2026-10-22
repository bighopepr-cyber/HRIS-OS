import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface PublicPageBadgeProps {
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}

/** Pil penanda yang ditampilkan di atas H1 pada setiap halaman pemasaran atau legal publik. */
const PublicPageBadge = ({ icon, children, className }: PublicPageBadgeProps) => (
  <div
    className={cn(
      "inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary [&_svg]:h-4 [&_svg]:w-4",
      className,
    )}
  >
    {icon && <span aria-hidden="true" className="flex">{icon}</span>}
    {children}
  </div>
);

export default PublicPageBadge;
