import {
  X,
  Mail,
  Shield,
  Loader2,
  User,
  AtSign,
  Phone,
  Truck,
  AlertCircle,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { CustomSelect } from "../../ui/CustomSelect";

/* -------------------------------------------------------------------------- */
/*                          VEHICLE TYPE CHOICES                              */
/* -------------------------------------------------------------------------- */

const VEHICLE_CHOICES = [
  { value: "motorcycle", labelKey: "companyUsers.vehicles.motorcycle" },
  { value: "car", labelKey: "companyUsers.vehicles.car" },
  { value: "bicycle", labelKey: "companyUsers.vehicles.bicycle" },
  { value: "van", labelKey: "companyUsers.vehicles.van" },
  { value: "foot", labelKey: "companyUsers.vehicles.foot" },
] as const;

export type VehicleType = (typeof VEHICLE_CHOICES)[number]["value"];

const UserAvatar = ({
  user,
  size = "md",
}: {
  user: any;
  size?: "sm" | "md" | "lg";
}) => {
  const sizeClasses = {
    sm: "w-8 h-8 text-xs",
    md: "w-12 h-12 text-xl",
    lg: "w-16 h-16 text-2xl",
  };
  const initial =
    user.first_name?.[0] || user.email?.[0]?.toUpperCase() || "?";

  return (
    <div
      className={`${sizeClasses[size]} rounded-full bg-gradient-to-br from-indigo-100 to-indigo-200 flex items-center justify-center overflow-hidden shadow-inner flex-shrink-0`}
    >
      {user.profile_image ? (
        <img
          src={user.profile_image}
          alt=""
          className="w-full h-full object-cover"
        />
      ) : (
        <span className="text-secondary font-bold">{initial}</span>
      )}
    </div>
  );
};

/**
 * Resolve the best user identifier for backend calls.
 *
 * Priority (first non-empty, non-"undefined"/"null
 * /**
 * Resolve the best user identifier for backend calls.
 *
 * Priority (first non-empty, non-"undefined"/"null" wins):
 *   1. user.user_id   → the real CustomUser PK (preferred)
 *   2. user.user?.id  → nested user object PK
 *   3. user.id        → fallback if it's a real PK
 *   4. user.uuid      → some backends use UUIDs
 *   5. user.pk        → Django-style PK
 *   6. user.username  → last resort
 */
function resolveUserId(user: any): string {
  if (!user) return "";
  const candidates = [
    user.user_id,
    user.user?.id,
    user.id,
    user.uuid,
    user.pk,
    user.username,
  ];
  for (const c of candidates) {
    if (c === undefined || c === null) continue;
    const s = String(c).trim();
    if (s && s !== "undefined" && s !== "null") return s;
  }
  return "";
}

interface EditUserModalProps {
  isOpen: boolean;
  user: {
    id: string;
    user_id?: string | number;
    uuid?: string;
    pk?: string | number;
    user?: { id?: string | number } | null;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    phone_number: string;
    role: "admin" | "staff" | "viewer" | "delivery";
    profile_image?: string;
    vehicle_type?: VehicleType | "";
  };
  onClose: () => void;
  onSave: (updatedUser: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    role: string;
    vehicle_type?: VehicleType;
  }) => void;
  updating: boolean;
  serverErrors?: Record<string, string | string[]>;
}

