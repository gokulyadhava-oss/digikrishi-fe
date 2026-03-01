import * as React from "react";
import * as ToastPrimitive from "@radix-ui/react-toast";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { setToastApi } from "@/lib/toast";
import type { ToastEntry } from "@/lib/toast";

const ToastProvider = ToastPrimitive.Provider;

const ToastViewport = React.forwardRef<
  React.ComponentRef<typeof ToastPrimitive.Viewport>,
  React.ComponentPropsWithoutRef<typeof ToastPrimitive.Viewport>
>(({ className, ...props }, ref) => (
  <ToastPrimitive.Viewport
    ref={ref}
    className={cn(
      "fixed bottom-0 right-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:max-w-[420px]",
      className
    )}
    {...props}
  />
));
ToastViewport.displayName = ToastPrimitive.Viewport.displayName;

function genId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function Toaster() {
  const [toasts, setToasts] = React.useState<ToastEntry[]>([]);

  React.useEffect(() => {
    setToastApi({
      add: ({ variant, message }) => {
        const id = genId();
        setToasts((prev) => [...prev, { id, variant, message }]);
      },
    });
    return () => setToastApi(null);
  }, []);

  const remove = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastProvider swipeDirection="right">
      {toasts.map((t) => (
        <ToastPrimitive.Root
          key={t.id}
          open
          onOpenChange={(open) => {
            if (!open) remove(t.id);
          }}
          duration={5000}
          className={cn(
            "group pointer-events-auto relative flex w-full items-center justify-between gap-3 overflow-hidden rounded-lg border p-4 pr-9 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[state=open]:animate-in data-[state=closed]:animate-out data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:fade-out-80 data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full",
            t.variant === "success" &&
              "border-emerald-500/30 bg-emerald-50 dark:bg-emerald-950/90 dark:border-emerald-500/20 text-emerald-900 dark:text-emerald-100",
            t.variant === "error" &&
              "border-red-500/30 bg-red-50 dark:bg-red-950/90 dark:border-red-500/20 text-red-900 dark:text-red-100"
          )}
        >
          <ToastPrimitive.Description className="flex-1 text-sm">
            {t.message}
          </ToastPrimitive.Description>
          <ToastPrimitive.Close
            className="absolute right-2 top-2 rounded-md p-1 opacity-70 transition-opacity hover:opacity-100 focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </ToastPrimitive.Close>
        </ToastPrimitive.Root>
      ))}
      <ToastViewport />
    </ToastProvider>
  );
}
