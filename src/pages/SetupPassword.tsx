// src/pages/SetupPassword.tsx
import React, { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { validateOwnerInvitation, confirmOwnerInvitation, getMe } from "../services/api";
import { useAuth } from "../context/authContext";
import { Eye, EyeOff, Lock, CheckCircle2, AlertTriangle, Building2, ArrowRight } from "lucide-react";

class SetupPasswordErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error("SetupPassword render error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white p-6 rounded-2xl shadow-lg border border-slate-100 text-center">
            <h3 className="text-lg font-bold text-slate-900 mb-2">Something went wrong</h3>
            <p className="text-sm text-slate-500 mb-4">
              {this.state.error?.message || "An unexpected error occurred while loading this page."}
            </p>
            <a
              href="/signin"
              className="inline-block px-4 py-2 bg-[#674FA3] text-white text-sm font-semibold rounded-xl"
            >
              Go to Sign In
            </a>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

function SetupPasswordContent(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const uid = searchParams.get("uid") || "";
  const token = searchParams.get("token") || "";

  const navigate = useNavigate();
  const { login } = useAuth();

  const [validating, setValidating] = useState(true);
  const [tokenStatus, setTokenStatus] = useState<"valid" | "expired" | "already_active" | "invalid">("valid");
  const [validationMessage, setValidationMessage] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [ownerEmail, setOwnerEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function checkToken() {
      if (!uid || !token) {
        if (isMounted) {
          setValidating(false);
          setTokenStatus("invalid");
          setValidationMessage("Missing invitation credentials in the link.");
        }
        return;
      }

      try {
        const res = await validateOwnerInvitation(uid, token);
        if (isMounted) {
          if (res.data.valid) {
            setTokenStatus("valid");
            setCompanyName(res.data.company_name || "");
            setOwnerEmail(res.data.email || "");
          } else {
            setTokenStatus((res.data.status as any) || "invalid");
            setValidationMessage(res.data.message || "Invalid invitation link.");
          }
        }
      } catch (err: any) {
        if (isMounted) {
          setTokenStatus("invalid");
          setValidationMessage(err?.response?.data?.message || "Failed to validate invitation link.");
        }
      } finally {
        if (isMounted) {
          setValidating(false);
        }
      }
    }

    checkToken();

    return () => {
      isMounted = false;
    };
  }, [uid, token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setFormError(null);

    if (password.length < 8) {
      setFormError("Password must be at least 8 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }

    setSubmitting(true);

    try {
      const res = await confirmOwnerInvitation({
        uid,
        token,
        password,
        confirm_password: confirmPassword,
      });

      const { access, refresh } = res.data;
      if (!access || !refresh) {
        throw new Error("Invalid response received from server.");
      }

      localStorage.setItem("access", access);
      localStorage.setItem("refresh", refresh);

      // Fetch user profile
      let userData: any = null;
      try {
        const meRes = await getMe();
        userData = meRes.data;
      } catch {
        userData = res.data.user;
      }

      setIsSuccess(true);
      await login(access, refresh, userData);

      // Redirect directly into dashboard
      setTimeout(() => {
        navigate("/dashboard", { replace: true });
      }, 1500);
    } catch (err: any) {
      const detail = err?.response?.data?.detail || err?.response?.data?.message || err?.message;
      setFormError(detail || "Failed to set password. Please try again.");
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="mx-auto w-14 h-14 bg-purple-100 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
          <Building2 className="w-8 h-8 text-[#674FA3]" />
        </div>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">
          Elilita Dashboard
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Company Owner Onboarding & Password Setup
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-100/80 rounded-2xl sm:px-10 border border-slate-100">
          {validating ? (
            <div className="py-12 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-[#674FA3] border-t-transparent mb-3" />
              <p className="text-sm text-slate-600 font-medium">Validating your invitation...</p>
            </div>
          ) : tokenStatus === "expired" ? (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Invitation Link Expired
              </h3>
              <p className="text-sm text-slate-500 mb-6 leading-relaxed">
                For security reasons, invitation links expire after <strong>48 hours</strong>. Please contact your platform administrator to resend a fresh invitation email to your address.
              </p>
              <button
                type="button"
                onClick={() => navigate("/signin")}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          ) : tokenStatus === "already_active" ? (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Account Already Active
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                Your password has already been configured and your account is active. You can log in directly to your dashboard.
              </p>
              <button
                type="button"
                onClick={() => navigate("/signin")}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-white bg-[#674FA3] hover:bg-[#5b4591] transition-colors"
              >
                <span>Sign In to Dashboard</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : tokenStatus === "invalid" ? (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center mb-3">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-base font-semibold text-slate-900 mb-1">
                Invalid Invitation Link
              </h3>
              <p className="text-sm text-slate-500 mb-6">
                {validationMessage || "This invitation link is not valid or was corrupted."}
              </p>
              <button
                type="button"
                onClick={() => navigate("/signin")}
                className="w-full inline-flex justify-center items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 transition-colors"
              >
                Go to Sign In
              </button>
            </div>
          ) : isSuccess ? (
            <div className="text-center py-6">
              <div className="mx-auto w-14 h-14 bg-emerald-50 rounded-full flex items-center justify-center mb-3">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 mb-1">
                Password Set Successfully!
              </h3>
              <p className="text-sm text-slate-500 mb-2">
                Signing you into your store dashboard now...
              </p>
              <div className="mt-4 flex justify-center">
                <div className="inline-block animate-spin rounded-full h-5 w-5 border-2 border-[#674FA3] border-t-transparent" />
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              {companyName && (
                <div className="p-3 bg-purple-50/60 rounded-xl border border-purple-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#674FA3]/10 flex items-center justify-center text-[#674FA3]">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-purple-900/70 font-medium">Configuring Store Access</p>
                    <p className="text-sm font-semibold text-purple-950 truncate">{companyName}</p>
                    {ownerEmail && (
                      <p className="text-xs text-slate-500 truncate">{ownerEmail}</p>
                    )}
                  </div>
                </div>
              )}

              {formError && (
                <div className="p-3 bg-rose-50 text-rose-700 text-xs rounded-xl border border-rose-100 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  New Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="At least 8 characters"
                    className="block w-full pl-10 pr-10 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#674FA3]/30 focus:border-[#674FA3] text-slate-900 placeholder-slate-400"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 focus:outline-none"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Confirm Password
                </label>
                <div className="relative rounded-xl shadow-sm">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="h-4 w-4" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-type your password"
                    className="block w-full pl-10 pr-3.5 py-2.5 text-sm rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[#674FA3]/30 focus:border-[#674FA3] text-slate-900 placeholder-slate-400"
                  />
                </div>
              </div>

              <div className="text-xs text-slate-500 bg-slate-50 p-2.5 rounded-lg border border-slate-100 leading-relaxed">
                By setting your password, your owner account and store management access will be immediately activated.
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full inline-flex justify-center items-center gap-2 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-[#674FA3] hover:bg-[#5b4591] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#674FA3] shadow-md shadow-[#674FA3]/25 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {submitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                    <span>Setting Password...</span>
                  </>
                ) : (
                  <>
                    <span>Set Password & Enter Dashboard</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SetupPassword() {
  return (
    <SetupPasswordErrorBoundary>
      <SetupPasswordContent />
    </SetupPasswordErrorBoundary>
  );
}
