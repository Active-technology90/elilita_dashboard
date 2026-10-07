// src/components/guards/DashboardGuard.tsx
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/authContext";
import { AlertCircle, LogOut, ShieldOff } from "lucide-react";

interface DashboardGuardProps {
  children: React.ReactNode;
}

/**
 * Blocks access to the dashboard for signed-in users who are:
 *   - not super admins
 *   - not marketing users
 *   - and have no active company memberships
 */
export default function DashboardGuard({ children }: DashboardGuardProps) {
  const { isLoading, isAuthenticated, isRestricted, logout, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate("/signin", { replace: true });
      return;
    }

    // If restricted, do NOT auto-navigate — otherwise the message flashes.
    // The user can sign out manually from the restricted screen.
  }, [isLoading, isAuthenticated, isRestricted, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#5f4bb6] via-[#6a5acd] to-[#4b3ca7] p-4">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#6a5acd] border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  if (isRestricted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#5f4bb6] via-[#6a5acd] to-[#4b3ca7] p-4 sm:p-6">
        <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
            <ShieldOff className="h-7 w-7" />
          </div>

          <h2 className="mt-5 text-center text-lg font-bold text-gray-900 sm:text-xl">
            Dashboard access restricted
          </h2>

          <p className="mt-2 text-center text-sm leading-6 text-gray-500">
            Your account is not linked to any company yet. To use the
            dashboard, please ask a company owner or administrator to invite
            you, or contact support.
          </p>

          {user?.email && (
            <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-3 text-xs text-amber-800">
              <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
              <div className="min-w-0">
                <p className="font-semibold">Signed in as</p>
                <p className="truncate font-mono">{user.email}</p>
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={() => logout()}
            className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6a5acd] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#5a4ac0] active:scale-[0.98]"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}