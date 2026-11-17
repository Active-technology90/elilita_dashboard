import React, { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
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
  Briefcase,
  Target,
} from "lucide-react";
import { CustomSelect } from "../../ui/CustomSelect";

// const VEHICLE_CHOICES = [
//   { value: "motorcycle", label: "Motorcycle" },
//   { value: "car", label: "Car" },
//   { value: "bicycle", label: "Bicycle" },
//   { value: "van", label: "Van" },
//   { value: "foot", label: "Foot" },
// ] as const;

// export type VehicleType = (typeof VEHICLE_CHOICES)[number]["value"];

// const ROLE_OPTIONS = [
//   { value: "admin", label: "Admin", icon: <Shield className="h-4 w-4 text-secondary" /> },
//   { value: "staff", label: "Dispatcher", icon: <User className="h-4 w-4 text-secondary" /> },
//   { value: "viewer", label: "Viewer", icon: <User className="h-4 w-4 text-secondary" /> },
//   { value: "delivery", label: "Delivery Person", icon: <Truck className="h-4 w-4 text-secondary" /> },
// ];

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: any;
  onSave: (updatedUser: any) => Promise<void>;
}

const getVehicleLabel = (
  vehicle: string | undefined,
  t: (key: string) => string,
) => {
  if (!vehicle) return "—";
  const map: Record<string, string> = {
    motorcycle: t("vehicleMotorcycle"),
    car: t("vehicleCar"),
    bicycle: t("vehicleBicycle"),
    van: t("vehicleVan"),
    foot: t("vehicleFoot"),
  };
  return map[vehicle] ?? vehicle;
};

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

