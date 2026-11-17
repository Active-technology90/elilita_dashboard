// src/components/admin/CategoryManagement.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { Plus, Eye, Package2 } from "lucide-react";
import {
  getCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from "../../services/api";
import type { Category } from "../../types";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { ErrorView } from "../ui/ErrorView";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { usePagination } from "../../hooks/usePagination";
import { useSorting } from "../../hooks/useSorting";
import { useReadOnly } from "./AdminDashboard";
import CategoryTable from "./category-management/CategoryTable";
import CategoryFormModal from "./category-management/CategoryFormModal";
import SortSheet from "../ui/SortSheet";
import type { SelectOption } from "../ui/CustomSelect";
import PageHeader from "../ui/PageHeader";

export default function CategoryManagement() {
  const { t } = useTranslation("category");
  const readOnly = useReadOnly();

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
    }, 200);
  };

  const [pageSize, setPageSize] = useState(10);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_am: "",
    slug: "",
    code: "",
    description: "",
    icon: null as File | null,
    iconPreview: "",
    order: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const { toast, showToast } = useToast();

  // ---- Mobile sort sheet state ----
  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempSort, setTempSort] = useState("name|asc");

  // Filter categories client-side
  const filteredCategories = useMemo(() => {
    if (!searchTerm.trim()) return categories;
    const term = searchTerm.toLowerCase();
    return categories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(term) ||
        cat.name_am?.toLowerCase().includes(term) ||
        cat.slug.toLowerCase().includes(term) ||
        cat.code?.toLowerCase().includes(term),
    );
  }, [categories, searchTerm]);

  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    filteredCategories,
    "name",
    "asc",
  );

  useEffect(() => {
    if (sheetOpen) {
      setTempSort(`${sortField}|${sortOrder}`);
    }
  }, [sheetOpen, sortField, sortOrder]);

  const applyMobileSort = () => {
    if (tempSort !== `${sortField}|${sortOrder}`) {
      const [field, desiredOrder] = tempSort.split("|");
      if (field === sortField) {
        if (desiredOrder !== sortOrder) handleSort(field);
      } else {
        handleSort(field);
        if (desiredOrder === "desc") handleSort(field);
      }
    }
    setSheetOpen(false);
  };

  const resetMobileSort = () => {
    setTempSort("name|asc");
    if ("name|asc" !== `${sortField}|${sortOrder}`) {
      handleSort("name");
    }
    setSheetOpen(false);
  };

  const {
    paginatedItems,
    currentPage,
    totalPages,
    goToPage,
    resetPage,
    itemsPerPage,
  } = usePagination(sortedItems, pageSize);

  const paginatedItemsWithRowNumber = useMemo(() => {
    return paginatedItems.map((item, index) => ({
      ...item,
      rowNumber: (currentPage - 1) * itemsPerPage + index + 1,
    }));
  }, [paginatedItems, currentPage, itemsPerPage]);

  useEffect(() => {
    resetPage();
  }, [searchTerm, pageSize, resetPage]);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await getCategories();
      setCategories(res.data);
    } catch (err: any) {
      setError(err.message || t("loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleEdit = useCallback(
    (cat: Category) => {
      if (readOnly) return;
      setEditingId(cat.id);
      setFormData({
        name: cat.name,
        name_am: cat.name_am || "",
        slug: cat.slug,
        code: cat.code || "",
        description: cat.description || "",
        icon: null,
        iconPreview: cat.icon || "",
        order: cat.order || 0,
        is_active: cat.is_active ?? true,
      });
      setModalOpen(true);
    },
    [readOnly],
  );

  const handleDeleteClick = useCallback(
    (cat: Category) => {
      if (readOnly) return;
      setDeleteTarget(cat);
    },
    [readOnly],
  );

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t("nameRequired");
    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug))
      errors.slug = t("slugInvalid");
    if (formData.order < 0) errors.order = t("orderPositive");
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validateForm()) return;

    if (editingId) {
      const originalCategory = categories.find((c) => c.id === editingId);
      if (originalCategory) {
        const hasChanges =
          originalCategory.name !== formData.name ||
          (originalCategory.name_am || "") !== (formData.name_am || "") ||
          originalCategory.slug !== formData.slug ||
          (originalCategory.code || "") !== (formData.code || "") ||
          (originalCategory.description || "") !==
            (formData.description || "") ||
          (originalCategory.order || 0) !== formData.order ||
          (originalCategory.is_active ?? true) !== formData.is_active ||
          formData.icon !== null;

        if (!hasChanges) {
          showToast("info", t("noChanges"));
          setModalOpen(false);
          resetForm();
          return;
        }
      }
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.append("name", formData.name);
      if (formData.name_am) fd.append("name_am", formData.name_am);
      if (formData.slug) fd.append("slug", formData.slug);
      if (formData.code) fd.append("code", formData.code);
      if (formData.description) fd.append("description", formData.description);
      fd.append("order", String(formData.order));
      fd.append("is_active", String(formData.is_active));
      if (formData.icon) fd.append("icon", formData.icon);

      if (editingId) {
        await updateCategory(formData.slug, fd);
        showToast("success", t("categoryUpdated"));
      } else {
        await createCategory(fd);
        showToast("success", t("categoryCreated"));
      }
      setModalOpen(false);
      resetForm();
      fetchCategories();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || readOnly) return;
    try {
      await deleteCategory(deleteTarget.slug);
      showToast("success", t("categoryDeleted"));
      setDeleteTarget(null);
      fetchCategories();
    } catch (err: any) {
      if (
        err.response?.status === 400 ||
        err.response?.status === 409 ||
        err.response?.data?.detail?.includes("related")
      ) {
        try {
          await updateCategory(deleteTarget.slug, { is_active: false });
          showToast("success", t("categoryDeactivated"));
          setDeleteTarget(null);
          fetchCategories();
        } catch (updateErr: any) {
          showToast(
            "error",
            updateErr.response?.data?.detail || t("deactivateFailed"),
          );
        }
      } else {
        showToast("error", err.response?.data?.detail || t("deleteFailed"));
      }
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      name_am: "",
      slug: "",
      code: "",
      description: "",
      icon: null,
      iconPreview: "",
      order: 0,
      is_active: true,
    });
    setFormErrors({});
  };

  const sortOptions: SelectOption[] = useMemo(
    () => [
      { label: t("sortNameAsc"), value: "name|asc" },
      { label: t("sortNameDesc"), value: "name|desc" },
      { label: t("sortPriorityAsc"), value: "order|asc" },
      { label: t("sortPriorityDesc"), value: "order|desc" },
      { label: t("sortMostCompanies"), value: "company_count|desc" },
      { label: t("sortFewestCompanies"), value: "company_count|asc" },
    ],
    [t],
  );

  if (error) return <ErrorView error={error} onRetry={fetchCategories} />;

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        icon={Package2}
        badge={
          readOnly ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 sm:text-xs">
              <Eye className="h-3.5 w-3.5" />
              {t("viewOnly")}
            </span>
          ) : undefined
        }
        actions={
          !readOnly ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:text-sm"
              aria-label={t("createCategory")}
            >
              <Plus className="h-4 w-4" />
              <span>{t("createCategory")}</span>
            </button>
          ) : undefined
        }
        actionMobile={
          !readOnly ? (
            <button
              type="button"
              onClick={() => {
                resetForm();
                setModalOpen(true);
              }}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:text-sm"
              aria-label={t("createCategory")}
            >
              <Plus className="h-4 w-4" />
              <span>{t("create")}</span>
            </button>
          ) : undefined
        }
        className="mb-5 sm:mb-6"
      />

      <div className="mt-0">
        <CategoryTable
          loading={loading}
          readOnly={readOnly}
          categoriesWithRowNumber={paginatedItemsWithRowNumber}
          onEdit={handleEdit}
          onDelete={handleDeleteClick}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
          pageSize={pageSize}
          onPageSizeChange={setPageSize}
          inputValue={inputValue}
          onInputChange={handleInputChange}
          sortOptions={sortOptions}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
          sheetOpen={sheetOpen}
          setSheetOpen={setSheetOpen}
          setTempSort={setTempSort}
          tempSort={tempSort}
          applyMobileSort={applyMobileSort}
          resetMobileSort={resetMobileSort}
        />
      </div>

      <SortSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        options={sortOptions}
        value={tempSort}
        onChange={setTempSort}
        onApply={applyMobileSort}
        onReset={resetMobileSort}
      />

      {!readOnly && (
        <CategoryFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? t("editCategory") : t("newCategory")}
          onSubmit={handleSubmit}
          submitting={submitting}
          formData={formData}
          setFormData={setFormData}
          formErrors={formErrors}
          editingId={editingId}
        />
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.name || ""}
        deleteTitle={t("deleteCategory")}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />

      <style>{`
        .safe-bottom {
          padding-bottom: env(safe-area-inset-bottom, 1rem);
        }
      `}</style>
    </div>
  );
}