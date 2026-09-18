import { useState, useEffect, useMemo } from "react";
import { Plus, X, Repeat, Lock, Package2 } from "lucide-react";
// import type { CompanyListItem } from "../../../types";
import { useAuth } from "../../../context/authContext";
// import { useCompanySelection } from '../../../hooks/useCompanySelection';
import { useCompanyProducts } from "../../../hooks/useCompanyProducts";
import { CompanySelector } from "./CompanySelector";
import { ProductTable, type Product } from "./ProductTable";
import { ProductDetailView } from "./ProductDetailView";
import { ProductModal } from "./ProductModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { Toast } from "../../ui/Toast";
import { Pagination } from "../../ui/Pagination";
import { ErrorView } from "../../ui/ErrorView";
// import { NoCompanyView } from './NoCompanyView';
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { SearchInput } from "../../ui/SearchInput";
import PageHeader from "../../ui/PageHeader";

export default function CompanyProducts() {
  const { user } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";
  // Keep the selected company record so status can control write access.
  const selectedCompany = useMemo(() => {
    if (!companySlug) return null;
    return (
      companies.find((c: any) => c.slug === companySlug) ||
      (company as any) ||
      null
    );
  }, [companySlug, companies, company]);

  // If status is not present yet, do not lock the screen while company data is loading.
  const companyIsActive = selectedCompany?.is_active !== false;
  const isCompanyViewOnly = !companyIsActive;

  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  // Derive correct role for the selected company from user memberships
  const companyRole = useMemo(() => {
    if (!user || !companySlug) return "";
    if (isSuperAdmin) return "admin";
    const membership = user.memberships?.find(
      (m: any) => m.company_slug === companySlug,
    );
    return membership?.role || "";
  }, [user, companySlug, isSuperAdmin]);

  // Role-based permissions. Inactive companies are always view-only, including for super admins.
  const isAdmin = companyRole === "admin" || isSuperAdmin;
  // const isStaff = companyRole === "staff";
  const canEditBasic = companyIsActive && isAdmin;
  // const canEditPricing = isAdmin;
  const canDelete = companyIsActive && isAdmin;

  // Products hook
  const [pageSize, setPageSize] = useState(10);
  // Options for Page Size dropdown
  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: "5 / page" },
    { value: "10", label: "10 / page" },
    { value: "15", label: "15 / page" },
    { value: "30", label: "30 / page" },
    { value: "60", label: "60 / page" },
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

  // Modals & toast
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

  // Increase toast z-index when modal is open
  const showToastWithHigherZIndex = (
    type: "success" | "error",
    message: string,
  ) => {
    setToastZIndex(100); // Higher z-index for modal visibility
    setToast({ type, message });
    setTimeout(() => {
      setToast(null);
      setToastZIndex(50); // Reset to normal after toast disappears
    }, 3000);
  };

  // Handlers with permission checks (unchanged except we now use `companyRole`)
  const handleAdd = () => {
    if (isCompanyViewOnly) {
      showToast("error", "This company is inactive. Products are view-only.");
      return;
    }
    if (!canEditBasic) {
      showToast("error", "No permission");
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
      showToast("error", "This company is inactive. Products are view-only.");
      return;
    }
    if (!canEditBasic) {
      showToast("error", "No permission");
      return;
    }
    setEditingProduct(product);
    setIsModalOpen(true);
  };
  const handleDelete = async () => {
    if (!deleteTarget) return;
    if (isCompanyViewOnly) {
      showToast("error", "This company is inactive. Products are view-only.");
      setDeleteTarget(null);
      return;
    }
    if (!canDelete) {
      showToast("error", "No permission");
      setDeleteTarget(null);
      return;
    }
    try {
      await deleteProduct(deleteTarget.id);
      showToast("success", "Product deleted");
    } catch {
      showToast("error", "Delete failed");
    } finally {
      setDeleteTarget(null);
    }
  };
  const handleSave = async (data: any, existingProductId?: number) => {
    if (!canEditBasic) {
      const message = isCompanyViewOnly
        ? "This company is inactive. Products are view-only."
        : "No permission";
      showToast("error", message);
      throw new Error(message);
    }
    try {
      // If we have an existingProductId passed from modal (for update after back button)
      if (existingProductId) {
        await updateProduct(existingProductId, data);
        showToast("success", "Updated");
        await refetch(); // Refresh the product list
        return { id: existingProductId };
      }
      // Normal edit mode
      if (editingProduct) {
        await updateProduct(editingProduct.id, data);
        showToast("success", "Updated");
        await refetch(); // Refresh the product list
        return { id: editingProduct.id };
      } else {
        const created = await createProduct(data);
        showToast("success", "Created");
        await refetch(); // Refresh the product list for new product
        return created;
      }
    } catch (err: any) {
      showToast("error", err?.response?.data?.detail || "Save failed");
      throw err;
    }
  };

  // ----- Render -----
  if (showSelector) {
    return (
      <CompanySelector
        companies={companies} // ✅ now populated
        isLoading={isLoadingCompanies}
        title="All Products"
        subtitle="Select a company. Inactive companies are available in view-only mode."
        searchPlaceholder="Search products and companies by name..."
        onSelect={(slug, name) => {
          // If the user has NO memberships, they are a super admin → role = "admin"
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
        No company selected. Please select one to manage products.
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

  // Normal content (identical to your last version)
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
          onClose={() => setIsModalOpen(false)}
          onSave={handleSave}
          onProductUpdated={refetch}
          // Staff: can edit everything on create, but price/stock read‑only on edit
          isStaff={companyRole === "staff"}
          canEditBasic={canEditBasic}
          canEditPricing={true} // let the isStaff logic handle edit restriction
          onShowToast={showToastWithHigherZIndex}
        />

        <div className="px-3 sm:px-5 md:px-6">
          <PageHeader
            title="All Products"
            icon={Package2}
            eyebrow={isSuperAdmin && companyName ? companyName : undefined}
            description={
              isCompanyViewOnly
                ? "Browse and search this company’s products. Editing is disabled while the company is inactive."
                : "Manage your company’s products, pricing, stock, and availability."
            }
            badge={
              <span
                className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-semibold sm:text-xs ${
                  companyIsActive
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : "border-red-200 bg-red-50 text-red-700"
                }`}
              >
                {companyIsActive ? "Active" : "Inactive · View only"}
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
                    <span>Switch company</span>
                  </button>
                )}
                {canEditBasic && (
                  <button
                    type="button"
                    onClick={handleAdd}
                    className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:text-sm"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add Product</span>
                  </button>
                )}
              </>
            }
            className="mb-3 sm:mb-4"
          />

          {isCompanyViewOnly && (
            <div className="mb-3 mt-3 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-800 sm:text-sm">
              <Lock className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                This company is inactive. You can view and search its products,
                but adding, editing, and deleting are disabled. Only a super
                admin can reactivate the company from Company Management.
              </p>
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
                  placeholder="Search products..."
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
                  placeholder="10 / page"
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

        {/* Mobile Filter Modal - Bottom Sheet */}
        {showMobileFilterModal && (
          <div
            className="fixed inset-0 z-50 lg:hidden"
            onClick={() => setShowMobileFilterModal(false)}
          >
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

            {/* Bottom Sheet Content */}
            <div
              className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 bg-white border-b border-gray-100 px-4 py-3 flex justify-between items-center">
                <h3 className="text-lg font-extrabold text-secondary">
                  Filters
                </h3>
                <button
                  onClick={() => setShowMobileFilterModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100 transition"
                >
                  <X className="h-5 w-5 text-gray-500" />
                </button>
              </div>

              {/* Content */}
              <div className="p-4 space-y-4">
                {/* Page Size */}
                <div>
                  <label className="block text-sm font-medium text-secondary mb-1.5">
                    Items per page
                  </label>
                  <CustomSelect
                    key={pageSize}
                    value={String(pageSize)}
                    onChange={(val) => {
                      console.log(
                        "🟢 Modal CustomSelect onChange called with:",
                        val,
                      );
                      setPageSize(Number(val));
                      setCurrentPage(1);
                    }}
                    options={pageSizeOptions}
                    placeholder="5"
                  />
                </div>

                {/* Action Buttons */}
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
                      Clear all
                    </button>
                  )}
                  <button
                    onClick={() => setShowMobileFilterModal(false)}
                    className="flex-1 py-2.5 rounded-xl bg-secondary text-white text-sm font-medium hover:bg-secondary/90 transition shadow-sm"
                  >
                    Apply Filters
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
