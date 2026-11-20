import { X, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";

interface DeleteUserModalProps {
  isOpen: boolean;
  user: any;
  deleting: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function DeleteUserModal({
  isOpen,
  user,
  deleting,
  onClose,
  onConfirm,
}: DeleteUserModalProps) {
  const { t } = useTranslation("companyUsers");

  if (!isOpen || !user) return null;

  const isDispatcher = user.role === "staff";
  const subjectLabel = isDispatcher
    ? t("deleteModal.subjectDispatcher")
    : t("deleteModal.subjectUser");
  const actionLabel = isDispatcher
    ? t("deleteModal.removeDispatcherTitle")
    : t("deleteModal.removeUserTitle");
  const actionButtonLabel = isDispatcher
    ? t("deleteModal.removeDispatcherBtn")
    : t("deleteModal.removeUserBtn");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-3 sm:p-4 md:p-6"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[90%] overflow-hidden rounded-xl bg-white shadow-xl sm:max-w-lg sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-gray-100 p-4 sm:p-5">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 sm:text-xl">
              {actionLabel}
            </h2>
            {isDispatcher && (
              <p className="mt-0.5 text-xs text-gray-500">
                {t("deleteModal.dispatcherSubtitle")}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 rounded-full p-1 text-gray-400 transition-colors hover:bg-gray-100 hover:text-gray-600"
            aria-label={t("deleteModal.closeAria")}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <div className="p-4 pb-2 sm:p-5">
          <div className="flex items-start gap-3 sm:items-center">
            <div className="mt-0.5 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 sm:mt-0 sm:h-12 sm:w-12">
              <Trash2 className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-700 sm:text-base">
                {t("deleteModal.confirmPrefix")}{" "}
                <span className="font-semibold">
                  {user.first_name} {user.last_name}
                </span>{" "}
                {t("deleteModal.confirmSuffix", { subject: subjectLabel })}
              </p>
              <p className="mt-1 text-[10px] text-gray-500 sm:text-xs">
                {t("deleteModal.membershipNote")}
              </p>
            </div>
          </div>
        </div>

        <div className="mt-0 flex flex-row justify-end gap-3 rounded-b-xl bg-gray-50 p-3 sm:rounded-b-2xl sm:p-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 px-4 py-1.5 text-sm text-gray-700 transition hover:bg-white sm:text-base"
          >
            {t("deleteModal.cancel")}
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-lg bg-red-600 px-4 py-1.5 text-sm text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 sm:text-base"
          >
            {deleting
              ? t("deleteModal.removing")
              : actionButtonLabel}
          </button>
        </div>
      </div>
    </div>
  );
}