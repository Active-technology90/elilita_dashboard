// src/components/dashboard/CompanyManagement/CompanyUsers.tsx
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useCompanyUsers } from "../../../hooks/useCompanyUsers";
import { useAddCompanyUser } from "../../../hooks/useAddCompanyUser";
import {
  getMySubscription,
  onboardCompanyStaff,
  removeUserFromCompany,
  searchUsers,
  updateUserCompanyRole,
} from "../../../services/api";
import { useDebounce } from "../../../hooks/useDebounce";
import type { User, UserRole } from "../../../types";
import {
  AlertCircle,
  Briefcase,
  Building2,
  Eye,
  Repeat,
  Shield,
  Truck,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { Pagination } from "../../ui/Pagination";
import { ErrorView } from "../../ui/ErrorView";
import { CompanyUsersTable } from "./CompanyUsersTable";
import { AddUserModal } from "./AddUserModal";
import { EditUserModal } from "./EditUserModal";
import { DeleteUserModal } from "./DeleteUserModal";
import { CompanySelector } from "../company-products/CompanySelector";
import { useReadOnly } from "../AdminDashboard";
import { CreateCompanyUserModal } from "./CreateCompanyUserModal";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { SearchInput } from "../../ui/SearchInput";
import PageHeader from "../../ui/PageHeader";
import toast from "react-hot-toast";

/* ──────────────────────────────────────────────────────────────────
   Role helpers
   ────────────────────────────────────────────────────────────────── */

type CompanyRole =
  | "owner"
  | "admin"
  | "staff"
  | "viewer"
  | "delivery"
  | "superAdmin";

const normalizeRole = (raw: unknown): CompanyRole | null => {
  if (raw == null || typeof raw !== "string") return null;

  const r = raw.toLowerCase().trim();

  if (r === "owner" || r === "company_owner" || r === "companyowner") {
    return "owner";
  }
  if (r === "admin" || r === "administrator") return "admin";
  if (r === "staff" || r === "dispatcher" || r === "employee") return "staff";
  if (r === "delivery" || r === "driver" || r === "courier") return "delivery";
  if (r === "viewer" || r === "read_only" || r === "readonly") return "viewer";
  if (r === "superadmin" || r === "super_admin" || r === "super-admin") {
    return "superAdmin";
  }

  return null;
};

const extractMembershipRole = (membership: any): string | null => {
  if (!membership) return null;

  const raw =
    membership.role ??
    membership.user_role ??
    membership.userRole ??
    membership.company_role ??
    membership.companyRole ??
    membership.membership_role;

  return raw == null ? null : String(raw);
};

const membershipMatchesCompany = (
  membership: any,
  companySlug: string | null,
  companyId: string | number | null,
): boolean => {
  if (!membership) return false;

  if (companySlug) {
    if (
      membership.company_slug === companySlug ||
      membership.companySlug === companySlug ||
      membership.slug === companySlug ||
      membership.company?.slug === companySlug ||
      membership.company?.company_slug === companySlug
    ) {
      return true;
    }
  }

  if (companyId != null) {
    if (
      String(membership.company_id) === String(companyId) ||
      String(membership.companyId) === String(companyId) ||
      String(membership.company?.id) === String(companyId)
    ) {
      return true;
    }
  }

  return false;
};

/**
 * Resolve the *real* user PK that the backend expects.
 * Same priority as EditUserModal's `resolveUserId`.
 */
function resolveUserIdFromRow(row: any): string {
  if (!row) return "";
  const candidates = [
    row.user_id,
    row.user?.id,
    row.user?.user_id,
    row.id,
    row.uuid,
    row.pk,
    row.username,
  ];
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const s = String(c).trim();
    if (s && s !== "undefined" && s !== "null") return s;
  }
  return "";
}

/* ──────────────────────────────────────────────────────────────────
   Skeletons
   ────────────────────────────────────────────────────────────────── */

