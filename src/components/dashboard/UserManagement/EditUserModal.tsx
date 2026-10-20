import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Save,
  AlertCircle,
  Mail,
  Phone,
  UserIcon,
  User2Icon,
  UserCircle,
} from "lucide-react";
import type { User } from "../../../types";

// ============================================================
// Reusable Components
// ============================================================

interface FormInputProps {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  required?: boolean;
  placeholder?: string;
  error?: string;
  autoComplete?: string;
}

const FormInput: React.FC<FormInputProps> = ({
  id,
  label,
  type = "text",
  value,
  onChange,
  required,
  placeholder,
  error,
  autoComplete,
}) => {
  const [focused, setFocused] = useState(false);

  return (
    <div className="w-full space-y-2">
      {/* Label */}
      <label
        htmlFor={id}
        className="
          flex items-center gap-1
          text-xs sm:text-sm
          font-semibold
          text-gray-700
        "
      >
        {label}

        {required && (
          <span className="text-red-500">*</span>
        )}
      </label>

      {/* Input */}
      <div className="relative">
        {/* Focus Glow */}
        <div
          className={`
            absolute inset-0 rounded-2xl transition-all duration-300
            ${
              focused
                ? "bg-secondary/10 blur-md opacity-100"
                : "opacity-0"
            }
          `}
        />

        <input
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder || `Enter ${label}`}
          required={required}
          autoComplete={autoComplete}
          className={`
            relative
            w-full
            rounded-2xl
            border
            bg-white/90
            backdrop-blur-xl

            px-4
            py-3.5

            text-sm
            font-medium
            text-gray-900
            placeholder:text-gray-400

            outline-none
            transition-all duration-200

            ${
              error
                ? `
                  border-red-300
                  focus:border-red-400
                  shadow-[0_0_0_4px_rgba(239,68,68,0.08)]
                `
                : focused
                ? `
                  border-secondary
                  shadow-[0_0_0_4px_rgba(103,79,163,0.12)]
                `
                : `
                  border-gray-200
                  hover:border-gray-300
                `
            }
          `}
        />
      </div>

      {/* Error */}
      <AnimatePresence mode="wait">
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.18 }}
            className="flex items-start gap-1.5 px-1"
          >
            <div className="mt-[2px] h-1.5 w-1.5 rounded-full bg-red-500 shrink-0" />

            <p
              className="
                text-[11px] xs:text-xs
                font-medium
                text-red-500
                leading-relaxed
              "
            >
              {error}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
}) => {
  return (
    <div className="flex flex-col xs:flex-row xs:items-center xs:justify-between p-3 xs:p-4 bg-gray-50 rounded-xl gap-2 xs:gap-0">
      <div>
        <p className="font-medium text-gray-900 text-xs xs:text-sm">{label}</p>
        {description && (
          <p className="text-[10px] xs:text-xs text-gray-500">{description}</p>
        )}
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative inline-flex h-5 xs:h-6 w-9 xs:w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-secondary/50 ${
          checked ? "bg-secondary" : "bg-gray-300"
        }`}
      >
        <span
          className={`inline-block h-3.5 xs:h-4 w-3.5 xs:w-4 transform rounded-full bg-white transition-transform ${
            checked
              ? "translate-x-5 xs:translate-x-6"
              : "translate-x-0.5 xs:translate-x-1"
          }`}
        />
      </button>
    </div>
  );
};

// interface AvatarUploadProps {
//   imageUrl: string | null;
//   onImageChange: (file: File | null) => void;
//   name: string;
// }

// const AvatarUpload: React.FC<AvatarUploadProps> = ({
//   imageUrl,
//   onImageChange,
//   name,
// }) => {
//   const [preview, setPreview] = useState<string | null>(imageUrl);
//   const [isHovering, setIsHovering] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setPreview(reader.result as string);
//       };
//       reader.readAsDataURL(file);
//       onImageChange(file);
//     }
//   };

//   const getInitials = () => {
//     const parts = name.split(" ");
//     if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
//     if (parts.length === 1) return parts[0][0].toUpperCase();
//     return "U";
//   };

//   return (
//     <div className="flex flex-col items-center gap-3">
//       <motion.div
//         className="relative cursor-pointer"
//         whileHover={{ scale: 1.05 }}
//         onHoverStart={() => setIsHovering(true)}
//         onHoverEnd={() => setIsHovering(false)}
//         onClick={() => fileInputRef.current?.click()}
//       >
//         <div className="h-20 w-20 rounded-full bg-secondary flex items-center justify-center overflow-hidden shadow-lg">
//           {preview ? (
//             <img
//               src={preview}
//               alt="Avatar"
//               className="h-full w-full object-cover"
//             />
//           ) : (
//             <span className="text-3xl font-bold text-white">
//               {getInitials()}
//             </span>
//           )}
//         </div>
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: isHovering ? 1 : 0 }}
//           className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center"
//         >
//           <Camera className="h-6 w-6 text-white" />
//         </motion.div>
//       </motion.div>
//       <input
//         ref={fileInputRef}
//         type="file"
//         accept="image/*"
//         onChange={handleFileChange}
//         className="hidden"
//       />
//       <button
//         type="button"
//         onClick={() => fileInputRef.current?.click()}
//         className="text-xs text-secondary hover:underline"
//       >
//         Change photo
//       </button>
//       {preview && (
//         <button
//           type="button"
//           onClick={() => {
//             setPreview(null);
//             onImageChange(null);
//           }}
//           className="text-xs text-red-500 hover:underline"
//         >
//           Remove
//         </button>
//       )}
//     </div>
//   );
// };

interface ErrorAlertProps {
  message: string;
  onDismiss?: () => void;
}

const ErrorAlert: React.FC<ErrorAlertProps> = ({ message, onDismiss }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="flex items-center gap-3 p-3 xs:p-4 bg-red-50 rounded-xl border border-red-200"
    >
      <AlertCircle className="h-4 w-4 xs:h-5 xs:w-5 text-red-500 flex-shrink-0" />
      <p className="text-xs xs:text-sm text-red-700 flex-1">{message}</p>
      {onDismiss && (
        <button onClick={onDismiss} className="p-1 hover:bg-red-100 rounded-lg">
          <X className="h-4 w-4 text-red-500" />
        </button>
      )}
    </motion.div>
  );
};
interface ActionButtonProps {
  onClick?: () => void;
  loading?: boolean;
  disabled?: boolean;
  variant?: "primary" | "secondary" | "danger";
  children: React.ReactNode;
  type?: "button" | "submit";
  fullWidth?: boolean;
  icon?: React.ReactNode;
}

const ActionButton: React.FC<ActionButtonProps> = ({
  onClick,
  loading,
  disabled,
  variant = "primary",
  children,
  type = "button",
  fullWidth = false,
  icon,
}) => {
  const isDisabled = disabled || loading;

  const baseStyles = `
    relative overflow-hidden
    inline-flex items-center justify-center gap-2.5

    min-h-[40px] xs:min-h-[50px]
    px-5 xs:px-6

    rounded-2xl
    font-semibold

    text-sm xs:text-[15px]

    transition-all duration-200 ease-out

    active:scale-[0.98]
    disabled:cursor-not-allowed
    disabled:opacity-60

    focus-visible:outline-none
    focus-visible:ring-4
    focus-visible:ring-offset-0

    select-none
    whitespace-nowrap
  `;

  const variants = {
    primary: `
      bg-secondary
      text-white

      shadow-lg shadow-secondary/20

      hover:-translate-y-0.5
      hover:shadow-xl hover:shadow-secondary/30

      focus-visible:ring-secondary/25
    `,

    secondary: `
      bg-white/90
      backdrop-blur-xl

      border border-gray-200
      text-gray-700

      shadow-sm

      hover:bg-white
      hover:border-gray-300
      hover:shadow-md

      focus-visible:ring-gray-200
    `,

    danger: `
      bg-red-500
      text-white

      shadow-lg shadow-red-500/20

      hover:-translate-y-0.5
      hover:bg-red-600
      hover:shadow-xl hover:shadow-red-500/30

      focus-visible:ring-red-200
    `,
  };

  return (
    <motion.button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      whileTap={{ scale: 0.985 }}
      whileHover={
        !isDisabled
          ? {
              y: -1,
            }
          : {}
      }
      transition={{
        duration: 0.18,
        ease: "easeOut",
      }}
      className={`
        ${baseStyles}
        ${variants[variant]}
        ${fullWidth ? "w-full" : ""}
      `}
    >
      {/* Shine Effect */}
      {!isDisabled && variant === "primary" && (
        <span
          className="
            absolute inset-0
            opacity-0 hover:opacity-100
            transition-opacity duration-500
            bg-[linear-gradient(110deg,transparent,rgba(255,255,255,0.18),transparent)]
            translate-x-[-120%] hover:translate-x-[120%]
          "
        />
      )}

      {/* Loading Spinner */}
      {loading ? (
        <svg
          className="h-4 w-4 animate-spin shrink-0"
          viewBox="0 0 24 24"
          fill="none"
        >
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          />

          <path
            className="opacity-90"
            fill="currentColor"
            d="M12 2a10 10 0 00-10 10h4a6 6 0 016-6V2z"
          />
        </svg>
      ) : icon ? (
        <span className="flex shrink-0 items-center justify-center">
          {icon}
        </span>
      ) : null}

      {/* Text */}
      <span
        className={` 
          relative z-10 text-xs md:text-sm
          flex items-center justify-center
          transition-opacity duration-200
          ${loading ? "opacity-90" : ""}
        `}
      >
        {children}
      </span>
    </motion.button>
  );
};
// ============================================================
// Main Modal Component
// ============================================================

interface EditUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onSave: (updatedUser: Partial<User>) => Promise<void>;
}

const EditUserModal: React.FC<EditUserModalProps> = React.memo(
  ({ isOpen, onClose, user, onSave }) => {
    const [formData, setFormData] = useState({
      first_name: "",
      last_name: "",
      email: "",
      phone_number: "",
      username: "",
      is_active: true,
      is_marketing: false,
      daily_target: 0,
      weekly_target: 0,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

    useEffect(() => {
      if (user) {
        setFormData({
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          email: user.email,
          phone_number: user.phone_number || "",
          username: user.username,
          is_active: user.is_active !== false,
          is_marketing: Boolean(user.is_marketing),
          daily_target: user.daily_target || 0,
          weekly_target: user.weekly_target || 0,
        });
        setFieldErrors({});
      }
    }, [user]);

    const validate = useCallback(() => {
      const errors: Record<string, string> = {};
      if (!formData.email.trim()) errors.email = "Email is required";
      else if (!/\S+@\S+\.\S+/.test(formData.email))
        errors.email = "Invalid email format";
      if (!formData.username.trim()) errors.username = "Username is required";
      if (
        formData.phone_number &&
        !/^\+?[0-9\s\-()]{8,}$/.test(formData.phone_number)
      )
        errors.phone_number = "Invalid phone number";
      setFieldErrors(errors);
      return Object.keys(errors).length === 0;
    }, [formData]);

    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!validate()) return;

      setLoading(true);
      setError("");

      try {
        const updateData: Partial<User> = {
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone_number: formData.phone_number,
          username: formData.username,
          is_active: formData.is_active,
          is_marketing: formData.is_marketing,
          daily_target: formData.daily_target,
          weekly_target: formData.weekly_target,
        };
        console.log(updateData);
        await onSave(updateData);
        onClose();
      } catch (err: any) {
        setError(err.message || "Failed to update user");
      } finally {
        setLoading(false);
      }
    };

    if (!isOpen) return null;

    // Responsive modal classes
  const modalContainerClasses = `
  bg-white shadow-[0_25px_80px_rgba(0,0,0,0.15)]
  border border-secondary/10
  flex flex-col overflow-hidden

  w-[95vw]
  mx-auto

  h-[95dvh]
  rounded-3xl

  sm:w-full
  sm:max-w-lg
  sm:max-h-[92dvh]
  sm:rounded-3xl

  md:max-w-2xl
  lg:max-w-4xl
  xl:max-w-5xl
  2xl:max-w-6xl
`;
    return (
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center sm:items-center sm:justify-center bg-black/80 p-0 sm:p-4"
            onClick={onClose}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              transition={{ type: "spring", damping: 25 }}
              className={modalContainerClasses}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="sticky top-0 z-10 bg-secondary-light py-3 xs:py-4 rounded-t-3xl max-[319px]:rounded-none xs:rounded-t-3xl">
                <div className="flex items-center justify-between px-4 xs:px-5 sm:px-6">
                  <div>
                    <h2 className="text-base xs:text-lg sm:text-xl md:text-2xl font-bold text-white">
                      Edit User Profile
                    </h2>
                    <p className="text-purple-100 text-xs xs:text-sm mt-1">
                      Update user information and permissions
                    </p>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onClose}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
                  >
                    <X className="h-5 w-5 text-white" />
                  </motion.button>
                </div>
              </div>

              {/* Scrollable content */}
              <div className="flex-1 overflow-y-auto overscroll-contain">
                <form
                  onSubmit={handleSubmit}
                  className="px-4 xs:px-5 sm:px-6 py-6 xs:py-8 space-y-4"
                >
                  {/* Avatar Upload */}
                  {/* <div className="flex justify-center">
                    <AvatarUpload
                      imageUrl={user?.profile_image || null}
                      onImageChange={setAvatarFile}
                      name={`${formData.first_name} ${formData.last_name}`}
                    />
                  </div> */}

                  {/* Two-column layout */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 xs:gap-5">
                    <FormInput
                      id="first_name"
                      label="First Name"
                      value={formData.first_name}
                      onChange={(val) =>
                        setFormData({ ...formData, first_name: val })
                      }
                      icon={<User2Icon className="h-4 w-4" />}
                      autoComplete="given-name"
                    />
                    <FormInput
                      id="last_name"
                      label="Last Name"
                      value={formData.last_name}
                      onChange={(val) =>
                        setFormData({ ...formData, last_name: val })
                      }
                      icon={<UserIcon className="h-4 w-4" />}
                      autoComplete="family-name"
                    />
                    <FormInput
                      id="username"
                      label="Username"
                      value={formData.username}
                      onChange={(val) =>
                        setFormData({ ...formData, username: val })
                      }
                      icon={<UserCircle className="h-4 w-4" />}
                      required
                      error={fieldErrors.username}
                      autoComplete="username"
                    />
                    <FormInput
                      id="email"
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(val) =>
                        setFormData({ ...formData, email: val })
                      }
                      icon={<Mail className="h-4 w-4" />}
                      required
                      error={fieldErrors.email}
                      autoComplete="email"
                    />
                    <FormInput
                      id="phone_number"
                      label="Phone Number"
                      value={formData.phone_number}
                      onChange={(val) =>
                        setFormData({ ...formData, phone_number: val })
                      }
                      icon={<Phone className="h-4 w-4" />}
                      error={fieldErrors.phone_number}
                      autoComplete="tel"
                    />
                  </div>

                  {/* Toggle Switch */}
                  <ToggleSwitch
                    checked={formData.is_active}
                    onChange={(checked) =>
                      setFormData({ ...formData, is_active: checked })
                    }
                    label="Active Account"
                    description="User can log in and access the platform"
                  />

                  <ToggleSwitch
                    checked={formData.is_marketing}
                    onChange={(checked) =>
                      setFormData({ 
                        ...formData, 
                        is_marketing: checked,
                        daily_target: checked ? formData.daily_target : 0,
                        weekly_target: checked ? formData.weekly_target : 0
                      })
                    }
                    label="Marketing Agent"
                    description="Designate this user as a Elilita marketing person"
                  />

                  {formData.is_marketing && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-purple-50/50 rounded-2xl border border-purple-100/50">
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Daily Registration Target
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.daily_target}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              daily_target: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-gray-700 mb-2">
                          Weekly Registration Target
                        </label>
                        <input
                          type="number"
                          min="0"
                          value={formData.weekly_target}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              weekly_target: Math.max(0, parseInt(e.target.value) || 0)
                            })
                          }
                          className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-sm font-medium text-gray-900 outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/10"
                        />
                      </div>
                    </div>
                  )}

                  {/* Error Message */}
                  {error && (
                    <ErrorAlert
                      message={error}
                      onDismiss={() => setError("")}
                    />
                  )}
                </form>
              </div>

              {/* Sticky Footer with buttons */}
              <div
                className="sticky bottom-0 bg-white border-t border-gray-100 px-4 xs:px-5 sm:px-6 py-3 xs:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 xs:gap-3"
                style={{
                  paddingBottom: `max(env(safe-area-inset-bottom, 1rem), 1rem)`,
                }}
              >
                {/* <ActionButton
                  onClick={onClose}
                  variant="secondary"
                  type="button"
                >
                  Cancel
                </ActionButton> */}
                <ActionButton
                  loading={loading}
                  variant="primary"
                  type="submit"
                  onClick={handleSubmit as any}
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Changes
                </ActionButton>
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