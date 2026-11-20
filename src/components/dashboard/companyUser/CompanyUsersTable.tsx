import { useMemo } from "react";
import { Edit, Trash2, Star, ShieldCheck } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DataTable, type Column } from "../../ui/DataTable";

interface CompanyUser {
  id: number | string;
  user_id?: number | string;
  username?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  profile_image?: string | null;
  role?: string;
  average_rating?: string | number;
  total_reviews?: number;
}

interface CompanyUsersTableProps {
  users: CompanyUser[];
  loading: boolean;
  onEdit: (user: CompanyUser) => void;
  onDelete: (user: CompanyUser) => void;
  currentUser: any;
  currentUserRole?: string | null;
  canEdit: boolean;
  canDelete: boolean;
}

const getRoleBadgeClass = (role?: string) => {
  switch (role) {
    case "staff":
      return "bg-secondary/10 text-secondary border-secondary/15";
    case "delivery":
      return "bg-emerald-50 text-emerald-700 border-emerald-200";
    case "admin":
      return "bg-violet-50 text-violet-700 border-violet-200";
    case "owner":
      return "bg-amber-50 text-amber-700 border-amber-200";
    case "viewer":
      return "bg-gray-100 text-gray-600 border-gray-200";
    default:
      return "bg-gray-100 text-gray-600 border-gray-200";
  }
};

export function CompanyUsersTable({
  users,
  loading,
  onEdit,
  onDelete,
  currentUser,
  currentUserRole,
  canEdit,
  canDelete,
}: CompanyUsersTableProps) {
  const { t } = useTranslation("companyUsers");

  const isSelf = (user: CompanyUser) =>
    String(user.user_id ?? user.id) === String(currentUser?.id);

  const canDeleteTarget = (user: CompanyUser): boolean => {
    if (isSelf(user)) return false;
    if (user.role === "owner") {
      return currentUserRole === "owner" || currentUserRole === "superAdmin";
    }
    return true;
  };

  const canEditTarget = (user: CompanyUser): boolean => {
    if (user.role === "owner") {
      return currentUserRole === "owner" || currentUserRole === "superAdmin";
    }
    return true;
  };

  const columns = useMemo<Column<CompanyUser>[]>(() => {
    const tableColumns: Column<CompanyUser>[] = [
      {
        key: "user",
        header: t("table.columnUser"),
        className: "min-w-[160px]",
        render: (user) => (
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-secondary/10 sm:h-9 sm:w-9">
              {user.profile_image ? (
                <img
                  src={user.profile_image}
                  alt={user.username || user.email}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-[10px] font-semibold text-secondary sm:text-sm">
                  {user.first_name?.[0]?.toUpperCase() ||
                    user.email?.[0]?.toUpperCase() ||
                    "U"}
                </span>
              )}
            </div>

            <div className="min-w-0">
              <p className="max-w-[150px] truncate text-xs font-medium text-gray-900 sm:max-w-[220px] sm:text-sm">
                {user.username ||
                  `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                  t("table.unnamedUser")}
              </p>

              {(user.first_name || user.last_name) && user.username && (
                <p className="mt-0.5 max-w-[150px] truncate text-[10px] text-gray-400 sm:max-w-[220px] sm:text-xs">
                  {`${user.first_name || ""} ${user.last_name || ""}`.trim()}
                </p>
              )}
            </div>
          </div>
        ),
      },
      {
        key: "email",
        header: t("table.columnEmail"),
        className: "min-w-[190px] whitespace-nowrap text-gray-600",
      },
      {
        key: "role",
        header: t("table.columnRole"),
        className: "whitespace-nowrap",
        render: (user) => (
          <span
            className={`inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold sm:text-xs ${getRoleBadgeClass(
              user.role,
            )}`}
          >
            {user.role === "owner" && (
              <ShieldCheck className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            )}
            {user.role
              ? t(`roles.${user.role}`, { defaultValue: user.role })
              : t("roles.unknown")}
          </span>
        ),
      },
      {
        key: "rating",
        header: t("table.columnRating"),
        className: "min-w-[120px] whitespace-nowrap",
        render: (user) => {
          if (user.role !== "delivery") {
            return (
              <span className="text-xs text-gray-400">
                {t("roles.unknown")}
              </span>
            );
          }

          const rating = Number(user.average_rating || 0);
          const reviews = user.total_reviews || 0;

          if (rating <= 0) {
            return (
              <span className="text-xs text-gray-400">
                {t("table.noRatings")}
              </span>
            );
          }

          return (
            <div className="flex items-center gap-1">
              <div className="hidden items-center gap-0.5 sm:flex">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    className={`h-3 w-3 sm:h-3.5 sm:w-3.5 ${
                      star <= Math.round(rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>

              <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400 sm:hidden" />

              <span className="ml-0.5 text-[10px] text-gray-600 sm:text-xs">
                {t("table.ratingValue", {
                  rating: rating.toFixed(1),
                  reviews,
                })}
              </span>
            </div>
          );
        },
      },
    ];

    if (canEdit || canDelete) {
      tableColumns.push({
        key: "actions",
        header: t("table.columnActions"),
        className: "whitespace-nowrap text-right",
        render: (user) => {
          const self = isSelf(user);
          const editAllowed = canEdit && canEditTarget(user);
          const deleteAllowed = canDelete && canDeleteTarget(user);

          if (!editAllowed && !deleteAllowed) {
            return <div className="flex justify-end" />;
          }

          return (
            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
              {editAllowed && (
                <button
                  type="button"
                  onClick={() => onEdit(user)}
                  className="rounded-md p-1.5 text-secondary transition hover:bg-secondary/10 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30"
                  title={t("table.editTitle")}
                  aria-label={t("table.editAria", {
                    name: user.username || user.email,
                  })}
                >
                  <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}

              {deleteAllowed && (
                <button
                  type="button"
                  onClick={() => onDelete(user)}
                  className="rounded-md p-1.5 text-red-600 transition hover:bg-red-50 hover:text-red-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30"
                  title={
                    user.role === "staff"
                      ? t("table.removeDispatcherTitle")
                      : t("table.removeUserTitle")
                  }
                  aria-label={t("table.removeAria", {
                    name: user.username || user.email,
                  })}
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}

              {!deleteAllowed && self && (
                <button
                  type="button"
                  disabled
                  className="cursor-not-allowed rounded-md p-1.5 text-gray-300"
                  title={t("table.selfDeleteTitle")}
                  aria-label={t("table.selfDeleteAria")}
                >
                  <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}
            </div>
          );
        },
      });
    }

    return tableColumns;
  }, [currentUser?.id, currentUserRole, canEdit, canDelete, onDelete, onEdit, t]);

  return (
    <DataTable
      data={users}
      columns={columns}
      loading={loading}
      loadingRows={5}
      emptyMessage={t("table.emptyMessage")}
      stickyColumns={3}
    />
  );
}