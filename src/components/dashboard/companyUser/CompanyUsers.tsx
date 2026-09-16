import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../../../context/authContext";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { useCompanyUsers } from "../../../hooks/useCompanyUsers";
import { useAddCompanyUser } from "../../../hooks/useAddCompanyUser";
import {
  onboardCompanyStaff,
  removeUserFromCompany,
  searchUsers,
  updateUserCompanyRole,
} from "../../../services/api";
import { useDebounce } from "../../../hooks/useDebounce";
import type { User, UserRole } from "../../../types";
import {
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
import { TableControls } from "../../ui/TableControls";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";
import { SearchInput } from "../../ui/SearchInput";
import PageHeader from "../../ui/PageHeader";

const SkeletonBar = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-secondary/[0.08] ${className}`} />
);

const StatsSkeleton = () => (
  <div className="hidden grid-cols-2 gap-2 sm:grid md:grid-cols-3 lg:grid-cols-5">
    {Array.from({ length: 5 }).map((_, index) => (
      <div
        key={index}
        className="rounded-xl border border-secondary/10 bg-white px-3.5 py-3"
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
  <div className="rounded-xl border border-secondary/10 bg-white p-2.5">
    <div className="flex items-center gap-2">
      <SkeletonBar className="h-9 flex-1" />
      <SkeletonBar className="hidden h-9 w-44 lg:block" />
      <SkeletonBar className="h-9 w-24" />
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
  <div className="rounded-xl border border-secondary/10 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/50">
          {title}
        </p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-secondary">
          {value}
        </p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/[0.07] text-secondary">
        <Icon className="h-4 w-4" />
      </div>
    </div>
  </div>
);

export default function CompanyUsers() {
  const { user: currentUser } = useAuth();
  const { company, switchCompany, clearCompany } = useCurrentCompany();
  const { companies, isLoading: isLoadingCompanies } = useCompaniesList();
  const readOnly = useReadOnly();

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showMobileFilterModal, setShowMobileFilterModal] = useState(false);
  const [creatingUser, setCreatingUser] = useState(false);
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
  const [deletingUser, setDeletingUser] = useState<any>(null);
  const [deleting, setDeleting] = useState(false);

  const companySlug = company?.slug ?? null;
  const companyName = company?.name ?? "";
  const isSuperAdmin = !currentUser?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;
  const { users, loading, error, refetch } = useCompanyUsers(companySlug);
  const { addUser } = useAddCompanyUser();
  const debouncedQuery = useDebounce(searchTerm, 500);

  const currentUserRole = useMemo(() => {
    if (!currentUser || !companySlug) return null;
    if (isSuperAdmin) return "superAdmin";
    return (
      currentUser.memberships?.find(
        (membership: any) => membership.company_slug === companySlug,
      )?.role || null
    );
  }, [currentUser, companySlug, isSuperAdmin]);

  const canViewUsers =
    isSuperAdmin ||
    currentUserRole === "admin" ||
    currentUserRole === "staff" ||
    readOnly;

  const canManageUsers =
    (isSuperAdmin || currentUserRole === "admin") && !readOnly;

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
        String(member.email || "").toLowerCase().includes(query);

      const matchesRole =
        roleFilter === "all" ? true : member.role === roleFilter;

      return matchesSearch && matchesRole;
    });
  }, [users, tableSearch, roleFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / pageSize));

  const paginatedUsers = useMemo(
    () =>
      filteredUsers.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize,
      ),
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

  const openAddDispatcher = () => {
    setSelectedRole("staff");
    setSelectedUser(null);
    setSearchTerm("");
    setShowAddModal(true);
  };

  const handleAddUser = async () => {
    if (!companySlug || !selectedUser) return;

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

  const handleCreateUser = async (data: any) => {
    if (!companySlug) return;

    setCreatingUser(true);

    try {
      await onboardCompanyStaff(companySlug, data);
      setShowCreateModal(false);
      await refetch();
    } catch (error) {
      console.error(error);
    } finally {
      setCreatingUser(false);
    }
  };

  const handleEditUser = async (updatedUser: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    role: string;
  }) => {
    if (!companySlug) return;

    setUpdating(true);

    try {
      const userId = editingUser?.user_id || Number(updatedUser.id);

      await updateUserCompanyRole(
        companySlug,
        userId,
        updatedUser.role as UserRole,
      );

      setEditingUser(null);
      await refetch();
    } catch (error: any) {
      console.error("Role update error:", error);
      const message =
        error.response?.data?.detail ||
        error.response?.data?.user_role?.[0] ||
        error.response?.data?.role?.[0] ||
        "Failed to update role.";
      window.alert(message);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!companySlug || !deletingUser) return;

    setDeleting(true);

    try {
      await removeUserFromCompany(companySlug, deletingUser.user_id);
      setDeletingUser(null);
      await refetch();
    } catch (error) {
      console.error(error);
    } finally {
      setDeleting(false);
    }
  };

  if (!canViewUsers) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-3 sm:px-4 md:px-6">
        <div className="rounded-xl border border-secondary/10 bg-white px-4 py-10 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/[0.07] text-secondary">
            <Shield className="h-4 w-4" />
          </div>
          <h3 className="mt-3 text-sm font-semibold text-secondary">
            Access restricted
          </h3>
          <p className="mx-auto mt-1 max-w-md text-xs leading-5 text-secondary/50">
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
          const membership = currentUser?.memberships?.find(
            (item: any) => item.company_slug === slug,
          );
          const role = membership?.role ?? (isSuperAdmin ? "admin" : "staff");
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
        <div className="rounded-xl border border-secondary/10 bg-white px-4 py-10 text-center">
          <Building2 className="mx-auto h-7 w-7 text-secondary/30" />
          <p className="mt-2 text-xs font-medium text-secondary/55">
            Select a company to manage its users.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] space-y-3 px-3 pb-6 sm:px-4 md:px-6">
      <PageHeader
        title={isSuperAdmin ? companyName || "Company Users" : "All Users"}
        eyebrow={isSuperAdmin ? "User Management" : undefined}
        description="Manage dispatchers, delivery personnel and company access."
        icon={Users}
        badge={
          !loading ? (
            <span className="inline-flex items-center rounded-full border border-secondary/10 bg-secondary/[0.06] px-2.5 py-1 text-[10px] font-semibold text-secondary">
              {filteredUsers.length} {filteredUsers.length === 1 ? "user" : "users"}
            </span>
          ) : undefined
        }
        actions={
          isSuperAdmin ? (
            <button
              type="button"
              onClick={clearCompany}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/20"
            >
              <Repeat className="h-3.5 w-3.5" />
              Switch company
            </button>
          ) : undefined
        }
        loading={loading}
      />

      {loading ? (
        <StatsSkeleton />
      ) : (
        <section className="hidden grid-cols-2 gap-2 sm:grid md:grid-cols-3 lg:grid-cols-5">
          <StatCard title="Total" value={users?.length || 0} icon={Users} />
          <StatCard title="Admins" value={roleCounts.admin} icon={Shield} />
          <StatCard title="Dispatchers" value={roleCounts.staff} icon={Briefcase} />
          <StatCard title="Delivery" value={roleCounts.delivery} icon={Truck} />
          <StatCard title="Viewers" value={roleCounts.viewer} icon={Eye} />
        </section>
      )}

      {canManageUsers && (
        <div className="grid grid-cols-2 gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04]"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Create user
          </button>
          <button
            type="button"
            onClick={openAddDispatcher}
            className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold text-white transition hover:bg-secondary/90"
          >
            <UserPlus className="h-3.5 w-3.5" />
            Add member
          </button>
        </div>
      )}

      {loading ? (
        <ToolbarSkeleton />
      ) : (
        <div className="lg:hidden">
          <div className="relative z-30 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="flex items-center gap-2">
              <div className="min-w-0 flex-1">
                <SearchInput
                  value={tableSearch}
                  onChange={setTableSearch}
                  placeholder="Search team members"
                  loading={loading}
                  showMobileFilter={true}
                  onMobileFilterClick={() => setShowMobileFilterModal(true)}
                  activeFilterCount={activeFilterCount}
                />
              </div>
              <div className="relative z-50 w-[104px] shrink-0 sm:w-[118px]">
                <CustomSelect
                  value={String(pageSize)}
                  onChange={(value) => setPageSize(Number(value))}
                  options={pageSizeOptions}
                  placeholder="10 / page"
                  className="h-9 text-xs"
                />
              </div>
            </div>
          </div>
        </div>
      )}

      <section className="relative rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        {!loading && (
          <div className="relative z-40 hidden border-b border-secondary/10 p-2.5 lg:block">
            <TableControls
              pageSize={pageSize}
              onPageSizeChange={setPageSize}
            >
              <div className="flex w-full items-center gap-2">
                <div className="min-w-0 flex-1">
                  <SearchInput
                    value={tableSearch}
                    onChange={setTableSearch}
                    placeholder="Search team members"
                    loading={loading}
                    showClearButton={true}
                  />
                </div>

                <div className="relative z-50 w-[180px] shrink-0">
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
                    className="h-9 text-xs"
                  />
                </div>

                {canManageUsers && (
                  <>
                    <button
                      type="button"
                      onClick={openAddDispatcher}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg bg-secondary px-3 text-xs font-semibold text-white transition hover:bg-secondary/90"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Add member
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(true)}
                      className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04]"
                    >
                      <UserPlus className="h-3.5 w-3.5" />
                      Create user
                    </button>
                  </>
                )}
              </div>
            </TableControls>
          </div>
        )}

        <div className="relative z-0">
          <CompanyUsersTable
            users={paginatedUsers}
            loading={loading}
            currentUser={currentUser}
            isAdmin={canManageUsers}
            onEdit={(member) =>
              setEditingUser({ ...member, user_id: member.id })
            }
            onDelete={setDeletingUser}
          />
        </div>

        {!loading && filteredUsers.length > 0 && (
          <div className="border-t border-secondary/10 px-3 py-2.5 sm:px-4">
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
          <div className="border-t border-secondary/10 px-4 py-12 text-center">
            <Users className="mx-auto h-7 w-7 text-secondary/30" />
            <p className="mt-2 text-sm font-semibold text-secondary">
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
                className="mt-3 h-9 rounded-lg border border-secondary/15 bg-white px-3 text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04]"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </section>

      {showMobileFilterModal && (
        <div
          className="fixed inset-0 z-[70] lg:hidden"
          onClick={() => setShowMobileFilterModal(false)}
        >
          <div className="absolute inset-0 bg-secondary/35 backdrop-blur-[2px]" />
          <div
            className="absolute inset-x-0 bottom-0 max-h-[80vh] overflow-y-auto rounded-t-2xl border-t border-secondary/10 bg-white shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-secondary/10 bg-white px-4 py-3">
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

            <div className="space-y-4 p-4">
              <div>
                <label className="mb-1.5 block text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/50">
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

              <div className="grid grid-cols-2 gap-2 border-t border-secondary/10 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setTableSearch("");
                    setRoleFilter("all");
                    setCurrentPage(1);
                  }}
                  disabled={!tableSearch && roleFilter === "all"}
                  className="h-10 rounded-lg border border-secondary/15 bg-white text-xs font-semibold text-secondary transition hover:bg-secondary/[0.04] disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Clear all
                </button>
                <button
                  type="button"
                  onClick={() => setShowMobileFilterModal(false)}
                  className="h-10 rounded-lg bg-secondary text-xs font-semibold text-white transition hover:bg-secondary/90"
                >
                  Show {filteredUsers.length}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
        onClose={() => setShowCreateModal(false)}
        loading={creatingUser}
        onSubmit={handleCreateUser}
      />

      <EditUserModal
        isOpen={!!editingUser}
        user={editingUser}
        updating={updating}
        onClose={() => setEditingUser(null)}
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
