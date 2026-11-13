// src/components/dashboard/HeadCompanyManagement/HeadCompanyManagement.tsx
import React, { useEffect, useState, useMemo, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Plus, Building2, ImageIcon, Edit, Trash2 } from "lucide-react";
import {
  getHeadCompanies,
  createHeadCompany,
  updateHeadCompany,
  deleteHeadCompany,
} from "../../../services/api";
import type { HeadCompany } from "../../../types";
import { FormModal } from "../../ui/FormModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { ErrorView } from "../../ui/ErrorView";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { DragDropImageUpload } from "../../ui/DragDropImageUpload";
import PageHeader from "../../ui/PageHeader";
import { SearchInput } from "../../ui/SearchInput";
import { DataTable, type Column } from "../../ui/DataTable";
import MobileCardSkeleton from "../../ui/MobileCardSkeleton";

interface HeadCompanyFormData {
  name: string;
  name_am: string;
  logo: File | null;
  logoPreview: string | null;
  cover_image: File | null;
  coverPreview: string | null;
  is_active: boolean;
}

const emptyForm: HeadCompanyFormData = {
  name: "",
  name_am: "",
  logo: null,
  logoPreview: null,
  cover_image: null,
  coverPreview: null,
  is_active: true,
};

export default function HeadCompanyManagement() {
  const { t } = useTranslation("headcompany");

  const [headCompanies, setHeadCompanies] = useState<HeadCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => setSearchTerm(value), 200);
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [formData, setFormData] = useState<HeadCompanyFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<HeadCompany | null>(null);
  const { toast, showToast } = useToast();

  const fetchHeadCompanies = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getHeadCompanies();
      const data = res.data;
      setHeadCompanies(Array.isArray(data) ? data : (data.results ?? []));
    } catch (err: any) {
      setError(err.message || t("loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHeadCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return headCompanies;
    const term = searchTerm.toLowerCase();
    return headCompanies.filter(
      (h) =>
        h.name.toLowerCase().includes(term) ||
        h.name_am?.toLowerCase().includes(term) ||
        h.slug.toLowerCase().includes(term),
    );
  }, [headCompanies, searchTerm]);

  const resetForm = () => {
    setEditingSlug(null);
    setFormData(emptyForm);
    setFormErrors({});
  };

  const openCreate = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEdit = (head: HeadCompany) => {
    setEditingSlug(head.slug);
    setFormData({
      name: head.name,
      name_am: head.name_am || "",
      logo: null,
      logoPreview: head.logo || null,
      cover_image: null,
      coverPreview: head.cover_image || null,
      is_active: head.is_active,
    });
    setFormErrors({});
    setModalOpen(true);
  };

  const validate = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t("nameRequired");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      if (formData.name_am) fd.append("name_am", formData.name_am);
      fd.append("is_active", String(formData.is_active));
      if (formData.logo instanceof File) fd.append("logo", formData.logo);
      if (formData.cover_image instanceof File)
        fd.append("cover_image", formData.cover_image);

      if (editingSlug) {
        await updateHeadCompany(editingSlug, fd);
        showToast("success", t("updatedSuccess"));
      } else {
        await createHeadCompany(fd);
        showToast("success", t("createdSuccess"));
      }
      setModalOpen(false);
      resetForm();
      fetchHeadCompanies();
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail ||
          err.response?.data?.name?.[0] ||
          t("operationFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteHeadCompany(deleteTarget.slug);
      showToast("success", t("deletedSuccess"));
      setDeleteTarget(null);
      fetchHeadCompanies();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || t("deleteFailed"));
    }
  };

  if (error) return <ErrorView error={error} onRetry={fetchHeadCompanies} />;

  const columns = useMemo<Column<HeadCompany>[]>(
    () => [
      {
        key: "rowNumber",
        header: t("colNo"),
        className: "whitespace-nowrap text-gray-500",
        render: (_head, index) => index + 1,
      },
      {
        key: "logo",
        header: t("colLogo"),
        render: (head) =>
          head.logo ? (
            <img
              src={head.logo}
              alt={head.name}
              className="h-9 w-9 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gray-100">
              <ImageIcon className="h-4 w-4 text-gray-400" />
            </div>
          ),
      },
      {
        key: "name",
        header: t("colName"),
        className: "min-w-[140px] font-medium text-gray-900",
        render: (head) => (
          <div className="min-w-0">
            <span className="block truncate text-sm font-medium text-gray-900">
              {head.name}
            </span>
            {head.name_am ? (
              <span className="block truncate text-xs text-gray-400">
                {head.name_am}
              </span>
            ) : null}
          </div>
        ),
      },
      {
        key: "slug",
        header: t("colSlug"),
        className:
          "hidden whitespace-nowrap font-mono text-gray-500 sm:table-cell",
      },
      {
        key: "branch_count",
        header: t("colBranches"),
        className: "whitespace-nowrap",
        render: (head) => (
          <span className="inline-flex items-center gap-1 text-gray-600">
            <Building2 className="h-4 w-4 text-secondary" />
            {head.branch_count ?? 0}
          </span>
        ),
      },
      {
        key: "is_active",
        header: t("colActive"),
        className: "whitespace-nowrap",
        render: (head) => (
          <span
            className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${
              head.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {head.is_active ? t("yes") : t("no")}
          </span>
        ),
      },
    ],
    [t],
  );

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        icon={Building2}
        actions={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5b4694] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("createHeadCompany")}</span>
            <span className="sm:hidden">{t("create")}</span>
          </button>
        }
        actionMobile={
          <button
            type="button"
            onClick={openCreate}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5b4694] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 sm:w-auto"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">{t("createHeadCompany")}</span>
            <span className="sm:hidden">{t("create")}</span>
          </button>
        }
        loading={loading}
        className="mb-5 sm:mb-6"
      />

      <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6">
        <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
          <SearchInput
            value={inputValue}
            onChange={handleInputChange}
            debounceMs={0}
            loading={loading}
            showClearButton={false}
            placeholder={t("searchPlaceholder")}
            className="w-full"
          />
        </div>
      </div>

      {/* Mobile card view */}
      <div className="block md:hidden">
        {loading ? (
          <MobileCardSkeleton count={3} metaLinePairs={2} showActions={true} />
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-2">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("emptyTitle")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm.trim() ? t("emptyFiltered") : t("emptyNoData")}
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-2 pb-24">
            {filtered.map((head) => (
              <div
                key={head.slug}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3"
              >
                <div className="flex items-center gap-3">
                  {head.logo ? (
                    <img
                      src={head.logo}
                      alt={head.name}
                      className="h-10 w-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <ImageIcon size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {head.name}
                    </h3>
                    {head.name_am && (
                      <p className="text-xs text-gray-500 truncate">
                        {head.name_am}
                      </p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] xs:text-xs font-medium rounded-full ${
                      head.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        head.is_active ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    ></span>
                    {head.is_active ? t("statusActive") : t("statusInactive")}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">{t("labelSlug")}</span>{" "}
                    <span className="font-mono">{head.slug}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t("labelBranches")}</span>{" "}
                    <span className="inline-flex items-center gap-1">
                      <Building2 className="h-3 w-3 text-secondary" />
                      {head.branch_count ?? 0}
                    </span>
                  </div>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    onClick={() => openEdit(head)}
                    className="flex-1 bg-secondary/10 text-secondary text-xs font-medium p-1 rounded-xl hover:bg-secondary/20 min-h-[32px]"
                  >
                    <Edit size={14} className="inline-block mr-1" />
                    {t("edit")}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(head)}
                    className="flex-1 bg-red-50 text-red-600 text-xs font-medium p-1 rounded-xl hover:bg-red-100 min-h-[32px]"
                  >
                    <Trash2 size={14} className="inline-block mr-1" />
                    {t("delete")}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden w-full md:block">
        <DataTable
          data={filtered}
          columns={columns}
          loading={loading}
          loadingRows={5}
          emptyMessage={t("emptyTable")}
          onEdit={openEdit}
          onDelete={(head) => setDeleteTarget(head)}
          stickyColumns={3}
        />
      </div>

      {/* Create / Edit modal */}
      <FormModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editingSlug ? t("editHeadCompany") : t("newHeadCompany")}
        onSubmit={handleSubmit}
        submitting={submitting}
        maxWidth="lg"
      >
        <div className="space-y-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {t("nameEnglish")} <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                placeholder={t("nameEnglishPlaceholder")}
                value={formData.name}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name: e.target.value }))
                }
                className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary/20 min-h-[44px] ${
                  formErrors.name
                    ? "border-red-500 bg-red-50"
                    : "border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                }`}
              />
              {formErrors.name && (
                <p className="text-red-500 text-xs mt-1.5">{formErrors.name}</p>
              )}
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                {t("nameAmharic")}
              </label>
              <input
                type="text"
                placeholder={t("nameAmharicPlaceholder")}
                value={formData.name_am}
                onChange={(e) =>
                  setFormData((p) => ({ ...p, name_am: e.target.value }))
                }
                className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 min-h-[44px]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <DragDropImageUpload
                label={t("logoLabel")}
                size="sm"
                value={formData.logo}
                onChange={(file) => setFormData((p) => ({ ...p, logo: file }))}
                previewUrl={formData.logoPreview}
                required={false}
              />
              <p className="text-[10px] text-gray-400 mt-1">{t("logoHint")}</p>
            </div>
            <div>
              <DragDropImageUpload
                label={t("coverLabel")}
                value={formData.cover_image}
                onChange={(file) =>
                  setFormData((p) => ({ ...p, cover_image: file }))
                }
                previewUrl={formData.coverPreview}
              />
              <p className="text-[10px] text-gray-400 mt-1">
                {t("coverHint")}
              </p>
            </div>
          </div>

          <div className="p-2 flex items-center gap-3">
            <input
              type="checkbox"
              id="head_is_active"
              checked={formData.is_active}
              onChange={(e) =>
                setFormData((p) => ({ ...p, is_active: e.target.checked }))
              }
              className="h-5 w-5 text-secondary focus:ring-secondary border-gray-300 rounded cursor-pointer"
            />
            <label
              htmlFor="head_is_active"
              className="text-sm font-semibold text-gray-700 cursor-pointer"
            >
              {t("activeLabel")}
            </label>
          </div>
        </div>
      </FormModal>

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.name || ""}
        deleteTitle={t("deleteHeadCompany")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}