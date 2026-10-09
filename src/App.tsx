// src/App.tsx
import { Routes, Route } from "react-router-dom";
import SignIn from "./pages/SignIn";
import SSOCallback from "./pages/SSOCallback";
import AdminDashboard from "./components/dashboard/AdminDashboard";
import BankManagement from "./components/dashboard/bank/BankManagement";
import DashboardGuard from "./components/guards/DashboardGuard";
import { CurrentCompanyProvider } from "./context/CurrentCompanyContext";
import { useAuth } from "./context/authContext";
import { ThemeProvider } from "./context/ThemeContext";
import { NotificationsProvider } from "./context/NotificationsContext";

export default function App() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/sso" element={<SSOCallback />} />
      <Route path="/signin" element={<SignIn />} />

      {/* Dashboard — restricted to super admins & users with active memberships */}
      <Route
        path="/dashboard"
        element={
          <DashboardGuard>
            <CurrentCompanyProvider
              userMemberships={user?.memberships || null}
            >
              <ThemeProvider>
                <NotificationsProvider>
                  <AdminDashboard />
                </NotificationsProvider>
              </ThemeProvider>
            </CurrentCompanyProvider>
          </DashboardGuard>
        }
      />

      {/* Bank Management — same restriction */}
      <Route
        path="/bank-accounts"
        element={
          <DashboardGuard>
            <CurrentCompanyProvider
              userMemberships={user?.memberships || null}
            >
              <ThemeProvider>
                <NotificationsProvider>
                  <BankManagement />
                </NotificationsProvider>
              </ThemeProvider>
            </CurrentCompanyProvider>
          </DashboardGuard>
        }
      />

      <Route path="/" element={<SignIn />} />
    </Routes>
  );
}