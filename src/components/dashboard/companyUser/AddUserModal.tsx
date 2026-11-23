
import {
  X,
  Loader2,
  ChevronDown,
  User as UserIcon,
  Search,
  Users,
  ShieldCheck,
  Truck,
  Eye,
  CheckCircle2,
} from "lucide-react";
import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type KeyboardEvent,
  type MouseEvent,
} from "react";
import { useTranslation } from "react-i18next";
import type { User } from "../../../types";
import { CustomSelect } from "../../ui/CustomSelect";

// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

type UserRole = "admin" | "staff" | "viewer" | "delivery";

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  searching: boolean;
  searchResults: User[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  selectedRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  adding: boolean;
  onAdd: () => void;
}

// --------------------------------------------------------------
// Avatar component
// --------------------------------------------------------------

const UserAvatar = ({
  user,
  size = "md",
}: {
  user: User;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-9 h-9 text-xs",
    md: "w-11 h-11 text-sm",
    lg: "w-14 h-14 text-lg",
  };

  const initial =
    user.first_name?.[0]?.toUpperCase() ||
    user.username?.[0]?.toUpperCase() ||
    user.email?.[0]?.toUpperCase() ||
    "?";

  return (
    <div
      className={`
        ${sizeClasses[size]}
        rounded-full
        bg-gradient-to-br from-indigo-100 to-violet-200
        flex items-center justify-center
        overflow-hidden flex-shrink-0
        ring-2 ring-white shadow-sm
      `}
    >
      {user.profile_image ? (
        <img
          src={user.profile_image}
          alt={`${user.first_name || user.username || "User"} avatar`}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span className="font-semibold text-indigo-700">
          {initial}
        </span>
      )}
    </div>
  );
};

// --------------------------------------------------------------
// Role options
// --------------------------------------------------------------

const ROLE_ICONS: Record<UserRole, React.ReactNode> = {
  admin: <ShieldCheck className="w-4 h-4" />,
  staff: <Users className="w-4 h-4" />,
  delivery: <Truck className="w-4 h-4" />,
  viewer: <Eye className="w-4 h-4" />,
};

// --------------------------------------------------------------
// Main modal component
// Backend "staff" is displayed as Dispatcher
// --------------------------------------------------------------

