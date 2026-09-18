import { useMemo } from "react";
import { Edit, Trash2, Star } from "lucide-react";
import { DataTable, type Column } from "../../ui/DataTable";

const getRoleLabel = (role?: string) => {
  switch (role) {
    case "staff":
      return "Dispatcher";
    case "delivery":
      return "Delivery";
    case "admin":
      return "Admin";
    case "owner":
      return "Owner";
    case "viewer":
      return "Viewer";
    default:
      return role || "—";
  }
};

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
  isAdmin: boolean;
}

export function CompanyUsersTable({
  users,
  loading,
  onEdit,
  onDelete,
  currentUser,
  isAdmin,
}: CompanyUsersTableProps) {
  const isSelf = (user: CompanyUser) =>
    String(user.user_id) === String(currentUser?.id);

  const columns = useMemo<Column<CompanyUser>[]>(() => {
    const tableColumns: Column<CompanyUser>[] = [
      {
        key: "user",
        header: "User",
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
                  "Unnamed user"}
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
        header: "Email",
        className: "min-w-[190px] whitespace-nowrap text-gray-600",
      },
      {
        key: "role",
        header: "Role",
        className: "whitespace-nowrap",
        render: (user) => (
          <span
            className={`inline-flex whitespace-nowrap rounded-full border px-2 py-1 text-[10px] font-semibold sm:text-xs ${getRoleBadgeClass(
              user.role,
            )}`}
          >
            {getRoleLabel(user.role)}
          </span>
        ),
      },
      {
        key: "rating",
        header: "Rating",
        className: "min-w-[120px] whitespace-nowrap",
        render: (user) => {
          if (user.role !== "delivery") {
            return <span className="text-xs text-gray-400">—</span>;
          }

          const rating = Number(user.average_rating || 0);
          const reviews = user.total_reviews || 0;

          if (rating <= 0) {
            return <span className="text-xs text-gray-400">No ratings</span>;
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
                {rating.toFixed(1)} ({reviews})
              </span>
            </div>
          );
        },
      },
    ];

    if (isAdmin) {
      tableColumns.push({
        key: "actions",
        header: "Actions",
        className: "whitespace-nowrap text-right",
        render: (user) => {
          const self = isSelf(user);

          return (
            <div className="flex items-center justify-end gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={() => onEdit(user)}
                className="rounded-md p-1.5 text-secondary transition hover:bg-secondary/10 hover:text-indigo-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary/30"
                title="Edit team role"
                aria-label={`Edit ${user.username || user.email}`}
              >
                <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>

              <button
                type="button"
                onClick={() => {
                  if (!self) onDelete(user);
                }}
                disabled={self}
                className={`rounded-md p-1.5 transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400/30 ${
                  self
                    ? "cursor-not-allowed text-gray-300"
                    : "text-red-600 hover:bg-red-50 hover:text-red-800"
                }`}
                title={
                  self
                    ? "You cannot delete yourself"
                    : user.role === "staff"
                      ? "Remove dispatcher"
                      : "Remove user"
                }
                aria-label={
                  self
                    ? "You cannot delete yourself"
                    : `Remove ${user.username || user.email}`
                }
              >
                <Trash2 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          );
        },
      });
    }

    return tableColumns;
  }, [currentUser?.id, isAdmin, onDelete, onEdit]);

  return (
    <DataTable
      data={users}
      columns={columns}
      loading={loading}
      loadingRows={5}
      emptyMessage="No users found"
      stickyColumns={3}
    />
  );
}
