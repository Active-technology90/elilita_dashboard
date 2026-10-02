import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { exchangeSSOTicket, getMe, setAuthToken } from "../services/api";
import { useAuth } from "../context/authContext";
import { Loader2, AlertCircle, ArrowRight, CheckCircle2 } from "lucide-react";

export default function SSOCallback(): React.JSX.Element {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (attemptedRef.current) return;
    attemptedRef.current = true;

    const ticket = searchParams.get("ticket");
    if (!ticket) {
      setStatus("error");
      setErrorMessage("No authentication ticket was provided. Please open the dashboard from the mobile app.");
      return;
    }

    const performExchange = async () => {
      try {
        // 1. Exchange the single-use ticket for fresh JWT credentials
        const response = await exchangeSSOTicket(ticket);
        const { access, refresh } = response.data;

        if (!access || !refresh) {
          throw new Error("Invalid authorization response from server.");
        }

        // 2. Set tokens in localStorage and in memory headers immediately
        setAuthToken(access);
        localStorage.setItem("refresh", refresh);

        // 3. Fetch the user profile with the authenticated session
        let userData = null;
        try {
          const userResponse = await getMe();
          userData = userResponse.data;
        } catch (profileErr) {
          console.warn("SSO Profile fetch fallback", profileErr);
        }

        // 4. Update AuthContext state
        await login(access, refresh, userData);

        setStatus("success");

        // Small delay for smooth visual feedback before redirecting to dashboard
        setTimeout(() => {
          navigate("/dashboard", { replace: true });
        }, 400);
      } catch (err: any) {
        console.error("SSO Exchange Error:", err);
        setStatus("error");
        const detail =
          err?.response?.data?.detail ||
          err?.message ||
          "Session transfer failed or ticket has expired. Please launch from your app again.";
        setErrorMessage(detail);
      }
    };

    performExchange();
  }, [searchParams, navigate, login]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#5f4bb6] via-[#6a5acd] to-[#4b3ca7] p-4 sm:p-6 md:p-8">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 sm:p-10 text-center relative overflow-hidden">
        {/* Top Decorative Glow */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#6a5acd] to-[#a855f7]" />

        {/* Brand Logo */}
        <div className="w-16 h-16 rounded-full shadow-md mx-auto mb-4 overflow-hidden flex items-center justify-center bg-purple-50">
          <img
            src="/elilta1.jpg"
            alt="Elilita"
            className="w-full h-full object-cover"
            onError={(e) => {
              // Fallback if image fails
              (e.target as HTMLElement).style.display = "none";
            }}
          />
        </div>

        <h1 className="text-2xl font-bold text-gray-800">Elilita Dashboard</h1>

        {status === "loading" && (
          <div className="mt-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-purple-50 flex items-center justify-center mb-4">
              <Loader2 className="w-6 h-6 text-[#6a5acd] animate-spin" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Connecting your session...</p>
            <p className="text-xs text-gray-400 mt-1 max-w-xs">
              Securely signing you in with your authenticated mobile account.
            </p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-6 h-6 text-emerald-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">Authenticated!</p>
            <p className="text-xs text-gray-400 mt-1">
              Redirecting to your dashboard...
            </p>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6 flex flex-col items-center">
            <div className="w-12 h-12 rounded-full bg-red-50 flex items-center justify-center mb-4">
              <AlertCircle className="w-6 h-6 text-red-500" />
            </div>
            <p className="text-sm font-semibold text-gray-800">Connection Failed</p>
            <p className="text-xs text-red-600 bg-red-50 border border-red-100 rounded-xl p-3 mt-2 w-full">
              {errorMessage}
            </p>

            <button
              onClick={() => navigate("/signin", { replace: true })}
              className="mt-5 w-full py-3 px-4 bg-[#6a5acd] hover:bg-[#5f4bb6] text-white font-medium rounded-xl flex items-center justify-center gap-2 transition shadow-md"
            >
              <span>Go to Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