export function AddUserModal({
  isOpen,
  onClose,
  searching,
  searchResults,
  searchTerm,
  onSearchChange,
  selectedUser,
  onSelectUser,
  selectedRole,
  onRoleChange,
  adding,
  onAdd,
}: AddUserModalProps) {
  const { t } = useTranslation("companyUsers");

  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // ------------------------------------------------------------
  // Role options
  // ------------------------------------------------------------

  const roleOptions = [
    {
      value: "admin",
      label: t("addUserModal.roleOptions.admin"),
      icon: ROLE_ICONS.admin,
    },
    {
      value: "staff",
      label: t("addUserModal.roleOptions.staff"),
      icon: ROLE_ICONS.staff,
    },
    {
      value: "delivery",
      label: t("addUserModal.roleOptions.delivery"),
      icon: ROLE_ICONS.delivery,
    },
    {
      value: "viewer",
      label: t("addUserModal.roleOptions.viewer"),
      icon: ROLE_ICONS.viewer,
    },
  ];

  // ------------------------------------------------------------
  // Reset dropdown index when search results change
  // ------------------------------------------------------------

  useEffect(() => {
    setDropdownIndex(-1);
  }, [searchResults]);

  // ------------------------------------------------------------
  // Reset modal state when closed
  // ------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) {
      setShowDropdown(false);
      setDropdownIndex(-1);
    }
  }, [isOpen]);

  // ------------------------------------------------------------
  // Prevent background scrolling while modal is open
  // ------------------------------------------------------------

  useEffect(() => {
    if (!isOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  // ------------------------------------------------------------
  // Close search dropdown when clicking outside
  // ------------------------------------------------------------

  useEffect(() => {
    if (!showDropdown) return;

    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showDropdown]);

  // ------------------------------------------------------------
  // Select user
  // ------------------------------------------------------------

  const handleSelectUser = useCallback(
    (user: User) => {
      onSelectUser(user);

      onSearchChange(
        `${user.first_name || ""} ${user.last_name || ""} (${user.email})`.trim(),
      );

      setShowDropdown(false);
      setDropdownIndex(-1);
    },
    [onSelectUser, onSearchChange],
  );

  // ------------------------------------------------------------
  // Search keyboard navigation
  // ------------------------------------------------------------

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        setShowDropdown(false);
        setDropdownIndex(-1);
        return;
      }

      if (!showDropdown || searchResults.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();

        setDropdownIndex((prev) =>
          prev >= searchResults.length - 1 ? 0 : prev + 1,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();

        setDropdownIndex((prev) =>
          prev <= 0 ? searchResults.length - 1 : prev - 1,
        );
      } else if (e.key === "Enter" && dropdownIndex >= 0) {
        e.preventDefault();

        const user = searchResults[dropdownIndex];

        if (user) handleSelectUser(user);
      }
    },
    [showDropdown, searchResults, dropdownIndex, handleSelectUser],
  );

  // ------------------------------------------------------------
  // Search input changes
  // ------------------------------------------------------------

  const handleSearchChange = (value: string) => {
    onSearchChange(value);
    onSelectUser(null);
    setShowDropdown(true);
    setDropdownIndex(-1);
  };

  // ------------------------------------------------------------
  // Clear search
  // ------------------------------------------------------------

  const handleClearSearch = () => {
    onSearchChange("");
    onSelectUser(null);
    setShowDropdown(false);
    setDropdownIndex(-1);
    searchInputRef.current?.focus();
  };

  // ------------------------------------------------------------
  // Modal backdrop
  // ------------------------------------------------------------

  const handleBackdropClick = (
    event: MouseEvent<HTMLDivElement>,
  ) => {
    if (event.target === event.currentTarget && !adding) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const selectedRoleLabel =
    roleOptions.find((role) => role.value === selectedRole)?.label ||
    selectedRole;

  return (
    <div
      className="
        fixed inset-0 z-[100]
        flex items-center justify-center
        bg-black/50 backdrop-blur-sm
        p-3 sm:p-5
        animate-in fade-in duration-200
      "
      onMouseDown={handleBackdropClick}
      role="presentation"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-user-modal-title"
        className="
          relative flex flex-col
          w-full max-w-xl
          max-h-[92dvh]
          bg-white
          rounded-2xl sm:rounded-3xl
          shadow-2xl
          overflow-hidden
          animate-in zoom-in-95 slide-in-from-bottom-2 duration-200
        "
      >
        {/* ================================================== */}
        {/* HEADER */}
        {/* ================================================== */}

        <div
          className="
            relative flex items-center justify-between
            px-4 py-4 sm:px-6 sm:py-5
            border-b border-gray-100
            bg-gradient-to-r from-secondary/10 via-white to-indigo-50/60
            flex-shrink-0
          "
        >
          <div className="flex items-center gap-3 min-w-0">
            <div
              className="
                w-11 h-11 sm:w-12 sm:h-12
                rounded-xl
                bg-secondary/10
                flex items-center justify-center
                flex-shrink-0
              "
            >
              <Users className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
            </div>

            <div className="min-w-0">
              <h2
                id="add-user-modal-title"
                className="text-base sm:text-xl font-bold text-secondary"
              >
                {t("addUserModal.title")}
              </h2>

              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {t("addUserModal.subtitle")}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            disabled={adding}
            aria-label={t("addUserModal.closeAria")}
            className="
              p-2 rounded-xl
              text-gray-400
              hover:text-gray-700
              hover:bg-gray-100
              transition-all
              disabled:opacity-40
              flex-shrink-0
            "
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* ================================================== */}
        {/* CONTENT */}
        {/* ================================================== */}

        <div
          className="
            flex-1 min-h-0
            overflow-y-auto overscroll-contain
            px-4 py-5 sm:px-6 sm:py-6
            space-y-6
          "
        >
          {/* ---------------------------------------------- */}
          {/* USER SEARCH */}
          {/* ---------------------------------------------- */}

          <section>
            <div className="flex items-center justify-between mb-2">
              <label
                htmlFor="add-user-search"
                className="text-sm font-semibold text-gray-700"
              >
                {t("addUserModal.searchLabel")}
                <span className="text-red-500 ml-1">*</span>
              </label>

              {selectedUser && (
                <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {t("addUserModal.selected")}
                </span>
              )}
            </div>

            <div className="relative" ref={containerRef}>
              {/* Search input */}

              <div className="relative">
                <Search
                  className="
                    absolute left-3.5 top-1/2
                    -translate-y-1/2
                    w-4 h-4
                    text-gray-400
                    pointer-events-none
                  "
                />

                <input
                  ref={searchInputRef}
                  id="add-user-search"
                  type="text"
                  autoComplete="off"
                  placeholder={t("addUserModal.searchPlaceholder")}
                  value={searchTerm}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  onFocus={() => setShowDropdown(true)}
                  onKeyDown={handleKeyDown}
                  aria-autocomplete="list"
                  aria-expanded={showDropdown}
                  aria-controls="add-user-search-results"
                  aria-label={t("addUserModal.searchLabel")}
                  className="
                    w-full h-11 sm:h-12
                    pl-10 pr-20
                    text-sm sm:text-base
                    text-gray-800
                    placeholder:text-gray-400
                    bg-gray-50
                    border border-gray-200
                    rounded-xl
                    outline-none
                    transition-all duration-200
                    hover:border-gray-300
                    focus:bg-white
                    focus:border-secondary
                    focus:ring-4 focus:ring-secondary/10
                  "
                />

                {searchTerm && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label={t("addUserModal.clearSearchAria")}
                    className="
                      absolute right-9 top-1/2
                      -translate-y-1/2
                      p-1.5
                      rounded-full
                      text-gray-400
                      hover:text-gray-700
                      hover:bg-gray-200
                      transition-colors
                    "
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}

                <ChevronDown
                  className={`
                    absolute right-3 top-1/2
                    -translate-y-1/2
                    w-4 h-4
                    text-gray-400
                    pointer-events-none
                    transition-transform duration-200
                    ${showDropdown ? "rotate-180" : ""}
                  `}
                />
              </div>

              {/* ------------------------------------------ */}
              {/* SEARCH RESULTS */}
              {/* ------------------------------------------ */}

              {showDropdown && (
                <div
                  id="add-user-search-results"
                  role="listbox"
                  aria-label={t("addUserModal.searchLabel")}
                  className="
                    absolute left-0 right-0 top-full
                    z-30 mt-2
                    bg-white
                    border border-gray-200
                    rounded-xl
                    shadow-xl
                    overflow-hidden
                    max-h-64 sm:max-h-72
                    overflow-y-auto
                  "
                >
                  {searching ? (
                    <div className="flex flex-col items-center justify-center py-7 px-4">
                      <Loader2 className="w-6 h-6 text-secondary animate-spin" />

                      <p className="text-sm text-gray-500 mt-2">
                        {t("addUserModal.searching")}
                      </p>
                    </div>
                  ) : searchResults.length > 0 ? (
                    <div className="py-1">
                      {searchResults.map((user, idx) => {
                        const isSelected = selectedUser?.id === user.id;

                        return (
                          <button
                            key={user.id}
                            type="button"
                            role="option"
                            aria-selected={isSelected}
                            onClick={() => handleSelectUser(user)}
                            className={`
                              w-full
                              flex items-center gap-3
                              px-3 sm:px-4 py-3
                              text-left
                              border-b border-gray-50 last:border-0
                              transition-colors duration-150
                              ${
                                idx === dropdownIndex
                                  ? "bg-secondary/10"
                                  : "hover:bg-gray-50"
                              }
                              ${
                                isSelected
                                  ? "bg-indigo-50/70"
                                  : ""
                              }
                            `}
                          >
                            <UserAvatar user={user} size="sm" />

                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-semibold text-gray-800 truncate">
                                {user.username ||
                                  `${user.first_name || ""} ${user.last_name || ""}`.trim() ||
                                  user.email}
                              </p>

                              <p className="text-xs text-gray-500 truncate mt-0.5">
                                {user.email}
                              </p>

                              {user.phone_number && (
                                <p className="text-xs text-gray-400 truncate mt-0.5">
                                  {user.phone_number}
                                </p>
                              )}
                            </div>

                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0" />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : searchTerm.trim() ? (
                    <div className="flex flex-col items-center text-center px-4 py-7">
                      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                        <UserIcon className="w-6 h-6 text-gray-400" />
                      </div>

                      <p className="text-sm font-medium text-gray-700">
                        {t("addUserModal.noUsersFound")}
                      </p>

                      <p className="text-xs text-gray-400 mt-1">
                        {t("addUserModal.noUsersHint")}
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center text-center px-4 py-6">
                      <Search className="w-6 h-6 text-gray-300 mb-2" />

                      <p className="text-xs text-gray-400">
                        {t("addUserModal.searchPlaceholder")}
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          {/* ---------------------------------------------- */}
          {/* SELECTED USER PREVIEW */}
          {/* ---------------------------------------------- */}

          {selectedUser && (
            <section
              className="
                relative
                rounded-2xl
                border border-indigo-100
                bg-gradient-to-br from-indigo-50/80 via-white to-violet-50/50
                p-3 sm:p-4
                animate-in fade-in slide-in-from-top-2 duration-200
              "
            >
              <div className="flex items-start gap-3">
                <UserAvatar user={selectedUser} size="lg" />

                <div className="flex-1 min-w-0 pt-0.5">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                      {`${selectedUser.first_name || ""} ${selectedUser.last_name || ""}`.trim() ||
                        selectedUser.username ||
                        "—"}
                    </p>

                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-100 text-green-700 font-medium">
                      {t("addUserModal.selected")}
                    </span>
                  </div>

                  <p className="text-xs sm:text-sm text-gray-500 mt-1 break-all">
                    {selectedUser.email}
                  </p>

                  {selectedUser.phone_number && (
                    <p className="text-xs text-gray-400 mt-1">
                      {selectedUser.phone_number}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    onSelectUser(null);
                    onSearchChange("");
                    setShowDropdown(false);
                    searchInputRef.current?.focus();
                  }}
                  aria-label={t("addUserModal.removeSelectionAria")}
                  className="
                    p-1.5 rounded-lg
                    text-gray-400
                    hover:text-red-500
                    hover:bg-red-50
                    transition-colors
                    flex-shrink-0
                  "
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </section>
          )}

          {/* ---------------------------------------------- */}
          {/* ROLE SELECTION */}
          {/* ---------------------------------------------- */}

          <section>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-semibold text-gray-700">
                {t("addUserModal.roleLabel")}
                <span className="text-red-500 ml-1">*</span>
              </label>

              <span className="text-[10px] sm:text-xs text-gray-400">
                {selectedRoleLabel}
              </span>
            </div>

            <CustomSelect
              value={selectedRole}
              onChange={(value) => onRoleChange(value as UserRole)}
              options={roleOptions}
              placeholder={t("addUserModal.roleLabel")}
              ariaLabel={t("addUserModal.roleLabel")}
              maxHeight={220}
              className="w-full"
            />

            <p className="text-xs text-gray-400 leading-relaxed mt-2">
              {t("addUserModal.roleHint")}
            </p>
          </section>
        </div>

        {/* ================================================== */}
        {/* FOOTER */}
        {/* ================================================== */}

        <div
          className="
            flex flex-row gap-3
            px-4 py-4 sm:px-6 sm:py-5
            border-t border-gray-100
            bg-gray-50/70
            flex-shrink-0
          "
        >
          <button
            type="button"
            onClick={onClose}
            disabled={adding}
            className="
              flex-1
              min-h-10 sm:min-h-11
              px-3 sm:px-5
              rounded-xl
              border border-gray-200
              bg-white
              text-gray-600
              text-sm font-semibold
              hover:bg-gray-100
              hover:border-gray-300
              transition-all
              disabled:opacity-50
              disabled:cursor-not-allowed
            "
          >
            {t("addUserModal.cancel")}
          </button>

          <button
            type="button"
            onClick={onAdd}
            disabled={!selectedUser || adding}
            className="
              flex-1
              min-h-10 sm:min-h-11
              px-3 sm:px-5
              rounded-xl
              bg-secondary
              text-white
              text-sm font-semibold
              shadow-sm
              hover:opacity-90
              hover:shadow-md
              active:scale-[0.98]
              transition-all
              disabled:opacity-40
              disabled:cursor-not-allowed
              disabled:shadow-none
              flex items-center justify-center gap-2
            "
          >
            {adding ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />

                <span>{t("addUserModal.adding")}</span>
              </>
            ) : (
              <>
                {selectedRole === "staff"
                  ? t("addUserModal.addDispatcher")
                  : t("addUserModal.addUser")}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddUserModal;
