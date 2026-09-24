import React, {
  useEffect,
  useState,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { Building2, Plus } from "lucide-react";
import api from "../../../services/api";
import {
  createCompany,
  updateCompany,
  deleteCompany,
  getCategories,
  getSubCategories,
  getCompanyDetail,
  getHeadCompanies,
} from "../../../services/api";
import type {
  CompanyListItem,
  Category,
  SubCategory,
  Company,
  HeadCompany,
} from "../../../types";
import { MultiStepFormModal } from "../../ui/MultiStepFormModal";
import { DeleteConfirmModal } from "../../ui/DeleteConfirmModal";
import { ErrorView } from "../../ui/ErrorView";
import { Toast } from "../../ui/Toast";
import { useToast } from "../../../hooks/useToast";
import { usePagination } from "../../../hooks/usePagination";
import { useSorting } from "../../../hooks/useSorting";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import type { Column } from "../../ui/DataTable";
import { ImageIcon } from "lucide-react";

import SuperAdminView from "./SuperAdminView";
import NonSuperAdminView from "./NonSuperAdminView";
import CompanyFilters from "./CompanyFilters";
import CompanyForm from "./CompanyForm";
import type { CompanyFormData } from "./CompanyForm";
import LocationPickerModal from "./LocationPickerModal";
import PageHeader from "../../ui/PageHeader";

type PaginatedResponse<T> = {
  results: T[];
  next: string | null;
};

// Role priority helper
const getPrimaryMembership = (memberships: any[] | undefined) => {
  if (!memberships?.length) return null;
  const priority: Record<string, number> = {
    owner: 5,
    admin: 4,
    staff: 3,
    delivery: 2,
    viewer: 1,
  };
  let best = memberships[0];
  let bestScore = priority[best.role] || 0;
  for (const m of memberships) {
    const score = priority[m.role] || 0;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
};

// ─── Skeleton Components ──────────────────────────────────
const SkeletonRow: React.FC = () => (
  <tr className="border-b border-gray-100/80 animate-pulse">
    <td className="py-3.5 px-5">
      <div className="h-4 w-6 bg-gray-300/70 rounded"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-10 w-10 rounded-full bg-gray-300/70"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-4 w-24 bg-gray-300/70 rounded"></div>
      <div className="h-3 w-16 bg-gray-300/70 rounded mt-1"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-4 w-20 bg-gray-300/70 rounded"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-4 w-16 bg-gray-300/70 rounded"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-4 w-16 bg-gray-300/70 rounded"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-4 w-12 bg-gray-300/70 rounded"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-4 w-20 bg-gray-300/70 rounded"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-4 w-20 bg-gray-300/70 rounded"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-4 w-20 bg-gray-300/70 rounded"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-6 w-16 bg-gray-300/70 rounded-full"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-6 w-16 bg-gray-300/70 rounded-full"></div>
    </td>
    <td className="py-3.5 px-5 text-right">
      <div className="flex items-center justify-end gap-1.5">
        <div className="h-8 w-12 bg-gray-300/70 rounded-xl"></div>
        <div className="h-8 w-12 bg-gray-300/70 rounded-xl"></div>
      </div>
    </td>
  </tr>
);

const SkeletonTable: React.FC<{ rowCount?: number }> = ({ rowCount = 5 }) => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden animate-pulse">
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="bg-gradient-to-r from-gray-50/80 to-gray-100/50 border-b border-gray-200/60">
            {[
              "No.",
              "Logo",
              "Name",
              "Slug",
              "Category",
              "Subcategory",
              "Type",
              "Address",
              "TIN",
              "Tax Type",
              "Active",
              "Featured",
              "Actions",
            ].map((_h, i) => (
              <th key={i} className="text-left py-3.5 px-5">
                <div className="h-4 w-12 bg-gray-300/70 rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rowCount)].map((_, i) => (
            <SkeletonRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
  </div>
);

const SkeletonDetailCard: React.FC = () => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-pulse">
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
      <div className="flex items-center gap-4">
        <div className="h-16 w-16 rounded-full bg-gray-300/70"></div>
        <div>
          <div className="h-6 w-48 bg-gray-300/70 rounded mb-1"></div>
          <div className="h-4 w-32 bg-gray-300/70 rounded"></div>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <div className="h-9 w-20 bg-gray-300/70 rounded-xl"></div>
        <div className="h-9 w-20 bg-gray-300/70 rounded-xl"></div>
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {[...Array(4)].map((_, i) => (
        <div key={i}>
          <div className="h-4 w-24 bg-gray-300/70 rounded mb-1"></div>
          <div className="h-5 w-32 bg-gray-300/70 rounded"></div>
        </div>
      ))}
    </div>
    <div className="mt-6 flex justify-end gap-2">
      <div className="h-10 w-24 bg-gray-300/70 rounded-xl"></div>
      <div className="h-10 w-24 bg-gray-300/70 rounded-xl"></div>
    </div>
  </div>
);

// Empty form data used for initial state and reset
const EMPTY_COMPANY_FORM: CompanyFormData = {
  name: "",
  name_am: "",
  slug: "",
  head_company: null,
  category: 0,
  sub_category: 0,
  business_type: "",
  address: "",
  address_am: "",
  description: "",
  description_am: "",
  minimum_order_total: "0.00",
  maximum_cod_total: "0.00",
  latitude: "",
  longitude: "",
  delivery_fee_per_km: "0.00",
  is_active: false,
  is_featured: false,
  supports_table_service: false,
  show_order_queue: false,
  logo: null,
  cover_image: null,
  chapa_sub_account_id: "",
  theme_primary: "#674FA3",
  theme_dark: "#6750A4",
  theme_light: "#8B6BB5",
  tin_number: "",
  vat_registration_number: "",
  tax_type: "none",
  license: null,
  contact_phone: "",
  contact_email: "",
};

const COMPANY_VERIFICATION_STORAGE_KEY = "company-verification-status-v1";

const readCompanyVerificationState = (): Record<string, boolean> => {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(COMPANY_VERIFICATION_STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
};

export default function CompanyManagement() {
  const [pageSize, setPageSize] = useState(10);
  const { user } = useAuth();
  const { company: currentCompany } = useCurrentCompany();

  // Permission flags
  const isMarketing = !!user?.is_marketing;
  const isSuperAdmin = !user?.memberships?.length && !isMarketing;
  const memberships = user?.memberships ?? [];
  const primaryMembership =
    !isSuperAdmin && !isMarketing ? getPrimaryMembership(memberships) : null;
  const userCompanyRole = primaryMembership?.role ?? null;

  // Get role for currently selected company
  const getCurrentCompanyRole = () => {
    if (isSuperAdmin) return "super_admin";
    if (!currentCompany?.slug || !memberships.length) return userCompanyRole;
    const membership = memberships.find(
      (m) => m.company_slug === currentCompany.slug,
    );
    return membership?.role || userCompanyRole;
  };

  const currentCompanyRole = getCurrentCompanyRole();

  const canAddCompany = isSuperAdmin || isMarketing;
  const canDeleteCompany = isSuperAdmin;
  const canEditCompany = useCallback(
    (companySlug: string) => {
      if (isSuperAdmin || isMarketing) return true;
      const membershipForCompany = memberships.find(
        (m) => m.company_slug === companySlug,
      );
      const roleForCompany = membershipForCompany?.role;
      return roleForCompany === "owner" || roleForCompany === "admin";
    },
    [isSuperAdmin, isMarketing, memberships],
  );

  // Data states
  const [companies, setCompanies] = useState<CompanyListItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<SubCategory[]>([]);
  const [headCompanies, setHeadCompanies] = useState<HeadCompany[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Search & filter state
  const [inputValue, setInputValue] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [businessTypeFilter, setBusinessTypeFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [subCategoryFilter, setSubCategoryFilter] = useState("all");

  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [showMapPicker, setShowMapPicker] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [formData, setFormData] = useState<CompanyFormData>({
    ...EMPTY_COMPANY_FORM,
  });
  const [originalFormData, setOriginalFormData] =
    useState<CompanyFormData | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  const handleLogoChange = useCallback(
    (file: File | null) => {
      if (logoPreview && logoPreview.startsWith("blob:")) {
        URL.revokeObjectURL(logoPreview);
      }
      if (file) {
        const url = URL.createObjectURL(file);
        setLogoPreview(url);
      } else {
        setLogoPreview(null);
      }
    },
    [logoPreview],
  );

  const handleCoverChange = useCallback(
    (file: File | null) => {
      if (coverPreview && coverPreview.startsWith("blob:")) {
        URL.revokeObjectURL(coverPreview);
      }
      if (file) {
        const url = URL.createObjectURL(file);
        setCoverPreview(url);
      } else {
        setCoverPreview(null);
      }
    },
    [coverPreview],
  );

  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<CompanyListItem | null>(
    null,
  );
  const { toast, showToast } = useToast();
  const [isEditingActive, setIsEditingActive] = useState(false);
  const [verificationBySlug, setVerificationBySlug] = useState<Record<string, boolean>>(
    readCompanyVerificationState,
  );
  const [verificationDraft, setVerificationDraft] = useState(false);
  const [originalVerification, setOriginalVerification] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(
        COMPANY_VERIFICATION_STORAGE_KEY,
        JSON.stringify(verificationBySlug),
      );
    } catch {
      // Verification is a frontend convenience only. Ignore storage failures.
    }
  }, [verificationBySlug]);

  const handleVerificationChange = useCallback(
    (verified: boolean) => {
      if (!isSuperAdmin || !editingSlug) return;
      setVerificationDraft(verified);
      if (!verified) {
        setFormData((current) => ({ ...current, is_active: false }));
      }
    },
    [isSuperAdmin, editingSlug],
  );

  // Filtered companies (super admin or marketing agent)
  const filteredCompanies = useMemo(() => {
    if (!isSuperAdmin && !isMarketing) return companies;
    let data = [...companies];
    if (businessTypeFilter !== "all") {
      data = data.filter((comp) => comp.business_type === businessTypeFilter);
    }
    if (categoryFilter !== "all") {
      data = data.filter((comp) => comp.category_name === categoryFilter);
    }
    if (subCategoryFilter !== "all") {
      data = data.filter(
        (comp) => comp.sub_category_name === subCategoryFilter,
      );
    }
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(
      (comp) =>
        comp.name.toLowerCase().includes(term) ||
        (comp.name_am && comp.name_am.toLowerCase().includes(term)) ||
        comp.slug.toLowerCase().includes(term) ||
        (comp.business_type &&
          comp.business_type.toLowerCase().includes(term)) ||
        comp.category_name.toLowerCase().includes(term) ||
        comp.sub_category_name.toLowerCase().includes(term),
    );
  }, [
    companies,
    searchTerm,
    isSuperAdmin,
    businessTypeFilter,
    categoryFilter,
    subCategoryFilter,
  ]);

  // Options for filters
  const businessTypeOptions = useMemo(
    () =>
      Array.from(
        new Set(companies.map((c) => c.business_type).filter(Boolean)),
      ).sort(),
    [companies],
  );
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(companies.map((c) => c.category_name).filter(Boolean)),
      ).sort(),
    [companies],
  );
  const subCategoryOptions = useMemo(
    () =>
      Array.from(
        new Set(companies.map((c) => c.sub_category_name).filter(Boolean)),
      ).sort(),
    [companies],
  );
  const hasActiveFilters =
    !!inputValue.trim() ||
    businessTypeFilter !== "all" ||
    categoryFilter !== "all" ||
    subCategoryFilter !== "all";

  // Sorting & pagination
  const { sortedItems, handleSort, sortField, sortOrder } = useSorting(
    isSuperAdmin || isMarketing ? filteredCompanies : companies,
    "name",
    "asc",
  );
  const { paginatedItems, currentPage, totalPages, goToPage, resetPage } =
    usePagination(sortedItems, pageSize);

  const paginatedItemsWithRowNumber = useMemo(
    () =>
      paginatedItems.map((item, idx) => ({
        ...item,
        rowNumber: (currentPage - 1) * pageSize + idx + 1,
      })),
    [paginatedItems, currentPage, pageSize],
  );

  useEffect(() => {
    resetPage();
  }, [
    searchTerm,
    pageSize,
    businessTypeFilter,
    categoryFilter,
    subCategoryFilter,
    resetPage,
  ]);

  // Table columns (memoised)
  const columns: Column<CompanyListItem>[] = useMemo(
    () => [
      {
        key: "rowNumber",
        header: "No.",
        sortable: false,
        render: (item: CompanyListItem & { rowNumber?: number }) =>
          item.rowNumber,
      },
      {
        key: "logo",
        header: "Logo",
        sortable: false,
        render: (comp) =>
          comp.logo ? (
            <img
              src={comp.logo}
              alt={comp.name}
              className="h-8 w-8 sm:h-10 sm:w-10 rounded-full object-cover"
            />
          ) : (
            <div className="h-8 w-8 sm:h-10 sm:w-10 rounded-full bg-gray-100 flex items-center justify-center">
              <ImageIcon size={16} className="text-gray-400" />
            </div>
          ),
      },
      {
        key: "name",
        header: "Name",
        sortable: true,
        className:
          "font-medium text-gray-900 max-w-[120px] sm:max-w-[200px] break-words",
      },
      {
        key: "slug",
        header: "Slug",
        sortable: true,
        className:
          "font-mono text-gray-500 max-w-[100px] sm:max-w-[150px] break-words",
      },
      { key: "category_name", header: "Category", sortable: true },
      { key: "sub_category_name", header: "Subcategory", sortable: true },
      {
        key: "business_type",
        header: "Type",
        sortable: true,
        render: (comp) => comp.business_type?.toUpperCase() || "-",
      },
      {
        key: "address",
        header: "Address",
        sortable: true,
        className: "w-[190px] max-w-[190px]",
        render: (comp) => {
          const address = comp.address?.trim() || "-";

          return (
            <span
              className="block w-[190px] max-w-[190px] overflow-hidden text-ellipsis whitespace-nowrap"
              title={address === "-" ? undefined : address}
            >
              {address}
            </span>
          );
        },
      },
      {
        key: "tin_number",
        header: "TIN",
        sortable: true,
        render: (comp) => comp.tin_number || "-",
      },
      {
        key: "tax_type",
        header: "Tax Type",
        sortable: true,
        render: (comp) => {
          const taxLabels: Record<string, string> = {
            vat: "VAT",
            turnover_goods: "Turnover Goods",
            turnover_services: "Turnover Services",
            none: "None",
          };
          return taxLabels[comp.tax_type || "none"] || "-";
        },
      },
      {
        key: "is_active",
        header: "Is Active",
        sortable: true,
        render: (comp) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${comp.is_active
                ? "bg-emerald-100 text-emerald-700 border-emerald-200"
                : "bg-red-100 text-red-700 border-red-200"
              }`}
          >
            {comp.is_active ? "Yes" : "No"}
          </span>
        ),
      },
      {
        key: "is_featured",
        header: "Featured",
        sortable: true,
        render: (comp) => (
          <span
            className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold border ${comp.is_featured
                ? "bg-amber-100 text-amber-700 border-amber-200"
                : "bg-red-100 text-red-700 border-red-200"
              }`}
          >
            {comp.is_featured ? "Yes" : "No"}
          </span>
        ),
      },
    ],
    [],
  );

  // Sort change handler
  const onSortChange = useCallback(
    (value: string) => {
      const [field, desiredOrder] = value.split("|");
      if (field === sortField) {
        if (desiredOrder !== sortOrder) handleSort(field);
      } else {
        handleSort(field);
        if (desiredOrder === "desc") handleSort(field);
      }
    },
    [handleSort, sortField, sortOrder],
  );

  // --- API fetching ---
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      if (!isSuperAdmin && !isMarketing && currentCompany?.slug) {
        const companyRes = await getCompanyDetail(currentCompany.slug);
        const company = companyRes.data as Company;
        const companyListItem: CompanyListItem = {
          id: company.id,
          name: company.name,
          name_am: company.name_am || "",
          slug: company.slug,
          logo: company.logo,
          cover_image: company.cover_image,
          head_company: company.head_company ?? null,
          head_company_detail: company.head_company_detail ?? null,
          category: company.category,
          category_name: company.category_name,
          sub_category: company.sub_category,
          sub_category_name: company.sub_category_name,
          business_type: company.business_type,
          minimum_order_total: company.minimum_order_total || "0.00",
          maximum_cod_total: company.maximum_cod_total || "0.00",
          latitude: company.latitude || "",
          longitude: company.longitude || "",
          delivery_fee_per_km: company.delivery_fee_per_km || "0.00",
          is_active: company.is_active,
          is_featured: company.is_featured,
          supports_table_service: company.supports_table_service,
          show_order_queue: Boolean(company.show_order_queue),
          description: company.description || "",
          address: company.address || "",
          address_am: (company as any).address_am || "",
          contact_phone: company.contact_phone || "",
          contact_email: company.contact_email || "",
          tin_number: (company as any).tin_number || "",
          vat_registration_number:
            (company as any).vat_registration_number || "",
          tax_type: (company as any).tax_type || "none",
          license: (company as any).license || null,
          chapa_sub_account_id: (company as any).chapa_sub_account_id || "",
          theme_primary: (company as any).theme_primary || "#674FA3",
          theme_dark: (company as any).theme_dark || "#6750A4",
          theme_light: (company as any).theme_light || "#8B6BB5",
        };
        setCompanies([companyListItem]);
        setEditingSlug(companyListItem.slug);
        const newFormData: CompanyFormData = {
          name: companyListItem.name,
          name_am: companyListItem.name_am || "",
          slug: companyListItem.slug,
          head_company: companyListItem.head_company ?? null,
          category: companyListItem.category,
          sub_category: companyListItem.sub_category,
          business_type: companyListItem.business_type,
          address: companyListItem.address || "",
          address_am: (companyListItem as any).address_am || "",
          description: companyListItem.description || "",
          description_am: (companyListItem as any).description_am || "",
          minimum_order_total: companyListItem.minimum_order_total || "0.00",
          maximum_cod_total: companyListItem.maximum_cod_total || "0.00",
          latitude: companyListItem.latitude || "",
          longitude: companyListItem.longitude || "",
          delivery_fee_per_km: companyListItem.delivery_fee_per_km || "0.00",
          is_active: companyListItem.is_active,
          is_featured: companyListItem.is_featured,
          supports_table_service: companyListItem.supports_table_service,
          show_order_queue: Boolean(companyListItem.show_order_queue),
          logo: null,
          cover_image: null,
          contact_phone: companyListItem.contact_phone || "",
          contact_email: companyListItem.contact_email || "",
          license: (companyListItem as any).license || null,
          tin_number: companyListItem.tin_number || "",
          vat_registration_number:
            companyListItem.vat_registration_number || "",
          tax_type: companyListItem.tax_type || "none",
          chapa_sub_account_id:
            (companyListItem as any).chapa_sub_account_id || "",
          theme_primary: (companyListItem as any).theme_primary || "#674FA3",
          theme_dark: (companyListItem as any).theme_dark || "#6750A4",
          theme_light: (companyListItem as any).theme_light || "#8B6BB5",
        };
        setFormData(newFormData);
        setOriginalFormData({
          ...newFormData,
          logo: companyListItem.logo as any,
          cover_image: companyListItem.cover_image as any,
        });
        if (companyListItem.logo) setLogoPreview(companyListItem.logo);
        if (companyListItem.cover_image)
          setCoverPreview(companyListItem.cover_image);
      } else if (isSuperAdmin || isMarketing) {
        let allCompanies: CompanyListItem[] = [];
        const extraParam = isMarketing ? "&my_registrations=true" : "";
        let nextUrl: string | null =
          `/companies/?page=1&ordering=name${extraParam}`;
        while (nextUrl) {
          const res = await api.get(nextUrl);
          const data = res.data as PaginatedResponse<CompanyListItem>;
          allCompanies = [...allCompanies, ...data.results];
          nextUrl = data.next;
        }

        const detailedCompanies = await Promise.all(
          allCompanies.map(async (company) => {
            try {
              const detailRes = await getCompanyDetail(company.slug);
              const detail = detailRes.data as any;
              return {
                ...company,
                contact_phone: detail.contact_phone || "",
                contact_email: detail.contact_email || "",
                description: detail.description,
                description_am: detail.description_am,
                head_company: detail.head_company ?? null,
                tin_number: detail.tin_number || "",
                vat_registration_number: detail.vat_registration_number || "",
                tax_type: detail.tax_type || "none",
                license: detail.license || null,
                chapa_sub_account_id: detail.chapa_sub_account_id || "",
                theme_primary: detail.theme_primary || "#674FA3",
                theme_dark: detail.theme_dark || "#6750A4",
                theme_light: detail.theme_light || "#8B6BB5",
                delivery_fee_per_km: detail.delivery_fee_per_km || "",
              };
            } catch (err) {
              return company;
            }
          }),
        );

        setCompanies(detailedCompanies);
        if (detailedCompanies.length > 0) {
          const first = detailedCompanies[0];
          setEditingSlug(first.slug);
          const newFormData: CompanyFormData = {
            name: first.name,
            name_am: first.name_am || "",
            slug: first.slug,
            head_company: first.head_company ?? null,
            category: first.category,
            sub_category: first.sub_category,
            business_type: first.business_type,
            address: first.address || "",
            address_am: (first as any).address_am || "",
            description: first.description || "",
            description_am: (first as any).description_am || "",
            minimum_order_total: first.minimum_order_total || "0.00",
            maximum_cod_total: first.maximum_cod_total || "0.00",
            latitude: first.latitude || "",
            longitude: first.longitude || "",
            delivery_fee_per_km: first.delivery_fee_per_km || "0.00",
            is_active: first.is_active,
            is_featured: first.is_featured,
            supports_table_service: first.supports_table_service,
            show_order_queue: Boolean(first.show_order_queue),
            logo: null,
            cover_image: null,
            contact_phone: first.contact_phone || "",
            contact_email: first.contact_email || "",
            license: (first as any).license || null,
            tin_number: first.tin_number || "",
            vat_registration_number: first.vat_registration_number || "",
            tax_type: first.tax_type || "none",
            chapa_sub_account_id: (first as any).chapa_sub_account_id || "",
            theme_primary: (first as any).theme_primary || "#674FA3",
            theme_dark: (first as any).theme_dark || "#6750A4",
            theme_light: (first as any).theme_light || "#8B6BB5",
          };
          setFormData(newFormData);
          setOriginalFormData({
            ...newFormData,
            logo: first.logo as any,
            cover_image: first.cover_image as any,
          });
          if (first.logo) setLogoPreview(first.logo);
          if (first.cover_image) setCoverPreview(first.cover_image);
        }
      } else {
        setCompanies([]);
      }
      const [categoriesRes, subcategoriesRes, headCompaniesRes] =
        await Promise.all([
          getCategories(),
          getSubCategories(),
          getHeadCompanies(),
        ]);
      setCategories(categoriesRes.data);
      setSubcategories(subcategoriesRes.data);
      const headData = headCompaniesRes.data;
      setHeadCompanies(
        Array.isArray(headData) ? headData : (headData.results ?? []),
      );
    } catch (err: any) {
      setError(err.message || "Failed to load data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [currentCompany?.slug]);

  // --- Form handlers ---
  const validateBasicInfo = () => {
    const errors: Record<string, string> = {};

    if (formData.slug && !/^[a-z0-9-]+$/.test(formData.slug)) {
      errors.slug =
        "Slug must contain only lowercase letters, numbers, and hyphens";
    }
    if (!formData.name.trim()) {
      errors.name = "Company name is required";
    }
    if (formData.category === 0) {
      errors.category = "Please select a category";
    }
    if (formData.sub_category === 0) {
      errors.sub_category = "Please select a subcategory";
    }
    if (!formData.business_type) {
      errors.business_type = "Please select a business type";
    }
    if (!formData.slug.trim()) {
      errors.slug = "Slug is required";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateLocation = () => {
    const errors: Record<string, string> = {};
    if (!formData.contact_phone.trim()) {
      errors.contact_phone = "Phone Number is required";
    }
    if (!formData.contact_email.trim()) {
      errors.contact_email = "Email Address is required";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contact_email.trim())
    ) {
      errors.contact_email = "Please enter a valid email address";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const validateDocuments = () => {
    // No required documents in backend; always valid
    setFormErrors({});
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!validateBasicInfo()) return;

    if (editingSlug && originalFormData) {
      const hasChanges = () => {
        const cleanString = (val: any) =>
          val === null || val === undefined ? "" : String(val).trim();
        const cleanFloat = (val: any) => {
          if (val === null || val === undefined || val === "") return 0;
          const parsed = parseFloat(val);
          return isNaN(parsed) ? 0 : parsed;
        };
        const compareFloats = (val1: any, val2: any) => {
          return Math.abs(cleanFloat(val1) - cleanFloat(val2)) > 0.000001;
        };

        if (cleanString(formData.name) !== cleanString(originalFormData.name))
          return true;
        if (
          cleanString(formData.name_am) !==
          cleanString(originalFormData.name_am)
        )
          return true;
        if (Number(formData.category) !== Number(originalFormData.category))
          return true;
        if (
          Number(formData.sub_category) !==
          Number(originalFormData.sub_category)
        )
          return true;
        if (
          cleanString(formData.business_type) !==
          cleanString(originalFormData.business_type)
        )
          return true;
        if (
          cleanString(formData.address) !==
          cleanString(originalFormData.address)
        )
          return true;
        if (
          cleanString(formData.address_am) !==
          cleanString(originalFormData.address_am)
        )
          return true;
        if (
          Number(formData.head_company ?? 0) !==
          Number(originalFormData.head_company ?? 0)
        )
          return true;
        if (
          cleanString(formData.description) !==
          cleanString(originalFormData.description)
        )
          return true;
        if (
          cleanString(formData.description_am) !==
          cleanString(originalFormData.description_am)
        )
          return true;
        if (
          compareFloats(
            formData.minimum_order_total,
            originalFormData.minimum_order_total,
          )
        )
          return true;
        if (
          compareFloats(
            formData.maximum_cod_total,
            originalFormData.maximum_cod_total,
          )
        )
          return true;
        if (compareFloats(formData.latitude, originalFormData.latitude))
          return true;
        if (compareFloats(formData.longitude, originalFormData.longitude))
          return true;
        if (
          compareFloats(
            formData.delivery_fee_per_km,
            originalFormData.delivery_fee_per_km,
          )
        )
          return true;
        if (
          isSuperAdmin &&
          Boolean(formData.is_active) !== Boolean(originalFormData.is_active)
        )
          return true;
        if (isSuperAdmin && verificationDraft !== originalVerification) return true;
        if (
          Boolean(formData.is_featured) !==
          Boolean(originalFormData.is_featured)
        )
          return true;
        if (
          Boolean(formData.supports_table_service) !==
          Boolean(originalFormData.supports_table_service)
        )
          return true;
        if (
          Boolean(formData.show_order_queue) !==
          Boolean(originalFormData.show_order_queue)
        )
          return true;
        if (
          cleanString(formData.tin_number) !==
          cleanString(originalFormData.tin_number)
        )
          return true;
        if (
          cleanString(formData.vat_registration_number) !==
          cleanString(originalFormData.vat_registration_number)
        )
          return true;
        if (
          cleanString(formData.tax_type) !==
          cleanString(originalFormData.tax_type)
        )
          return true;
        if (
          cleanString(formData.chapa_sub_account_id) !==
          cleanString(originalFormData.chapa_sub_account_id)
        )
          return true;
        if (
          cleanString(formData.theme_primary) !==
          cleanString(originalFormData.theme_primary)
        )
          return true;
        if (
          cleanString(formData.theme_dark) !==
          cleanString(originalFormData.theme_dark)
        )
          return true;
        if (
          cleanString(formData.theme_light) !==
          cleanString(originalFormData.theme_light)
        )
          return true;
        if (
          cleanString(formData.contact_phone) !==
          cleanString(originalFormData.contact_phone)
        )
          return true;
        if (
          cleanString(formData.contact_email) !==
          cleanString(originalFormData.contact_email)
        )
          return true;
        if (formData.license !== originalFormData.license) return true;
        if (formData.logo !== originalFormData.logo) return true;
        if (formData.cover_image !== originalFormData.cover_image) return true;
        return false;
      };

      const changesExist = hasChanges();
      if (!changesExist) {
        showToast("info", "No changes detected. Update canceled.");
        if (!isSuperAdmin && !isMarketing) {
          setIsEditingActive(false);
          resetForm();
        } else {
          setModalOpen(false);
        }
        setSubmitting(false);
        return;
      }
    }

    setSubmitting(true);
    try {
      const formPayload = new FormData();
      formPayload.append("name", formData.name);
      if (formData.name_am) formPayload.append("name_am", formData.name_am);
      if (formData.slug) formPayload.append("slug", formData.slug);
      formPayload.append("category", String(formData.category));
      formPayload.append("sub_category", String(formData.sub_category));
      formPayload.append(
        "head_company",
        formData.head_company ? String(formData.head_company) : "",
      );
      formPayload.append("business_type", formData.business_type);
      if (formData.address) formPayload.append("address", formData.address);
      if (formData.address_am)
        formPayload.append("address_am", formData.address_am);
      if (formData.description)
        formPayload.append("description", formData.description);
      if (formData.description_am)
        formPayload.append("description_am", formData.description_am);
      formPayload.append(
        "minimum_order_total",
        formData.minimum_order_total || "0.00",
      );
      formPayload.append(
        "maximum_cod_total",
        formData.maximum_cod_total || "0.00",
      );
      if (formData.latitude) formPayload.append("latitude", formData.latitude);
      if (formData.longitude)
        formPayload.append("longitude", formData.longitude);
      formPayload.append(
        "delivery_fee_per_km",
        formData.delivery_fee_per_km || "0.00",
      );
      // Only a super admin may change an existing company's active state.
      // Every newly created company starts inactive and must be verified first.
      if (!editingSlug) {
        formPayload.append("is_active", "false");
      } else if (isSuperAdmin) {
        formPayload.append(
          "is_active",
          String(verificationDraft ? formData.is_active : false),
        );
      }
      formPayload.append("is_featured", String(formData.is_featured));
      formPayload.append(
        "supports_table_service",
        String(formData.supports_table_service),
      );
      formPayload.append(
        "show_order_queue",
        String(formData.show_order_queue),
      );
      formPayload.append("tin_number", formData.tin_number || "");
      formPayload.append(
        "vat_registration_number",
        formData.vat_registration_number || "",
      );
      formPayload.append("tax_type", formData.tax_type || "none");
      formPayload.append(
        "chapa_sub_account_id",
        formData.chapa_sub_account_id || "",
      );
      formPayload.append("theme_primary", formData.theme_primary || "#674FA3");
      formPayload.append("theme_dark", formData.theme_dark || "#6750A4");
      formPayload.append("theme_light", formData.theme_light || "#8B6BB5");
      formPayload.append("contact_phone", formData.contact_phone || "");
      formPayload.append("contact_email", formData.contact_email || "");

      // Handle license
      if (formData.license instanceof File) {
        formPayload.append("license", formData.license);
      } else if (formData.license === null && originalFormData?.license) {
        formPayload.append("license", "");
      }

      // Handle logo and cover
      if (formData.logo instanceof File) {
        formPayload.append("logo", formData.logo);
      } else if (
        formData.logo === null &&
        originalFormData?.logo &&
        logoPreview === null
      ) {
        formPayload.append("logo", "");
      }
      if (formData.cover_image instanceof File) {
        formPayload.append("cover_image", formData.cover_image);
      } else if (
        formData.cover_image === null &&
        originalFormData?.cover_image &&
        coverPreview === null
      ) {
        formPayload.append("cover_image", "");
      }

      if (editingSlug) {
        await updateCompany(editingSlug, formPayload);
        if (isSuperAdmin) {
          setVerificationBySlug((current) => ({
            ...current,
            [editingSlug]: verificationDraft,
          }));
          setOriginalVerification(verificationDraft);
        }
      } else {
        await createCompany(formPayload);
        if (formData.slug.trim()) {
          setVerificationBySlug((current) => ({
            ...current,
            [formData.slug.trim()]: false,
          }));
        }
      }

      showToast(
        "success",
        editingSlug
          ? "Company updated successfully"
          : "Company created as inactive. Super admin verification is required before activation.",
      );

      setModalOpen(false);
      setIsEditingActive(false);
      resetForm();
      await fetchData();
    } catch (err: any) {
      if (err?.response?.status === 401) {
        showToast("error", "Session expired. Please refresh the page.");
      } else {
        const msg =
          err.response?.data?.message ||
          err.response?.data?.detail ||
          "Operation failed";
        showToast("error", msg);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Multi-step form steps
  const steps = useMemo(
    () => [
      {
        id: "basic",
        title: <span className="text-secondary">Basic Information</span>,
        content: (
          <CompanyForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            categories={categories}
            headCompanies={headCompanies}
            subcategories={subcategories}
            logoPreview={logoPreview}
            coverPreview={coverPreview}
            onLogoFileChange={handleLogoChange}
            onCoverFileChange={handleCoverChange}
            isEditingActive={true}
            canManageActiveStatus={isSuperAdmin}
            isCompanyVerified={verificationDraft}
            onVerificationChange={handleVerificationChange}
            submitting={submitting}
            editingSlug={editingSlug}
            headCompanyName={
              headCompanies.find((h) => h.id === formData.head_company)?.name ??
              null
            }
            currentStep={0}
            onSubmit={handleSubmit}
            onClose={() => setModalOpen(false)}
          />
        ),
        validate: validateBasicInfo,
      },
      {
        id: "location",
        title: <span className="text-secondary">Location & Contact</span>,
        content: (
          <CompanyForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            categories={categories}
            subcategories={subcategories}
            logoPreview={logoPreview}
            headCompanies={headCompanies}
            coverPreview={coverPreview}
            onLogoFileChange={handleLogoChange}
            onCoverFileChange={handleCoverChange}
            isEditingActive={true}
            canManageActiveStatus={isSuperAdmin}
            isCompanyVerified={verificationDraft}
            onVerificationChange={handleVerificationChange}
            submitting={submitting}
            editingSlug={editingSlug}
            headCompanyName={
              headCompanies.find((h) => h.id === formData.head_company)?.name ??
              null
            }
            currentStep={1}
            onSubmit={handleSubmit}
            onClose={() => setModalOpen(false)}
          />
        ),
        validate: validateLocation,
      },
      {
        id: "documents",
        title: <span className="text-secondary">Media & Documents</span>,
        content: (
          <CompanyForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            categories={categories}
            subcategories={subcategories}
            logoPreview={logoPreview}
            coverPreview={coverPreview}
            headCompanies={headCompanies}
            onLogoFileChange={handleLogoChange}
            onCoverFileChange={handleCoverChange}
            isEditingActive={true}
            canManageActiveStatus={isSuperAdmin}
            isCompanyVerified={verificationDraft}
            onVerificationChange={handleVerificationChange}
            submitting={submitting}
            editingSlug={editingSlug}
            headCompanyName={
              headCompanies.find((h) => h.id === formData.head_company)?.name ??
              null
            }
            currentStep={2}
            onSubmit={handleSubmit}
            onClose={() => setModalOpen(false)}
          />
        ),
        validate: validateDocuments,
      },
      {
        id: "summary",
        title: <span className="text-secondary">Review</span>,
        content: (
          <CompanyForm
            formData={formData}
            setFormData={setFormData}
            formErrors={formErrors}
            categories={categories}
            subcategories={subcategories}
            logoPreview={logoPreview}
            coverPreview={coverPreview}
            headCompanies={headCompanies}
            onLogoFileChange={handleLogoChange}
            onCoverFileChange={handleCoverChange}
            isEditingActive={true}
            canManageActiveStatus={isSuperAdmin}
            isCompanyVerified={verificationDraft}
            onVerificationChange={handleVerificationChange}
            submitting={submitting}
            editingSlug={editingSlug}
            headCompanyName={
              headCompanies.find((h) => h.id === formData.head_company)?.name ??
              null
            }
            currentStep={3}
            onSubmit={handleSubmit}
            onClose={() => setModalOpen(false)}
          />
        ),
      },
    ],
    [
      formData,
      formErrors,
      categories,
      subcategories,
      headCompanies,
      logoPreview,
      coverPreview,
      submitting,
      editingSlug,
      handleSubmit,
      handleLogoChange,
      handleCoverChange,
      isSuperAdmin,
      verificationDraft,
      handleVerificationChange,
      validateBasicInfo,
      validateLocation,
      validateDocuments,
    ],
  );

  const resetForm = () => {
    setEditingSlug(null);
    setFormData({ ...EMPTY_COMPANY_FORM });
    setOriginalFormData(null);
    setLogoPreview(null);
    setCoverPreview(null);
    setFormErrors({});
    setVerificationDraft(false);
    setOriginalVerification(false);
  };

  const openEdit = useCallback(
    (company: CompanyListItem) => {
      if (!canEditCompany(company.slug)) {
        showToast("error", "You don't have permission to edit this company");
        return;
      }
      setEditingSlug(company.slug);
      setCurrentStep(0);
      const newFormData: CompanyFormData = {
        name: company.name,
        name_am: company.name_am || "",
        slug: company.slug,
        head_company: company.head_company ?? null,
        category: company.category,
        sub_category: company.sub_category,
        business_type: company.business_type,
        address: company.address || "",
        address_am: (company as any).address_am || "",
        description: company.description || "",
        description_am: (company as any).description_am || "",
        minimum_order_total: company.minimum_order_total || "0.00",
        maximum_cod_total: company.maximum_cod_total || "0.00",
        latitude: company.latitude || "",
        longitude: company.longitude || "",
        delivery_fee_per_km: company.delivery_fee_per_km || "0.00",
        is_active: company.is_active,
        is_featured: company.is_featured,
        supports_table_service: company.supports_table_service,
        show_order_queue: Boolean(company.show_order_queue),
        logo: null,
        cover_image: null,
        contact_phone: company.contact_phone || "",
        contact_email: company.contact_email || "",
        license: (company as any).license || null,
        tin_number: company.tin_number || "",
        vat_registration_number: company.vat_registration_number || "",
        tax_type: company.tax_type || "none",
        chapa_sub_account_id: (company as any).chapa_sub_account_id || "",
        theme_primary: (company as any).theme_primary || "#674FA3",
        theme_dark: (company as any).theme_dark || "#6750A4",
        theme_light: (company as any).theme_light || "#8B6BB5",
      };
      setFormData(newFormData);
      setOriginalFormData({
        ...newFormData,
        logo: company.logo as any,
        cover_image: company.cover_image as any,
      });
      const storedVerification = verificationBySlug[company.slug];
      const initialVerification =
        storedVerification === undefined ? Boolean(company.is_active) : storedVerification;
      setVerificationDraft(initialVerification);
      setOriginalVerification(initialVerification);
      if (company.logo) setLogoPreview(company.logo);
      if (company.cover_image) setCoverPreview(company.cover_image);
      if (isSuperAdmin || isMarketing) {
        setModalOpen(true);
      } else {
        setIsEditingActive(true);
      }
    },
    [canEditCompany, isSuperAdmin, isMarketing, showToast, verificationBySlug],
  );

  const closeInlineEdit = useCallback(() => {
    setEditingSlug(null);
    setIsEditingActive(false);
    // resetForm();
  }, []);

  const handleDeleteClick = useCallback((company: CompanyListItem) => {
    setDeleteTarget(company);
  }, []);

  const clearAllFilters = useCallback(() => {
    setInputValue("");
    setSearchTerm("");
    setBusinessTypeFilter("all");
    setCategoryFilter("all");
    setSubCategoryFilter("all");
  }, []);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteCompany(deleteTarget.slug);
      showToast("success", "Company deleted successfully");
      setDeleteTarget(null);
      fetchData();
    } catch (err: any) {
      showToast("error", err.response?.data?.detail || "Delete failed");
    }
  };

  if (error) return <ErrorView error={error} onRetry={fetchData} />;

  if (loading) {
    return (
      <div
        className={`max-w-full p-3 sm:p-4 lg:p-6 ${
          isSuperAdmin || isMarketing
            ? "min-h-screen"
            : "lg:h-full lg:min-h-0 lg:overflow-hidden"
        }`}
      >
        <PageHeader
          title={isSuperAdmin || isMarketing ? "Companies" : "Company Detail"}
          description={
            isSuperAdmin
              ? "Manage company access, status, and operational settings."
              : isMarketing
                ? "Manage company profiles and marketing information."
                : "Manage your company details and settings."
          }
          icon={Building2}
          loading
          className="mb-4 sm:mb-6"
        />
        {isSuperAdmin || isMarketing ? (
          <SkeletonTable rowCount={pageSize} />
        ) : (
          <SkeletonDetailCard />
        )}
      </div>
    );
  }

  return (
    <div
      className={`max-w-full ${
        isSuperAdmin || isMarketing
          ? "min-h-screen"
          : "lg:h-full lg:min-h-0 lg:overflow-hidden"
      }`}
    >
      <Toast toast={toast} />
      <div
        className={
          isSuperAdmin || isMarketing
            ? "space-y-3 p-2 sm:p-4 md:space-y-4 md:p-4 lg:p-6"
            : "flex flex-col gap-3 p-2 sm:p-4 md:p-4 lg:h-full lg:min-h-0 lg:overflow-hidden lg:p-4"
        }
      >
        <PageHeader
          title={isSuperAdmin || isMarketing ? "Companies" : "Company Detail"}
          description={
            isSuperAdmin
              ? "Manage company activation, access, and operational settings. Inactive companies remain visible in view-only mode."
              : isMarketing
                ? "Manage company profiles and marketing information."
                : "Manage your company details and settings."
          }
          icon={Building2}
          className={isSuperAdmin || isMarketing ? undefined : "shrink-0"}
          actions={
            canAddCompany ? (
              <button
                type="button"
                onClick={() => {
                  resetForm();
                  setModalOpen(true);
                }}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-[#5b4694] hover:shadow-md active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/50 focus-visible:ring-offset-2 sm:w-auto"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Add Company</span>
                <span className="sm:hidden">Add</span>
              </button>
            ) : undefined
          }
        />

        {(isSuperAdmin || isMarketing) && (
          <CompanyFilters
            pageSize={pageSize}
            onPageSizeChange={setPageSize}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            loading={loading}
            sortField={sortField}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
            businessTypeFilter={businessTypeFilter}
            onBusinessTypeChange={setBusinessTypeFilter}
            businessTypeOptions={businessTypeOptions}
            categoryFilter={categoryFilter}
            onCategoryChange={setCategoryFilter}
            categoryOptions={categoryOptions}
            subCategoryFilter={subCategoryFilter}
            onSubCategoryChange={setSubCategoryFilter}
            subCategoryOptions={subCategoryOptions}
            hasActiveFilters={hasActiveFilters}
            onClearAll={clearAllFilters}
          />
        )}

        {isSuperAdmin || isMarketing ? (
          <div className="">
            <SuperAdminView
              paginatedItems={paginatedItemsWithRowNumber}
              columns={columns}
              loading={loading}
              sortField={sortField}
              sortOrder={sortOrder}
              onSort={handleSort}
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={goToPage}
              onEdit={openEdit}
              onDelete={canDeleteCompany ? handleDeleteClick : undefined}
              inputValue={inputValue}
              onInputChange={handleInputChange}
              onSortChange={onSortChange}
              businessTypeFilter={businessTypeFilter}
              onBusinessTypeChange={setBusinessTypeFilter}
              categoryFilter={categoryFilter}
              onCategoryChange={setCategoryFilter}
              subCategoryFilter={subCategoryFilter}
              onSubCategoryChange={setSubCategoryFilter}
              businessTypeOptions={businessTypeOptions}
              categoryOptions={categoryOptions}
              subCategoryOptions={subCategoryOptions}
              onClearAll={clearAllFilters}
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            />
          </div>
        ) : (
          <div className="min-h-0 flex-1 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
            <NonSuperAdminView
              companies={companies}
              userCompanyRole={currentCompanyRole}
              onEdit={openEdit}
              loading={loading}
              formData={formData}
              headCompanies={headCompanies}
              setFormData={setFormData}
              formErrors={formErrors}
              categories={categories}
              subcategories={subcategories}
              logoPreview={logoPreview}
              coverPreview={coverPreview}
              onLogoFileChange={handleLogoChange}
              onCoverFileChange={handleCoverChange}
              isEditingActive={isEditingActive}
              submitting={submitting}
              editingSlug={editingSlug}
              headCompanyName={
                headCompanies.find((h) => h.id === formData.head_company)
                  ?.name ??
                companies[0]?.head_company_detail?.name ??
                null
              }
              onSubmit={handleSubmit}
              onCloseForm={closeInlineEdit}
            />
          </div>
        )}

        <MultiStepFormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          steps={steps}
          initialStep={currentStep}
          onStepChange={setCurrentStep}
          onSubmit={handleSubmit}
          submitting={submitting}
          maxWidth="2xl"
        />
        <DeleteConfirmModal
          isOpen={!!deleteTarget}
          title={deleteTarget?.name || ""}
          onConfirm={handleDelete}
          deleteTitle={"Delete Company"}
          onCancel={() => setDeleteTarget(null)}
        />
      </div>

      {showMapPicker && (
        <LocationPickerModal
          isOpen={showMapPicker}
          onClose={() => setShowMapPicker(false)}
          onSelect={(selectedLat, selectedLon) => {
            setFormData((prev) => ({
              ...prev,
              latitude: selectedLat,
              longitude: selectedLon,
            }));
          }}
          onSelectAddress={(address) => {
            setFormData((prev) => ({
              ...prev,
              address: address,
            }));
          }}
          initialLat={formData.latitude}
          initialLon={formData.longitude}
          initialAddress={formData.address}
        />
      )}
    </div>
  );
}
