// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api, { setAuthToken } from "../services/api";
import type { User } from "../types";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (access: string, refresh: string, user: User | null) => Promise<void>;
  logout: () => Promise<void>;
  setUser: (user: User | null) => void;
  getAccessToken: () => string | null;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
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
  }, []);

  const login = async (access: string, refresh: string, userData: User | null) => {
    try {
      setAuthToken(access);
      localStorage.setItem("refresh", refresh);

      setUser(userData);
      setIsAuthenticated(true);
    } catch (error: any) {
      console.log("Login error:", error?.message);
    }
  };

  const logout = async () => {
    try {
      setAuthToken(null);
      localStorage.removeItem("refresh");

      setUser(null);
      setIsAuthenticated(false);
      navigate("/signin"); // adjust route as needed
    } catch (error: any) {
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

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
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