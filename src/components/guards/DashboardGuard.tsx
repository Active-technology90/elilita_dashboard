
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/authContext";
import { LogOut, ShieldOff, UserX, Building2 } from "lucide-react";

interface DashboardGuardProps {
  children: React.ReactNode;
}

/* ──────────────────────────────────────────────────────────── */
/*  Reusable restricted card                                    */
/* ──────────────────────────────────────────────────────────── */
function RestrictedScreen({
  icon,
  title,
  message,
  onLogout,
}: {
  icon: React.ReactNode;
  title: string;
  message: string;
  onLogout: () => void;
}) {
  const { t } = useTranslation("dashboardGuard");

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#5f4bb6] via-[#6a5acd] to-[#4b3ca7] p-4 sm:p-6">
      <div className="w-full max-w-md rounded-3xl bg-white p-7 shadow-2xl sm:p-9">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-600">
          {icon}
        </div>

        <h2 className="mt-5 text-center text-lg font-bold text-gray-900 sm:text-xl">
          {title}
        </h2>

        <p className="mt-2 text-center text-sm leading-6 text-gray-500">
          {message}
        </p>

        <button
          type="button"
          onClick={onLogout}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-[#6a5acd] px-4 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-[#5a4ac0] active:scale-[0.98]"
        >
          <LogOut className="h-4 w-4" />
          {t("actions.signInWithDifferentAccount")}
        </button>
      </div>
    </div>
  );
}

export default function DashboardGuard({ children }: DashboardGuardProps) {
  const { t } = useTranslation("dashboardGuard");
  const { isLoading, isAuthenticated, isRestricted, logout, user } = useAuth();
  const navigate = useNavigate();

  /* ── User-level inactive ── */
  const isUserInactive = user && (user as any).is_active === false;

  /* ── Membership-level inactive ── */
  const memberships: any[] = Array.isArray((user as any)?.memberships)
    ? (user as any).memberships
    : [];
  const isSuperAdmin = (user as any)?.is_superuser === true;
  const isMarketing = (user as any)?.is_marketing === true;

  const hasActiveMembership = memberships.some(
    (m) => m?.is_active !== false,
  );

  // User has memberships but NONE are active → company access restricted
  const allMembershipsInactive =
    !isSuperAdmin &&
    !isMarketing &&
    memberships.length > 0 &&
    !hasActiveMembership;

  useEffect(() => {
    if (isLoading) return;

    if (!isAuthenticated) {
      navigate("/signin", { replace: true });
      return;
    }
  }, [isLoading, isAuthenticated, navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#5f4bb6] via-[#6a5acd] to-[#4b3ca7] p-4">
        <div className="rounded-2xl bg-white px-6 py-5 shadow-xl">
          <div className="flex items-center gap-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#6a5acd] border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">
              {t("loading")}
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // ── User deactivated ──
  if (isUserInactive) {
    return (
      <RestrictedScreen
        icon={<UserX className="h-7 w-7" />}
        title={t("userInactive.title")}
        message={t("userInactive.message")}
        onLogout={logout}
      />
    );
  }

  // ── Membership company inactive (all memberships inactive) ──
  if (allMembershipsInactive) {
    const companyNames = memberships
      .map((m) => m?.company_name)
      .filter(Boolean)
      .join(", ");

    return (
      <RestrictedScreen
        icon={<Building2 className="h-7 w-7" />}
        title={t("companyInactive.title")}
        message={t("companyInactive.message", {
          companyNames: companyNames ? ` (${companyNames})` : "",
        })}
        onLogout={logout}
      />
    );
  }

  // ── No memberships at all (non-super, non-marketing) ──
  if (isRestricted) {
    return (
      <RestrictedScreen
        icon={<ShieldOff className="h-7 w-7" />}
        title={t("restricted.title")}
        message={t("restricted.message")}
        onLogout={logout}
      />
    );
  }

  return <>{children}</>;
}
