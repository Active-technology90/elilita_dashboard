import {
  X,
  Loader2,
  UserPlus,
  Shield,
  Phone,
  Mail,
  Lock,
  User,
  AtSign,
  AlertCircle,
  Eye,
  EyeOff,
  Info,
} from "lucide-react";
import { useMemo, useState } from "react";

interface CreateCompanyUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  loading: boolean;
  onSubmit: (data: {
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    username: string;
    password: string;
    role: "admin" | "staff" | "viewer" | "delivery";
  }) => void;
  /** Optional: pass backend field errors from parent, e.g. { username: ["Already exists"] } */
  serverErrors?: Record<string, string | string[]>;
}

type FormErrors = {
  first_name?: string;
  last_name?: string;
  email?: string;
  phone_number?: string;
  username?: string;
  password?: string;
  confirm_password?: string;
};

export function CreateCompanyUserModal({
  isOpen,
  onClose,
  loading,
  onSubmit,
  serverErrors,
}: CreateCompanyUserModalProps) {
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    username: "",
    phone_number: "",
    password: "",
    confirm_password: "",
    role: "staff" as "admin" | "staff" | "viewer" | "delivery",
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ✅ Ethiopian mobile: Ethio Telecom (09/+2519) OR Safaricom (07/+2517)
  // Accepts: 09XXXXXXXX, 07XXXXXXXX, +2519XXXXXXXX, +2517XXXXXXXX
  const phoneRegex = /^(\+251|0)(9|7)\d{8}$/;

  const usernameRegex = /^[a-zA-Z0-9_]{3,20}$/;

  // Normalize backend errors into a flat map of field -> message
  const normalizedServerErrors = useMemo(() => {
    const map: Record<string, string> = {};
    if (!serverErrors) return map;
    Object.entries(serverErrors).forEach(([key, value]) => {
      const msg = Array.isArray(value) ? value[0] : value;
      if (msg) map[key] = String(msg);
    });
    // catch-all bucket for non_field_errors / detail
    return map;
  }, [serverErrors]);

  const generalServerError =
    normalizedServerErrors["non_field_errors"] ||
    normalizedServerErrors["detail"] ||
    normalizedServerErrors["__all__"];

  const getFieldError = (field: keyof FormErrors): string | undefined => {
    // Server error takes priority (it's the real truth)
    if (normalizedServerErrors[field]) return normalizedServerErrors[field];
    return errors[field];
  };

  const validate = () => {
    const newErrors: FormErrors = {};

    if (!formData.first_name.trim()) {
      newErrors.first_name = "First name is required";
    } else if (formData.first_name.trim().length < 2) {
      newErrors.first_name = "Minimum 2 characters required";
    }

    if (!formData.last_name.trim()) {
      newErrors.last_name = "Last name is required";
    } else if (formData.last_name.trim().length < 2) {
      newErrors.last_name = "Minimum 2 characters required";
    }

    if (!formData.username.trim()) {
      newErrors.username = "Username is required";
    } else if (!usernameRegex.test(formData.username)) {
      newErrors.username =
        "3-20 characters. Letters, numbers & underscore only";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      newErrors.email = "Invalid email address";
    }

    if (!formData.phone_number.trim()) {
      newErrors.phone_number = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone_number)) {
      newErrors.phone_number =
        "Use 09XXXXXXXX, 07XXXXXXXX, +2519XXXXXXXX or +2517XXXXXXXX";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (formData.password.length < 8) {
      newErrors.password = "Minimum 8 characters required";
    } else if (
      !/[A-Z]/.test(formData.password) ||
      !/[0-9]/.test(formData.password) ||
      !/[^A-Za-z0-9]/.test(formData.password)
    ) {
      newErrors.password = "Include uppercase, number and special character";
    }

    if (!formData.confirm_password) {
      newErrors.confirm_password = "Please confirm your password";
    } else if (formData.confirm_password !== formData.password) {
      newErrors.confirm_password = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (field: keyof typeof formData, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field as keyof FormErrors]) {
      setErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    validate();
  };

  const passwordStrength = useMemo(() => {
    let score = 0;
    if (formData.password.length >= 8) score++;
    if (/[A-Z]/.test(formData.password)) score++;
    if (/[0-9]/.test(formData.password)) score++;
    if (/[^A-Za-z0-9]/.test(formData.password)) score++;
    return score;
  }, [formData.password]);

  const passwordStrengthText = () => {
    if (passwordStrength <= 1) return "Weak";
    if (passwordStrength <= 3) return "Medium";
    return "Strong";
  };

  const handleSubmit = () => {
    const isValid = validate();
    if (!isValid) {
      setTouched({
        first_name: true,
        last_name: true,
        email: true,
        username: true,
        phone_number: true,
        password: true,
        confirm_password: true,
      });
      return;
    }
    onSubmit({
      first_name: formData.first_name,
      last_name: formData.last_name,
      email: formData.email,
      username: formData.username,
      phone_number: formData.phone_number,
      password: formData.password,
      role: formData.role,
    });
  };

  const inputClass = (field: keyof FormErrors) => {
    const hasError =
      (touched[field] && !!getFieldError(field)) || !!getFieldError(field);
    return `
      w-full pl-8 sm:pl-10 pr-8 sm:pr-12 py-2.5 sm:py-3 text-sm sm:text-base rounded-2xl border bg-white
      outline-none transition-all duration-200
      ${
        hasError
          ? "border-red-300 focus:ring-4 focus:ring-red-100 focus:border-red-500"
          : "border-gray-200 focus:ring-4 focus:ring-secondary/10 focus:border-secondary"
      }
    `;
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 md:p-8"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-[95%] sm:max-w-5xl bg-white rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200 max-h-[90vh] sm:max-h-[85vh] flex flex-col"
      >
        {/* HEADER */}
        <div className="sticky top-0 z-30 px-4 sm:px-6 py-4 sm:py-5 border-b border-gray-100 flex items-start justify-between bg-gradient-to-r from-secondary/5 to-indigo-50 backdrop-blur-sm bg-opacity-95">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-secondary">
              {formData.role === "staff" ? "Create Dispatcher" : "Create User"}
            </h2>
            <p className="text-xs sm:text-sm text-secondary/60 mt-1">
              {formData.role === "staff"
                ? "Create and onboard a dispatcher"
                : "Create and onboard a company user instantly"}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-full hover:bg-white/80 transition flex-shrink-0"
          >
            <X className="h-4 w-4 sm:h-5 sm:w-5 text-secondary/60" />
          </button>
        </div>

        {/* BODY */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6 flex-1 overflow-y-auto">
          {/* General backend error banner */}
          {generalServerError && (
            <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2.5 text-sm text-red-700">
              <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <span>{generalServerError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5">
            {/* FIRST NAME */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                First Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Abebe"
                  value={formData.first_name}
                  onChange={(e) => handleChange("first_name", e.target.value)}
                  onBlur={() => handleBlur("first_name")}
                  className={inputClass("first_name")}
                />
              </div>
              {getFieldError("first_name") && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3.5 w-3.5" />{" "}
                  {getFieldError("first_name")}
                </p>
              )}
            </div>

            {/* LAST NAME */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                Last Name <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Bikila"
                  value={formData.last_name}
                  onChange={(e) => handleChange("last_name", e.target.value)}
                  onBlur={() => handleBlur("last_name")}
                  className={inputClass("last_name")}
                />
              </div>
              {getFieldError("last_name") && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                  {getFieldError("last_name")}
                </p>
              )}
            </div>

            {/* USERNAME */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                Username <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="abebe123"
                  value={formData.username}
                  onChange={(e) =>
                    handleChange("username", e.target.value.replace(/\s/g, ""))
                  }
                  onBlur={() => handleBlur("username")}
                  className={inputClass("username")}
                />
              </div>
              {getFieldError("username") && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                  {getFieldError("username")}
                </p>
              )}
            </div>

            {/* EMAIL */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                Email <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="email"
                  placeholder="abebe@example.com"
                  value={formData.email}
                  onChange={(e) => handleChange("email", e.target.value)}
                  onBlur={() => handleBlur("email")}
                  className={inputClass("email")}
                />
              </div>
              {getFieldError("email") && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                  {getFieldError("email")}
                </p>
              )}
            </div>

            {/* PHONE */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                Phone Number <span className="text-red-500">*</span>
                <span className="text-[10px] sm:text-xs text-gray-400 ml-1">
                  (Ethio Telecom & Safaricom)
                </span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="09XXXXXXXX, 07XXXXXXXX or +251..."
                  value={formData.phone_number}
                  onChange={(e) => handleChange("phone_number", e.target.value)}
                  onBlur={() => handleBlur("phone_number")}
                  className={inputClass("phone_number")}
                />
                <div
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 cursor-help"
                  title="Accepts Ethio Telecom (09/+2519) and Safaricom (07/+2517) numbers"
                >
                  <Info className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </div>
              </div>
              {getFieldError("phone_number") ? (
                <p className="mt-1.5 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                  {getFieldError("phone_number")}
                </p>
              ) : (
                <p className="mt-1 text-[10px] sm:text-xs text-gray-400">
                  Ethio Telecom: 0911000000 · Safaricom: 0711000000
                </p>
              )}
            </div>

            {/* ROLE */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                Role
              </label>
              <div className="relative">
                <Shield className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <select
                  value={formData.role}
                  onChange={(e) => handleChange("role", e.target.value)}
                  className="w-full appearance-none pl-8 sm:pl-10 pr-8 sm:pr-4 py-2.5 sm:py-3 text-sm sm:text-base rounded-2xl border border-gray-200 bg-white focus:ring-4 focus:ring-secondary/10 focus:border-secondary outline-none transition"
                >
                  <option value="admin">Admin</option>
                  <option value="staff">Dispatcher</option>
                  <option value="delivery">Delivery Personnel</option>
                  <option value="viewer">Viewer</option>
                </select>
              </div>
            </div>

            {/* PASSWORD */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Strong password..."
                  value={formData.password}
                  onChange={(e) => handleChange("password", e.target.value)}
                  onBlur={() => handleBlur("password")}
                  className={inputClass("password")}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? (
                    <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </button>
              </div>
              {formData.password && (
                <div className="mt-3">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] sm:text-xs text-gray-500">
                      Password strength
                    </span>
                    <span
                      className={`text-[10px] sm:text-xs font-medium ${
                        passwordStrength <= 1
                          ? "text-red-500"
                          : passwordStrength <= 3
                            ? "text-yellow-500"
                            : "text-green-600"
                      }`}
                    >
                      {passwordStrengthText()}
                    </span>
                  </div>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-2 flex-1 rounded-full transition ${
                          passwordStrength >= level
                            ? passwordStrength <= 1
                              ? "bg-red-500"
                              : passwordStrength <= 3
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            : "bg-gray-200"
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
              {getFieldError("password") && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                  {getFieldError("password")}
                </p>
              )}
            </div>

            {/* CONFIRM PASSWORD */}
            <div>
              <label className="text-xs sm:text-sm font-medium text-gray-700 mb-1.5 block">
                Confirm Password <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm password..."
                  value={formData.confirm_password}
                  onChange={(e) =>
                    handleChange("confirm_password", e.target.value)
                  }
                  onBlur={() => handleBlur("confirm_password")}
                  className={inputClass("confirm_password")}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  ) : (
                    <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                </button>
              </div>
              {getFieldError("confirm_password") && (
                <p className="mt-1.5 text-xs sm:text-sm text-red-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />{" "}
                  {getFieldError("confirm_password")}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="sticky bottom-0 z-20 mt-auto px-4 sm:px-6 py-4 sm:py-5 border-t border-gray-100 bg-gray-50/95 backdrop-blur-sm flex flex-row justify-end gap-2 sm:gap-3 rounded-b-2xl sm:rounded-b-3xl">
          <button
            onClick={onClose}
            className="flex-1 px-4 sm:px-5 py-2 sm:py-3 rounded-xl border border-gray-200 hover:bg-white transition font-medium text-sm sm:text-base"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="flex-1 px-4 sm:px-5 py-2 sm:py-3 rounded-xl bg-secondary hover:bg-secondary/80 text-white transition shadow-sm font-medium flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
          >
            {loading ? (
              <>
                <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />{" "}
                Creating...
              </>
            ) : (
              <>
                <UserPlus className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                {formData.role === "staff"
                  ? "Create Dispatcher"
                  : "Create User"}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}