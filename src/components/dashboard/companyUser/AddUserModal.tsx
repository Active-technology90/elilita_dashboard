
import { X, Loader2, ChevronDown, User as UserIcon } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import type { User } from "../../../types";

// --------------------------------------------------------------
// Avatar component (unchanged)
// --------------------------------------------------------------
const UserAvatar = ({
  user,
  size = "md",
}: {
  user: User;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-9 h-9 text-sm",
    lg: "w-12 h-12 text-xl",
  };

  const initial = user.first_name?.[0] || user.email[0]?.toUpperCase() || "?";

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0`}
    >
      {user.profile_image ? (
        <img
          src={user.profile_image}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-gray-600 font-medium">{initial}</span>
      )}
    </div>
  );
};

// --------------------------------------------------------------
// Main modal component – backend "staff" is presented as Dispatcher
// --------------------------------------------------------------
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  searching: boolean;
  searchResults: User[];
  searchTerm: string;
  onSearchChange: (val: string) => void;
  selectedUser: User | null;
  onSelectUser: (user: User | null) => void;
  selectedRole: "admin" | "staff" | "viewer" | "delivery";
  onRoleChange: (role: "admin" | "staff" | "viewer" | "delivery") => void;
  adding: boolean;
  onAdd: () => void;
}

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
  const { t } = useTranslation();

  const [showDropdown, setShowDropdown] = useState(false);
  const [dropdownIndex, setDropdownIndex] = useState(-1);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setDropdownIndex(-1);
  }, [searchResults]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (!showDropdown || searchResults.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setDropdownIndex((prev) => (prev + 1) % searchResults.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setDropdownIndex(
          (prev) => (prev - 1 + searchResults.length) % searchResults.length,
        );
      } else if (e.key === "Enter" && dropdownIndex >= 0) {
        e.preventDefault();
        const user = searchResults[dropdownIndex];
        if (user) handleSelectUser(user);
      } else if (e.key === "Escape") {
        setShowDropdown(false);
      }
    },
    [showDropdown, searchResults, dropdownIndex],
  );

  const handleSelectUser = (user: User) => {
    onSelectUser(user);
    onSearchChange(
      `${user.first_name || ""} ${user.last_name || ""} (${user.email})`.trim(),
    );
    setShowDropdown(false);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-[95%] sm:max-w-3xl rounded-2xl shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-center p-4 sm:p-6 border-b border-gray-100 bg-gradient-to-r from-secondary/5 to-white">
          <div>
            <h2 className="text-lg sm:text-xl font-semibold text-secondary">
              {t("addUserModal.title")}
            </h2>
            <p className="text-xs sm:text-sm text-secondary/60 mt-0.5">
              {t("addUserModal.subtitle")}
            </p>
          </div>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
            aria-label={t("addUserModal.closeAria")}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5">
          {/* Search input with live suggestions */}
          <div className="relative" ref={containerRef}>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              {t("addUserModal.searchLabel")}{" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <input
                type="text"
                placeholder={t("addUserModal.searchPlaceholder")}
                value={searchTerm}
                onChange={(e) => {
                  onSearchChange(e.target.value);
                  setShowDropdown(true);
                  onSelectUser(null);
                  setDropdownIndex(-1);
                }}
                onFocus={() => setShowDropdown(true)}
                onKeyDown={handleKeyDown}
                className="w-full border border-gray-200 rounded-xl px-3 sm:px-4 py-2 sm:py-2.5 pr-16 sm:pr-20 text-sm sm:text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none"
                aria-autocomplete="list"
                aria-expanded={showDropdown}
              />

              {/* Clear button */}
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => {
                    onSearchChange("");
                    onSelectUser(null);
                    setShowDropdown(false);
                  }}
                  className="absolute right-8 sm:right-10 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label={t("addUserModal.clearSearchAria")}
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              )}

              <ChevronDown
                className={`absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400 transition-transform ${
                  showDropdown ? "rotate-180" : ""
                }`}
              />
            </div>

            {/* Dropdown suggestions */}
            {showDropdown && (
              <div
                ref={dropdownRef}
                className="absolute z-20 mt-1.5 w-full bg-white border border-gray-100 rounded-xl shadow-lg max-h-48 sm:max-h-64 overflow-y-auto"
              >
                {searching ? (
                  <div className="p-3 sm:p-4 text-center text-secondary/60">
                    <Loader2 className="h-4 w-4 sm:h-5 sm:w-5 animate-spin mx-auto" />
                    <p className="mt-1 text-sm">
                      {t("addUserModal.searching")}
                    </p>
                  </div>
                ) : searchResults.length === 0 && searchTerm.trim() !== "" ? (
                  <div className="p-4 sm:p-6 text-center">
                    <UserIcon className="h-8 w-8 sm:h-10 sm:w-10 mx-auto text-gray-300 mb-2" />
                    <p className="text-xs sm:text-sm text-secondary/60">
                      {t("addUserModal.noUsersFound")}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-400 mt-1">
                      {t("addUserModal.noUsersHint")}
                    </p>
                  </div>
                ) : (
                  searchResults.map((user, idx) => (
                    <button
                      key={user.id}
                      onClick={() => handleSelectUser(user)}
                      className={`w-full text-left px-3 sm:px-4 py-2 sm:py-3 flex items-center gap-2 sm:gap-3 transition-colors border-b border-gray-50 last:border-0 ${
                        idx === dropdownIndex
                          ? "bg-indigo-50"
                          : "hover:bg-gray-50"
                      }`}
                    >
                      <UserAvatar user={user} size="sm" />

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-secondary truncate">
                          {user.username}
                        </p>
                        <p className="text-xs text-secondary/60 truncate">
                          {user.email}
                        </p>

                        {user.phone_number && (
                          <p className="text-xs text-gray-400 truncate">
                            {user.phone_number}
                          </p>
                        )}
                      </div>

                      {selectedUser?.id === user.id && (
                        <span className="text-secondary text-xs font-medium">
                          {t("addUserModal.selected")}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Selected user preview */}
          {selectedUser && (
            <div className="bg-gradient-to-r from-indigo-50/50 to-white rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-indigo-100 shadow-sm">
              <UserAvatar user={selectedUser} size="lg" />

              <div className="flex-1 min-w-0">
                <p className="font-medium text-secondary truncate">
                  {selectedUser.first_name || "—"}{" "}
                  {selectedUser.last_name || ""}
                </p>

                <p className="text-xs sm:text-sm text-secondary/60 truncate">
                  {selectedUser.email}
                </p>

                {selectedUser.phone_number && (
                  <p className="text-xs text-gray-400 truncate">
                    {selectedUser.phone_number}
                  </p>
                )}
              </div>

              <button
                onClick={() => {
                  onSelectUser(null);
                  onSearchChange("");
                }}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 flex-shrink-0"
                aria-label={t("addUserModal.removeSelectionAria")}
              >
                <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>
          )}

          {/* Role selection – "staff" is displayed as Dispatcher */}
          <div>
            <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
              {t("addUserModal.roleLabel")}{" "}
              <span className="text-red-500">*</span>
            </label>

            <div className="relative">
              <select
                value={selectedRole}
                onChange={(e) => onRoleChange(e.target.value as any)}
                className="w-full border border-gray-200 rounded-full px-4 py-1.5 text-sm sm:text-base focus:ring-2 focus:ring-secondary/20 focus:border-secondary transition-all outline-none bg-white appearance-none cursor-pointer pr-10"
              >
                <option value="admin">
                  {t("addUserModal.roleOptions.admin")}
                </option>

                <option value="staff">
                  {t("addUserModal.roleOptions.staff")}
                </option>

                <option value="delivery">
                  {t("addUserModal.roleOptions.delivery")}
                </option>

                <option value="viewer">
                  {t("addUserModal.roleOptions.viewer")}
                </option>
              </select>

              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400 pointer-events-none" />
            </div>

            <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5">
              {t("addUserModal.roleHint")}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex flex-row gap-3 sm:gap-4 p-4 sm:p-6 border-t border-gray-100 bg-gray-50/30">
          <button
            onClick={onClose}
            className="flex-1 px-4 sm:px-6 py-1.5 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-secondary hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium text-center justify-center"
          >
            {t("addUserModal.cancel")}
          </button>

          <button
            onClick={onAdd}
            disabled={!selectedUser || adding}
            className="flex-1 px-4 sm:px-6 py-1.5 sm:py-2.5 bg-secondary text-white rounded-lg sm:rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm sm:text-base font-medium flex items-center justify-center gap-2"
          >
            {adding && (
              <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
            )}

            {adding
              ? t("addUserModal.adding")
              : selectedRole === "staff"
                ? t("addUserModal.addDispatcher")
                : t("addUserModal.addUser")}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AddUserModal;
