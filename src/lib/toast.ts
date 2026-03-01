/**
 * Imperative toast API used by the app. Set by <Toaster /> on mount.
 * Import: import { toast } from "@/lib/toast";
 */

export type ToastVariant = "success" | "error";

export type ToastEntry = {
  id: string;
  variant: ToastVariant;
  message: string;
};

type ToastApi = {
  add: (entry: Omit<ToastEntry, "id">) => void;
};

const ref: { current: ToastApi | null } = { current: null };

export function setToastApi(api: ToastApi | null) {
  ref.current = api;
}

export const toast = {
  success: (message: string) => {
    ref.current?.add({ variant: "success", message });
  },
  error: (message: string) => {
    ref.current?.add({ variant: "error", message });
  },
};
