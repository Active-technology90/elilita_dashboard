// src/context/AuthContext.tsx
import React, {
  createContext,
  useState,
  useEffect,
  useMemo,
  useContext,
} from "react";
import { useNavigate, useLocation } from "react-router-dom";
import api, { setAuthToken } from "../services/api";
import type { User } from "../types";

/* -------------------------------------------------------------------------- */
/*                                   TYPES                                    */
/* -------------------------------------------------------------------------- */

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;

  /**
   * True only when the backend explicitly flags the user as a superuser.
   */
  isSuperAdmin: boolean;

  /**
   * True when the backend flags the user as a marketing user.
   */
  isMarketing: boolean;

  /**
   * True when the user belongs to at least one active company membership.
   */
  hasMemberships: boolean;

  /**
   * True when the user can access the dashboard:
   * super admin OR marketing user OR has at least one active membership.
   */
  canAccessDashboard: boolean;

  /**
   * True when the user is signed in but has no dashboard access.
   */
  isRestricted: boolean;

  login: (access: string, refresh: string, user: User | null) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  getAccessToken: () => string | null;
}

/* -------------------------------------------------------------------------- */
/*                                  CONTEXT                                   */
/* -------------------------------------------------------------------------- */

export const AuthContext = createContext<AuthContextType | undefined>(
  undefined
);

/**
 * Custom hook to access the auth context.
 * Exported as a named export so components can do:
 *
 *   import { useAuth } from "../context/AuthContext";
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

/* -------------------------------------------------------------------------- */
/*                                  PROVIDER                                  */
/* -------------------------------------------------------------------------- */

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  /* ──────────────────────────────────────────────────────────────
     Initialize auth on mount / route change
     ────────────────────────────────────────────────────────────── */
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      // 🛑 Skip auto-init on /signin page — SignIn.tsx handles the flow itself.
      // This prevents the context from racing against the login form and
      // wiping the error message shown to inactive users.
      if (location.pathname.includes("/signin")) {
        if (isMounted) {
          setIsLoading(false);
          setIsAuthenticated(false);
          setUser(null);
        }
        return;
      }

      try {
        const accessToken = localStorage.getItem("access");

        if (!accessToken) {
          if (isMounted) {
            setIsAuthenticated(false);
            setUser(null);
          }
          return;
        }

        const response = await api.get("/auth/users/me/", {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        });

        if (isMounted) {
          setUser(response?.data ?? null);
          setIsAuthenticated(true);
        }
      } catch (error: any) {
        // eslint-disable-next-line no-console
        console.log("Auth init error:", error?.message);

        localStorage.removeItem("access");
        localStorage.removeItem("refresh");

        if (isMounted) {
          setUser(null);
          setIsAuthenticated(false);
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  /* ──────────────────────────────────────────────────────────────
     Derived permission flags — single source of truth
     ────────────────────────────────────────────────────────────── */

  const isSuperAdmin = useMemo(() => {
    if (!user) return false;
    const u = user as any;
    return u.is_superuser === true || u.isSuperAdmin === true;
  }, [user]);

  const isMarketing = useMemo(() => {
    if (!user) return false;
    const u = user as any;
    return u.is_marketing === true;
  }, [user]);

  const hasMemberships = useMemo(() => {
    if (!user) return false;
    const memberships = (user as any)?.memberships;
    if (!Array.isArray(memberships)) return false;

    // Only count active memberships — `is_active: false` grants no access.
    return memberships.some((m: any) => m?.is_active !== false);
  }, [user]);

  const canAccessDashboard = useMemo(() => {
    if (!user) return false;
    return isSuperAdmin || isMarketing || hasMemberships;
  }, [user, isSuperAdmin, isMarketing, hasMemberships]);

  const isRestricted = useMemo(() => {
    if (!user) return false;
    return !canAccessDashboard;
  }, [user, canAccessDashboard]);

  /* ──────────────────────────────────────────────────────────────
     Actions
     ────────────────────────────────────────────────────────────── */

  const login = async (
    access: string,
    refresh: string,
    userData: User | null
  ) => {
    try {
      setAuthToken(access);
      localStorage.setItem("refresh", refresh);

      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.log("Login error:", error?.message);
    }
  };

  const logout = async () => {
    try {
      setAuthToken(null);
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");

      setUser(null);
      setIsAuthenticated(false);
      navigate("/signin");
    } catch (error: any) {
      // eslint-disable-next-line no-console
      console.log("Logout error:", error?.message);
    }
  };

  const getAccessToken = (): string | null => {
    try {
      return localStorage.getItem("access");
    } catch {
      return null;
    }
  };

  /* ──────────────────────────────────────────────────────────────
     Provider
     ────────────────────────────────────────────────────────────── */

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        isSuperAdmin,
        isMarketing,
        hasMemberships,
        canAccessDashboard,
        isRestricted,
        login,
        logout,
        setUser,
        getAccessToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};