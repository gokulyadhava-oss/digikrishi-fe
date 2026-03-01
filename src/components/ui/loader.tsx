import { cn } from "@/lib/utils";

/** Spinner for inline use (e.g. buttons, small areas). */
export function Loader({ className }: { className?: string }) {
  return <div className={cn("loader-spinner", className)} role="status" aria-label="Loading" />;
}

/** Full-page loader – green animated inset circle. Use for farmers list, dashboard, etc. */
export function PageLoader({ message }: { message?: string } = {}) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="loader-page" role="status" aria-label="Loading" />
      {message && <p className="text-sm text-muted-foreground">{message}</p>}
    </div>
  );
}