export function EditUserModal({
  isOpen,
  user,
  onClose,
  onSave,
  updating,
  serverErrors,
}: EditUserModalProps) {
  const { t } = useTranslation("companyUsers");

  useEffect(() => {
    if (!isOpen || !user) return;

    console.group("🔍 [EditUserModal] Opened");
    console.log("👤 Raw user prop:", user);
    console.log("🆔 user.id        →", user?.id);
    console.log("🆔 user.user_id   →", (user as any)?.user_id);
    console.log("🆔 user.user?.id  →", (user as any)?.user?.id);
    console.log("🆔 user.uuid      →", (user as any)?.uuid);
    console.log("🆔 user.pk        →", (user as any)?.pk);
    console.log("🆔 user.username  →", user?.username);
    console.log(
      "✅ Resolved ID    →",
      resolveUserId(user),
      "(this will be sent to backend)",
    );
    console.groupEnd();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, user?.id, (user as any)?.user_id]);

  useEffect(() => {
    if (!isOpen) return;
    if (serverErrors && Object.keys(serverErrors).length > 0) {
      console.group("⚠️ [EditUserModal] Server errors received");
      console.table(serverErrors);
      console.groupEnd();
    }
  }, [serverErrors, isOpen]);

  const [formData, setFormData] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    email: user?.email || "",
    username: user?.username || "",
    role: user?.role || "staff",
    vehicle_type: (user?.vehicle_type || "") as VehicleType | "",
  });

  const [localErrors, setLocalErrors] = useState<{
    first_name?: string;
    last_name?: string;
    email?: string;
    username?: string;
    vehicle_type?: string;
  }>({});

  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const modalRef = useRef<HTMLDivElement>(null);

  const normalizedServerErrors = useMemo(() => {
    const map: Record<string, string> = {};
    if (!serverErrors) return map;
    Object.entries(serverErrors).forEach(([key, value]) => {
      const msg = Array.isArray(value) ? value[0] : value;
      if (msg) map[key] = String(msg);
    });

    if (Object.keys(map).length > 0) {
      console.log("🧩 [EditUserModal] Normalized server errors:", map);
    }

    return map;
  }, [serverErrors]);

  const getFieldError = (
    field: "first_name" | "last_name" | "email" | "username" | "vehicle_type",
  ): string | undefined => {
    return normalizedServerErrors[field] || localErrors[field];
  };

  useEffect(() => {
    if (user) {
      console.log("🔄 [EditUserModal] Syncing form data for user:", {
        id: user.id,
        user_id: (user as any).user_id,
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
        vehicle_type: user.vehicle_type,
      });

      setFormData({
        first_name: user.first_name,
        last_name: user.last_name,
        email: user.email,
        username: user.username,
        role: user.role,
        vehicle_type: (user.vehicle_type || "") as VehicleType | "",
      });
      setLocalErrors({});
      setTouched({});
    }
  }, [user]);

  useEffect(() => {
    if (formData.role !== "delivery" && formData.vehicle_type) {
      console.log(
        "🧹 [EditUserModal] Role changed away from delivery — clearing vehicle_type",
      );
      setFormData((prev) => ({ ...prev, vehicle_type: "" }));
      setLocalErrors((prev) => ({ ...prev, vehicle_type: undefined }));
    }
  }, [formData.role, formData.vehicle_type]);

  useEffect(() => {
    if (isOpen && modalRef.current) {
      const focusable = modalRef.current.querySelectorAll(
        "button, input, select",
      );
      if (focusable.length) (focusable[0] as HTMLElement).focus();
    }
  }, [isOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !user) return null;

  const handleInputChange = (field: string, value: string) => {
    console.log(`✏️ [EditUserModal] Changed "${field}" →`, value);
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (localErrors[field as keyof typeof localErrors]) {
      setLocalErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
  };

  const validate = (): boolean => {
    const errors: typeof localErrors = {};

    if (!formData.first_name.trim()) {
      errors.first_name = t("editModal.errors.firstNameRequired");
    }
    if (!formData.last_name.trim()) {
      errors.last_name = t("editModal.errors.lastNameRequired");
    }
    if (!formData.email.trim()) {
      errors.email = t("editModal.errors.emailRequired");
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = t("editModal.errors.emailInvalid");
    }
    if (!formData.username.trim()) {
      errors.username = t("editModal.errors.usernameRequired");
    }
    if (formData.role === "delivery" && !formData.vehicle_type) {
      errors.vehicle_type = t("editModal.errors.vehicleTypeRequired");
    }

    console.group("🧪 [EditUserModal] Validation");
    console.log("📝 formData:", formData);
    console.log("❌ Errors:", errors);
    console.log(
      "✅ Valid?",
      Object.keys(errors).length === 0 ? "YES" : "NO",
    );
    console.groupEnd();

    setLocalErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = () => {
    console.group("🚀 [EditUserModal] Submit clicked");

    if (!validate()) {
      console.warn("❌ Validation failed — aborting submit");
      setTouched({
        first_name: true,
        last_name: true,
        email: true,
        username: true,
        vehicle_type: true,
      });
      console.groupEnd();
      return;
    }

    const resolvedId = resolveUserId(user);
    console.log("🆔 Resolved user ID for API:", resolvedId);

    if (!resolvedId) {
      console.error(
        "❌ [EditUserModal] Cannot submit — no valid user ID found on the user object.",
        {
          user_id: (user as any)?.user_id,
          user_user_id: (user as any)?.user?.id,
          id: user?.id,
          uuid: (user as any)?.uuid,
          pk: (user as any)?.pk,
          username: user?.username,
        },
      );
      toast.error(t("editModal.errors.missingUserId"));
      console.groupEnd();
      return;
    }

    const payload: {
      id: string;
      first_name: string;
      last_name: string;
      email: string;
      username: string;
      role: string;
      vehicle_type?: VehicleType;
    } = {
      id: resolvedId,
      first_name: formData.first_name.trim(),
      last_name: formData.last_name.trim(),
      email: formData.email.trim(),
      username: formData.username.trim(),
      role: formData.role,
    };

    if (formData.role === "delivery" && formData.vehicle_type) {
      payload.vehicle_type = formData.vehicle_type as VehicleType;
    }

    console.log("📦 [EditUserModal] Payload sent to parent:", payload);
    console.log(
      "🌐 [EditUserModal] Parent will call API with id =",
      payload.id,
    );
    console.groupEnd();

    onSave(payload);
  };

  const inputClass = (
    field: "first_name" | "last_name" | "email" | "username",
  ) => {
    const hasError =
      (touched[field] && !!getFieldError(field)) || !!getFieldError(field);
    return `w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border bg-white outline-none transition
      ${
        hasError
          ? "border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-500"
          : "border-gray-200 focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
      }`;
  };

  return (
    <div
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6 transition-all duration-200"
      onClick={onClose}
    >
      <div
        ref={modalRef}
        className="bg-white w-full max-w-[95%] sm:max-w-5xl rounded-xl sm:rounded-2xl shadow-xl transform transition-all duration-200 scale-100 overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="sticky top-0 z-30 flex justify-between items-center p-4 sm:p-6 border-b border-secondary/20 bg-secondary/20 backdrop-blur-sm bg-opacity-95">
          <div>
            <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
              {t("editModal.title")}
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
              {t("editModal.subtitle")}
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100 flex-shrink-0"
            aria-label={t("editModal.closeAria")}
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5" />
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 flex-1 overflow-y-auto">
          <div className="bg-gradient-to-r from-indigo-50/50 to-white rounded-xl p-3 sm:p-4 flex items-center gap-3 sm:gap-4 border border-indigo-100 shadow-sm">
            <UserAvatar user={user} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                {user.first_name} {user.last_name}
              </p>
              <div className="flex items-center gap-2 mt-1">
                <Mail className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 flex-shrink-0" />
                <p className="text-xs sm:text-sm text-gray-500 truncate">
                  {user.email}
                </p>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <Shield className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-400 flex-shrink-0" />
                <p className="text-[10px] sm:text-xs text-gray-500">
                  {t("editModal.currentRolePrefix")}{" "}
                  <span className="font-semibold text-secondary">
                    {t(`roles.${user.role}`)}
                  </span>
                  {user.role === "delivery" && user.vehicle_type && (
                    <>
                      {" · "}
                      <span className="font-semibold text-secondary">
                        {t(`vehicles.${user.vehicle_type}`)}
                      </span>
                    </>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("editModal.firstNameLabel")}{" "}
                <span className="text-red-500">{t("editModal.requiredMark")}</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.first_name}
                  onChange={(e) =>
                    handleInputChange("first_name", e.target.value)
                  }
                  onBlur={() => handleBlur("first_name")}
                  className={inputClass("first_name")}
                />
              </div>
              {getFieldError("first_name") && touched.first_name && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{" "}
                  {getFieldError("first_name")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                {t("editModal.lastNameLabel")}{" "}
                <span className="text-red-500">{t("editModal.requiredMark")}</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.last_name}
                  onChange={(e) =>
                    handleInputChange("last_name", e.target.value)
                  }
                  onBlur={() => handleBlur("last_name")}
                  className={inputClass("last_name")}
                />
              </div>
              {getFieldError("last_name") && touched.last_name && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{" "}
                  {getFieldError("last_name")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("editModal.emailLabel")}{" "}
                <span className="text-red-500">{t("editModal.requiredMark")}</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={inputClass("email")}
                />
              </div>
              {getFieldError("email") && touched.email && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {getFieldError("email")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t("editModal.usernameLabel")}{" "}
                <span className="text-red-500">{t("editModal.requiredMark")}</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={formData.username}
                  onChange={(e) =>
                    handleInputChange("username", e.target.value)
                  }
                  onBlur={() => handleBlur("username")}
                  className={inputClass("username")}
                />
              </div>
              {getFieldError("username") && touched.username && (
                <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />{" "}
                  {getFieldError("username")}
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                {t("editModal.phoneLabel")}{" "}
                <span className="text-[10px] sm:text-xs text-gray-400 ml-1">
                  {t("editModal.phoneRestricted")}
                </span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  value={user.phone_number}
                  disabled
                  className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                  title={t("editModal.phoneAria")}
                />
              </div>
              <p className="mt-1 text-[10px] sm:text-xs text-gray-400">
                {t("editModal.phoneHint")}
              </p>
            </div>

            <div>
              <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                {t("editModal.roleLabel")}{" "}
                <span className="text-red-500">{t("editModal.requiredMark")}</span>
              </label>
              <CustomSelect
                value={formData.role}
                onChange={(value) => handleInputChange("role", value)}
                options={[
                  { value: "admin", label: t("roles.admin"), icon: <Shield className="h-4 w-4 text-secondary" /> },
                  { value: "staff", label: t("roles.staff"), icon: <User className="h-4 w-4 text-secondary" /> },
                  { value: "viewer", label: t("roles.viewer"), icon: <User className="h-4 w-4 text-secondary" /> },
                  { value: "delivery", label: t("roles.delivery"), icon: <Truck className="h-4 w-4 text-secondary" /> },
                ]}
                placeholder={t("editModal.rolePlaceholder")}
                className="w-full"
              />
            </div>

            {formData.role === "delivery" && (
              <div className="sm:col-span-2">
                <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                  <span className="inline-flex items-center gap-1.5">
                    <Truck className="h-3.5 w-3.5" />
                    {t("editModal.vehicleTypeLabel")}{" "}
                    <span className="text-red-500">{t("editModal.requiredMark")}</span>
                  </span>
                </label>
                <CustomSelect
                  value={formData.vehicle_type}
                  onChange={(value) => {
                    handleInputChange("vehicle_type", value);
                    setTouched((prev) => ({ ...prev, vehicle_type: true }));
                  }}
                  options={[
                    { value: "", label: t("editModal.vehicleTypePlaceholder") },
                    ...VEHICLE_CHOICES.map((v) => ({
                      value: v.value,
                      label: t(v.labelKey),
                    })),
                  ]}
                  placeholder={t("editModal.vehicleTypePlaceholder")}
                  className={
                    getFieldError("vehicle_type") ? "border-red-500" : ""
                  }
                />
                {getFieldError("vehicle_type") ? (
                  <p className="mt-1.5 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                    {getFieldError("vehicle_type")}
                  </p>
                ) : (
                  <p className="mt-1 text-[10px] sm:text-xs text-gray-400">
                    {t("editModal.vehicleTypeHint")}
                  </p>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="sticky bottom-0 z-20 mt-auto px-4 sm:px-6 py-3 sm:py-5 border-t border-gray-100 bg-gray-50/95 backdrop-blur-sm flex flex-row gap-3 sm:gap-4 rounded-b-xl sm:rounded-b-2xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 sm:px-6 py-1.5 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium text-center justify-center"
          >
            {t("actions.cancel")}
          </button>
          <button
            onClick={handleSubmit}
            disabled={updating}
            className="flex-1 px-4 sm:px-6 py-1.5 sm:py-2.5 bg-secondary text-white rounded-lg sm:rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm sm:text-base font-medium flex items-center justify-center gap-2"
          >
            {updating ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />{" "}
                {t("actions.saving")}
              </>
            ) : (
              t("actions.save")
            )}
          </button>
        </div>
      </div>
    </div>
  );
}