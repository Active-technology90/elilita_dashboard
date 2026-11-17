// src/components/admin/SubCategoryManagement.tsx
import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import { Plus, ImageIcon, Edit, Trash2, Filter, Package2 } from "lucide-react";
import {
  getSubCategories,
  createSubCategory,
  updateSubCategory,
  deleteSubCategory,
  getCategories,
} from "../../services/api";
import type { SubCategory, Category } from "../../types";
import { SearchInput } from "../ui/SearchInput";
import { DataTable, type Column } from "../ui/DataTable";
import { Pagination } from "../ui/Pagination";
import { FormModal } from "../ui/FormModal";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { ErrorView } from "../ui/ErrorView";
import { Toast } from "../ui/Toast";
import { useToast } from "../../hooks/useToast";
import { usePagination } from "../../hooks/usePagination";
import { useSorting } from "../../hooks/useSorting";
import { useReadOnly } from "./AdminDashboard";
import { CustomSelect, type SelectOption } from "../ui/CustomSelect";
import MobileCardSkeleton from "../ui/MobileCardSkeleton";
import FilterSortSheet from "../ui/FilterSortSheet";
import PageHeader from "../ui/PageHeader";

const MemoizedDataTable = React.memo(DataTable) as typeof DataTable;
const MemoizedPagination = React.memo(Pagination);

