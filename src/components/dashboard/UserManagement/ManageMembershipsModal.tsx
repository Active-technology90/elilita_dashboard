import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Plus,
  Trash2,
  Building2,
  AlertCircle,
  Sparkles,
  UserPlus,
  RefreshCw,
} from "lucide-react";

import type { User, UserRole } from "../../../types";
import { useAddCompanyUser } from "../../../hooks/useAddCompanyUser";
import ConfirmDeleteModal from "./ConfirmDeleteModal";
import { CustomSelect, type SelectOption } from "../../ui/CustomSelect";

interface ManageMembershipsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  availableCompanies: Array<{ id: number; name: string; slug: string }>;
  onUpdateRole: (
    userId: number,
    companySlug: string,
    role: UserRole,
  ) => Promise<void>;
  onRemoveMembership: (userId: number, companyId: number) => Promise<void>;
  onRefresh?: () => void;
}

const roleOptions: UserRole[] = ["admin", "staff", "viewer", "delivery","owner"];

const roleSelectOptions: SelectOption[] = roleOptions.map((role) => ({
  label: role.charAt(0).toUpperCase() + role.slice(1),
  value: role,
}));

const ManageMembershipsModal: React.FC<ManageMembershipsModalProps> = ({
  isOpen,
  onClose,
  user,
  availableCompanies,
  onUpdateRole,
  onRemoveMembership,
  onRefresh,
}) => {
  const { addUser } = useAddCompanyUser();

  const [selectedCompanyId, setSelectedCompanyId] = useState<number | "">("");
  const [selectedRole, setSelectedRole] = useState<UserRole>("staff");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [updatingRoleCompanyId, setUpdatingRoleCompanyId] = useState<number | null>(null);
  const [removingCompanyId, setRemovingCompanyId] = useState<number | null>(null);

  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [companyToRemove, setCompanyToRemove] = useState<{ id: number; name: string } | null>(null);
const [editingRole, setEditingRole] = useState<string | null>(null);

  // ✅ SAFE MEMO (must be after hooks)
  const availableFilteredCompanies = useMemo(() => {
    if (!user) return [];
    return availableCompanies.filter(
      (c) => !user.memberships.some((m) => m.company_id === c.id),
    );
  }, [availableCompanies, user]);

  // ❗ MOVE THIS HERE (AFTER HOOKS)


  if (!isOpen || !user) return null;

  const userEmail = user.email;

  // --- Add membership ---
  const handleAdd = async () => {
    if (!selectedCompanyId) return;

    const selectedCompany = availableCompanies.find(
      (c) => c.id === Number(selectedCompanyId),
    );

    if (!selectedCompany) {
      setError("Selected company not found");
      return;
    }

    setLoading(true);
    setError("");

    try {
      await addUser(
        selectedCompany.slug,
        userEmail,
        selectedRole,
      );

      setSelectedCompanyId("");
      setSelectedRole("staff");

      onRefresh?.();
    } catch (err: any) {
      setError(err.message || "Failed to add membership");
    } finally {
      setLoading(false);
    }
  };

  // --- Remove membership (called after confirmation) ---
  const confirmRemove = async () => {
    if (!companyToRemove) return;

    setRemovingCompanyId(companyToRemove.id);
    setError("");

    try {
      await onRemoveMembership(
        user.id,
        companyToRemove.id,
      );

      onRefresh?.();

      setConfirmModalOpen(false);
      setCompanyToRemove(null);
    } catch (err: any) {
      setError(err.message || "Failed to remove membership");
    } finally {
      setRemovingCompanyId(null);
    }
  };

  const handleRemoveClick = (
    companyId: number,
    companyName: string,
  ) => {
    setCompanyToRemove({
      id: companyId,
      name: companyName,
    });

    setConfirmModalOpen(true);
  };

  // --- Update role ---
  const handleRoleChange = async (
    companySlug: string,
    companyId: number,
    newRole: UserRole,
  ) => {
    setUpdatingRoleCompanyId(companyId);
    setError("");

    try {
      await onUpdateRole(
        user.id,
        companySlug,
        newRole,
      );

      onRefresh?.();
    } catch (err: any) {
      setError(err.message || "Failed to update role");
    } finally {
      setUpdatingRoleCompanyId(null);
    }
  };

  // const availableFilteredCompanies = useMemo(
  //   () =>
  //     availableCompanies.filter(
  //       (c) =>
  //         !user.memberships.some(
  //           (m) => m.company_id === c.id,
  //         ),
  //     ),
  //   [availableCompanies, user.memberships],
  // );

  // Transform companies into CustomSelect options
  const companySelectOptions: SelectOption[] =
    availableFilteredCompanies.map((c) => ({
      label: c.name,
      value: String(c.id),
      icon: (
        <Building2 className="h-4 w-4 text-violet-500" />
      ),
    }));

  // Responsive modal classes
  const modalContainerClasses = `
    relative flex flex-col overflow-hidden
    w-full bg-white shadow-2xl
    border border-white/40

    /* Mobile Bottom Sheet */
    h-[95dvh]
    max-h-[95dvh]
    rounded-xl

    /* Mobile Safe Width */
    max-w-full

    /* Desktop */
    sm:h-auto
    sm:max-h-[92dvh]
    sm:rounded-[32px]
    sm:max-w-2xl

    lg:max-w-4xl
    xl:max-w-5xl
    2xl:max-w-6xl
  `;
  

  return (
    <>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            className="
              fixed inset-0 z-50
              bg-black/55 backdrop-blur-md
              flex items-center sm:items-center sm:justify-center
              px-2 sm:px-4
              overflow-hidden
            "
            onClick={onClose}
          >
            <motion.div
              initial={{
                opacity: 0,
                y: 40,
                scale: 0.98,
              }}
              animate={{
                opacity: 1,
                y: 0,
                scale: 1,
              }}
              exit={{
                opacity: 0,
                y: 30,
                scale: 0.98,
              }}
              transition={{
                type: "spring",
                damping: 24,
                stiffness: 260,
              }}
              className={modalContainerClasses}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Mobile Grabber */}
              <div className="flex justify-center pt-3 pb-1 sm:hidden">
                <div className="h-1.5 w-14 rounded-full bg-gray-300" />
              </div>

              {/* Header */}
              <div
                className="
                  sticky top-0 z-30
                  border-b border-gray-200/70
                  bg-white/90 backdrop-blur-xl
                "
              >
                <div
                  className="
                    px-4 sm:px-6 lg:px-7
                    py-4 sm:py-5
                  "
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0 flex items-start gap-3">
                      <div
                        className="
                          hidden sm:flex
                          h-12 w-12 shrink-0
                          items-center justify-center
                          rounded-2xl
                          bg-gradient-to-br
                          from-violet-100 to-indigo-100
                          shadow-inner
                        "
                      >
                        <Building2 className="h-6 w-6 text-secondary" />
                      </div>

                      <div className="min-w-0">
                        <h2
                          className="
                            text-lg sm:text-xl lg:text-2xl
                            font-bold tracking-tight
                            text-gray-900
                            truncate
                          "
                        >
                          Manage Memberships
                        </h2>

                        <p
                          className="
                            mt-1
                            text-xs  sm:text-sm  text-gray-500
                            truncate
                          "
                        >
                          {user.first_name ||
                            user.username}{" "}
                          • @{user.username}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={onClose}
                      aria-label="Close modal"
                      className="
                        flex shrink-0 items-center justify-center
                        h-10 w-10
                        rounded-xl
                        border border-gray-200
                        bg-white
                        text-gray-500
                        transition-all duration-200
                        hover:bg-gray-100
                        hover:text-gray-700
                        active:scale-95
                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-violet-500
                      "
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Scrollable Content */}
              <div
                className="
                  flex-1 overflow-y-auto
                  overscroll-contain
                  scroll-smooth
                "
              >
                <div
                  className="
                    px-4 sm:px-6 lg:px-7
                    py-4 sm:py-6
                    space-y-6
                  "
                >
                  {/* Add Membership Section */}
                  <section
                    className="
                      rounded-3xl
                      border border-gray-200/70
                      bg-gradient-to-br
                      from-violet-50/70 to-white
                      p-4 sm:p-5 lg:p-6
                      shadow-sm
                    "
                  >
                    <div className="flex items-center gap-2 mb-4">
                      <div
                        className="
                          flex h-9 w-9 items-center justify-center
                          rounded-xl
                          bg-violet-100
                        "
                      >
                        <UserPlus className="h-4 w-4 text-secondary" />
                      </div>

                      <div>
                        <h3
                          className="
                            text-xs  sm:text-sm  sm:text-base
                            font-semibold
                            text-gray-900
                          "
                        >
                          Add New Membership
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-500">
                          Assign this user to another company
                        </p>
                      </div>
                    </div>

                    {/* Better Mobile Layout */}
                    <div
                      className="
                        grid grid-cols-1
                        gap-3

                        sm:grid-cols-[1fr_140px]
                        lg:grid-cols-[1fr_160px_auto]
                      "
                    >
                      {/* Company */}
                      <div className="min-w-0">
                        <CustomSelect
                          value={selectedCompanyId.toString()}
                          onChange={(val) =>
                            setSelectedCompanyId(
                              val === ""
                                ? ""
                                : Number(val),
                            )
                          }
                          options={companySelectOptions}
                          placeholder="Select a company"
                          className="w-full"
                          maxHeight={240}
                        />
                      </div>

                      {/* Role */}
                      <div className="min-w-0">
                        <CustomSelect
                          value={selectedRole}
                          onChange={(val) =>
                            setSelectedRole(
                              val as UserRole,
                            )
                          }
                          options={roleSelectOptions}
                          className="w-full"
                          maxHeight={180}
                        />
                      </div>

                      {/* Button */}
                      <button
                        onClick={handleAdd}
                        disabled={
                          !selectedCompanyId || loading
                        }
                        className="
                          h-8 sm:h-8 md:h-11
                          px-3
                          rounded-2xl
                          bg-secondary
                          text-white
                          font-medium
                          shadow-lg shadow-violet-500/20
                          transition-all duration-200

                          hover:-translate-y-0.5
                          hover:shadow-xl

                          active:scale-[0.98]

                          disabled:opacity-50
                          disabled:cursor-not-allowed
                          disabled:hover:translate-y-0

                          flex items-center justify-center gap-2
                          whitespace-nowrap
                        "
                      >
                        {loading ? (
                          <RefreshCw className="h-4 w-4 animate-spin" />
                        ) : (
                          <Plus className="h-3 w-3 md:h-4 md:w-4" />
                        )}

                        <span className=" text-xs  sm:text-sm ">
                          Add Membership
                        </span>
                      </button>
                    </div>

                    {availableFilteredCompanies.length ===
                      0 &&
                      selectedCompanyId === "" && (
                        <div
                          className="
                            mt-4
                            rounded-2xl
                            border border-dashed border-gray-200
                            bg-white/80
                            px-4 py-3
                            text-center
                          "
                        >
                          <p className="text-xs sm:text-sm text-gray-500">
                            All companies are already assigned
                          </p>
                        </div>
                      )}
                  </section>

                  {/* Membership Section */}
                  <section>
                    <div className="flex items-center gap-2 mb-4">
                      <Sparkles className="h-4 w-4 secondary" />

                      <h3
                        className="
                          text-xs   sm:text-base
                          font-semibold
                          text-gray-900
                        "
                      >
                        Current Companies
                      </h3>
                    </div>

                    {user.memberships.length === 0 ? (
                      <div
                        className="
                          rounded-3xl
                          border border-dashed border-gray-200
                          bg-gradient-to-br from-gray-50 to-white
                          px-6 py-12
                          text-center
                        "
                      >
                        <div
                          className="
                            mx-auto mb-4
                            flex h-16 w-16
                            items-center justify-center
                            rounded-3xl
                            bg-gray-100
                          "
                        >
                          <Building2 className="h-8 w-8 text-secondary" />
                        </div>

                        <h4 className="text-base font-semibold text-gray-900">
                          No memberships yet
                        </h4>

                        <p className="mt-1 text-xs  sm:text-sm  text-gray-500">
                          This user has not been assigned to any
                          company.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {user.memberships.map((m) => {
                          const isUpdating =
                            updatingRoleCompanyId ===
                            m.company_id;

                          return (
                            <motion.div
                              key={m.company_id}
                              layout
                              className="
                                group
                                rounded-3xl
                                border border-gray-200/80
                                bg-white
                                p-4 sm:p-5
                                shadow-sm
                                transition-all duration-200

                                hover:border-violet-200
                                hover:shadow-lg
                              "
                            >
                              {/* Better Mobile Card Structure */}
                              <div className="flex flex-col gap-4">
                                {/* Top */}
                                <div className="flex items-start gap-3">
                                  <div
                                    className="
                                      flex h-12 w-12 shrink-0
                                      items-center justify-center
                                      rounded-2xl
                                      bg-gradient-to-br
                                      from-violet-100
                                      to-indigo-100
                                    "
                                  >
                                    <Building2 className="h-5 w-5 text-secondary" />
                                  </div>

                                  <div className="min-w-0 flex-1">
                                    <h4
                                      className="
                                        truncate
                                        text-xs  sm:text-sm  sm:text-base
                                        font-semibold
                                        text-gray-900
                                      "
                                    >
                                      {m.company_name}
                                    </h4>

                                    <div className="mt-1 flex items-center gap-2">
                                      <span
                                        className="
                                          text-xs text-gray-500
                                        "
                                      >
                                        Membership Access
                                      </span>

                                      {isUpdating && (
                                        <div
                                          className="
                                            inline-flex items-center gap-1
                                            rounded-full
                                            bg-violet-50
                                            px-2 py-1
                                            text-[11px]
                                            font-medium
                                            text-secondary
                                          "
                                        >
                                          <RefreshCw className="h-3 w-3 animate-spin" />
                                          Updating
                                        </div>
                                      )}
                                    </div>
                                  </div>

                                  {/* Desktop Remove */}
                                  <button
                                    onClick={() =>
                                      handleRemoveClick(
                                        m.company_id,
                                        m.company_name,
                                      )
                                    }
                                    disabled={
                                      removingCompanyId ===
                                      m.company_id
                                    }
                                    aria-label={`Remove ${m.company_name}`}
                                    className="
                                      hidden sm:flex
                                      h-10 w-10 shrink-0
                                      items-center justify-center
                                      rounded-xl
                                      border border-red-100
                                      text-red-500
                                      transition-all

                                      hover:bg-red-50
                                      hover:border-red-200

                                      active:scale-95

                                      disabled:opacity-50
                                    "
                                  >
                                    {removingCompanyId ===
                                    m.company_id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}
                                  </button>
                                </div>

                                {/* Bottom Controls */}
                                <div
                                  className="
                                    flex flex-col gap-3
                                    sm:flex-row sm:items-center sm:justify-between
                                  "
                                >
                                 
<div className="w-full sm:w-44">
  {editingRole === `${m.company_slug}-${m.company_id}` ? (
    <div className="flex items-center gap-2">
      <CustomSelect
        value={m.role}
        onChange={(val) => {
          handleRoleChange(
            m.company_slug,
            m.company_id,
            val as UserRole,
          );

          setEditingRole(null);
        }}
        options={roleSelectOptions}
        className="w-full"
        maxHeight={180}
      />

      {/* Cancel */}
      <button
        onClick={() => setEditingRole(null)}
        className="
          shrink-0
          rounded-xl
          border border-gray-200
          bg-white
          px-3 py-2
          text-xs font-medium
          text-gray-600
          transition-all duration-200
          hover:bg-gray-50
        "
      >
        Cancel
      </button>
    </div>
  ) : (
    <div
      className="
        flex items-center justify-between gap-2
        rounded-xl
        border border-gray-200
        bg-gray-50/70
        px-3 py-2
      "
    >
      {/* Current Role */}
      <span
        className="
          truncate
          text-sm
          font-medium
          text-gray-800
        "
      >
        {m.role}
      </span>

      {/* Edit Button */}
      <button
        onClick={() =>
          setEditingRole(
            `${m.company_slug}-${m.company_id}`,
          )
        }
        className="
          shrink-0
          rounded-lg
          border border-gray-200
          bg-white
          px-2.5 py-1.5
          text-xs
          font-medium
          text-gray-600
          transition-all duration-200
          hover:border-gray-300
          hover:bg-gray-50
        "
      >
        Edit
      </button>
    </div>
  )}
</div>
                                  {/* Mobile Remove */}
                                  <button
                                    onClick={() =>
                                      handleRemoveClick(
                                        m.company_id,
                                        m.company_name,
                                      )
                                    }
                                    disabled={
                                      removingCompanyId ===
                                      m.company_id
                                    }
                                    className="
                                      sm:hidden

                                      h-8 md:
                                      rounded-2xl
                                      border border-red-100
                                      bg-red-50/70
                                      px-4

                                      text-xs  sm:text-sm 
                                      font-medium
                                      text-red-600

                                      transition-all

                                      active:scale-[0.98]

                                      flex items-center justify-center gap-2

                                      disabled:opacity-50
                                    "
                                  >
                                    {removingCompanyId ===
                                    m.company_id ? (
                                      <RefreshCw className="h-4 w-4 animate-spin" />
                                    ) : (
                                      <Trash2 className="h-4 w-4" />
                                    )}

                                    Remove Membership
                                  </button>
                                </div>
                              </div>
                            </motion.div>
                          );
                        })}
                      </div>
                    )}
                  </section>
                </div>
              </div>

              {/* Sticky Footer */}
              <div
                className="
                  sticky bottom-0 z-30
                  border-t border-gray-200/70
                  bg-white/95 backdrop-blur-xl
                "
                style={{
                  paddingBottom:
                    "max(env(safe-area-inset-bottom), 16px)",
                }}
              >
                <div
                  className="
                    px-4 sm:px-6 lg:px-7
                    py-4
                    space-y-4
                  "
                >
                  {/* Error Message */}
                  {error && (
                    <motion.div
                      initial={{
                        opacity: 0,
                        y: 10,
                      }}
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="
                        flex items-start gap-3
                        rounded-2xl
                        border border-red-100
                        bg-red-50
                        p-4
                      "
                    >
                      <AlertCircle className="h-5 w-5 shrink-0 text-red-500" />

                      <div className="min-w-0">
                        <p className="text-sm font-medium text-red-700">
                          Something went wrong
                        </p>

                        <p className="mt-0.5 text-xs  sm:text-sm  text-red-600 break-words">
                          {error}
                        </p>
                      </div>
                    </motion.div>
                  )}

                  {/* Footer Actions */}
                  <div
                    className="
                      flex flex-col-reverse gap-3
                      sm:flex-row sm:justify-end
                    "
                  >
                    <button
                      onClick={onClose}
                      className="
                        h-11 sm:h-12
                        rounded-2xl
                        border border-gray-200
                        bg-secondary
                        px-5

                        text-xs sm:text-sm font-medium
                        text-white

                        transition-all duration-200

                        hover:bg-secondary/90
                        hover:text-white
                        active:scale-[0.98]

                        focus-visible:outline-none
                        focus-visible:ring-2
                        focus-visible:ring-violet-500
                      "
                    >
                      Done
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation Modal for removal */}
      <ConfirmDeleteModal
        isOpen={confirmModalOpen}
        onClose={() => {
          setConfirmModalOpen(false);
          setCompanyToRemove(null);
        }}
        onConfirm={confirmRemove}
        title="Remove Membership"
        message={`Are you sure you want to remove ${companyToRemove?.name} from ${
          user.first_name || user.username
        }? This will revoke all access to that company.`}
        loading={removingCompanyId !== null}
      />
    </>
  );
};

export default ManageMembershipsModal;