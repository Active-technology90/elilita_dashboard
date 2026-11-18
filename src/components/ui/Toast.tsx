
import { createPortal } from "react-dom";
import { Package, AlertCircle } from "lucide-react";
import type { ToastType } from "../../hooks/useToast";

interface ToastProps {
  toast: { type: ToastType; message: string } | null;
  zIndex?: number;
}

export function Toast({ toast, zIndex = 999999 }: ToastProps) {
  if (!toast || typeof document === "undefined") return null;

  return createPortal(
    <div
      className="pointer-events-none fixed inset-x-0 top-4 flex justify-end px-4 sm:px-6 animate-in slide-in-from-top-2"
      style={{ zIndex }}
    >
      <div
        role="alert"
        aria-live="assertive"
        className={`pointer-events-auto flex max-w-md items-center gap-2 rounded-lg border px-4 py-3 shadow-xl ${
          toast.type === "success"
            ? "border-green-200 bg-green-50 text-green-800"
            : "border-red-200 bg-red-50 text-red-800"
        }`}
      >
        {toast.type === "success" ? (
          <Package className="h-5 w-5 shrink-0" />
        ) : (
          <AlertCircle className="h-5 w-5 shrink-0" />
        )}

        <span className="text-sm font-medium break-words">
          {toast.message}
        </span>
      </div>
    </div>,
    document.body
  );
}
