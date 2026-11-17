import { useState, useEffect, useMemo } from "react";
import { Plus, X, Repeat, Lock, Package2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../../context/authContext";
import { useCompanyProducts } from "../../../hooks/useCompanyProducts";
import { CompanySelector } from "./CompanySelector";
import { ProductTable, type Product } from "./ProductTable";
import { ProductDetailView } from "./ProductDetailView";
import { ProductModal } from "./ProductModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { ErrorView } from "../../ui/ErrorView";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { SearchInput } from "../../ui/SearchInput";
import PageHeader from "../../ui/PageHeader";

export default function CompanyProducts() {
  const { t } = useTranslation("product");
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";

  const selectedCompany = useMemo(() => {
    if (!companySlug) return null;
    return (
      companies.find((c: any) => c.slug === companySlug) ||
      (company as any) ||
      null
    );
  }, [companySlug, companies, company]);

  const companyIsActive = selectedCompany?.is_active !== false;
  const isCompanyViewOnly = !companyIsActive;

  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const companyRole = useMemo(() => {
    if (!user || !companySlug) return "";
    if (isSuperAdmin) return "admin";
    const membership = user.memberships?.find(
      (m: any) => m.company_slug === companySlug,
    );
    return membership?.role || "";
  }, [user, companySlug, isSuperAdmin]);

  const isAdmin =
    companyRole === "admin" || companyRole === "owner" || isSuperAdmin;
  const canEditBasic = companyIsActive && isAdmin;
  const canDelete = companyIsActive && isAdmin;

  const [pageSize, setPageSize] = useState(10);

  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: t("products.pageSize.5") },
    { value: "10", label: t("products.pageSize.10") },
    { value: "15", label: t("products.pageSize.15") },
    { value: "30", label: t("products.pageSize.30") },
    { value: "60", label: t("products.pageSize.60") },
  ];

  const {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    search,
    setSearch,
    setCurrentPage,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch,
  } = useCompanyProducts({ companySlug, pageSize });

  useEffect(() => {
    setCurrentPage(1);
    setTimeout(() => {
      refetch();
    }, 100);
  }, [pageSize]);

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [viewingProduct, setViewingProduct] = useState<Product | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{
    id: number;
    title: string;
  } | null>(null);
  const [toast, setToast] = useState<{
    type: "success" | "error";
    message: string;
  } | null>(null);
  const [toastZIndex, setToastZIndex] = useState(50);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);

  useEffect(() => {
    if (!isCompanyViewOnly) return;
    setIsModalOpen(false);
    setEditingProduct(null);
    setDeleteTarget(null);
  }, [isCompanyViewOnly]);

  const showToast = (type: "success" | "error", message: string) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const showToastWithHigherZIndex = (
    type: "success" | "error",
    message: string,
  ) => {
    setToastZIndex(100);
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
      setToastZIndex(50);
    }, 3000);
  };

  const handleAdd = () => {
    if (isCompanyViewOnly) {
      showToast("error", t("products.messages.inactiveViewOnly"));
      return;
    }
    if (!canEditBasic) {
      showToast("error", t("products.messages.noPermission"));
      return;
    }
    setEditingProduct(null);
    setIsModalOpen(true);
  };

  const handleView = (product: Product) => {
    setViewingProduct(product);
  };

  const handleEdit = (product: any) => {
    if (isCompanyViewOnly) {
      showToast("error", t("products.messages.inactiveViewOnly"));
      return;
    }
    if (!canEditBasic) {
      showToast("error", t("products.messages.noPermission"));
      return;
    }
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (isCompanyViewOnly) {
      showToast("error", t("products.messages.inactiveViewOnly"));
      setDeleteTarget(null);
      return;
    }
    if (!canDelete) {
      showToast("error", t("products.messages.noPermission"));
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteProduct(deleteTarget.id);
      showToast("success", t("products.messages.deleted"));
    } catch {
      showToast("error", t("products.messages.deleteFailed"));
    } finally {
      setDeleteTarget(null);
    }
  };

  const handleSave = async (data: any, existingProductId?: number) => {
    if (!canEditBasic) {
      const message = isCompanyViewOnly
        ? t("products.messages.inactiveViewOnly")
        : t("products.messages.noPermission");
      showToast("error", message);
      throw new Error(message);
    }
    try {
      if (existingProductId) {
        await updateProduct(existingProductId, data);
        showToast("success", t("products.messages.updated"));
        await refetch();
        return { id: existingProductId };
      }
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        showToast("success", t("products.messages.updated"));
        await refetch();
        return { id: editingProduct.id };
      } else {
        const created = await createProduct(data);
        showToast("success", t("products.messages.created"));
        await refetch();
        return created;
      }
    } catch (err: any) {
      const errorMsg =
        err?.response?.data?.detail ||
        (Array.isArray(err?.response?.data) ? err.response.data[0] : null) ||
        (typeof err?.response?.data === "object" && err?.response?.data !== null
          ? Object.values(err.response.data).flat()[0]
          : null) ||
        t("products.messages.saveFailed");
      showToast(
        "error",
        typeof errorMsg === "string"
          ? errorMsg
          : t("products.messages.saveFailed"),
      );
      throw err;
    }
  };

  if (showSelector) {
    return (
      <CompanySelector
        companies={companies}
        isLoading={isLoadingCompanies}
        title={t("companySelector.title")}
        subtitle={t("companySelector.subtitle")}
        searchPlaceholder={t("companySelector.searchPlaceholder")}
        onSelect={(slug, name) => {
          const membership = user?.memberships?.find(
            (m: any) => m.company_slug === slug,
          );
          const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  if (error && !companySlug)
    return <ErrorView error={error} onRetry={refetch} />;

  if (!companySlug)
    return (
      <div className="flex flex-col items-center justify-center py-12 text-gray-500">
        {t("products.messages.noCompanySelected")}
      </div>
    );

  if (viewingProduct) {
    return (
      <ProductDetailView
        product={viewingProduct}
        companyName={companyName}
        onBack={() => setViewingProduct(null)}
        onEdit={
          canEditBasic
            ? (product) => {
                setViewingProduct(null);
                handleEdit(product);
              }
            : undefined
        }
      />
    );
  }

  return (
    <>
      <Toast toast={toast} zIndex={toastZIndex} />
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          title={deleteTarget?.title || ""}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTarget(null)}
        />
        <ProductModal
          isOpen={isModalOpen && canEditBasic}
          editingProduct={editingProduct}
          companySlug={companySlug}
          companyMealPeriods={selectedCompany?.meal_periods}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          onProductUpdated={refetch}
          isStaff={companyRole === "staff"}
          canEditBasic={canEditBasic}
          canEditPricing={true}
          onShowToast={showToastWithHigherZIndex}
        />

        <div className="px-3 sm:px-5 md:px-6">
          <PageHeader
            title={t("products.title")}
            icon={Package2}
            eyebrow={
              isSuperAdmin && companyName
                ? t("products.eyebrow", { companyName })
                : undefined
            }
            description={
              isCompanyViewOnly
                ? t("products.description.inactive")
                : t("products.description.active")
            }
            badge={
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${
                  companyIsActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {companyIsActive
                  ? t("products.badge.active")
                  : t("products.badge.inactiveViewOnly")}
              </span>
            }
            actions={
              <>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={clearCompany}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-secondary shadow-sm transition hover:border-secondary/30 hover:bg-secondary/5 sm:text-sm"
                  >
                    <Repeat className="h-4 w-4" />
                    <span>{t("products.actions.switchCompany")}</span>
                  </button>
                )}
                {canEditBasic && (
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t("products.actions.addProduct")}</span>
                  </button>
                )}
              </>
            }
            actionMobile={
              <>
                {isSuperAdmin && (
                  <button
                    type="button"
                    onClick={clearCompany}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-secondary shadow-sm transition hover:border-secondary/30 hover:bg-secondary/5 sm:text-sm"
                  >
                    <Repeat className="h-4 w-4" />
                  </button>
                )}
                {canEditBasic && (
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>{t("products.actions.add")}</span>
                  </button>
                )}
              </>
            }
            className="mb-3 sm:mb-4"
          />

          {isCompanyViewOnly && (
            <div className="mb-6 mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
              <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>{t("products.inactiveBanner")}</p>
            </div>
          )}
        </div>

        <div className="sticky -top-6 z-[2] -mt-6 mb-2 w-full bg-white pt-6">
          <div className="w-full px-3 sm:px-5 md:px-6">
            <div className="flex w-full items-center gap-2 rounded-xl border border-secondary/10 bg-white p-2 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
              <div className="min-w-0 flex-1">
                <SearchInput
                  value={search}
                  onChange={(value) => {
                    setSearch(value);
                    setCurrentPage(1);
                  }}
                  placeholder={t("products.searchPlaceholder")}
                  loading={loading}
                  debounceMs={0}
                  showClearButton={true}
                  className="w-full"
                />
              </div>

              <div className="relative z-[110] w-[104px] shrink-0 sm:w-[118px]">
                <CustomSelect
                  value={String(pageSize)}
                  onChange={(value) => {
                    setPageSize(Number(value));
                    setCurrentPage(1);
                  }}
                  options={pageSizeOptions}
                  placeholder={t("products.pageSize.10")}
                  className="w-full text-xs"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="px-3 sm:px-5 md:px-6 py-2">
          <ProductTable
            products={products}
            totalItems={totalItems}
            loading={loading}
            onView={handleView}
            onEdit={canEditBasic ? handleEdit : undefined}
            onDelete={
              canDelete
                ? (id, title) => setDeleteTarget({ id, title })
                : undefined
            }
          />
          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>

        {showMobileFilterModal && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setShowMobileFilterModal(false)}
          >
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-secondary">
                  {t("products.filters.title")}
                </h3>
                <button
                  onClick={() => setShowMobileFilterModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              <div className="p-4 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    {t("products.filters.itemsPerPage")}
                  </label>
                  <CustomSelect
                    key={pageSize}
                    value={String(pageSize)}
                    onChange={(val) => {
                      setPageSize(Number(val));
                      setCurrentPage(1);
                    }}
                    options={pageSizeOptions}
                    placeholder="5"
                  />
                </div>

                <div className="flex items-center gap-3 pt-2">
                  {(search || pageSize !== 10) && (
                    <button
                      onClick={() => {
                        setSearch("");
                        setPageSize(10);
                        setCurrentPage(1);
                      }}
                      className="flex-1 py-2.5 rounded-xl border border-red-200 text-red-600 text-sm font-medium hover:bg-red-50 transition"
                    >
                      {t("common.actions.clearAll")}
                    </button>
                  )}
                  <button
                    onClick={() => setShowMobileFilterModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition shadow-sm"
                  >
                    {t("products.filters.applyFilters")}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}