export const EditUserModal: React.FC<EditUserModalProps> = React.memo(
  ({ isOpen, onClose, user, onSave }) => {
    const { t } = useTranslation("users");

    const VEHICLE_CHOICES = [
      { value: "motorcycle", label: t("vehicleMotorcycle") },
      { value: "car", label: t("vehicleCar") },
      { value: "bicycle", label: t("vehicleBicycle") },
      { value: "van", label: t("vehicleVan") },
      { value: "foot", label: t("vehicleFoot") },
    ] as const;

    const ROLE_OPTIONS = [
      {
        value: "admin",
        label: t("roleAdmin"),
        icon: <Shield className="h-4 w-4 text-secondary" />,
      },
      {
        value: "staff",
        label: t("roleDispatcher"),
        icon: <User className="h-4 w-4 text-secondary" />,
      },
      {
        value: "viewer",
        label: t("roleViewer"),
        icon: <User className="h-4 w-4 text-secondary" />,
      },
      {
        value: "delivery",
        label: t("roleDelivery"),
        icon: <Truck className="h-4 w-4 text-secondary" />,
      },
    ];

    const [formData, setFormData] = useState({
      first_name: "",
      last_name: "",
      email: "",
      username: "",
      phone_number: "",
      role: "staff",
      vehicle_type: "" as string,
      is_active: true,
      is_marketing: false,
      daily_target: 0,
      weekly_target: 0,
    });

    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [localErrors, setLocalErrors] = useState<Record<string, string>>({});
    const [touched, setTouched] = useState<Record<string, boolean>>({});

    useEffect(() => {
      if (user && isOpen) {
        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email || "",
          username: user.username || "",
          phone_number: user.phone_number || "",
          role: user.role || "staff",
          vehicle_type: user.vehicle_type || "",
          is_active: user.is_active !== false,
          is_marketing: Boolean(user.is_marketing),
          daily_target: user.daily_target || 0,
          weekly_target: user.weekly_target || 0,
        });
        setLocalErrors({});
        setTouched({});
        setError("");
      }
    }, [user, isOpen]);

    useEffect(() => {
      if (formData.role !== "delivery" && formData.vehicle_type) {
        setFormData((prev) => ({ ...prev, vehicle_type: "" }));
        setLocalErrors((prev) => ({ ...prev, vehicle_type: "" }));
      }
    }, [formData.role, formData.vehicle_type]);

    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === "Escape" && isOpen) onClose();
      };
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }, [isOpen, onClose]);

    const validate = useCallback(() => {
      const errors: Record<string, string> = {};
      if (!formData.first_name.trim())
        errors.first_name = t("firstNameRequired");
      if (!formData.last_name.trim())
        errors.last_name = t("lastNameRequired");
      if (!formData.email.trim()) errors.email = t("emailRequired");
      else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email))
        errors.email = t("emailInvalid");
      if (!formData.username.trim())
        errors.username = t("usernameRequired");
      if (formData.role === "delivery" && !formData.vehicle_type) {
        errors.vehicle_type = t("vehicleRequired");
      }
      setLocalErrors(errors);
      return Object.keys(errors).length === 0;
    }, [formData, t]);

    if (!isOpen || !user) return null;

    const handleInputChange = (field: string, value: any) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
      if (localErrors[field]) {
        setLocalErrors((prev) => ({ ...prev, [field]: "" }));
      }
    };

    const handleBlur = (field: string) => {
      setTouched((prev) => ({ ...prev, [field]: true }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) {
        setTouched({
          first_name: true,
          last_name: true,
          email: true,
          username: true,
          vehicle_type: true,
        });
        return;
      }

      setUpdating(true);
      setError("");

      try {
        const updateData = {
          ...formData,
          first_name: formData.first_name.trim(),
          last_name: formData.last_name.trim(),
          email: formData.email.trim(),
          username: formData.username.trim(),
          vehicle_type:
            formData.role === "delivery" ? formData.vehicle_type : undefined,
        };
        await onSave(updateData);
        onClose();
      } catch (err: any) {
        setError(err.message || t("userUpdateFailed"));
      } finally {
        setUpdating(false);
      }
    };

    const inputClass = (field: string) => {
      const hasError =
        (touched[field] && !!localErrors[field]) || !!localErrors[field];
      return `w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border bg-white outline-none transition ${
        hasError
          ? "border-red-300 focus:ring-2 focus:ring-red-100 focus:border-red-500"
          : "border-gray-200 focus:ring-2 focus:ring-secondary/20 focus:border-secondary"
      }`;
    };

    const roleLabel = (role?: string) =>
      role === "staff"
        ? t("roleDispatcher")
        : role === "delivery"
        ? t("roleDelivery")
        : role
        ? role.charAt(0).toUpperCase() + role.slice(1)
        : "—";

    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4 md:p-6"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className="bg-white w-full max-w-[95%] sm:max-w-5xl rounded-xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] sm:max-h-[85vh] flex flex-col"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 z-30 flex justify-between items-center p-4 sm:p-6 border-b border-secondary/20 bg-secondary/20 backdrop-blur-sm bg-opacity-95">
                <div>
                  <h2 className="text-lg sm:text-xl font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent">
                    {t("editProfileTitle")}
                  </h2>
                  <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                    {t("editProfileDesc")}
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100 flex-shrink-0"
                  aria-label={t("cancel")}
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
                        {t("currentRole")}{" "}
                        <span className="font-semibold text-secondary">
                          {roleLabel(user.role)}
                        </span>
                        {user.role === "delivery" && user.vehicle_type && (
                          <>
                            {" · "}
                            <span className="font-semibold text-secondary">
                              {getVehicleLabel(user.vehicle_type, t)}
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
                      {t("firstName")} <span className="text-red-500">*</span>
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
                    {localErrors.first_name && touched.first_name && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />{" "}
                        {localErrors.first_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      {t("lastName")} <span className="text-red-500">*</span>
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
                    {localErrors.last_name && touched.last_name && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />{" "}
                        {localErrors.last_name}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("email")} <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        onBlur={() => handleBlur("email")}
                        className={inputClass("email")}
                      />
                    </div>
                    {localErrors.email && touched.email && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" /> {localErrors.email}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      {t("username")} <span className="text-red-500">*</span>
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
                    {localErrors.username && touched.username && (
                      <p className="mt-1.5 text-xs text-red-500 flex items-center gap-1">
                        <AlertCircle className="h-3 w-3" />{" "}
                        {localErrors.username}
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      {t("phoneNumber")}{" "}
                      <span className="text-[10px] sm:text-xs text-gray-400 ml-1">
                        {t("phoneRestricted")}
                      </span>
                    </label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                      <input
                        type="text"
                        value={formData.phone_number}
                        disabled
                        className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-3 text-sm sm:text-base rounded-xl sm:rounded-2xl border border-gray-200 bg-gray-50 text-gray-500 cursor-not-allowed"
                        title={t("phoneCannotEdit")}
                      />
                    </div>
                    <p className="mt-1 text-[10px] sm:text-xs text-gray-400">
                      {t("phoneCannotEdit")}
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1.5">
                      {t("role")} <span className="text-red-500">*</span>
                    </label>
                    <CustomSelect
                      value={formData.role}
                      onChange={(value) => handleInputChange("role", value)}
                      options={ROLE_OPTIONS}
                      placeholder={t("role")}
                      className="w-full"
                    />
                  </div>

                  {formData.role === "delivery" && (
                    <div className="sm:col-span-2">
                      <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                        <span className="inline-flex items-center gap-1.5">
                          <Truck className="h-3.5 w-3.5" />
                          {t("vehicleType")}{" "}
                          <span className="text-red-500">*</span>
                        </span>
                      </label>
                      <CustomSelect
                        value={formData.vehicle_type}
                        onChange={(value) => {
                          handleInputChange("vehicle_type", value);
                          setTouched((prev) => ({
                            ...prev,
                            vehicle_type: true,
                          }));
                        }}
                        options={[
                          { value: "", label: t("selectVehicleType") },
                          ...VEHICLE_CHOICES.map((v) => ({
                            value: v.value,
                            label: v.label,
                          })),
                        ]}
                        placeholder={t("selectVehicleType")}
                        className={
                          localErrors.vehicle_type ? "border-red-500" : ""
                        }
                      />
                      {localErrors.vehicle_type ? (
                        <p className="mt-1.5 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                          {localErrors.vehicle_type}
                        </p>
                      ) : (
                        <p className="mt-1 text-[10px] sm:text-xs text-gray-400">
                          {t("vehicleTypeHint")}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                <div className="border-t border-gray-100 pt-4 mt-2">
                  <div className="flex items-center justify-between p-3 sm:p-4 bg-gray-50 rounded-xl">
                    <div>
                      <p className="font-medium text-gray-900 text-xs sm:text-sm flex items-center gap-2">
                        <Briefcase className="h-4 w-4 text-secondary" />
                        {t("marketingAgent")}
                      </p>
                      <p className="text-[10px] sm:text-xs text-gray-500 mt-0.5">
                        {t("marketingAgentDesc")}
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={formData.is_marketing}
                      onClick={() =>
                        handleInputChange(
                          "is_marketing",
                          !formData.is_marketing,
                        )
                      }
                      className={`relative inline-flex h-5 xs:h-6 w-9 xs:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
                        formData.is_marketing ? "bg-secondary" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`inline-block h-3.5 xs:h-4 w-3.5 xs:w-4 transform rounded-full bg-white transition-transform ${
                          formData.is_marketing
                            ? "translate-x-5 xs:translate-x-6"
                            : "translate-x-0.5 xs:translate-x-1"
                        }`}
                      />
                    </button>
                  </div>

                  {formData.is_marketing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 mt-3 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />{" "}
                          {t("dailyTarget")}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.daily_target}
                          onChange={(e) =>
                            handleInputChange(
                              "daily_target",
                              Math.max(0, parseInt(e.target.value) || 0),
                            )
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2 flex items-center gap-1">
                          <Target className="h-3.5 w-3.5" />{" "}
                          {t("weeklyTarget")}
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.weekly_target}
                          onChange={(e) =>
                            handleInputChange(
                              "weekly_target",
                              Math.max(0, parseInt(e.target.value) || 0),
                            )
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 sm:p-4 bg-gray-50 rounded-xl gap-2 xs:gap-0">
                  <div>
                    <p className="font-medium text-gray-900 text-xs sm:text-sm">
                      {t("activeAccount")}
                    </p>
                    <p className="text-[10px] sm:text-xs text-gray-500">
                      {t("activeAccountDesc")}
                    </p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={formData.is_active}
                    onClick={() =>
                      handleInputChange("is_active", !formData.is_active)
                    }
                    className={`relative inline-flex h-5 xs:h-6 w-9 xs:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
                      formData.is_active ? "bg-secondary" : "bg-gray-300"
                    }`}
                  >
                    <span
                      className={`inline-block h-3.5 xs:h-4 w-3.5 xs:w-4 transform rounded-full bg-white transition-transform ${
                        formData.is_active
                          ? "translate-x-5 xs:translate-x-6"
                          : "translate-x-0.5 xs:translate-x-1"
                      }`}
                    />
                  </button>
                </div>

                {error && (
                  <div className="flex items-center gap-3 p-3 sm:p-4 bg-red-50 rounded-xl border border-red-200">
                    <AlertCircle className="h-4 w-4 sm:h-5 sm:w-5 text-red-500 flex-shrink-0" />
                    <p className="text-xs sm:text-sm text-red-700 flex-1">
                      {error}
                    </p>
                    <button
                      onClick={() => setError("")}
                      className="p-1 hover:bg-red-100 rounded-lg"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </button>
                  </div>
                )}
              </div>

              <div className="sticky bottom-0 z-20 mt-auto px-4 sm:px-6 py-3 sm:py-5 border-t border-gray-100 bg-gray-50/95 backdrop-blur-sm flex flex-row gap-3 sm:gap-4 rounded-b-xl sm:rounded-b-2xl">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-4 sm:px-6 py-1.5 sm:py-2.5 border border-gray-300 rounded-lg sm:rounded-xl text-gray-700 hover:bg-gray-50 transition-colors text-sm sm:text-base font-medium text-center justify-center"
                >
                  {t("cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSubmit as any}
                  disabled={updating}
                  className="flex-1 px-4 sm:px-6 py-1.5 sm:py-2.5 bg-secondary text-white rounded-lg sm:rounded-xl hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm text-sm sm:text-base font-medium flex items-center justify-center gap-2"
                >
                  {updating ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />{" "}
                      {t("updatingBtn")}
                    </>
                  ) : (
                    t("saveChanges")
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  },
);

EditUserModal.displayName = "EditUserModal";
export default EditUserModal;