// src/components/admin/UserManagement/SuperAdminUsers.tsx
import React, {
  useState,
  useEffect,
  useMemo,
  useCallback,
  useRef,
} from "react";
import { useTranslation } from "react-i18next";
import {
  Search,
  MoreVertical,
  Eye,
  Edit,
  Trash2,
  Users,
  Building2,
  CheckCircle,
  Briefcase,
  UserCheck,
  UserMinus,
  Shield,
  Package,
  Minus,
  X,
  ChevronRight,
  Filter,
  UserPlus,
} from "lucide-react";
import {
  getAllUsers,
  getAvailableCompanies,
  removeUserFromCompany,
  updateUser,
  updateUserCompanyRole,
  registerUser,
} from "../../../services/api";
import type { User, UserRole, Membership } from "../../../types";
import ReactDOM from "react-dom";
import { Pagination } from "../../ui/Pagination";
import EditUserModal from "./EditUserModal";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import ManageMembershipsModal from "./ManageMembershipsModal";
import ViewUserModal from "./ViewUserModal";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { CustomSelect } from "../../ui/CustomSelect";
import BottomSheet from "../../ui/BottomSheet";
import PageHeader from "../../ui/PageHeader";
import {
  CreateCompanyUserModal,
  type VehicleType,
} from "../companyUser/CreateCompanyUserModal";

// ============================================================
// Utility Functions
// ============================================================
const getInitials = (
  firstName: string,
  lastName: string,
  username: string,
): string => {
  if (firstName && lastName)
    return `${firstName[0]}${lastName[0]}`.toUpperCase();
  if (firstName) return firstName[0].toUpperCase();
  if (username) return username[0].toUpperCase();
  return "U";
};

const roleStyles: Record<UserRole, string> = {
  owner: "border border-secondary/15 bg-secondary/[0.07] text-secondary",
  admin: "border border-secondary/15 bg-secondary/[0.07] text-secondary",
  staff: "border border-secondary/15 bg-secondary/[0.07] text-secondary",
  viewer: "border border-secondary/15 bg-secondary/[0.07] text-secondary",
  delivery: "border border-secondary/15 bg-secondary/[0.07] text-secondary",
};