const SkeletonBar = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-secondary/[0.08] ${className}`} />
);

const StatsSkeleton = () => (
  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="rounded-xl border border-secondary/10 bg-white px-3 py-3 sm:px-4 sm:py-3.5"
      >
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-2">
            <SkeletonBar className="h-2.5 w-16" />
            <SkeletonBar className="h-5 w-8" />
          </div>
          <SkeletonBar className="h-9 w-9 rounded-lg" />
        </div>
      </div>
    ))}
  </div>
);

const ToolbarSkeleton = () => (
  <div className="rounded-xl border border-secondary/10 bg-white p-2.5 sm:p-3">
    <div className="flex items-center gap-2.5">
      <SkeletonBar className="h-10 flex-1" />
      <SkeletonBar className="hidden h-10 w-44 lg:block" />
      <SkeletonBar className="h-10 w-24" />
    </div>
  </div>
);

const StatCard = ({
  title,
  value,
  icon: Icon,
}: {
  title: string;
  value: number;
  icon: React.FC<{ className?: string }>;
}) => (
  <div className="rounded-xl border border-secondary/10 bg-white px-3 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-secondary/20 sm:px-4 sm:py-3.5">
    <div className="flex items-center justify-between gap-2 sm:gap-3">
      <div className="min-w-0">
        <p className="truncate text-[9px] font-semibold uppercase tracking-[0.07em] text-secondary/50 sm:text-[10px]">
          {title}
        </p>
        <p className="mt-0.5 text-lg font-bold tracking-tight text-secondary sm:mt-1 sm:text-xl">
          {value}
        </p>
      </div>
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/[0.07] text-secondary sm:h-9 sm:w-9">
        <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
      </div>
    </div>
  </div>
);

/* ──────────────────────────────────────────────────────────────────
   Main component
   ────────────────────────────────────────────────────────────────── */

export default function CompanyUsers() {
  const { user: currentUser } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();
  const readOnly = useReadOnly();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
  const [createServerErrors, setCreateServerErrors] = useState<
    Record<string, string | string[]>
  >({});
  const [roleFilter, setRoleFilter] = useState<
    "all" | "admin" | "staff" | "viewer" | "delivery"
  >("all");
  const [tableSearch, setTableSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adding, setAdding] = useState(false);
  const [selectedRole, setSelectedRole] = useState<
    "admin" | "staff" | "viewer" | "delivery"
  >("staff");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingUser, setEditingUser] = useState<any>(null);
  const [updating, setUpdating] = useState(false);
  const [editServerErrors, setEditServerErrors] = useState<
    Record<string, string | string[]>
  >({});
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";
  const companyId = (company as any)?.id ?? null;

  const isSuperAdmin = useMemo(() => {
    if (!currentUser) return false;

    const u = currentUser as any;

    if (u.is_superuser === true) return true;
    if (u.isSuperAdmin === true) return true;

    const memberships = u.memberships ?? [];
    return Array.isArray(memberships) && memberships.length === 0;
  }, [currentUser]);

  const showSelector = isSuperAdmin && !companySlug;

  const { users, loading, error, refetch } = useCompanyUsers(companySlug);
  const { addUser } = useAddCompanyUser();
  const debouncedQuery = useDebounce(searchTerm, 500);

  const [activeSub, setActiveSub] = useState<any>(null);

  useEffect(() => {
    if (companySlug) {
      getMySubscription(companySlug)
        .then((res) => setActiveSub(res.data))
        .catch(console.error);
    }
  }, [companySlug]);

  const maxStaff =
    activeSub?.allowed_max_staff_members ?? (isSuperAdmin ? -1 : 5);
  const currentStaffCount = (users || []).length;
  const isLimitReached =
    !isSuperAdmin && maxStaff !== -1 && currentStaffCount >= maxStaff;

  /* ──────────────────────────────────────────────────────────────
     Role resolution
     ────────────────────────────────────────────────────────────── */

  const currentUserRole = useMemo<CompanyRole | null>(() => {
    if (!currentUser || !companySlug) return null;

    if (isSuperAdmin) return "superAdmin";

    const u = currentUser as any;
    const memberships: any[] = Array.isArray(u.memberships)
      ? u.memberships
      : [];

    let membership: any = null;

    for (const m of memberships) {
      if (membershipMatchesCompany(m, companySlug, companyId)) {
        membership = m;
        break;
      }
    }

    if (membership) {
      const rawRole = extractMembershipRole(membership);
      const normalized = normalizeRole(rawRole);
      if (normalized) return normalized;
    }

    const flatRole =
      u.company_role ??
      u.companyRole ??
      u.active_company_role ??
      u.activeCompanyRole ??
      u.current_role ??
      u.currentRole;

    const normalizedFlat = normalizeRole(flatRole);
    if (normalizedFlat) return normalizedFlat;

    if (memberships.length === 1) {
      const onlyRaw = extractMembershipRole(memberships[0]);
      const normalizedOnly = normalizeRole(onlyRaw);
      if (normalizedOnly) return normalizedOnly;
    }

    return normalizeRole(u.role);
  }, [currentUser, companySlug, companyId, isSuperAdmin]);

  /* ──────────────────────────────────────────────────────────────
     Derived permissions
     ────────────────────────────────────────────────────────────── */

  const canViewUsers =
    isSuperAdmin ||
    currentUserRole === "owner" ||
    currentUserRole === "admin" ||
    currentUserRole === "staff" ||
    currentUserRole === "delivery" ||
    currentUserRole === "viewer" ||
    readOnly;

  const canManageUsers =
    (isSuperAdmin ||
      currentUserRole === "owner" ||
      currentUserRole === "admin") &&
    !readOnly;

  /* ──────────────────────────────────────────────────────────────
     Filters, pagination, counts
     ────────────────────────────────────────────────────────────── */

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (tableSearch.trim()) count += 1;
    if (roleFilter !== "all") count += 1;
    return count;
  }, [tableSearch, roleFilter]);

  const pageSizeOptions: SelectOption[] = [
    { value: "5", label: "5 / page" },
    { value: "10", label: "10 / page" },
    { value: "15", label: "15 / page" },
    { value: "30", label: "30 / page" },
    { value: "60", label: "60 / page" },
  ];

  const roleCounts = useMemo(() => {
    const counts = { admin: 0, staff: 0, viewer: 0, delivery: 0 };

    (users || []).forEach((member: any) => {
      if (member.role in counts) {
        counts[member.role as keyof typeof counts] += 1;
      }
    });

    return counts;
  }, [users]);

  const roleOptions: SelectOption[] = [
    { value: "all", label: "All roles" },
    { value: "admin", label: `Admin (${roleCounts.admin})` },
    { value: "staff", label: `Dispatcher (${roleCounts.staff})` },
    { value: "viewer", label: `Viewer (${roleCounts.viewer})` },
    { value: "delivery", label: `Delivery (${roleCounts.delivery})` },
  ];

  const filteredUsers = useMemo(() => {
    const query = tableSearch.trim().toLowerCase();

    return (users || []).filter((member: any) => {
      const matchesSearch =
        !query ||
        `${member.first_name || ""} ${member.last_name || ""}`
          .toLowerCase()
          .includes(query) ||
        String(member.email || "")
          .toLowerCase()
          .includes(query);

      const matchesRole =
        roleFilter === "all" ? true : member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, tableSearch, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [filteredUsers, currentPage, pageSize],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [roleFilter, tableSearch, pageSize]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  useEffect(() => {
    const fetchSearchResults = async () => {
      if (!debouncedQuery.trim()) {
        setSearchResults([]);
        return;
      }

      setSearching(true);

      try {
        const response = await searchUsers(debouncedQuery);
        setSearchResults(response.data.results || []);
      } catch (error) {
        console.error(error);
        setSearchResults([]);
      } finally {
        setSearching(false);
      }
    };

    void fetchSearchResults();
  }, [debouncedQuery]);

  /* ──────────────────────────────────────────────────────────────
     Handlers
     ────────────────────────────────────────────────────────────── */

  const openAddDispatcher = () => {
    if (!canManageUsers) return;
    setSelectedRole("staff");
    setSelectedUser(null);
    setSearchTerm("");
    setShowAddModal(true);
  };

  const handleAddUser = async () => {
    if (!canManageUsers || !companySlug || !selectedUser) return;

    setAdding(true);

    try {
      await addUser(companySlug, selectedUser.email, selectedRole);
      setShowAddModal(false);
      setSelectedUser(null);
      setSearchTerm("");
      setSelectedRole("staff");
      await refetch();
    } catch (error) {
      console.error(error);
    } finally {
      setAdding(false);
    }
  };

  const extractServerErrors = (
    err: any,
  ): Record<string, string | string[]> => {
    const data = err?.response?.data;

    if (data && typeof data === "object" && !Array.isArray(data)) {
      const result: Record<string, string | string[]> = {};
      let hasFieldError = false;

      Object.entries(data).forEach(([key, value]) => {
        if (value == null) return;
        if (Array.isArray(value)) {
          result[key] = value.map(String);
          hasFieldError = true;
        } else if (typeof value === "string") {
          result[key] = value;
          hasFieldError = true;
        } else if (typeof value === "object") {
          Object.entries(value as Record<string, any>).forEach(
            ([nestedKey, nestedValue]) => {
              if (nestedValue == null) return;
              result[nestedKey] = Array.isArray(nestedValue)
                ? nestedValue.map(String)
                : String(nestedValue);
              hasFieldError = true;
            },
          );
        }
      });

      if (hasFieldError) return result;
    }

    const fallback =
      err?.response?.data?.detail ||
      err?.message ||
      "Failed to create user. Please try again.";

    return { detail: String(fallback) };
  };

  const handleCreateUser = async (data: any) => {
    if (!canManageUsers || !companySlug) return;

    setCreatingUser(true);
    setCreateServerErrors({});

    try {
      await onboardCompanyStaff(companySlug, data);
      setShowCreateModal(false);
      setCreateServerErrors({});
      await refetch();
      toast.success("User created successfully");
    } catch (err: any) {
      console.error("Create user error:", err);
      const parsed = extractServerErrors(err);
      setCreateServerErrors(parsed);

      // Surface the first error message as a toast too
      const firstMsg =
        Object.values(parsed)
          .flat()
          .map(String)
          .find(Boolean) || "Failed to create user";
      toast.error(firstMsg);
    } finally {
      setCreatingUser(false);
    }
  };

  /**
   * handleEditUser — receives `updatedUser` from the modal.
   * The `id` here is already the resolved backend PK (from EditUserModal.resolveUserId).
   */
  const handleEditUser = async (updatedUser: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    role: string;
    vehicle_type?: string;
  }) => {
    console.group("📤 [CompanyUsers] handleEditUser");
    console.log("Payload from modal:", updatedUser);

    if (!canManageUsers || !companySlug) {
      console.warn("❌ Cannot save: missing permission or companySlug");
      console.groupEnd();
      return;
    }

    // ── Find the original row being edited to double-check IDs ──
    const originalRow =
      (users || []).find(
        (u: any) =>
          String(u.id) === String(editingUser?.id) ||
          String(u.user_id) === String(editingUser?.user_id),
      ) || editingUser;

    console.log("📋 Original row from users list:", originalRow);
    console.log("🆔 originalRow.id         →", originalRow?.id);
    console.log("🆔 originalRow.user_id    →", originalRow?.user_id);
    console.log("🆔 originalRow.user?.id   →", originalRow?.user?.id);
    console.log("🆔 payload.id (from modal)→", updatedUser.id);

    // ── Resolve the real backend user PK ──
    // Priority:
    //   1. payload.id  (modal already resolved it — trust this)
    //   2. originalRow.user_id
    //   3. originalRow.user?.id
    //   4. originalRow.id
    const resolvedUserId =
      resolveUserIdFromRow({
        user_id: updatedUser.id,       // modal-resolved value takes top priority
        id: originalRow?.user_id,      // fall back to original row's user_id
        user: originalRow?.user,       // then nested user
      }) || String(updatedUser.id);

    console.log("✅ resolvedUserId (for API) →", resolvedUserId);

    if (!resolvedUserId) {
      console.error("❌ No valid user ID — aborting save");
      toast.error("Cannot save: missing user ID.");
      console.groupEnd();
      return;
    }

    const url = `/users/admin/companies/${companySlug}/staff/${resolvedUserId}/profile/`;
    console.log("🌐 PUT endpoint →", url);
    console.log("📦 Body →", {
      first_name: updatedUser.first_name,
      last_name: updatedUser.last_name,
      email: updatedUser.email,
      username: updatedUser.username,
      role: updatedUser.role,
      ...(updatedUser.role === "delivery" && updatedUser.vehicle_type
        ? { vehicle_type: updatedUser.vehicle_type }
        : {}),
    });

    setUpdating(true);
    setEditServerErrors({});

    try {
      await updateUserCompanyRole(
        companySlug,
        Number(resolvedUserId),
        updatedUser.role as UserRole,
      );

      console.log("✅ [CompanyUsers] Role updated successfully");
      toast.success("User role updated successfully");

      setEditingUser(null);
      await refetch();
    } catch (error: any) {
      console.group("❌ [CompanyUsers] Update failed");
      console.log("Status:", error?.response?.status);
      console.log("URL:", error?.config?.url);
      console.log("Method:", error?.config?.method);
      console.log("Payload sent:", error?.config?.data);
      console.log("Response:", error?.response?.data);
      console.groupEnd();

      const message =
        error?.response?.data?.detail ||
        error?.response?.data?.user_role?.[0] ||
        error?.response?.data?.role?.[0] ||
        error?.message ||
        "Failed to update user.";

      toast.error(String(message));
      setEditServerErrors(error?.response?.data ?? {});
    } finally {
      setUpdating(false);
      console.groupEnd();
    }
  };

  const handleDeleteUser = async () => {
    if (!canManageUsers || !companySlug || !deletingUser) return;

    setDeleting(true);

    try {
      const resolvedUserId =
        resolveUserIdFromRow(deletingUser) || deletingUser.user_id;
      console.log("🗑️ [CompanyUsers] Deleting user id →", resolvedUserId);

      await removeUserFromCompany(companySlug, resolvedUserId);
      toast.success("User removed successfully");
      setDeletingUser(null);
      await refetch();
    } catch (error: any) {
      console.error(error);
      toast.error(
        error?.response?.data?.detail || "Failed to remove user.",
      );
    } finally {
      setDeleting(false);
    }
  };

  /* ──────────────────────────────────────────────────────────────
     Early returns
     ────────────────────────────────────────────────────────────── */

  if (!canViewUsers) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-4 md:px-6">
        <div className="rounded-2xl border border-secondary/10 bg-white px-6 py-12 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/[0.07] text-secondary">
            <Shield className="h-5 w-5" />
          </div>
          <h3 className="mt-4 text-sm font-semibold text-secondary">
            Access restricted
          </h3>
          <p className="mx-auto mt-1.5 max-w-md text-xs leading-5 text-secondary/50">
            You do not have permission to manage this company&apos;s users.
          </p>
        </div>
      </div>
    );
  }

  if (showSelector) {
    return (
      <CompanySelector
        companies={companies}
        title="Team & Dispatcher Management"
        subtitle="Select a company to manage users, dispatchers and access."
        searchPlaceholder="Search companies by name..."
        isLoading={isLoadingCompanies}
        disableProductSearch={true}
        onSelect={(slug, name) => {
          const membership = currentUser?.memberships?.find((item: any) =>
            membershipMatchesCompany(item, slug, null),
          );
          const role =
            normalizeRole(extractMembershipRole(membership)) ??
            (isSuperAdmin ? "superAdmin" : "staff");
          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  if (error && !companySlug) {
    return <ErrorView error={error} onRetry={() => refetch?.()} />;
  }

  if (!companySlug) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-4 md:px-6">
        <div className="rounded-2xl border border-secondary/10 bg-white px-6 py-12 text-center">
          <Building2 className="mx-auto h-8 w-8 text-secondary/30" />
          <p className="mt-3 text-xs font-medium text-secondary/55">
            Select a company to manage its users.
          </p>
        </div>
      </div>
    );
  }

  /* ──────────────────────────────────────────────────────────────
     Render
     ────────────────────────────────────────────────────────────── */

  return (
    <div className="rounded-2xl border border-gray-200/80 bg-white shadow-sm">
      <div className="p-4 sm:p-6 lg:p-8">
        <PageHeader
          title={isSuperAdmin ? companyName || "Company Users" : "All Users"}
          eyebrow={isSuperAdmin ? "User Management" : undefined}
          description="Manage dispatchers, delivery personnel and company access."
          icon={Users}
          badge={
            !loading ? (
              <span className="inline-flex items-center rounded-full border border-secondary/10 bg-secondary/[0.06] px-2.5 py-1 text-[10px] font-semibold text-secondary">
                {filteredUsers.length}{" "}
                {filteredUsers.length === 1 ? "user" : "users"}
              </span>
            ) : undefined
          }
          actions={
            isSuperAdmin ? (
              <button
                type="button"
                onClick={clearCompany}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-secondary/15 bg-white px-3.5 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/20"
              >
                <Repeat className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Switch company</span>
                <span className="sm:hidden">Switch</span>
              </button>
            ) : undefined
          }
          loading={loading}
        />

        {/* Stats — hidden on mobile, visible from `sm` breakpoint up */}
        <div className="mt-5 hidden sm:mt-6 sm:block">
          {loading ? (
            <StatsSkeleton />
          ) : (
            <section className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 sm:gap-3 lg:grid-cols-5">
              <StatCard title="Total" value={users?.length || 0} icon={Users} />
              <StatCard title="Admins" value={roleCounts.admin} icon={Shield} />
              <StatCard
                title="Dispatchers"
                value={roleCounts.staff}
                icon={Briefcase}
              />
              <StatCard
                title="Delivery"
                value={roleCounts.delivery}
                icon={Truck}
              />
              <StatCard title="Viewers" value={roleCounts.viewer} icon={Eye} />
            </section>
          )}
        </div>

        {/* Staff limit warning */}
        {isLimitReached && (
          <div className="mt-4 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-xs text-amber-800 sm:mt-5">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
            <div className="flex-1 leading-5">
              <span className="font-bold">
                Staff Limit Reached ({currentStaffCount}/{maxStaff}):{" "}
              </span>
              Your current subscription tier has reached its maximum staff
              members limit. Please upgrade your subscription plan to add or
              onboard more team members.
            </div>
          </div>
        )}

        {/* Mobile action buttons */}
        {canManageUsers && (
          <div className="mt-5 grid grid-cols-2 gap-2.5 sm:grid-cols-2 lg:hidden">
            <button
              type="button"
              onClick={openAddDispatcher}
              disabled={isLimitReached}
              title={
                isLimitReached
                  ? `Staff limit reached (${currentStaffCount}/${maxStaff})`
                  : undefined
              }
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-secondary px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 active:scale-[0.98] ${
                isLimitReached
                  ? "cursor-not-allowed opacity-50 hover:bg-secondary"
                  : ""
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Add member
            </button>
            <button
              type="button"
              onClick={() => {
                setCreateServerErrors({});
                setShowCreateModal(true);
              }}
              disabled={isLimitReached}
              title={
                isLimitReached
                  ? `Staff limit reached (${currentStaffCount}/${maxStaff})`
                  : undefined
              }
              className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-secondary/20 bg-white px-4 text-sm font-semibold text-secondary shadow-sm transition hover:bg-secondary/[0.04] active:scale-[0.98] ${
                isLimitReached
                  ? "cursor-not-allowed opacity-50 hover:bg-white"
                  : ""
              }`}
            >
              <UserPlus className="h-4 w-4" />
              Create user
            </button>
          </div>
        )}
      </div>

      {/* Sticky toolbar */}
      <div className="sticky top-0 z-20 bg-white/95 px-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <div className="pt-5 sm:pt-6">
          {loading ? (
            <ToolbarSkeleton />
          ) : (
            <>
              {/* Mobile toolbar */}
              <div className="w-full lg:hidden">
                <div className="flex w-full items-center gap-2 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
                  <div className="min-w-0 flex-1">
                    <SearchInput
                      value={tableSearch}
                      onChange={(value) => {
                        setTableSearch(value);
                        setCurrentPage(1);
                      }}
                      placeholder="Search team members"
                      loading={loading}
                      showMobileFilter={true}
                      onMobileFilterClick={() =>
                        setShowMobileFilterModal(true)
                      }
                      activeFilterCount={activeFilterCount}
                      showClearButton={true}
                      className="w-full"
                    />
                  </div>

                  <div className="relative z-[110] w-[104px] shrink-0">
                    <CustomSelect
                      value={String(pageSize)}
                      onChange={(value) => {
                        setPageSize(Number(value));
                        setCurrentPage(1);
                      }}
                      options={pageSizeOptions}
                      placeholder="10 / page"
                      className="h-10 w-full text-xs"
                    />
                  </div>
                </div>
              </div>

              {/* Desktop toolbar */}
              <div className="hidden w-full items-center gap-2.5 rounded-xl border border-secondary/10 bg-white p-3 shadow-[0_1px_3px_rgba(0,0,0,0.035)] lg:flex">
                <div className="min-w-0 flex-1">
                  <SearchInput
                    value={tableSearch}
                    onChange={(value) => {
                      setTableSearch(value);
                      setCurrentPage(1);
                    }}
                    placeholder="Search team members"
                    loading={loading}
                    showClearButton={true}
                    className="w-full"
                  />
                </div>

                <div className="relative z-[110] w-[180px] shrink-0">
                  <CustomSelect
                    value={roleFilter}
                    onChange={(value) => {
                      setRoleFilter(
                        value as
                          | "all"
                          | "admin"
                          | "staff"
                          | "viewer"
                          | "delivery",
                      );
                      setCurrentPage(1);
                    }}
                    options={roleOptions}
                    placeholder="All roles"
                    className="h-10 w-full text-xs"
                  />
                </div>

                <div className="relative z-[110] w-[120px] shrink-0">
                  <CustomSelect
                    value={String(pageSize)}
                    onChange={(value) => {
                      setPageSize(Number(value));
                      setCurrentPage(1);
                    }}
                    options={pageSizeOptions}
                    placeholder="10 / page"
                    className="h-10 w-full text-xs"
                  />
                </div>

                {canManageUsers && (
                  <>
                    <button
                      type="button"
                      onClick={openAddDispatcher}
                      disabled={isLimitReached}
                      title={
                        isLimitReached
                          ? `Staff limit reached (${currentStaffCount}/${maxStaff})`
                          : undefined
                      }
                      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-3.5 text-xs font-semibold text-white transition hover:bg-secondary/90 ${
                        isLimitReached
                          ? "cursor-not-allowed opacity-50 hover:bg-secondary"
                          : ""
                      }`}
                    >
                      <UserPlus className="h-4 w-4" />
                      Add member
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        setCreateServerErrors({});
                        setShowCreateModal(true);
                      }}
                      disabled={isLimitReached}
                      title={
                        isLimitReached
                          ? `Staff limit reached (${currentStaffCount}/${maxStaff})`
                          : undefined
                      }
                      className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-lg border border-secondary/15 bg-white px-3.5 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] ${
                        isLimitReached
                          ? "cursor-not-allowed opacity-50 hover:bg-white"
                          : ""
                      }`}
                    >
                      <UserPlus className="h-4 w-4" />
                      Create user
                    </button>
                  </>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="px-4 pt-4 sm:px-6 sm:pt-5 lg:px-8">
        <section className="overflow-hidden rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
          <div className="relative z-0">
            <CompanyUsersTable
              users={paginatedUsers}
              loading={loading}
              currentUser={currentUser}
              currentUserRole={currentUserRole}
              canEdit={canManageUsers}
              canDelete={canManageUsers}
              onEdit={(member) => {
                // ✅ Enrich the member with all possible user-id fields so
                //    the modal's resolveUserId() can pick the correct one.
                console.group("✏️ [CompanyUsers] Opening edit modal");
                console.log("Raw member from table:", member);
                console.log("member.id        →", (member as any)?.id);
                console.log("member.user_id   →", (member as any)?.user_id);
                console.log("member.user?.id  →", (member as any)?.user?.id);

                const enriched = {
                  ...member,
                  // Ensure `id` reflects the real PK
                  id:
                    (member as any)?.user_id ??
                    (member as any)?.user?.id ??
                    (member as any)?.id,
                  // Preserve nested user object if present
                  user: (member as any)?.user ?? null,
                };

                console.log("✅ Enriched member for modal:", enriched);
                console.groupEnd();

                setEditingUser(enriched);
                setEditServerErrors({});
              }}
              onDelete={setDeletingUser}
            />
          </div>

          {!loading && filteredUsers.length > 0 && (
            <div className="border-t border-secondary/10 px-3 py-3 sm:px-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={pageSize}
                onPageSizeChange={setPageSize}
                pageSizeOptions={[5, 10, 15, 30, 60]}
                enableUrlSync={true}
              />
            </div>
          )}

          {!loading && filteredUsers.length === 0 && (
            <div className="border-t border-secondary/10 px-6 py-14 text-center sm:py-16">
              <Users className="mx-auto h-8 w-8 text-secondary/30" />
              <p className="mt-3 text-sm font-semibold text-secondary">
                No users found
              </p>
              <p className="mt-1 text-xs text-secondary/50">
                Try another search or role filter.
              </p>
              {(tableSearch || roleFilter !== "all") && (
                <button
                  type="button"
                  onClick={() => {
                    setTableSearch("");
                    setRoleFilter("all");
                  }}
                  className="mt-4 h-9 rounded-lg border border-secondary/15 bg-white px-3.5 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04]"
                >
                  Clear filters
                </button>
              )}
            </div>
          )}
        </section>
      </div>

      {/* Bottom padding for the outer card */}
      <div className="h-4 sm:h-6 lg:h-8" />

      {/* Mobile filter bottom sheet */}
      {showMobileFilterModal && (
        <div
          className="fixed inset-0 z-[70] lg:hidden"
          onClick={() => setShowMobileFilterModal(false)}
        >
          <div className="absolute inset-0 bg-secondary/35 backdrop-blur-[2px]" />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl border-t border-secondary/10 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-secondary/10 bg-white px-5 py-4">
              <div>
                <h3 className="text-sm font-bold text-secondary">Filters</h3>
                <p className="mt-0.5 text-[11px] text-secondary/50">
                  Narrow the user list by role.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowMobileFilterModal(false)}
                aria-label="Close filters"
                className="flex h-8 w-8 items-center justify-center rounded-lg text-secondary/50 transition hover:bg-secondary/[0.05] hover:text-secondary"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-5 p-5">
              <div>
                <label className="mb-2 block text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/50">
                  Role
                </label>
                <CustomSelect
                  value={roleFilter}
                  onChange={(value) =>
                    setRoleFilter(
                      value as
                        | "all"
                        | "admin"
                        | "staff"
                        | "viewer"
                        | "delivery",
                    )
                  }
                  options={roleOptions}
                  placeholder="All roles"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5 border-t border-secondary/10 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setTableSearch("");
                    setRoleFilter("all");
                    setCurrentPage(1);
                  }}
                  disabled={!tableSearch && roleFilter === "all"}
                  className="h-11 rounded-lg border border-secondary/15 bg-white text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilterModal(false)}
                  className="h-11 rounded-lg bg-secondary text-xs font-semibold text-white transition hover:bg-secondary/90"
                >
                  Show {filteredUsers.length}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <AddUserModal
        isOpen={showAddModal}
        onClose={() => {
          setShowAddModal(false);
          setSelectedUser(null);
          setSearchTerm("");
        }}
        searching={searching}
        searchResults={searchResults}
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        selectedUser={selectedUser}
        onSelectUser={setSelectedUser}
        selectedRole={selectedRole}
        onRoleChange={setSelectedRole}
        adding={adding}
        onAdd={handleAddUser}
      />

      <CreateCompanyUserModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateServerErrors({});
        }}
        loading={creatingUser}
        onSubmit={handleCreateUser}
        serverErrors={createServerErrors}
      />

      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        updating={updating}
        serverErrors={editServerErrors}
        onClose={() => {
          setEditingUser(null);
          setEditServerErrors({});
        }}
        onSave={handleEditUser}
      />

      <DeleteUserModal
        isOpen={!!deletingUser}
        user={deletingUser}
        deleting={deleting}
        onClose={() => setDeletingUser(null)}
        onConfirm={handleDeleteUser}
      />
    </div>
  );
}