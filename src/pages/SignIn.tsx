// src/pages/SignIn.tsx
import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

import { login as loginApi, getMe } from "../services/api";
import { useAuth } from "../context/authContext";
import { Eye, EyeOff } from "lucide-react";

export default function SignIn(): React.JSX.Element {
  const [email, setEmail] = useState(""); // UI keeps email input
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const navigate = useNavigate();
  const { login } = useAuth();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    setLoading(true);
    setError(null);

    try {
      // Backend expects "username" (email or username both work).
      const response = await loginApi(email, password);

      const access = response?.data?.access;
      const refresh = response?.data?.refresh;

      if (!access || !refresh) {
        throw new Error("Invalid login response from server");
      }

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      let userData: any = null;

      try {
        const userResponse = await getMe();
        userData = userResponse.data;
      } catch (err) {
        console.warn("Profile fetch failed");
      }

      await login(access, refresh, userData);

      /* ──────────────────────────────────────────────────────────
         Post-login routing:
         - Super admin (is_superuser) → dashboard
         - Any active membership      → dashboard
         - Otherwise                  → dashboard (guard will show
                                        the "access restricted" screen)
         ────────────────────────────────────────────────────────── */

      const isSuper = userData?.is_superuser === true;
      const memberships = Array.isArray(userData?.memberships)
        ? userData.memberships
        : [];
      const hasActiveMembership = memberships.some(
        (m: any) => m?.is_active !== false,
      );

      if (isSuper || hasActiveMembership) {
        navigate("/dashboard", { replace: true });
      } else {
        // Send them to the dashboard anyway — DashboardGuard will render
        // the "access restricted" screen so they see a clear explanation
        // instead of a silent redirect loop.
        navigate("/dashboard", { replace: true });
      }
    } catch (err: any) {
      console.error(err);

      setError(
        err?.response?.data?.detail ||
          err?.message ||
          "Login failed. Check credentials.",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="signin-page min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5f4bb6] via-[#6a5acd] to-[#4b3ca7] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 bg-white rounded-3xl shadow-2xl overflow-hidden mx-auto">
        {/* LEFT SIDE — hidden on mobile, visible on md+ */}
        <div className="hidden md:flex flex-col justify-center items-center text-white p-6 lg:p-10 bg-gradient-to-br from-[#6a5acd] to-[#4b3ca7] relative">
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_20%_30%,white,transparent_40%),radial-gradient(circle_at_80%_70%,white,transparent_40%)]"></div>

          <div className="relative z-10 text-center flex flex-col items-center">
            <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full border-4 border-white flex items-center justify-center mb-4 lg:mb-6">
              <img
                src="/elilta1.jpg"
                alt="Elilita Logo"
                className="w-full h-full object-cover rounded-full"
              />
            </div>

            <h1 className="text-2xl lg:text-3xl font-bold mb-2">Elilita</h1>

            <p className="text-xs lg:text-sm opacity-90 px-4">
              Manage your company with full control
            </p>
          </div>
        </div>

        {/* RIGHT SIDE — Responsive */}
        <div className="p-6 sm:p-8 md:p-10 flex flex-col justify-center">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-800">
              Welcome
            </h2>

            <p className="text-gray-500 text-xs sm:text-sm mt-1">
              Enter your credentials to access the panel
            </p>
          </div>

          {error && (
            <div className="mb-4 bg-red-100 text-red-600 p-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs sm:text-sm text-gray-600 font-medium">
                Username
              </label>

              <input
                type="text"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 p-2.5 sm:p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6a5acd] outline-none transition-all text-sm sm:text-base"
                placeholder="admin@elilita.com"
              />
            </div>

            <div>
              <label className="text-xs sm:text-sm text-gray-600 font-medium">
                Password
              </label>

              <div className="relative mt-1">
                <input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 sm:p-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-[#6a5acd] outline-none transition-all text-sm sm:text-base pr-12"
                  placeholder="••••••••"
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-[#6a5acd] transition-colors"
                >
                  {showPassword ? (
                    <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
                  ) : (
                    <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#6a5acd] text-white py-2.5 sm:py-3 px-4 rounded-xl font-semibold 
                hover:bg-[#5a4ac0] hover:scale-[1.02] active:scale-[0.98] 
                transition-all duration-200 ease-in-out shadow-md hover:shadow-lg
                disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                text-sm sm:text-base"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Signing in...
                </span>
              ) : (
                "Sign In"
              )}
            </button>
          </form>

          <div className="mt-6 text-[10px] sm:text-xs text-gray-400 text-center">
            Secure Login • Elilita v1.0.0
          </div>
        </div>
      </div>
    </div>
  );
}