const formatPhone = (phone: string | null): string => {
  if (!phone) return "—";
  const cleaned = phone.replace(/\D/g, "");
  if (cleaned.length === 12 && cleaned.startsWith("251")) {
    return `+251 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
  }
  return phone;
};

const formatDate = (user: User): string => {
  const dateStr = (user as any).date_joined || (user as any).created_at;
  if (!dateStr) return "—";
  return new Date(dateStr).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const isCreatedToday = (user: User): boolean => {
  const dateStr = (user as any).date_joined || (user as any).created_at;
  if (!dateStr) return false;
  const today = new Date().toISOString().split("T")[0];
  return dateStr.startsWith(today);
};

interface StatCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
}

const StatCard: React.FC<StatCardProps> = ({ title, value, icon }) => (
  <div className="rounded-xl border border-secondary/10 bg-white px-3.5 py-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
    <div className="flex items-center justify-between gap-3">
      <div className="min-w-0">
        <p className="truncate text-[10px] font-semibold uppercase tracking-[0.08em] text-gray-500">
          {title}
        </p>
        <p className="mt-0.5 text-xl font-bold tracking-tight text-gray-900">
          {value}
        </p>
      </div>
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary/[0.07] text-secondary">
        {icon}
      </div>
    </div>
  </div>
);

// ============================================================
// Filters Component
// ============================================================
interface FiltersProps {
  searchTerm: string;
  setSearchTerm: (term: string) => void;
  roleFilter: string;
  setRoleFilter: (role: string) => void;
  pageSize: number;
  setPageSize: (size: number) => void;
}

const UserFilters: React.FC<FiltersProps> = ({
  searchTerm,
  setSearchTerm,
  roleFilter,
  setRoleFilter,
  pageSize,
  setPageSize,
}) => {
  const { t } = useTranslation("users");
  const [sheetOpen, setSheetOpen] = useState(false);

  const pageSizeOptions = [
    { label: t("pageSize5"), value: "5" },
    { label: t("pageSize10"), value: "10" },
    { label: t("pageSize15"), value: "15" },
    { label: t("pageSize30"), value: "30" },
    { label: t("pageSize60"), value: "60" },
  ];

  const roleOptions = useMemo(
    () => [
      {
        label: t("allRoles"),
        value: "all",
        icon: <Users className="h-4 w-4 text-secondary" />,
      },
      {
        label: t("roleAdmin"),
        value: "admin",
        icon: <Shield className="h-4 w-4 text-secondary" />,
      },
      {
        label: t("roleDispatcher"),
        value: "staff",
        icon: <Users className="h-4 w-4 text-secondary" />,
      },
      {
        label: t("roleViewer"),
        value: "viewer",
        icon: <Eye className="h-4 w-4 text-secondary" />,
      },
      {
        label: t("roleDelivery"),
        value: "delivery",
        icon: <Package className="h-4 w-4 text-secondary" />,
      },
      {
        label: t("roleNoCompany"),
        value: "no_company",
        icon: <Briefcase className="h-4 w-4 text-secondary" />,
      },
    ],
    [t],
  );

  return (
    <>
      <div className="sticky -top-6 z-[2] -mt-6 w-full bg-white pt-6">
        <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
          <div className="flex items-center gap-2">
            <div className="relative min-w-0 flex-1">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder={t("searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="h-9 w-full rounded-lg border border-secondary/15 bg-white pl-9 pr-9 text-xs font-medium text-gray-900 outline-none placeholder:text-gray-400 focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => setSearchTerm("")}
                  aria-label={t("clearSearch")}
                  className="absolute right-2 top-1/2 flex h-6 w-6 -translate-y-1/2 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>

            <div className="relative z-[110] hidden w-[180px] shrink-0 md:block">
              <CustomSelect
                value={roleFilter}
                onChange={setRoleFilter}
                options={roleOptions}
                placeholder={t("allRoles")}
                className="h-9 text-xs"
              />
            </div>

            <div className="relative z-[110] w-[106px] shrink-0 sm:w-[120px]">
              <CustomSelect
                value={pageSize.toString()}
                onChange={(val) => setPageSize(parseInt(val, 10))}
                options={pageSizeOptions}
                placeholder={t("pageSize10")}
                className="h-9 text-xs"
              />
            </div>

            <button
              type="button"
              onClick={() => setSheetOpen(true)}
              aria-label={t("filterUsers")}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-secondary/15 bg-white text-secondary transition hover:bg-secondary/[0.05] md:hidden"
            >
              <Filter className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title={t("filterUsersTitle")}
      >
        <div className="space-y-3">
          <p className="text-xs text-gray-500">{t("filterUsersDesc")}</p>
          <div className="grid grid-cols-2 gap-2">
            {roleOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => {
                  setRoleFilter(opt.value);
                  setSheetOpen(false);
                }}
                className={`flex min-h-[72px] flex-col items-center justify-center gap-1.5 rounded-xl border px-3 py-3 text-xs font-semibold transition ${
                  roleFilter === opt.value
                    ? "border-secondary bg-secondary text-white"
                    : "border-secondary/10 bg-white text-gray-700 hover:bg-secondary/[0.04]"
                }`}
              >
                <span
                  className={
                    roleFilter === opt.value ? "text-white" : "text-secondary"
                  }
                >
                  {opt.icon}
                </span>
                <span className="text-center">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>
      </BottomSheet>
    </>
  );
};

// ============================================================
// Actions Dropdown Component
// ============================================================
interface ActionsDropdownProps {
  user: User;
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onRemove: (user: User) => void;
  onManageMemberships: (user: User) => void;
}

const ActionsDropdown: React.FC<ActionsDropdownProps> = ({
  user,
  onView,
  onEdit,
  onRemove,
  onManageMemberships,
}) => {
  const { t } = useTranslation("users");
  const [open, setOpen] = useState(false);
  const [isAbove, setIsAbove] = useState(false);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node) &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    };
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("keydown", handleEscape);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [open]);

  useEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const estimatedMenuHeight = 176;
    const spaceBelow = window.innerHeight - rect.bottom;
    setIsAbove(spaceBelow < estimatedMenuHeight && rect.top > spaceBelow);
  }, [open]);

  const buttonRect = buttonRef.current?.getBoundingClientRect();
  const portalStyle: React.CSSProperties = {
    position: "fixed",
    top: buttonRect
      ? isAbove
        ? buttonRect.top - 8
        : buttonRect.bottom + 8
      : 0,
    right: buttonRect ? window.innerWidth - buttonRect.right : 0,
    width: 208,
    zIndex: 99999,
    transform: isAbove ? "translateY(-100%)" : undefined,
  };

  const menuItems = [
    { label: t("viewProfile"), icon: Eye, action: () => onView(user) },
    { label: t("editUser"), icon: Edit, action: () => onEdit(user) },
    {
      label: t("manageMemberships"),
      icon: Building2,
      action: () => onManageMemberships(user),
    },
    { label: t("removeUser"), icon: Trash2, action: () => onRemove(user) },
  ];

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={t("actionsFor", { name: user.username })}
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-secondary/10 bg-white text-gray-500 transition hover:border-secondary/20 hover:bg-secondary/[0.05] hover:text-secondary focus:outline-none focus:ring-2 focus:ring-secondary/15"
      >
        <MoreVertical className="h-4 w-4" />
      </button>

      {open &&
        ReactDOM.createPortal(
          <div
            ref={menuRef}
            style={portalStyle}
            className="overflow-hidden rounded-xl border border-secondary/10 bg-white p-1 shadow-[0_14px_35px_rgba(0,0,0,0.12)]"
          >
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => {
                    item.action();
                    setOpen(false);
                  }}
                  className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-xs font-medium text-gray-700 transition hover:bg-secondary/[0.05] hover:text-secondary"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-secondary/[0.06] text-secondary">
                    <Icon className="h-3.5 w-3.5" />
                  </span>
                  <span className="min-w-0 flex-1 truncate">{item.label}</span>
                  <ChevronRight className="h-3.5 w-3.5 text-gray-300" />
                </button>
              );
            })}
          </div>,
          document.body,
        )}
    </>
  );
};

// ============================================================
// Desktop Table Component
// ============================================================
interface UserTableProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onRemove: (user: User) => void;
  onManageMemberships: (user: User) => void;
  editingRoleInTable: string | null;
  setEditingRoleInTable: (value: string | null) => void;
  handleRoleChangeFromTable: (
    membership: Membership,
    newRole: UserRole,
    userId: number,
  ) => Promise<void>;
  handleRemoveMembershipFromTable: (
    companyId: number,
    companyName: string,
    userId: number,
    userName: string,
  ) => void;
}

interface UserMobileCardsProps {
  users: User[];
  onView: (user: User) => void;
  onEdit: (user: User) => void;
  onRemove: (user: User) => void;
  onManageMemberships: (user: User) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  editingRoleInTable,
  setEditingRoleInTable,
  handleRoleChangeFromTable,
  handleRemoveMembershipFromTable,
  ...actionProps
}) => {
  const { t } = useTranslation("users");

  const getRoleLabel = (role: string): string => {
    if (!role) return "";
    const map: Record<string, string> = {
      owner: t("roleOwner"),
      admin: t("roleAdmin"),
      staff: t("roleDispatcher"),
      viewer: t("roleViewer"),
      delivery: t("roleDelivery"),
    };
    return map[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="hidden overflow-x-auto lg:block">
      <div className="overflow-visible rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
        <table className="w-full min-w-[1040px] table-fixed text-left">
          <thead className="border-b border-secondary/10 bg-secondary/[0.035]">
            <tr className="text-[10px] font-semibold uppercase tracking-[0.06em] text-gray-500">
              <th className="w-[220px] px-4 py-2.5">{t("colUser")}</th>
              <th className="w-[210px] px-4 py-2.5">{t("colEmail")}</th>
              <th className="w-[150px] px-4 py-2.5">{t("colPhone")}</th>
              <th className="w-[120px] px-4 py-2.5">{t("colJoined")}</th>
              <th className="w-[280px] px-4 py-2.5">{t("colCompanies")}</th>
              <th className="w-[105px] px-4 py-2.5">{t("colStatus")}</th>
              <th className="w-[80px] px-4 py-2.5 text-right">
                {t("colAction")}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-secondary/[0.08]">
            {users.map((user) => (
              <tr
                key={user.id}
                className="text-xs text-gray-700 transition hover:bg-secondary/[0.025]"
              >
                <td className="px-4 py-3 align-top">
                  <div className="flex min-w-0 items-center gap-2.5">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-xs font-bold text-white">
                      {user.profile_image ? (
                        <img
                          src={user.profile_image}
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        getInitials(
                          user.first_name,
                          user.last_name,
                          user.username,
                        )
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="flex min-w-0 items-center gap-1.5">
                        <p className="truncate text-xs font-semibold text-gray-900">
                          {user.first_name || user.username}
                          {user.last_name && ` ${user.last_name}`}
                        </p>
                        {isCreatedToday(user) && (
                          <span className="shrink-0 rounded-full border border-secondary/10 bg-secondary/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-secondary">
                            {t("newBadge")}
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 truncate text-[10px] text-gray-500">
                        @{user.username}
                      </p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-3 align-top">
                  <p
                    className="truncate font-medium text-gray-700"
                    title={user.email}
                  >
                    {user.email}
                  </p>
                </td>
                <td className="px-4 py-3 align-top font-medium text-gray-600">
                  {formatPhone(user.phone_number)}
                </td>
                <td className="px-4 py-3 align-top text-gray-500">
                  {formatDate(user)}
                </td>
                <td className="px-4 py-3 align-top">
                  {user.memberships.length > 0 ? (
                    <div className="max-h-[116px] space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-secondary/20 scrollbar-track-transparent">
                      {user.memberships.map(
                        (membership: Membership, index: number) => (
                          <div
                            key={`${membership.company_id}-${index}`}
                            className="flex items-center justify-between gap-2 rounded-lg border border-secondary/[0.08] bg-white px-2 py-1.5"
                          >
                            <div className="flex min-w-0 items-center gap-1.5">
                              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-secondary" />
                              <span className="truncate text-[10px] font-medium text-gray-700">
                                {membership.company_name}
                              </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-1">
                              {editingRoleInTable ===
                              `role-${user.id}-${membership.company_id}` ? (
                                <select
                                  value={membership.role}
                                  onChange={(event) =>
                                    handleRoleChangeFromTable(
                                      membership,
                                      event.target.value as UserRole,
                                      user.id,
                                    )
                                  }
                                  onBlur={() => {
                                    setEditingRoleInTable(null);
                                  }}
                                  autoFocus
                                  className="rounded-md border border-secondary/20 bg-white px-1.5 py-1 text-[9px] font-semibold text-gray-700 outline-none focus:ring-2 focus:ring-secondary/10"
                                >
                                  {[
                                    "admin",
                                    "staff",
                                    "viewer",
                                    "delivery",
                                  ].map((role) => (
                                    <option key={role} value={role}>
                                      {getRoleLabel(role)}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() => {
                                    setEditingRoleInTable(
                                      `role-${user.id}-${membership.company_id}`,
                                    );
                                  }}
                                  className={`rounded-full px-2 py-0.5 text-[9px] font-semibold transition hover:bg-secondary/[0.1] ${roleStyles[membership.role]}`}
                                >
                                  {getRoleLabel(membership.role)}
                                </button>
                              )}
                              <button
                                type="button"
                                onClick={() =>
                                  handleRemoveMembershipFromTable(
                                    membership.company_id,
                                    membership.company_name,
                                    user.id,
                                    user.first_name || user.username,
                                  )
                                }
                                aria-label={`Remove ${membership.company_name}`}
                                className="flex h-6 w-6 items-center justify-center rounded-md text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
                              >
                                <X className="h-3 w-3" />
                              </button>
                            </div>
                          </div>
                        ),
                      )}
                    </div>
                  ) : (
                    <span className="text-[10px] text-gray-400">
                      {t("noCompanies")}
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 align-top">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-1 text-[10px] font-semibold ${
                      user.is_active
                        ? "border-secondary/15 bg-secondary/[0.07] text-secondary"
                        : "border-gray-200 bg-white text-gray-400"
                    }`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${user.is_active ? "bg-secondary" : "bg-gray-300"}`}
                    />
                    {user.is_active ? t("statusActive") : t("statusInactive")}
                  </span>
                </td>
                <td className="relative overflow-visible px-4 py-3 text-right align-top">
                  <ActionsDropdown user={user} {...actionProps} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const UserMobileCards: React.FC<UserMobileCardsProps> = ({
  users,
  ...actionProps
}) => {
  const { t } = useTranslation("users");

  const getRoleLabel = (role: string): string => {
    if (!role) return "";
    const map: Record<string, string> = {
      owner: t("roleOwner"),
      admin: t("roleAdmin"),
      staff: t("roleDispatcher"),
      viewer: t("roleViewer"),
      delivery: t("roleDelivery"),
    };
    return map[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
  };

  return (
    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:hidden">
      {users.map((user) => (
        <article
          key={user.id}
          className="flex flex-col rounded-xl border border-secondary/10 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)]"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex min-w-0 items-center gap-2.5">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary text-[11px] font-bold text-white">
                {user.profile_image ? (
                  <img
                    src={user.profile_image}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  getInitials(user.first_name, user.last_name, user.username)
                )}
              </div>
              <div className="min-w-0">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="truncate text-xs font-semibold text-gray-900">
                    {user.first_name || user.username}
                    {user.last_name && ` ${user.last_name}`}
                  </p>
                  {isCreatedToday(user) && (
                    <span className="shrink-0 rounded-full border border-secondary/10 bg-secondary/[0.06] px-1.5 py-0.5 text-[9px] font-semibold text-secondary">
                      {t("newBadge")}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[10px] text-gray-500">
                  {user.email}
                </p>
              </div>
            </div>
            <ActionsDropdown user={user} {...actionProps} />
          </div>

          <div className="mt-3 grid grid-cols-2 gap-2 text-[10px]">
            <div className="rounded-lg bg-secondary/[0.035] px-2.5 py-2">
              <p className="font-medium text-gray-500">{t("colPhone")}</p>
              <p className="mt-0.5 truncate font-semibold text-gray-700">
                {formatPhone(user.phone_number)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/[0.035] px-2.5 py-2">
              <p className="font-medium text-gray-500">{t("colJoined")}</p>
              <p className="mt-0.5 truncate font-semibold text-gray-700">
                {formatDate(user)}
              </p>
            </div>
          </div>

          <div className="mt-3 flex-1">
            <p className="mb-1.5 text-[9px] font-semibold uppercase tracking-[0.06em] text-gray-500">
              {t("companiesLabel")}
            </p>
            {user.memberships.length > 0 ? (
              <div className="max-h-24 space-y-1 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-secondary/20 scrollbar-track-transparent">
                {user.memberships.map(
                  (membership: Membership, index: number) => (
                    <div
                      key={`${membership.company_id}-${index}`}
                      className="flex items-center justify-between gap-2 rounded-lg border border-secondary/[0.08] px-2 py-1.5"
                    >
                      <span className="truncate text-[10px] font-medium text-gray-700">
                        {membership.company_name}
                      </span>
                      <span
                        className={`shrink-0 rounded-full px-1.5 py-0.5 text-[9px] font-semibold ${roleStyles[membership.role]}`}
                      >
                        {getRoleLabel(membership.role)}
                      </span>
                    </div>
                  ),
                )}
              </div>
            ) : (
              <p className="text-[10px] text-gray-400">
                {t("noCompaniesAssigned")}
              </p>
            )}
          </div>

          <div className="mt-3 border-t border-secondary/[0.08] pt-2.5">
            <span
              className={`inline-flex items-center gap-1.5 text-[10px] font-semibold ${
                user.is_active ? "text-secondary" : "text-gray-400"
              }`}
            >
              {user.is_active ? (
                <CheckCircle className="h-3.5 w-3.5" />
              ) : (
                <Minus className="h-3.5 w-3.5" />
              )}
              {user.is_active ? t("statusActive") : t("statusInactive")}
            </span>
          </div>
        </article>
      ))}
    </div>
  );
};

interface EmptyStateProps {
  onReset: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onReset }) => {
  const { t } = useTranslation("users");
  return (
    <div className="rounded-xl border border-secondary/10 bg-white px-4 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-secondary/[0.07] text-secondary">
        <Users className="h-5 w-5" />
      </div>
      <h3 className="mt-3 text-sm font-semibold text-gray-900">
        {t("noUsersTitle")}
      </h3>
      <p className="mx-auto mt-1 max-w-sm text-xs leading-5 text-gray-500">
        {t("noUsersDesc")}
      </p>
      <button
        type="button"
        onClick={onReset}
        className="mt-4 h-9 rounded-lg bg-secondary px-4 text-xs font-semibold text-white transition hover:bg-secondary/90"
      >
        {t("resetFilters")}
      </button>
    </div>
  );
};

const SkeletonBar = ({ className = "" }: { className?: string }) => (
  <div className={`animate-pulse rounded bg-secondary/[0.08] ${className}`} />
);

const LoadingSkeleton: React.FC = () => (
  <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
    <div className="flex items-center justify-between gap-4 py-1">
      <div className="space-y-2">
        <SkeletonBar className="h-6 w-40" />
        <SkeletonBar className="h-3 w-64 max-w-[70vw]" />
      </div>
      <SkeletonBar className="h-9 w-28" />
    </div>

    <div className="grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-secondary/10 bg-white p-3.5"
        >
          <div className="flex items-center justify-between gap-3">
            <div className="space-y-2">
              <SkeletonBar className="h-2.5 w-20" />
              <SkeletonBar className="h-6 w-10" />
            </div>
            <SkeletonBar className="h-9 w-9 rounded-lg" />
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-xl border border-secondary/10 bg-white p-2.5">
      <div className="flex gap-2">
        <SkeletonBar className="h-9 min-w-0 flex-1" />
        <SkeletonBar className="hidden h-9 w-44 md:block" />
        <SkeletonBar className="h-9 w-28" />
      </div>
    </div>

    <div className="hidden overflow-hidden rounded-xl border border-secondary/10 bg-white lg:block">
      <div className="grid grid-cols-[220px_210px_150px_120px_280px_105px_80px] gap-0 border-b border-secondary/10 bg-secondary/[0.03] px-4 py-3">
        {Array.from({ length: 7 }).map((_, index) => (
          <SkeletonBar key={index} className="h-2.5 w-16" />
        ))}
      </div>
      <div className="divide-y divide-secondary/[0.08]">
        {Array.from({ length: 6 }).map((_, row) => (
          <div key={row} className="flex items-center gap-4 px-4 py-3">
            <SkeletonBar className="h-9 w-9 shrink-0 rounded-full" />
            <div className="w-40 space-y-1.5">
              <SkeletonBar className="h-3 w-28" />
              <SkeletonBar className="h-2.5 w-20" />
            </div>
            <SkeletonBar className="h-3 w-44" />
            <SkeletonBar className="h-3 w-28" />
            <SkeletonBar className="h-3 w-24" />
            <div className="min-w-0 flex-1">
              <SkeletonBar className="h-8 w-full max-w-[240px]" />
            </div>
            <SkeletonBar className="h-6 w-16 rounded-full" />
            <SkeletonBar className="ml-auto h-8 w-8 rounded-lg" />
          </div>
        ))}
      </div>
    </div>

    <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:hidden">
      {Array.from({ length: 4 }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl border border-secondary/10 bg-white p-3"
        >
          <div className="flex items-center gap-2.5">
            <SkeletonBar className="h-9 w-9 shrink-0 rounded-full" />
            <div className="flex-1 space-y-1.5">
              <SkeletonBar className="h-3 w-28" />
              <SkeletonBar className="h-2.5 w-40 max-w-full" />
            </div>
            <SkeletonBar className="h-8 w-8 rounded-lg" />
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2">
            <SkeletonBar className="h-11" />
            <SkeletonBar className="h-11" />
          </div>
          <SkeletonBar className="mt-3 h-16 w-full" />
        </div>
      ))}
    </div>
  </div>
);

// ============================================================
// Main Component
// ============================================================
const SuperAdminUsers: React.FC = () => {
  const { t } = useTranslation("users");
  const { toast, showToast } = useToast();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [managingUser, setManagingUser] = useState<User | null>(null);
  const [isMembershipModalOpen, setIsMembershipModalOpen] = useState(false);
  const [availableCompanies, setAvailableCompanies] = useState<
    Array<{ id: number; name: string; slug: string }>
  >([]);
  const [editingRoleInTable, setEditingRoleInTable] = useState<string | null>(
    null,
  );
  const [removeMembershipModalOpen, setRemoveMembershipModalOpen] =
    useState(false);
  const [removeMembershipData, setRemoveMembershipData] = useState<{
    companyId: number;
    companyName: string;
    userId: number;
    userName: string;
  } | null>(null);
  const [isRemovingMembership, setIsRemovingMembership] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  const [creatingUser, setCreatingUser] = useState(false);
  const [createUserServerErrors, setCreateUserServerErrors] = useState<
    Record<string, string | string[]>
  >({});
  const [updatingUser, setUpdatingUser] = useState(false);
  const [updateUserServerErrors, setUpdateUserServerErrors] = useState<
    Record<string, string | string[]>
  >({});

  const fetchAllUsers = useCallback(async (): Promise<User[]> => {
    let page = 1;
    let all: User[] = [];
    let hasMore = true;
    while (hasMore) {
      const response = await getAllUsers(page, 100);
      all = [...all, ...response.results];
      hasMore = !!response.next;
      page++;
    }
    return all;
  }, []);

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const users = await fetchAllUsers();
        setAllUsers(users);
      } catch (err: any) {
        setError(err.message || t("fetchUsersFailed"));
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, [fetchAllUsers, t]);

  useEffect(() => {
    if (managingUser && allUsers.length) {
      const updated = allUsers.find((u) => u.id === managingUser.id);
      if (updated) setManagingUser(updated);
    }
  }, [allUsers, managingUser]);

  const filteredUsers = useMemo(() => {
    let filtered = [...allUsers];
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (user) =>
          user.username.toLowerCase().includes(term) ||
          user.email.toLowerCase().includes(term) ||
          `${user.first_name || ""} ${user.last_name || ""}`
            .toLowerCase()
            .includes(term) ||
          (user.phone_number && user.phone_number.includes(term)) ||
          user.memberships.some((m) =>
            m.company_name.toLowerCase().includes(term),
          ),
      );
    }
    if (roleFilter !== "all") {
      if (roleFilter === "no_company") {
        filtered = filtered.filter((user) => user.memberships.length === 0);
      } else {
        filtered = filtered.filter((user) =>
          user.memberships.some((m) => m.role === roleFilter),
        );
      }
    }
    return filtered;
  }, [allUsers, searchTerm, roleFilter]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredUsers.slice(start, end);
  }, [filteredUsers, currentPage, pageSize]);

  const stats = useMemo(() => {
    const totalAdmins = filteredUsers.filter((u) =>
      u.memberships.some((m) => m.role === "admin"),
    ).length;
    const totalStaff = filteredUsers.filter((u) =>
      u.memberships.some((m) => m.role === "staff"),
    ).length;
    const totalViewers = filteredUsers.filter((u) =>
      u.memberships.some((m) => m.role === "viewer"),
    ).length;
    const totalDelivery = filteredUsers.filter((u) =>
      u.memberships.some((m) => m.role === "delivery"),
    ).length;
    const noCompany = filteredUsers.filter(
      (u) => u.memberships.length === 0,
    ).length;
    return { totalAdmins, totalStaff, totalViewers, totalDelivery, noCompany };
  }, [filteredUsers]);

  const handleRefresh = async () => {
    setSearchTerm("");
    setRoleFilter("all");
    setCurrentPage(1);
    await refreshAllUsers();
  };

  const handleResetFilters = async () => {
    setSearchTerm("");
    setRoleFilter("all");
    setCurrentPage(1);
    await refreshAllUsers();
  };

  const handlePageChange = (page: number) => setCurrentPage(page);
  const handlePageSizeChange = (size: number) => {
    setPageSize(size);
    setCurrentPage(1);
  };

  const refreshAllUsers = async () => {
    const users = await fetchAllUsers();
    setAllUsers(users);
    if (managingUser) {
      const updatedUser = users.find((u) => u.id === managingUser.id);
      if (updatedUser) setManagingUser(updatedUser);
    }
    if (selectedUser) {
      const updatedUser = users.find((u) => u.id === selectedUser.id);
      if (updatedUser) setSelectedUser(updatedUser);
    }
    if (editingUser) {
      const updatedUser = users.find((u) => u.id === editingUser.id);
      if (updatedUser) setEditingUser(updatedUser);
    }
  };

  const handleView = (user: User) => {
    setSelectedUser(user);
    setIsViewModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setUpdateUserServerErrors({});
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (updatedData: Partial<User>) => {
    if (!editingUser) return;
    setUpdatingUser(true);
    setUpdateUserServerErrors({});

    try {
      await updateUser(editingUser.id, updatedData);
      await refreshAllUsers();
      showToast("success", t("userUpdated"));
      setIsEditModalOpen(false);
    } catch (err: any) {
      const backendErrors = err?.response?.data;
      let message = err.message || t("userUpdateFailed");
      if (backendErrors && typeof backendErrors === "object") {
        setUpdateUserServerErrors(backendErrors);
        message = Object.entries(backendErrors)
          .map(([k, v]) => `${k}: ${Array.isArray(v) ? v.join(", ") : v}`)
          .join("; ");
      }
      showToast("error", message);
      throw new Error(message);
    } finally {
      setUpdatingUser(false);
    }
  };

  const handleCreateUser = async (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    username: string;
    password: string;
    role: "admin" | "staff" | "viewer" | "delivery";
    vehicle_type?: VehicleType;
  }) => {
    setCreatingUser(true);
    setCreateUserServerErrors({});

    try {
      const payload: Record<string, any> = {
        first_name: data.first_name.trim(),
        last_name: data.last_name.trim(),
        email: data.email.trim(),
        username: data.username.trim(),
        password: data.password,
        phone_number: data.phone_number.replace(/\D/g, ""),
        role: data.role,
      };

      if (data.role === "delivery" && data.vehicle_type) {
        payload.vehicle_type = data.vehicle_type;
      }

      await registerUser(payload as any);

      showToast("success", t("userCreated"));
      setIsCreateModalOpen(false);
      await refreshAllUsers();
    } catch (err: any) {
      const backendErrors = err?.response?.data;
      if (backendErrors && typeof backendErrors === "object") {
        setCreateUserServerErrors(backendErrors);
      } else {
        showToast("error", err?.message || t("userCreateFailed"));
      }
    } finally {
      setCreatingUser(false);
    }
  };

  const handleRemove = (user: User) => {
    setManagingUser(user);
    setIsMembershipModalOpen(true);
  };

  const handleManageMemberships = (user: User) => {
    setManagingUser(user);
    setIsMembershipModalOpen(true);
  };

  const getRoleLabel = (role: string): string => {
    const map: Record<string, string> = {
      owner: t("roleOwner"),
      admin: t("roleAdmin"),
      staff: t("roleDispatcher"),
      viewer: t("roleViewer"),
      delivery: t("roleDelivery"),
    };
    return map[role] ?? role.charAt(0).toUpperCase() + role.slice(1);
  };

  const handleRoleChangeFromTable = async (
    membership: Membership,
    newRole: UserRole,
    userId: number,
  ) => {
    try {
      await updateUserCompanyRole(membership.company_slug, userId, newRole);
      await refreshAllUsers();
      showToast("success", t("roleUpdated", { role: getRoleLabel(newRole) }));
      setEditingRoleInTable(null);
    } catch (err: any) {
      showToast("error", err.message || t("roleUpdateFailed"));
    }
  };

  const handleRemoveMembershipFromTable = (
    companyId: number,
    companyName: string,
    userId: number,
    userName: string,
  ) => {
    setRemoveMembershipData({ companyId, companyName, userId, userName });
    setRemoveMembershipModalOpen(true);
  };

  const confirmRemoveMembership = async () => {
    if (!removeMembershipData) return;

    const { companyId, companyName, userId, userName } = removeMembershipData;

    setIsRemovingMembership(true);

    try {
      const userToRemove = allUsers.find((u) => u.id === userId);
      if (!userToRemove) {
        showToast("error", t("userNotFound"));
        setIsRemovingMembership(false);
        return;
      }

      const membership = userToRemove.memberships.find(
        (m) => m.company_id === companyId,
      );
      if (!membership) {
        showToast("error", t("membershipNotFound"));
        setIsRemovingMembership(false);
        return;
      }

      await removeUserFromCompany(membership.company_slug, userId);
      await refreshAllUsers();
      showToast(
        "success",
        t("userRemoved", { user: userName, company: companyName }),
      );
      setRemoveMembershipModalOpen(false);
      setRemoveMembershipData(null);
    } catch (err: any) {
      showToast("error", err.message || t("removeFailed"));
    } finally {
      setIsRemovingMembership(false);
    }
  };

  useEffect(() => {
    if (isMembershipModalOpen) {
      getAvailableCompanies().then(setAvailableCompanies).catch(console.error);
    }
  }, [isMembershipModalOpen]);

  if (loading) return <LoadingSkeleton />;
  if (error) {
    return (
      <div className="mx-auto flex h-64 w-full max-w-[1600px] flex-col items-center justify-center px-4 text-center">
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/[0.07] text-secondary">
          <Users className="h-5 w-5" />
        </div>
        <p className="mt-3 text-sm font-semibold text-gray-900">
          {t("couldNotLoadUsers")}
        </p>
        <p className="mt-1 max-w-sm text-xs text-gray-500">{error}</p>
        <button
          type="button"
          onClick={handleRefresh}
          className="mt-4 h-9 rounded-lg bg-secondary px-4 text-xs font-semibold text-white transition hover:bg-secondary/90"
        >
          {t("retry")}
        </button>
      </div>
    );
  }

  return (
    <>
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
        <PageHeader
          title={t("pageTitle")}
          description={t("pageDescription")}
          icon={Users}
          badge={
            <span className="inline-flex items-center rounded-full border border-secondary/10 bg-secondary/[0.06] px-2.5 py-1 text-[10px] font-semibold text-secondary sm:text-xs">
              {t("usersCount", { count: allUsers.length })}
            </span>
          }
          actions={
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:text-sm"
            >
              <UserPlus className="h-4 w-4" />
              {t("createUser")}
            </button>
          }
          actionMobile={
            <button
              type="button"
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 sm:text-sm"
            >
              <UserPlus className="h-4 w-4" />
              {t("createUserShort")}
            </button>
          }
          className="mb-5 sm:mb-6"
        />

        <section className="mb-6 grid grid-cols-2 gap-2 md:grid-cols-3 lg:grid-cols-5">
          <StatCard
            title={t("statAdmins")}
            value={stats.totalAdmins}
            icon={<Shield className="h-4 w-4" />}
          />
          <StatCard
            title={t("statDispatchers")}
            value={stats.totalStaff}
            icon={<UserCheck className="h-4 w-4" />}
          />
          <StatCard
            title={t("statViewers")}
            value={stats.totalViewers}
            icon={<UserMinus className="h-4 w-4" />}
          />
          <StatCard
            title={t("statDelivery")}
            value={stats.totalDelivery}
            icon={<Package className="h-4 w-4" />}
          />
          <StatCard
            title={t("statNoCompany")}
            value={stats.noCompany}
            icon={<Briefcase className="h-4 w-4" />}
          />
        </section>

        <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6">
          <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
            <UserFilters
              searchTerm={searchTerm}
              setSearchTerm={(value) => {
                setSearchTerm(value);
                setCurrentPage(1);
              }}
              roleFilter={roleFilter}
              setRoleFilter={(value) => {
                setRoleFilter(value);
                setCurrentPage(1);
              }}
              pageSize={pageSize}
              setPageSize={handlePageSizeChange}
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState onReset={handleResetFilters} />
        ) : (
          <>
            <UserTable
              users={paginatedUsers}
              onView={handleView}
              onEdit={handleEdit}
              onRemove={handleRemove}
              onManageMemberships={handleManageMemberships}
              editingRoleInTable={editingRoleInTable}
              setEditingRoleInTable={setEditingRoleInTable}
              handleRoleChangeFromTable={handleRoleChangeFromTable}
              handleRemoveMembershipFromTable={handleRemoveMembershipFromTable}
            />
            <UserMobileCards
              users={paginatedUsers}
              onView={handleView}
              onEdit={handleEdit}
              onRemove={handleRemove}
              onManageMemberships={handleManageMemberships}
            />
            <div className="rounded-xl border border-secondary/10 bg-white px-3 py-2 shadow-[0_1px_2px_rgba(0,0,0,0.02)]">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredUsers.length / pageSize)}
                onPageChange={handlePageChange}
                enableUrlSync={false}
              />
            </div>
          </>
        )}
      </div>

      <ViewUserModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        user={selectedUser}
        onEdit={handleEdit}
        onDelete={handleRemove}
      />

      <EditUserModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setUpdateUserServerErrors({});
        }}
        user={editingUser}
        onSave={handleSaveEdit}
      />

      <ConfirmDeleteModal
        isOpen={removeMembershipModalOpen}
        onClose={() => {
          if (isRemovingMembership) return;
          setRemoveMembershipModalOpen(false);
          setRemoveMembershipData(null);
        }}
        onConfirm={confirmRemoveMembership}
        title={t("removeMembershipTitle")}
        message={t("removeMembershipConfirm", {
          company: removeMembershipData?.companyName || "",
          user: removeMembershipData?.userName || "",
        })}
        loading={isRemovingMembership}
      />

      <CreateCompanyUserModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCreateUserServerErrors({});
        }}
        loading={creatingUser}
        onSubmit={handleCreateUser}
        serverErrors={createUserServerErrors}
      />

      <ManageMembershipsModal
        isOpen={isMembershipModalOpen}
        onClose={() => setIsMembershipModalOpen(false)}
        user={managingUser}
        availableCompanies={availableCompanies}
        onUpdateRole={async (userId, companySlug, role) => {
          try {
            await updateUserCompanyRole(companySlug, userId, role);
            await refreshAllUsers();
            showToast("success", t("roleUpdatedSuccess"));
          } catch (err: any) {
            showToast("error", t("roleUpdateFailed"));
          }
        }}
        onRemoveMembership={async (userId, companyId) => {
          try {
            const company = availableCompanies.find((c) => c.id === companyId);
            if (!company) throw new Error(t("companyNotFoundGeneric"));
            await removeUserFromCompany(company.slug, userId);
            await refreshAllUsers();
            showToast("success", t("membershipRemoved"));
          } catch (err: any) {
            showToast("error", err.message || t("membershipRemoveFailed"));
          }
        }}
        onRefresh={refreshAllUsers}
      />
      <Toast toast={toast} />
    </>
  );
};

export default SuperAdminUsers;