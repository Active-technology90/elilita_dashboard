
import { useMemo, useState } from "react";
import { Plus, Trash2, Image as ImageIcon, Repeat } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { usePortfolio } from "../../../hooks/usePortfolio";
import { CompanySelector } from "../company-products/CompanySelector";
import { uploadPortfolioImage, deletePortfolioImage } from "../../../services/api";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { Toast } from "../../ui/Toast";
import type { PortfolioItem } from "../../../types";

export default function PortfolioManagement() {
  const { t } = useTranslation("portfolio");

  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const serviceCompanies = useMemo(
    () => companies.filter((c) => c.business_type === "service"),
    [companies],
  );

  const selectedCompany = companies.find((c) => c.slug === companySlug);
  const isServiceCompany = selectedCompany?.business_type === "service";

  const { items, loading, create, remove, refetch } = usePortfolio(
    isServiceCompany ? companySlug : null,
  );

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<PortfolioItem | null>(null);
  const [uploadingId, setUploadingId] = useState<number | null>(null);
  const [toast, setToast] = useState<{ type: "success" | "error"; message: string } | null>(
    null,
  );

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  if (showSelector) {
    return (
      <CompanySelector
        companies={serviceCompanies.length ? serviceCompanies : companies}
        isLoading={isLoadingCompanies}
        title={t("selector.title")}
        searchPlaceholder={t("selector.searchPlaceholder")}
        onSelect={(slug, name) => {
          const membership = user?.memberships?.find((m: any) => m.company_slug === slug);
          const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  if (!isServiceCompany) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-500">
        {t("page.selectCompany")}
      </div>
    );
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await create({ title, description, is_active: true });
      setTitle("");
      setDescription("");
      showToast("success", t("toasts.created"));
    } catch {
      showToast("error", t("toasts.createFailed"));
    }
  };

  const handleUpload = async (portfolioId: number, file: File, isBefore: boolean) => {
    if (!companySlug) return;

    setUploadingId(portfolioId);

    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("is_before", String(isBefore));

      await uploadPortfolioImage(companySlug, portfolioId, fd);
      refetch();
      showToast("success", t("toasts.uploaded"));
    } catch {
      showToast("error", t("toasts.uploadFailed"));
    } finally {
      setUploadingId(null);
    }
  };

  const handleDeleteImage = async (portfolioId: number, imageId: number) => {
    if (!companySlug) return;

    try {
      await deletePortfolioImage(companySlug, portfolioId, imageId);
      refetch();
    } catch {
      showToast("error", t("toasts.deleteImageFailed"));
    }
  };

  return (
    <>
      <Toast toast={toast} />

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.title || ""}
        onConfirm={async () => {
          if (deleteTarget) {
            await remove(deleteTarget.id);
            showToast("success", t("toasts.deleted"));
            setDeleteTarget(null);
          }
        }}
        onCancel={() => setDeleteTarget(null)}
      />

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-xl font-bold text-gray-900">
              {t("page.title")}
            </h1>

            <p className="text-sm text-gray-500 mt-1">
              {t("page.description", {
                company: company?.name || "",
              })}
            </p>
          </div>

          {isSuperAdmin && (
            <button
              onClick={clearCompany}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-sm text-gray-600 border border-gray-200 rounded-xl hover:bg-gray-50"
            >
              <Repeat className="h-4 w-4" />
              {t("page.switch")}
            </button>
          )}
        </div>

        <form
          onSubmit={handleCreate}
          className="rounded-xl border border-gray-200 p-4 mb-6 space-y-3"
        >
          <p className="text-sm font-medium text-gray-700">
            {t("form.title")}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={t("form.itemTitle")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
              required
            />

            <input
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder={t("form.description")}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-4 py-2 bg-purple-700 text-white text-sm font-medium rounded-xl hover:bg-purple-800"
          >
            <Plus className="h-4 w-4" />
            {t("form.addItem")}
          </button>
        </form>

        {loading ? (
          <div className="py-12 text-center text-gray-400">
            {t("loading")}
          </div>
        ) : items.length === 0 ? (
          <div className="py-16 text-center text-gray-500">
            {t("empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-gray-200 overflow-hidden"
              >
                <div className="p-4 flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-gray-900">
                      {item.title}
                    </h3>

                    {item.description && (
                      <p className="text-xs text-gray-500 mt-1">
                        {item.description}
                      </p>
                    )}
                  </div>

                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="text-red-400 hover:text-red-600 p-1"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>

                <div className="px-4 pb-4">
                  <div className="flex flex-wrap gap-2 mb-3">
                    {(item.images || []).map((img) => (
                      <div key={img.id} className="relative group">
                        <img
                          src={img.image}
                          alt={img.caption || item.title}
                          className="w-20 h-20 object-cover rounded-lg border border-gray-200"
                        />

                        <span className="absolute bottom-0 left-0 right-0 text-[9px] text-center bg-black/50 text-white rounded-b-lg py-0.5">
                          {img.is_before
                            ? t("images.before")
                            : t("images.after")}
                        </span>

                        <button
                          onClick={() => handleDeleteImage(item.id, img.id)}
                          className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-4 h-4 text-[10px] opacity-0 group-hover:opacity-100"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2">
                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingId === item.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(item.id, file, true);
                          e.target.value = "";
                        }}
                      />

                      <span className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-dashed border-gray-300 rounded-lg hover:bg-gray-50">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {t("images.before")}
                      </span>
                    </label>

                    <label className="flex-1 cursor-pointer">
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        disabled={uploadingId === item.id}
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleUpload(item.id, file, false);
                          e.target.value = "";
                        }}
                      />

                      <span className="flex items-center justify-center gap-1 px-2 py-1.5 text-xs border border-dashed border-gray-300 rounded-lg hover:bg-gray-50">
                        <ImageIcon className="h-3.5 w-3.5" />
                        {t("images.after")}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
