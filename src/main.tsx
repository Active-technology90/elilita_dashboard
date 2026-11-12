
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/authContext.tsx";
import { PWAInstallProvider } from "./context/PWAInstallContext.tsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000,
      refetchOnWindowFocus: false,
      retry: 2,
    },
  },
});

createRoot(document.getElementById("root")!).render(
  
  <BrowserRouter>
    <PWAInstallProvider>
      <AuthProvider>
         <QueryClientProvider client={queryClient}>
          <App />
          </QueryClientProvider>
      </AuthProvider>
    </PWAInstallProvider>
  </BrowserRouter>,
);
