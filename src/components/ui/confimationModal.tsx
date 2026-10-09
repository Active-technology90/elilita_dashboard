import React from "react";
import { createPortal } from "react-dom";
import { Loader2 } from "lucide-react";

export const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmVariant = "primary",
  loading = false,
  autoClose = true,
  children,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  confirmVariant?: "primary" | "danger";
  loading?: boolean;
  autoClose?: boolean;
  children?: React.ReactNode;
}) => {
  if (!isOpen) return null;

  const content = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 md:p-6 animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-xl sm:rounded-2xl w-full max-w-[92%] sm:max-w-md p-4 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200 border border-gray-100"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-base sm:text-lg font-bold text-gray-900 mb-1 sm:mb-2 break-words">
          {title}
        </h3>
        <p className="text-xs sm:text-sm text-gray-600 mb-4 sm:mb-6 break-words">
          {description}
        </p>
        {children && <div className="mb-4">{children}</div>}
        <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition disabled:opacity-50 w-full sm:w-auto min-h-[44px] sm:min-h-0 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              if (autoClose) onClose();
            }}
            disabled={loading}
            className={`px-3 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-medium text-white rounded-lg transition flex items-center justify-center gap-2 cursor-pointer ${
              confirmVariant === "danger"
                ? "bg-red-600 hover:bg-red-700 shadow-md shadow-red-200"
                : "bg-secondary hover:opacity-95 shadow-md shadow-purple-200"
            } disabled:opacity-50 w-full sm:w-auto min-h-[44px] sm:min-h-0`}
          >
            {loading && (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            )}
            <span>{confirmText}</span>
          </button>
        </div>
      </div>
    </div>
  );

  if (typeof document !== "undefined") {
    return createPortal(content, document.body);
  }
  return content;
};