export default function SubCategoryManagement() {
  const { t } = useTranslation("subcategory");
  const readOnly = useReadOnly();

  const [pageSize, setPageSize] = useState(10);
  const [subs, setSubs] = useState<SubCategory[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [tempCategory, setTempCategory] = useState("all");
  const [tempSort, setTempSort] = useState("name|asc");

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    name_am: "",
    slug: "",
    category: 0,
    item_code: "",
    description: "",
    icon: null as File | null,
    iconPreview: "" as string,
    order: 0,
    is_active: true,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<SubCategory | null>(null);
  const { toast, showToast } = useToast();

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const [subRes, catRes] = await Promise.all([
        getSubCategories(),
        getCategories(),
      ]);
      setSubs(subRes.data);
      setCategories(catRes.data);
    } catch (err: any) {
      setError(err.message || t("loadFailed"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredSubs = useMemo(() => {
    const categoryFiltered =
      categoryFilter === "all"
        ? subs
        : subs.filter((sub) => String(sub.category) === categoryFilter);

    if (!searchTerm.trim()) return categoryFiltered;
    const term = searchTerm.toLowerCase();
    return categoryFiltered.filter(
      (sub) =>
        sub.name.toLowerCase().includes(term) ||
        sub.name_am?.toLowerCase().includes(term) ||
        sub.slug.toLowerCase().includes(term) ||
        sub.item_code?.toLowerCase().includes(term) ||
        categories
          .find((c) => c.id === sub.category)
          ?.name.toLowerCase()
          .includes(term),
    );
  }, [subs, categories, searchTerm, categoryFilter]);

  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    filteredSubs,
    "name",
    "asc",
  );

  const sortLabel = useMemo(() => {
    const val = `${sortField}|${sortOrder}`;
    const labels: Record<string, string> = {
      "name|asc": t("sortNameAsc"),
      "name|desc": t("sortNameDesc"),
      "order|asc": t("sortOrderAsc"),
      "order|desc": t("sortOrderDesc"),
      "company_count|desc": t("sortMostCompanies"),
      "company_count|asc": t("sortFewestCompanies"),
      "is_active|desc": t("sortActiveFirst"),
      "is_active|asc": t("sortInactiveFirst"),
    };
    return labels[val] || t("sortBy");
  }, [sortField, sortOrder, t]);
  void sortLabel;

  useEffect(() => {
    if (sheetOpen) {
      setTempCategory(categoryFilter);
      setTempSort(`${sortField}|${sortOrder}`);
    }
  }, [sheetOpen, categoryFilter, sortField, sortOrder]);

  const applyMobileFilters = () => {
    if (tempSort !== `${sortField}|${sortOrder}`) {
      const [field, desiredOrder] = tempSort.split("|");
      if (field === sortField) {
        if (desiredOrder !== sortOrder) handleSort(field);
      } else {
        handleSort(field);
        if (desiredOrder === "desc") handleSort(field);
      }
    }
    if (tempCategory !== categoryFilter) {
      setCategoryFilter(tempCategory);
    }
    setSheetOpen(false);
  };

  const clearAllFilters = () => {
    setInputValue("");
    setSearchTerm("");
    setCategoryFilter("all");
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
  }, [searchTerm, pageSize, categoryFilter, resetPage]);

  const handleInputChange = (value: string) => {
    setInputValue(value);
    if (debounceTimer.current) clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setSearchTerm(value);
    }, 200);
  };

  useEffect(() => {
    return () => {
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
    };
  }, []);

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = t("nameRequired");
    if (formData.category === 0) errors.category = t("categoryRequired");
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
      const originalSubCategory = subs.find((s) => s.id === editingId);
      if (originalSubCategory) {
        const hasChanges =
          originalSubCategory.name !== formData.name ||
          (originalSubCategory.name_am || "") !== (formData.name_am || "") ||
          originalSubCategory.slug !== formData.slug ||
          originalSubCategory.category !== formData.category ||
          (originalSubCategory.item_code || "") !==
            (formData.item_code || "") ||
          (originalSubCategory.description || "") !==
            (formData.description || "") ||
          (originalSubCategory.order || 0) !== formData.order ||
          (originalSubCategory.is_active ?? true) !== formData.is_active ||
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
      fd.append("category", String(formData.category));
      if (formData.item_code) fd.append("item_code", formData.item_code);
      if (formData.description) fd.append("description", formData.description);
      fd.append("order", String(formData.order));
      fd.append("is_active", String(formData.is_active));
      if (formData.icon instanceof File) fd.append("icon", formData.icon);

      if (editingId) {
        const existing = subs.find((s) => s.id === editingId);
        if (existing) await updateSubCategory(existing.slug, fd);
        showToast("success", t("updatedSuccess"));
      } else {
        await createSubCategory(fd);
        showToast("success", t("createdSuccess"));
      }
      setModalOpen(false);
      resetForm();
      fetchData();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || t("saveFailed"));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || readOnly) return;
    try {
      await deleteSubCategory(deleteTarget.slug);
      showToast("success", t("deletedSuccess"));
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || t("deleteFailed"));
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      name: "",
      name_am: "",
      slug: "",
      category: 0,
      item_code: "",
      description: "",
      icon: null,
      iconPreview: "",
      order: 0,
      is_active: true,
    });
    setFormErrors({});
  };

  const openEdit = useCallback(
    (sub: SubCategory) => {
      if (readOnly) return;
      setEditingId(sub.id);
      setFormData({
        name: sub.name,
        name_am: sub.name_am || "",
        slug: sub.slug,
        category: sub.category,
        item_code: sub.item_code || "",
        description: sub.description || "",
        icon: null,
        iconPreview: sub.icon || "",
        order: sub.order || 0,
        is_active: sub.is_active ?? true,
      });
      setModalOpen(true);
    },
    [readOnly],
  );

  const handleDeleteClick = useCallback(
    (sub: SubCategory) => {
      if (readOnly) return;
      setDeleteTarget(sub);
    },
    [readOnly],
  );

  const categoryOptions: SelectOption[] = useMemo(
    () => [
      { value: "all", label: t("allCategories") },
      ...categories.map((cat) => ({
        value: String(cat.id),
        label: cat.name,
      })),
    ],
    [categories, t],
  );

  const columns: Column<SubCategory>[] = useMemo(
    () => [
      {
        key: "rowNumber",
        header: t("colNo"),
        sortable: false,
        render: (cat: SubCategory & { rowNumber?: number }) => cat.rowNumber,
      },
      {
        key: "icon",
        header: t("colIcon"),
        sortable: false,
        render: (sub) =>
          sub.icon ? (
            <img
              src={sub.icon}
              alt={sub.name}
              className="h-8 w-8 rounded object-cover"
            />
          ) : (
            <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center">
              <ImageIcon size={14} className="text-gray-400" />
            </div>
          ),
      },
      {
        key: "name",
        header: t("colName"),
        sortable: true,
        className: "font-medium text-gray-900",
      },
      {
        key: "name_am",
        header: t("colNameAm"),
        sortable: true,
        render: (sub) => sub.name_am || "-",
      },
      {
        key: "category",
        header: t("colCategory"),
        sortable: true,
        sortKey: "category_name",
        render: (sub) =>
          categories.find((c) => c.id === sub.category)?.name || sub.category,
      },
      {
        key: "item_code",
        header: t("colItemCode"),
        sortable: true,
        render: (sub) => sub.item_code || "-",
      },
      {
        key: "slug",
        header: t("colSlug"),
        sortable: true,
        className: "font-mono text-gray-500",
      },
      {
        key: "order",
        header: t("colOrder"),
        sortable: true,
        render: (sub) => sub.order ?? "-",
      },
      {
        key: "is_active",
        header: t("colIsActive"),
        sortable: true,
        render: (sub) => (
          <span
            className={`px-2 py-1 text-xs rounded-full ${
              sub.is_active
                ? "bg-green-100 text-green-800"
                : "bg-red-100 text-red-800"
            }`}
          >
            {sub.is_active ? t("yes") : t("no")}
          </span>
        ),
      },
      {
        key: "company_count",
        header: t("colCompanies"),
        sortable: true,
        render: (sub) => sub.company_count ?? 0,
      },
    ],
    [categories, t],
  );

  if (error) return <ErrorView error={error} onRetry={fetchData} />;

  const sortOptions: SelectOption[] = [
    { value: "name|asc", label: t("sortNameAsc") },
    { value: "name|desc", label: t("sortNameDesc") },
    { value: "order|asc", label: t("sortOrderAsc") },
    { value: "order|desc", label: t("sortOrderDesc") },
    { value: "company_count|desc", label: t("sortMostCompanies") },
    { value: "company_count|asc", label: t("sortFewestCompanies") },
    { value: "is_active|desc", label: t("sortActiveFirst") },
    { value: "is_active|asc", label: t("sortInactiveFirst") },
  ];

  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: t("pageSize5") },
    { value: "10", label: t("pageSize10") },
    { value: "15", label: t("pageSize15") },
    { value: "30", label: t("pageSize30") },
    { value: "60", label: t("pageSize60") },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        icon={Package2}
        badge={
          readOnly ? (
            <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 sm:text-xs">
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
              aria-label={t("addSubcategory")}
            >
              <Plus className="h-4 w-4" />
              <span>{t("addSubcategory")}</span>
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
              aria-label={t("addSubcategory")}
            >
              <Plus className="h-4 w-4" />
              <span>{t("add")}</span>
            </button>
          ) : undefined
        }
        className="mb-5 sm:mb-6"
      />

      <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6">
        {/* Desktop filters */}
        <div className="hidden w-full items-center gap-3 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)] md:flex">
          <div className="min-w-0 flex-1">
            <SearchInput
              value={inputValue}
              onChange={handleInputChange}
              debounceMs={0}
              showClearButton={false}
              placeholder={t("searchDesktop")}
              loading={loading}
            />
          </div>

          <div className="relative z-[110] w-[290px] shrink-0">
            <CustomSelect
              value={`${sortField}|${sortOrder}`}
              onChange={(val) => {
                const [field, desiredOrder] = val.split("|");
                if (field === sortField) {
                  if (desiredOrder !== sortOrder) handleSort(field);
                } else {
                  handleSort(field);
                  if (desiredOrder === "desc") handleSort(field);
                }
              }}
              options={sortOptions}
              placeholder={t("sortBy")}
              className="w-full"
            />
          </div>

          <div className="relative z-[110] w-[250px] shrink-0">
            <CustomSelect
              value={categoryFilter}
              onChange={setCategoryFilter}
              options={categoryOptions}
              placeholder={t("filterCategory")}
              className="w-full"
            />
          </div>

          <div className="relative z-[110] w-[138px] shrink-0">
            <CustomSelect
              value={String(pageSize)}
              onChange={(value) => setPageSize(Number(value))}
              options={pageSizeOptions}
              placeholder={t("pageSize10")}
              className="w-full"
            />
          </div>
        </div>

        {/* Mobile filters */}
        <div className="flex w-full items-center gap-2 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)] md:hidden">
          <div className="relative min-w-0 flex-1">
            <SearchInput
              value={inputValue}
              onChange={handleInputChange}
              debounceMs={0}
              loading={loading}
              showClearButton={false}
              placeholder={t("searchMobile")}
              className="rounded-xl border-secondary shadow-sm focus:ring-2 focus:ring-secondary/30"
            />

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label={t("openFilters")}
              className="absolute right-1 md:right-3 top-1/2 flex h-7 w-7 -translate-y-1/2 items-center justify-center md:rounded-lg md:bg-secondary md:text-white md:shadow-sm md:transition md:hover:bg-secondary/90 md:active:scale-95"
            >
              <Filter
                size={14}
                strokeWidth={2.5}
                className="text-secondary md:text-white"
              />
            </button>
          </div>

          <div className="relative z-[110] w-[104px] shrink-0">
            <CustomSelect
              value={String(pageSize)}
              onChange={(value) => setPageSize(Number(value))}
              options={pageSizeOptions}
              placeholder={t("pageSize10")}
              className="w-full text-xs"
            />
          </div>
        </div>
      </div>

      {/* Mobile card view */}
      <div className="block md:hidden">
        {loading ? (
          <MobileCardSkeleton
            count={3}
            metaLinePairs={2}
            showActions={!readOnly}
          />
        ) : paginatedItemsWithRowNumber.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center px-2">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
              <ImageIcon className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">
              {t("emptyTitle")}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {searchTerm.trim() || categoryFilter !== "all"
                ? t("emptyFiltered")
                : t("emptyNoData")}
            </p>
          </div>
        ) : (
          <div className="space-y-4 px-2 pb-24">
            {paginatedItemsWithRowNumber.map((sub) => (
              <div
                key={sub.id}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-200 space-y-3"
              >
                <div className="flex items-center gap-3">
                  {sub.icon ? (
                    <img
                      src={sub.icon}
                      alt={sub.name}
                      className="h-10 w-10 rounded object-cover"
                    />
                  ) : (
                    <div className="h-10 w-10 bg-gray-100 rounded flex items-center justify-center">
                      <ImageIcon size={18} className="text-gray-400" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">
                      {sub.name}
                    </h3>
                    {sub.name_am && (
                      <p className="text-xs text-gray-500">{sub.name_am}</p>
                    )}
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] xs:text-xs font-medium rounded-full ${
                      sub.is_active
                        ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                        : "bg-red-50 text-red-700 border border-red-200"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        sub.is_active ? "bg-emerald-500" : "bg-red-500"
                      }`}
                    ></span>
                    {sub.is_active ? t("statusActive") : t("statusInactive")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs text-gray-600">
                  <div>
                    <span className="font-medium">{t("labelCategory")}</span>{" "}
                    {categories.find((c) => c.id === sub.category)?.name ||
                      sub.category}
                  </div>
                  <div>
                    <span className="font-medium">{t("labelItemCode")}</span>{" "}
                    {sub.item_code || "—"}
                  </div>
                  <div>
                    <span className="font-medium">{t("labelSlug")}</span>{" "}
                    <span className="font-mono">{sub.slug}</span>
                  </div>
                  <div>
                    <span className="font-medium">{t("labelOrder")}</span>{" "}
                    {sub.order ?? "—"}
                  </div>
                </div>
                {!readOnly && (
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => openEdit(sub)}
                      className="flex-1 bg-secondary/10 text-secondary text-xs font-medium p-1 rounded-xl hover:bg-secondary/20 min-h-[32px]"
                    >
                      <Edit size={14} className="inline-block mr-1" />
                      {t("edit")}
                    </button>
                    <button
                      onClick={() => handleDeleteClick(sub)}
                      className="flex-1 bg-red-50 text-red-600 text-xs font-medium p-1 rounded-xl hover:bg-red-100 min-h-[32px]"
                    >
                      <Trash2 size={14} className="inline-block mr-1" />
                      {t("delete")}
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden w-full md:block">
        <MemoizedDataTable<SubCategory>
          data={paginatedItemsWithRowNumber}
          columns={columns}
          loading={loading}
          emptyMessage={t("emptyTitle")}
          onEdit={!readOnly ? openEdit : undefined}
          onDelete={!readOnly ? handleDeleteClick : undefined}
          sortField={sortField}
          sortOrder={sortOrder}
          onSort={handleSort}
        />
      </div>

      <div className="mt-6">
        <MemoizedPagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={goToPage}
        />
      </div>

      <FilterSortSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        sortOptions={sortOptions}
        tempSort={tempSort}
        onTempSortChange={setTempSort}
        categoryOptions={categoryOptions}
        tempCategory={tempCategory}
        onTempCategoryChange={setTempCategory}
        categoryNameMap={Object.fromEntries(
          categories.map((c) => [String(c.id), c.name]),
        )}
        onApply={applyMobileFilters}
        onClearAll={clearAllFilters}
      />

      {!readOnly && (
        <FormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? t("editSubCategory") : t("newSubCategory")}
          onSubmit={handleSubmit}
          submitting={submitting}
          maxWidth="lg"
        >
          <div className="space-y-6">
            {/* Row 1: Name fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {t("nameEnglish")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 min-h-[44px] ${
                    formErrors.name
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                  }`}
                  required
                />
                {formErrors.name && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {formErrors.name}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {t("nameAmharic")}
                </label>
                <input
                  type="text"
                  value={formData.name_am}
                  onChange={(e) =>
                    setFormData({ ...formData, name_am: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 min-h-[44px]"
                />
              </div>
            </div>

            {/* Row 2: Slug and Category */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {t("slug")} <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder={t("slugPlaceholder")}
                  value={formData.slug}
                  onChange={(e) =>
                    setFormData({ ...formData, slug: e.target.value })
                  }
                  disabled={!!editingId}
                  className={`w-full border-2 rounded-xl px-4 py-2.5 text-sm font-mono transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-secondary/20 min-h-[44px] ${
                    formErrors.slug
                      ? "border-red-500 bg-red-50"
                      : "border-gray-200 bg-gray-50/80 focus:border-secondary focus:bg-white"
                  } ${editingId ? "bg-gray-100 text-gray-500 cursor-not-allowed" : ""}`}
                />
                {formErrors.slug && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {formErrors.slug}
                  </p>
                )}
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {t("category")} <span className="text-red-500">*</span>
                </label>
                <CustomSelect
                  value={String(formData.category)}
                  onChange={(val) =>
                    setFormData({ ...formData, category: Number(val) })
                  }
                  options={categoryOptions.filter((opt) => opt.value !== "all")}
                  placeholder={t("selectCategory")}
                  className="w-full"
                />
                {formErrors.category && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {formErrors.category}
                  </p>
                )}
              </div>
            </div>

            {/* Row 3: Item Code and Order */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {t("itemCode")}
                </label>
                <input
                  type="text"
                  value={formData.item_code}
                  onChange={(e) =>
                    setFormData({ ...formData, item_code: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 min-h-[44px]"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {t("order")}
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.order}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      order: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 focus:outline-none focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 min-h-[44px]"
                />
                {formErrors.order && (
                  <p className="text-red-500 text-xs mt-1.5">
                    {formErrors.order}
                  </p>
                )}
              </div>
            </div>

            {/* Row 4: Icon and Description */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {t("subCategoryIcon")}
                </label>
                <div
                  className="bg-gradient-to-br from-gray-50 to-white rounded-xl border-2 border-dashed border-gray-200 p-2 flex flex-col items-center justify-center transition-all duration-300 hover:border-secondary hover:bg-gray-50/80"
                  style={{ height: "130px" }}
                >
                  <input
                    type="file"
                    id="subcategory-icon-upload"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        if (file.size > 5 * 1024 * 1024) {
                          alert(t("fileTooLarge"));
                          return;
                        }
                        setFormData({
                          ...formData,
                          icon: file,
                          iconPreview: URL.createObjectURL(file),
                        });
                      }
                    }}
                  />
                  {formData.iconPreview ? (
                    <div className="relative w-full h-full flex flex-col items-center justify-center">
                      <div className="relative group/preview">
                        <img
                          src={formData.iconPreview}
                          alt={t("preview")}
                          className="w-16 h-16 rounded-xl object-cover shadow-lg ring-2 ring-secondary/20"
                        />
                        <div className="absolute inset-0 bg-black/50 rounded-xl opacity-0 group-hover/preview:opacity-100 transition-opacity flex items-center justify-center">
                          <span className="text-white text-[10px] font-medium">
                            {t("preview")}
                          </span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            icon: null,
                            iconPreview: "",
                          });
                          const fileInput = document.getElementById(
                            "subcategory-icon-upload",
                          ) as HTMLInputElement;
                          if (fileInput) fileInput.value = "";
                        }}
                        className="mt-2 w-6 h-6 rounded-full bg-red-500 hover:bg-red-600 transition-all duration-200 flex items-center justify-center shadow-md hover:shadow-lg"
                        title={t("removeImage")}
                      >
                        <svg
                          className="w-3.5 h-3.5 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2.5}
                            d="M6 18L18 6M6 6l12 12"
                          />
                        </svg>
                      </button>
                    </div>
                  ) : (
                    <label
                      htmlFor="subcategory-icon-upload"
                      className="flex flex-col items-center justify-center cursor-pointer w-full h-full transition-all duration-200 hover:scale-102"
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary/10 to-secondary/5 flex items-center justify-center mb-1.5 transition-all duration-200 group-hover:shadow-md">
                        <svg
                          className="w-5 h-5 text-secondary"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                      </div>
                      <span className="text-[11px] font-semibold text-gray-600">
                        {t("uploadIcon")}
                      </span>
                      <span className="text-[10px] text-gray-400 mt-0.5">
                        {t("uploadHint")}
                      </span>
                    </label>
                  )}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                  {t("description")}
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className="w-full border-2 border-gray-200 bg-gray-50/80 rounded-xl px-4 py-3 text-sm transition-all duration-200 focus:outline-none focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 resize-none min-h-[44px]"
                  style={{ height: "130px" }}
                />
              </div>
            </div>

            {/* Active toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="is_active"
                checked={formData.is_active}
                onChange={(e) =>
                  setFormData({ ...formData, is_active: e.target.checked })
                }
                className="h-5 w-5 text-secondary focus:ring-secondary focus:ring-2 border-gray-300 rounded cursor-pointer transition-all"
              />
              <label
                htmlFor="is_active"
                className="text-sm font-semibold text-gray-700 cursor-pointer"
              >
                {t("activeSubcategory")}
              </label>
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  formData.is_active
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-gray-100 text-gray-500"
                }`}
              >
                <span
                  className={`inline-block w-1.5 h-1.5 rounded-full ${
                    formData.is_active ? "bg-emerald-500" : "bg-gray-400"
                  }`}
                ></span>
                {formData.is_active ? t("statusVisible") : t("statusHidden")}
              </span>
            </div>
          </div>
        </FormModal>
      )}

      <DeleteConfirmModal
        isOpen={!!deleteTarget}
        title={deleteTarget?.name || ""}
        deleteTitle={t("deleteSubCategory")}
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