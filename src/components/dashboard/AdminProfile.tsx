import React, { useState } from "react";
import { useCompaniesList } from "../../hooks/useCompaniesList";
import { useForm, Controller } from "react-hook-form";
import { updateProfile, changePassword, getMe } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentCompany } from "../../context/CurrentCompanyContext";
import { useTheme } from "../../context/ThemeContext";
import {
  User,
  Mail,
  Phone,
  Lock,
  Key,
  Building,
  ArrowRight,
  Camera,
  LogOut,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
  ShieldAlert,
} from "lucide-react";

type ProfileForm = {
  first_name: string;
  last_name: string;
  email: string;
  phone_number: string;
};

type PasswordForm = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

// Professional phone number validation function
const isValidPhoneNumber = (phone: string): boolean => {
  if (!phone || phone.trim() === "") return false;
  const cleaned = phone.trim();
  // Reject placeholder patterns
  if (
    cleaned.includes("XXX") ||
    cleaned.includes("xxx") ||
    cleaned === "+251 9XX XXX XXX"
  )
    return false;
  // Ethiopian phone number format: +251XXXXXXXXX or 09XXXXXXXX
  const phoneRegex = /^(?:\+251|0)[0-9]{9}$/;
  return phoneRegex.test(cleaned);
};

export default function AdminProfile() {
  const { user, setUser, logout } = useAuth();
  const { company, switchCompany } = useCurrentCompany();
  const { companies } = useCompaniesList();
  const { currentTheme } = useTheme();
  const isSuperAdmin = !user?.memberships?.length;
  console.log(user);

  const [avatar, setAvatar] = useState<string | null>(
    user?.profile_image || null,
  );
  const [profileLoading, setProfileLoading] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [activeForm, setActiveForm] = useState<
    "profile" | "password" | "membership"
  >("profile");
  const [toast, setToast] = useState<{
    message: string;
    type: "success" | "error";
  } | null>(null);
  const [passwordErrors, setPasswordErrors] = useState<{
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  }>({});
  // State for password visibility
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

  const { control, handleSubmit } = useForm<ProfileForm>({
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
      phone_number: user?.phone_number || "",
    },
  });

  const {
    control: passwordControl,
    handleSubmit: handlePasswordSubmit,
    reset,
  } = useForm<PasswordForm>({
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmitProfile = async (data: ProfileForm) => {
    setProfileLoading(true);
    setToast(null);
    try {
      const formData = new FormData();
      formData.append("first_name", data.first_name);
      formData.append("last_name", data.last_name);
      formData.append("email", data.email);

      // ✅ Only send valid phone numbers - prevents duplicate empty string constraint
      if (isValidPhoneNumber(data.phone_number)) {
        formData.append("phone_number", data.phone_number.trim());
      }
      // If phone number is invalid/empty, skip sending it - backend keeps existing value

      await updateProfile(formData);
      const res = await getMe();
      const updatedUser = res.data;
      setUser(updatedUser);
      if (updatedUser.profile_image) setAvatar(updatedUser.profile_image);
      setToast({ message: "Profile updated successfully", type: "success" });
      setTimeout(() => setToast(null), 3000);
    } catch (err: any) {
      console.error("Profile update error:", err);

      let errorMsg = "Failed to update profile";

      // Handle specific database constraint error
      if (
        err?.response?.data?.detail?.includes("phone_number") ||
        err?.response?.data?.detail?.includes("unique constraint")
      ) {
        errorMsg =
          "Phone number is already in use by another account. Please use a different number.";
      } else if (err?.response?.data?.detail) {
        errorMsg = err.response.data.detail;
      } else if (err?.response?.data?.message) {
        errorMsg = err.response.data.message;
      } else if (err?.response?.data?.phone_number) {
        errorMsg = `Phone number: ${err.response.data.phone_number[0]}`;
      }

      setToast({ message: errorMsg, type: "error" });
      setTimeout(() => setToast(null), 5000);
    } finally {
      setProfileLoading(false);
    }
  };

  const onSubmitPassword = async (data: PasswordForm) => {
    // Clear previous errors
    setPasswordErrors({});
    setToast(null);

    // Validate current password is not empty
    if (!data.currentPassword) {
      setPasswordErrors({ currentPassword: "Current password is required" });
      return;
    }

    // Validate password length
    if (data.newPassword.length < 8) {
      setPasswordErrors({
        newPassword: "Password must be at least 8 characters",
      });
      return;
    }

    // Validate password match
    if (data.newPassword !== data.confirmPassword) {
      setPasswordErrors({ confirmPassword: "Passwords do not match" });
      return;
    }
    setPasswordLoading(true);
    try {
      await changePassword({
        current_password: data.currentPassword,
        new_password: data.newPassword,
      });
      setToast({ message: "Password changed successfully", type: "success" });
      setTimeout(() => setToast(null), 3000);
      reset();
    } catch (err: unknown) {
      console.error(err);
      const responseData =
        typeof err === "object" &&
        err !== null &&
        "response" in err &&
        typeof (err as { response?: { data?: unknown } }).response?.data ===
          "object"
          ? ((err as { response?: { data?: Record<string, string> } }).response
              ?.data ?? {})
          : {};
      const errorMsg =
        responseData.detail ||
        responseData.message ||
        (err instanceof Error ? err.message : "") ||
        "Failed to change password";

      // Handle specific backend errors
      if (
        errorMsg.toLowerCase().includes("current") ||
        errorMsg.toLowerCase().includes("old password")
      ) {
        setPasswordErrors({ currentPassword: errorMsg });
      } else if (errorMsg.toLowerCase().includes("match")) {
        setPasswordErrors({ confirmPassword: errorMsg });
      } else {
        setToast({ message: errorMsg, type: "error" });
        setTimeout(() => setToast(null), 3000);
      }
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be less than 5MB");
      return;
    }
    const url = URL.createObjectURL(file);
    setAvatar(url);
    try {
      const formData = new FormData();
      formData.append("profile_image", file);
      await updateProfile(formData);
      const res = await getMe();
      const updatedUser = res.data;
      setUser(updatedUser);
      setAvatar(updatedUser.profile_image ?? null);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      alert("Failed to upload avatar");
    }
  };

  const handleSwitchCompany = (membership: any) => {
    // 🛑 BLOCK SWITCHING IF INACTIVE
    if (membership.is_active === false) return;

    switchCompany({
      slug: membership.company_slug,
      name: membership.company_name,
      role: membership.role,
    });
  };

  // Determine if a membership is currently selected
  const isCurrentCompany = (membership: any) => {
    return company?.slug === membership.company_slug;
  };
  // Get logo from companies list (same as CompanyProducts)
  const getCompanyLogo = (companySlug: string) => {
    if (!companySlug || !companies.length) return null;
    const foundCompany = companies.find((c: any) => c.slug === companySlug);
    return foundCompany?.logo || null;
  };

  return (
    <div className="w-full min-h-screen bg-gray-50 px-0 md:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 md:py-8 lg:py-10">
      <div className="max-w-7xl mx-auto">
        {/* Toast Notification */}
        {toast && (
          <div
            className={`fixed top-4 left-4 right-4 sm:left-auto sm:right-4 z-50 animate-in fade-in slide-in-from-top-2 duration-300 ${
              toast.type === "success"
                ? "bg-green-50 border-green-200 text-green-800"
                : "bg-red-50 border-red-200 text-red-800"
            } border rounded-xl shadow-lg p-4 max-w-full sm:max-w-sm`}
          >
            <div className="flex items-center gap-3">
              {toast.type === "success" ? (
                <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">
                  !
                </div>
              )}
              <p className="text-sm font-medium break-words">{toast.message}</p>
            </div>
          </div>
        )}
        {/* Profile Header Card */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden border border-gray-100">
          <div
            className="relative h-28 sm:h-32 md:h-36"
            style={{
              background: `linear-gradient(135deg, ${currentTheme.dark}, ${currentTheme.primary})`,
            }}
          >
            {/* Decorative circles */}
            <div className="absolute top-0 right-0 w-32 h-32 sm:w-48 sm:h-48 rounded-full bg-white/5 -mr-16 -mt-16" />
            <div className="absolute bottom-0 left-0 w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-white/5 -ml-12 -mb-12" />
            <div className="absolute top-1/2 left-1/2 w-40 h-40 sm:w-56 sm:h-56 rounded-full bg-white/5 -translate-x-1/2 -translate-y-1/2" />
            {/* Logout button - top right corner */}
            <div className="absolute top-2 right-2 sm:top-3 sm:right-3 md:top-4 md:right-4 z-10">
              <button
                onClick={() => setShowLogoutConfirm(true)}
                className="flex items-center gap-1 sm:gap-2 bg-white/20 backdrop-blur-sm hover:bg-white/30 text-white px-2 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-full text-xs sm:text-sm font-medium transition-all duration-200"
              >
                <LogOut className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4" />
                <span className="hidden sm:inline">Sign Out</span>
              </button>
            </div>

            <div className="absolute -bottom-8 sm:-bottom-10 md:-bottom-12 left-4 sm:left-5 md:left-6 flex items-end gap-2 sm:gap-3 md:gap-4">
              <div className="relative group">
                <div className="w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 rounded-full border-3 sm:border-4 border-white bg-white shadow-md overflow-hidden">
                  {avatar ? (
                    <img
                      src={avatar}
                      className="w-full h-full object-cover"
                      alt="avatar"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400">
                      <User className="h-6 w-6 sm:h-8 sm:w-8 md:h-10 md:w-10" />
                    </div>
                  )}
                </div>
                <label
                  htmlFor="avatar-upload"
                  className="absolute bottom-0 right-0 bg-white rounded-full p-1 sm:p-1.5 shadow-md cursor-pointer hover:bg-gray-50 transition"
                >
                  <Camera className="h-3 w-3 sm:h-3.5 sm:w-3.5 md:h-4 md:w-4 text-gray-600" />
                  <input
                    id="avatar-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </label>
              </div>
              <div className="mb-1 sm:mb-2 md:mb-4">
                <h1 className="text-lg sm:text-xl md:text-2xl font-bold text-white tracking-tight drop-shadow-sm break-words max-w-[180px] sm:max-w-[250px] md:max-w-none">
                  {user?.first_name} {user?.last_name}
                </h1>

                <div className="mt-1 sm:mt-2 inline-flex items-center gap-1 sm:gap-2 bg-white/15 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full backdrop-blur-sm">
                  <span className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-white" />
                  <p className="text-black/60 text-xs sm:text-sm font-medium truncate max-w-[120px] sm:max-w-[200px] md:max-w-none">
                    {user?.email}
                  </p>
                </div>
              </div>
            </div>
          </div>
          <div className="pt-12 sm:pt-14 md:pt-16 pb-4 sm:pb-5 md:pb-6 px-4 sm:px-5 md:px-6">
            {/* Tabs - Desktop: original style, Mobile: pill/segmented style */}
            <div className="border-b border-gray-200">
              {/* Desktop Tabs - hidden on mobile, visible on desktop */}
              <div className="hidden sm:block">
                <div className="flex gap-1">
                  <button
                    onClick={() => setActiveForm("profile")}
                    className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2 md:py-2.5 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${
                      activeForm === "profile"
                        ? "text-secondary"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Edit Profile
                    {activeForm === "profile" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
                    )}
                  </button>
                  <button
                    onClick={() => setActiveForm("password")}
                    className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2 md:py-2.5 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${
                      activeForm === "password"
                        ? "text-secondary"
                        : "text-gray-500 hover:text-gray-700"
                    }`}
                  >
                    Change Password
                    {activeForm === "password" && (
                      <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
                    )}
                  </button>
                  {!isSuperAdmin && (
                    <button
                      onClick={() => setActiveForm("membership")}
                      className={`px-3 sm:px-4 md:px-5 py-2 sm:py-2 md:py-2.5 text-xs sm:text-sm font-medium transition-all relative whitespace-nowrap ${
                        activeForm === "membership"
                          ? "text-secondary"
                          : "text-gray-500 hover:text-gray-700"
                      }`}
                    >
                      Memberships
                      {activeForm === "membership" && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-secondary rounded-full" />
                      )}
                    </button>
                  )}
                </div>
              </div>

              {/* Mobile Tabs - Pill/Segmented style (visible only on mobile) */}
              <div className="sm:hidden">
                <div className="flex gap-2 p-1 bg-gray-100 rounded-xl">
                  <button
                    onClick={() => setActiveForm("profile")}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                      activeForm === "profile"
                        ? "bg-white text-secondary shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Profile
                  </button>
                  <button
                    onClick={() => setActiveForm("password")}
                    className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                      activeForm === "password"
                        ? "bg-white text-secondary shadow-sm"
                        : "text-gray-600 hover:text-gray-800"
                    }`}
                  >
                    Password
                  </button>
                  {!isSuperAdmin && (
                    <button
                      onClick={() => setActiveForm("membership")}
                      className={`flex-1 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 ${
                        activeForm === "membership"
                          ? "bg-white text-secondary shadow-sm"
                          : "text-gray-600 hover:text-gray-800"
                      }`}
                    >
                      Memberships
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Profile Form - Updated with 2-column layout for all fields */}
            {activeForm === "profile" && (
              <div className="mt-4 sm:mt-5 md:mt-6 space-y-4 sm:space-y-5">
                {/* Row 1: First Name and Last Name */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <Controller
                      control={control}
                      name="first_name"
                      render={({ field }) => (
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                          <input
                            {...field}
                            className={`w-full pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary transition ${
                              passwordErrors.confirmPassword
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-200 focus:border-transparent"
                            }`}
                            placeholder="First Name"
                          />
                        </div>
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <Controller
                      control={control}
                      name="last_name"
                      render={({ field }) => (
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                          <input
                            {...field}
                            className="w-full pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition"
                            placeholder="Last Name"
                          />
                        </div>
                      )}
                    />
                  </div>
                </div>

                {/* Row 2: Email Address and Phone Number */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email Address
                    </label>
                    <Controller
                      control={control}
                      name="email"
                      render={({ field }) => (
                        <div className="relative">
                          <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                          <input
                            {...field}
                            type="email"
                            className="w-full pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition text-gray-900"
                            placeholder="you@example.com"
                          />
                        </div>
                      )}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number
                    </label>
                    <Controller
                      control={control}
                      name="phone_number"
                      render={({ field }) => (
                        <div className="relative">
                          <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                          <input
                            {...field}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-full pl-8 sm:pl-9 pr-3 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary focus:border-transparent transition text-gray-900"
                            placeholder="+251 9XX XXX XXX"
                          />
                        </div>
                      )}
                    />
                    <p className="text-xs text-gray-400 mt-1">
                      Format: +251XXXXXXXXX or 09XXXXXXXX
                    </p>
                  </div>
                </div>

                {/* Submit Button */}
                <div className="pt-2">
                  <button
                    onClick={handleSubmit(onSubmitProfile)}
                    disabled={profileLoading}
                    className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-secondary text-white rounded-xl font-medium hover:bg-secondary/90 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base"
                  >
                    {profileLoading ? "Updating..." : "Update Profile"}
                  </button>
                </div>
              </div>
            )}

            {/* Password Form - Updated with icons and reduced width */}
            {activeForm === "password" && (
              <div className="mt-4 sm:mt-5 md:mt-6 w-full">
                <div className="max-w-full sm:max-w-md space-y-4 sm:space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Current Password
                    </label>
                    <Controller
                      control={passwordControl}
                      name="currentPassword"
                      render={({ field }) => (
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                          <input
                            {...field}
                            type={showCurrentPassword ? "text" : "password"}
                            className={`w-full pl-8 sm:pl-9 pr-9 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary transition ${
                              passwordErrors.currentPassword
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-200 focus:border-transparent"
                            }`}
                            placeholder="Enter current password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowCurrentPassword(!showCurrentPassword)
                            }
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                          >
                            {showCurrentPassword ? (
                              <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    />
                    {passwordErrors.currentPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        {passwordErrors.currentPassword}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <Controller
                      control={passwordControl}
                      name="newPassword"
                      render={({ field }) => (
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                          <input
                            {...field}
                            type={showNewPassword ? "text" : "password"}
                            className={`w-full pl-8 sm:pl-9 pr-9 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary transition ${
                              passwordErrors.newPassword
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-200 focus:border-transparent"
                            }`}
                            placeholder="New password (min. 8 characters)"
                          />
                          <button
                            type="button"
                            onClick={() => setShowNewPassword(!showNewPassword)}
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                          >
                            {showNewPassword ? (
                              <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    />
                    {passwordErrors.newPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        {passwordErrors.newPassword}
                      </p>
                    )}
                    <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                      <Shield className="h-3 w-3" />
                      Password must be at least 8 characters
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm Password
                    </label>
                    <Controller
                      control={passwordControl}
                      name="confirmPassword"
                      render={({ field }) => (
                        <div className="relative">
                          <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                          <input
                            {...field}
                            type={showConfirmPassword ? "text" : "password"}
                            className={`w-full pl-8 sm:pl-9 pr-9 sm:pr-10 py-2 sm:py-2.5 text-sm sm:text-base border rounded-xl focus:outline-none focus:ring-2 focus:ring-secondary transition ${
                              passwordErrors.confirmPassword
                                ? "border-red-500 focus:ring-red-500"
                                : "border-gray-200 focus:border-transparent"
                            }`}
                            placeholder="Confirm new password"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(!showConfirmPassword)
                            }
                            className="absolute right-2 sm:right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                          >
                            {showConfirmPassword ? (
                              <EyeOff className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            ) : (
                              <Eye className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                            )}
                          </button>
                        </div>
                      )}
                    />
                    {passwordErrors.confirmPassword && (
                      <p className="text-xs text-red-500 mt-1">
                        {passwordErrors.confirmPassword}
                      </p>
                    )}
                  </div>
                  <div className="pt-2">
                    <button
                      onClick={handlePasswordSubmit(onSubmitPassword)}
                      disabled={passwordLoading}
                      className="w-full sm:w-auto px-4 sm:px-6 py-2 sm:py-2.5 bg-secondary text-white rounded-xl font-medium hover:bg-secondary/90 transition shadow-sm disabled:opacity-50 text-sm sm:text-base"
                    >
                      {passwordLoading ? "Saving..." : "Change Password"}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Membership Section with current selection highlight */}
            {!isSuperAdmin && activeForm === "membership" && (
              <div className="mt-4 sm:mt-5 md:mt-6">
                <div className="flex flex-row items-center justify-between mb-3 sm:mb-4 gap-2">
                  <h3 className="text-xs sm:text-lg font-semibold text-secondary">
                    Your Companies
                  </h3>
                  <span className="text-[9px] sm:text-xs bg-amber-500 text-white px-1.5 sm:px-3 py-0.5 rounded-full whitespace-nowrap shadow-sm">
                    {user?.memberships?.length || 0}{" "}
                    {user?.memberships?.length === 1 ? "company" : "companies"}
                  </span>
                </div>

                {user?.memberships?.length ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    {user.memberships.map((membership: any, idx: number) => {
                      const isActive = isCurrentCompany(membership);
                      
                      // 🛑 Check if the specific membership is inactive
                      const isInactive =
                        membership.is_active === false ||
                        (membership.is_active === undefined &&
                          companies.find(
                            (c: any) => c.slug === membership.company_slug,
                          )?.is_active === false);

                      return (
                        <div
                          key={idx}
                          onClick={() =>
                            !isInactive && handleSwitchCompany(membership)
                          }
                          className={`relative bg-white border rounded-xl p-3 sm:p-4 transition-all duration-200 group ${
                            isInactive
                              ? "opacity-60 cursor-not-allowed border-gray-200 bg-gray-50/50"
                              : isActive
                                ? "border-secondary shadow-md ring-1 ring-secondary/20 cursor-pointer"
                                : "border-gray-200 hover:shadow-md cursor-pointer"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl flex items-center justify-center transition-all duration-300 overflow-hidden shadow-md flex-shrink-0 ${
                                  isInactive
                                    ? "bg-gray-200 grayscale"
                                    : isActive
                                      ? "bg-gradient-to-br from-secondary to-purple-700 ring-2 ring-secondary/30"
                                      : "bg-gradient-to-br from-gray-100 to-gray-200 group-hover:from-secondary/10 group-hover:to-purple-100"
                                }`}
                              >
                                {(() => {
                                  const logo = getCompanyLogo(
                                    membership.company_slug,
                                  );
                                  if (logo) {
                                    return (
                                      <img
                                        src={logo}
                                        alt={membership.company_name}
                                        className="w-full h-full object-cover"
                                      />
                                    );
                                  }
                                  return (
                                    <Building
                                      className={`h-5 w-5 sm:h-6 sm:w-6 transition-all duration-300 ${
                                        isInactive
                                          ? "text-gray-400"
                                          : isActive
                                            ? "text-white"
                                            : "text-gray-500 group-hover:text-secondary"
                                      }`}
                                    />
                                  );
                                })()}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p
                                  className={`font-semibold transition-all duration-300 break-words ${
                                    isInactive
                                      ? "text-gray-500 line-through"
                                      : isActive
                                        ? "text-secondary text-base sm:text-lg"
                                        : "text-gray-800 group-hover:text-secondary text-sm sm:text-base"
                                  }`}
                                >
                                  {membership.company_name}
                                </p>
                                <div className="flex flex-wrap items-center gap-1 sm:gap-2 mt-1">
                                  <span
                                    className={`text-xs px-1.5 sm:px-2 py-0.5 rounded-full font-medium ${
                                      membership.role === "admin"
                                        ? "bg-emerald-100 text-emerald-700"
                                        : membership.role === "staff"
                                          ? "bg-blue-100 text-blue-700"
                                          : membership.role === "viewer"
                                            ? "bg-amber-100 text-amber-700"
                                            : "bg-gray-100 text-gray-600"
                                    }`}
                                  >
                                    {membership.role === "staff"
                                      ? "Dispatcher"
                                      : membership.role}
                                  </span>
                                  
                                  {/* Show Inactive Badge instead of Active */}
                                  {isInactive ? (
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 bg-red-100 border border-red-200 px-1.5 sm:px-2 py-0.5 rounded-full flex items-center gap-1">
                                      <ShieldAlert className="h-3 w-3" />
                                      Inactive
                                    </span>
                                  ) : isActive ? (
                                    <span className="text-[10px] font-medium text-emerald-600 bg-emerald-50 px-1.5 sm:px-2 py-0.5 rounded-full">
                                      Active
                                    </span>
                                  ) : null}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 ml-2">
                              {!isInactive && (
                                <span
                                  className={`text-xs px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-full font-medium ${
                                    membership.role === "admin"
                                      ? "bg-green-100 text-green-700"
                                      : membership.role === "staff"
                                        ? "bg-blue-100 text-blue-700"
                                        : "bg-gray-100 text-gray-600"
                                  }`}
                                >
                                  {membership.role === "staff"
                                    ? "Dispatcher"
                                    : membership.role}
                                </span>
                              )}
                              
                              {isInactive ? (
                                <ShieldAlert className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-400" />
                              ) : isActive ? (
                                <CheckCircle className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-secondary" />
                              ) : (
                                <ArrowRight className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-gray-300 group-hover:text-secondary transition-colors" />
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12 bg-gray-50 rounded-xl">
                    <Building className="h-10 w-10 sm:h-12 sm:w-12 mx-auto text-gray-300" />
                    <p className="text-gray-500 mt-2 text-sm sm:text-base">
                      No company memberships found
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Logout Confirmation Modal */}
        {showLogoutConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[calc(100%-2rem)] sm:max-w-md mx-auto overflow-hidden animate-in zoom-in-95 duration-200">
              {/* Modal Header */}
              <div className="p-4 sm:p-6 pb-3 sm:pb-4">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                    <LogOut className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                    Sign Out
                  </h3>
                </div>
                <p className="text-sm sm:text-base text-gray-500 mt-2 sm:mt-3 pl-10 sm:pl-13">
                  Are you sure you want to sign out of your account?
                </p>
              </div>

              {/* Modal Body */}
              <div className="bg-gray-50 px-4 sm:px-6 py-3 sm:py-4 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                <button
                  onClick={() => setShowLogoutConfirm(false)}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-all duration-200 w-full sm:w-auto order-2 sm:order-1"
                >
                  Cancel
                </button>
                <button
                  onClick={logout}
                  className="px-4 sm:px-5 py-2 sm:py-2.5 bg-gradient-to-r from-red-600 to-rose-600 text-white rounded-xl text-sm font-medium hover:from-red-700 hover:to-rose-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2"
                >
                  <LogOut className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}