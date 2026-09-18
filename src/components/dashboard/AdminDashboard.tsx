import { useState, useRef, useEffect, createContext, useContext } from "react";
import { RefreshButton } from "../ui/RefreshButton";
import {
  LayoutDashboard,
  Users,
  Package,
  ShoppingBag,
  CreditCard,
  AlertTriangle,
  LogOut,
  Menu,
  X,
  Layout,
  ChevronDown,
  ChevronUp,
  FileText,
  Building2,
  PanelLeftClose,
  PanelLeftOpen,
  User,
  ListOrdered,
  Proportions,
  Bell,
  Settings as SettingsIcon,
  Banknote,
  ClipboardList,
  Target,
  CalendarIcon,
  Wrench,
  CalendarDays,
  Clock,
  Repeat,
  // Images,
} from "lucide-react";
import { useAuth } from "../../hooks/useAuth";
import { useCurrentCompany } from "../../context/CurrentCompanyContext";

import Overview, { type DashboardTab } from "./overview/Overview";
import CompanyUsers from "./companyUser/CompanyUsers";
import CompanyOrders from "./vedorOrders/CompanyOrders";
import Payments from "./Payments";
import DisputesManagement from "./disputes/DisputesManagement";
import BankManagement from "./bank/BankManagement";
import CompanyProducts from "./company-products/CompanyProducts";
import CategoryManagement from "./CategoryManagement";
import SubCategoryManagement from "./SubCategoryManagement";
import HeadCompanyManagement from "./HeadCompanyManagement/HeadCompanyManagement";
import MasterOrders from "./masterOrders/MasterOrders";
import AdminProfile from "./AdminProfile";
import CompanyManagement from "./CompanyManagement/CompanyManagement";
import SuperAdminUsers from "./UserManagement/SuperAdminUsers";
import AdManagement from "./AdManagement";
import SettingsPage from "./settings/Settings";
import NotificationsPage from "./notifications/NotificationsPage";
import NotificationBell from "./notifications/NotificationBell";
import {
  clearPushParamsFromUrl,
  readPushParamsFromUrl,
  resolvePushTab,
  type PushNavigationPayload,
} from "../../utils/notificationNavigation";
import BillingPage from "./subscriptions/BillingPage";
import SuperadminSubscriptions from "./subscriptions/SuperadminSubscriptions";
import MarketingOverview from "./overview/MarketingOverview";
import MarketingAgentsManagement from "./UserManagement/MarketingAgentsManagement";
import LeadsManagement from "../marketing/LeadsManagement";
import TasksManagement from "../marketing/TasksManagement";
import TargetsManagement from "../marketing/TargetsManagement";
import CalendarManagement from "../marketing/CalendarManagement";
import CompanyServices from "./services/CompanyServices";
import ServiceBookings from "./services/ServiceBookings";
import ServiceSubscriptions from "./services/ServiceSubscriptions";
// import PortfolioManagement from "./services/PortfolioManagement";
import AvailabilityManagement from "./services/AvailabilityManagement";
import StaffManagement from "./services/StaffManagement";

import {
  getAdminVendorOrders,
  getCompanyVendorOrders,
} from "../../services/api";
import { VendorOrderDetailModal } from "./vedorOrders/VendorOrderDetailModal";
type Tab =
  | "overview"
  | "leads"
  | "tasks"
  | "targets"
  | "calendar"
  | "categories"
  | "subcategories"
  | "headcompanies"
  | "companies"
  | "products"
  | "users"
  | "masterOrders"
  | "companyOrders"
  | "payments"
  | "disputes"
  | "bankAccounts"
  | "profile"
  | "add advertisment"
  | "superUsers"
  | "notifications"
  | "settings"
  | "billing"
  | "adminSubscriptions"
  | "marketingAgents"
  | "serviceOfferings"
  | "serviceBookings"
  | "serviceSubscriptions"
  | "portfolio"
  | "availability"
  | "serviceStaff";

// ─────────────────────────────────────────────────────────────
// Read‑only Context – tells child components if they are in viewer mode
// ─────────────────────────────────────────────────────────────
const ReadOnlyContext = createContext<boolean>(false);
export const useReadOnly = () => useContext(ReadOnlyContext);

// ════════════════════════════════════════════════════════════
// OrdersMenu (unchanged)
// ════════════════════════════════════════════════════════════
function OrdersMenu({
  collapsed,
  activeTab,
  onNavigate,
  showMasterOrders,
  ordersMenuOpen,
  onToggleOrdersMenu,
}: {
  collapsed: boolean;
  activeTab: Tab;
  onNavigate: (tab: Tab) => void;
  showMasterOrders: boolean;
  ordersMenuOpen: boolean;
  onToggleOrdersMenu: () => void;
}) {
  const [collapsedOrdersOpen, setCollapsedOrdersOpen] = useState(false);
  const ordersRef = useRef<HTMLDivElement>(null);

  const isActive =
    activeTab === "masterOrders" ||
    activeTab === "companyOrders";

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        ordersRef.current &&
        !ordersRef.current.contains(event.target as Node)
      ) {
        setCollapsedOrdersOpen(false);
      }
    };

    if (collapsedOrdersOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, [collapsedOrdersOpen]);

  if (!showMasterOrders) {
    return (
      <button
        type="button"
        title={collapsed ? "All Orders" : undefined}
        onClick={() => onNavigate("companyOrders")}
        className={`
          group
          flex
          h-9
          w-full
          items-center
          rounded-lg
          text-[12px]
          font-medium
          transition-colors
          duration-150
          [&_svg]:h-4
          [&_svg]:w-4

          ${
            collapsed
              ? "justify-center px-2"
              : "gap-2.5 px-3"
          }

          ${
            activeTab === "companyOrders"
              ? "bg-white text-secondary shadow-sm"
              : "text-white/75 hover:bg-white/10 hover:text-white"
          }
        `}
      >
        <ShoppingBag className="shrink-0" />

        {!collapsed && (
          <span className="truncate">All Orders</span>
        )}
      </button>
    );
  }

  if (!collapsed) {
    return (
      <div>
        <button
          type="button"
          onClick={onToggleOrdersMenu}
          className={`
            group
            flex
            h-9
            w-full
            items-center
            justify-between
            rounded-lg
            px-3
            text-[12px]
            font-medium
            transition-colors
            duration-150
            [&_svg]:h-4
            [&_svg]:w-4

            ${
              isActive
                ? "bg-white text-secondary shadow-sm"
                : "text-white/75 hover:bg-white/10 hover:text-white"
            }
          `}
        >
          <div className="flex min-w-0 items-center gap-2.5">
            <ShoppingBag className="shrink-0" />
            <span className="truncate">Orders</span>
          </div>

          {ordersMenuOpen ? (
            <ChevronUp className="shrink-0" />
          ) : (
            <ChevronDown className="shrink-0" />
          )}
        </button>

        {ordersMenuOpen && (
          <div
            className="
              ml-4
              mt-1
              space-y-0.5
              border-l
              border-white/20
              pl-2
            "
          >
            {showMasterOrders && (
              <button
                type="button"
                onClick={() => onNavigate("masterOrders")}
                className={`
                  flex
                  h-8
                  w-full
                  items-center
                  gap-2
                  rounded-md
                  px-2.5
                  text-left
                  text-[11px]
                  transition-colors
                  duration-150
                  [&_svg]:h-3.5
                  [&_svg]:w-3.5

                  ${
                    activeTab === "masterOrders"
                      ? "bg-white/15 font-semibold text-white"
                      : "text-white/60 hover:bg-white/10 hover:text-white"
                  }
                `}
              >
                <FileText className="shrink-0" />
                <span className="truncate">Master Orders</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => onNavigate("companyOrders")}
              className={`
                flex
                h-8
                w-full
                items-center
                gap-2
                rounded-md
                px-2.5
                text-left
                text-[11px]
                transition-colors
                duration-150
                [&_svg]:h-3.5
                [&_svg]:w-3.5

                ${
                  activeTab === "companyOrders"
                    ? "bg-white/15 font-semibold text-white"
                    : "text-white/60 hover:bg-white/10 hover:text-white"
                }
              `}
            >
              <ListOrdered className="shrink-0" />
              <span className="truncate">All Orders</span>
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative" ref={ordersRef}>
      <button
        type="button"
        title="Orders"
        onClick={() =>
          setCollapsedOrdersOpen(!collapsedOrdersOpen)
        }
        className={`
          flex
          h-9
          w-full
          items-center
          justify-center
          rounded-lg
          px-2
          transition-colors
          duration-150
          [&_svg]:h-4
          [&_svg]:w-4

          ${
            isActive
              ? "bg-white text-secondary shadow-sm"
              : "text-white/75 hover:bg-white/10 hover:text-white"
          }
        `}
      >
        <ShoppingBag />
      </button>

      {collapsedOrdersOpen && (
        <div
          className="
            absolute
            left-full
            top-0
            z-[70]
            ml-2
            w-44
            overflow-hidden
            rounded-lg
            border
            border-secondary/10
            bg-white
            p-1
            shadow-[0_12px_32px_rgba(0,0,0,0.14)]
          "
        >
          {showMasterOrders && (
            <button
              type="button"
              onClick={() => {
                onNavigate("masterOrders");
                setCollapsedOrdersOpen(false);
              }}
              className={`
                flex
                h-8
                w-full
                items-center
                gap-2
                rounded-md
                px-2.5
                text-left
                text-[11px]
                transition-colors
                [&_svg]:h-3.5
                [&_svg]:w-3.5

                ${
                  activeTab === "masterOrders"
                    ? "bg-secondary/[0.08] font-semibold text-secondary"
                    : "text-gray-600 hover:bg-secondary/[0.04] hover:text-secondary"
                }
              `}
            >
              <FileText />
              Master Orders
            </button>
          )}

          <button
            type="button"
            onClick={() => {
              onNavigate("companyOrders");
              setCollapsedOrdersOpen(false);
            }}
            className={`
              flex
              h-8
              w-full
              items-center
              gap-2
              rounded-md
              px-2.5
              text-left
              text-[11px]
              transition-colors
              [&_svg]:h-3.5
              [&_svg]:w-3.5

              ${
                activeTab === "companyOrders"
                  ? "bg-secondary/[0.08] font-semibold text-secondary"
                  : "text-gray-600 hover:bg-secondary/[0.04] hover:text-secondary"
              }
            `}
          >
            <Building2 />
            Company Orders
          </button>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════
// Main Dashboard
// ════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [ordersMenuOpen, setOrdersMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const { company } = useCurrentCompany();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  const [companyLogo, setCompanyLogo] = useState<string | null>(null);
  const [companiesList, setCompaniesList] = useState<any[]>([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [notificationOrder, setNotificationOrder] = useState<any>(null);
  const [notificationReceipt, setNotificationReceipt] = useState<any>(null);
  //  const mainContentRef = useRef<HTMLDivElement>(null);
  const scrollableRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    // Our backend embeds "sub_tx_ref" in the return URL — this is our own tx_ref
    const txRef = queryParams.get("sub_tx_ref");
    // If a Chapa payment redirect occurred, automatically switch to the billing tab
    if (txRef) {
      setActiveTab("billing");
    }
  }, []);

  // ── Core identity flags ────────────────────────────────
  const isMarketing = !!user?.is_marketing;
  const isSuperAdmin = !user?.memberships?.length && !isMarketing;
  const isViewer = !isSuperAdmin && !isMarketing && company?.role === "viewer";
  const isDispatcher =
    !isSuperAdmin && !isMarketing && company?.role === "staff";

  // For viewers: show everything like super admin but read‑only
  const showPlatformAdmin = isSuperAdmin || isViewer;
  const showMasterOrders = isSuperAdmin;

  // Hide "Company Users" only for staff (not for viewers)
  // const hideUsersSidebar = !isSuperAdmin && company?.role === "staff";

  const currentCompanyMeta = companiesList.find(
    (c: any) => c.slug === company?.slug,
  );
  const showServiceMenu =
    isSuperAdmin ||
    currentCompanyMeta?.business_type === "service" ||
    user?.memberships?.some(
      (m: any) =>
        m.company_slug === company?.slug &&
        companiesList.find((c: any) => c.slug === m.company_slug)
          ?.business_type === "service",
    );
  console.log("user:", user);
  console.log("company", company);
  console.log("companiesList", companiesList);
  console.log("currentCompanyMeta", currentCompanyMeta);
  const navigate = (tab: Tab) => {
    setActiveTab(tab);
    setIsSidebarOpen(false);
    setProfileDropdownOpen(false);
  };

  const navigateFromOverview = (tab: DashboardTab) => {
    if (tab === "allOrders") {
      navigate("masterOrders");
    } else {
      navigate(tab as Tab);
    }
  };

  const applyPushNavigation = (payload: PushNavigationPayload) => {
    const tab = resolvePushTab(payload, isSuperAdmin);
    navigate(tab);
    clearPushParamsFromUrl();
  };

  // Cold start: user clicked OS notification while browser was closed.
  useEffect(() => {
    const payload = readPushParamsFromUrl();
    if (payload) applyPushNavigation(payload);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  // Warm start: dashboard already open, service worker sent postMessage.
  useEffect(() => {
    const handler = (event: Event) => {
      applyPushNavigation((event as CustomEvent<PushNavigationPayload>).detail);
    };
    window.addEventListener("admin-push-navigate", handler);
    return () => window.removeEventListener("admin-push-navigate", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isSuperAdmin]);

  // Handle logout with confirmation
  const handleLogoutClick = () => {
    setProfileDropdownOpen(false);
    setShowLogoutConfirm(true);
  };

  const confirmLogout = () => {
    setShowLogoutConfirm(false);
    logout();
  };
  // Handle refresh data - refresh current tab only
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      // Increment refreshKey to force re-render of current component
      setRefreshKey((prev) => prev + 1);
      // Small delay to show animation
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error("Refresh failed:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  // Fetch companies list to get company logo
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const { getCompanies } = await import("../../services/api");

        let page = 1;
        let hasNext = true;
        const allCompanies: any[] = [];

        while (hasNext) {
          const response = await getCompanies({
            page,
            page_size: 100,
          });

          const data = response.data;

          allCompanies.push(...(data.results || []));

          hasNext = !!data.next; // DRF pagination
          page++;
        }

        setCompaniesList(allCompanies);
      } catch (error) {
        console.error("Failed to fetch companies:", error);
      }
    };

    fetchCompanies();
  }, []);

  // Update company logo when company changes
  useEffect(() => {
    if (!company?.slug || !companiesList.length) {
      setCompanyLogo(null);
      return;
    }
    const foundCompany = companiesList.find(
      (c: any) => c.slug === company.slug,
    );
    setCompanyLogo(foundCompany?.logo || null);
  }, [company, companiesList]);

  // Handle scroll event for header color change
  useEffect(() => {
    const scrollableElement = scrollableRef.current;
    if (!scrollableElement) return;

    const handleScroll = () => {
      if (scrollableElement.scrollTop > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    scrollableElement.addEventListener("scroll", handleScroll);
    return () => scrollableElement.removeEventListener("scroll", handleScroll);
  }, []);
  const fetchOrderById = async (orderId: number) => {
    const token = localStorage.getItem("access");
    if (!token) return null;

    try {
      const query = {
        page: 1,
        page_size: 1,
        ordering: "-created_at",
        search: String(orderId),
      };

      if (isSuperAdmin || isViewer) {
        const res = await getAdminVendorOrders(query);
        return res.data.results[0] || null;
      } else if (company?.slug) {
        const res = await getCompanyVendorOrders(company.slug, query);
        return res.data.results[0] || null;
      }
    } catch (error) {
      console.error("Failed to fetch order by ID", error);
    }
    return null;
  };

  const handleNotificationClick = async (notification: any) => {
    const vendorOrderId = notification.data?.vendor_order_id;
    if (!vendorOrderId) return;

    const order = await fetchOrderById(vendorOrderId);
    if (order) {
      setNotificationOrder(order);
      setNotificationReceipt(order.receipt || null);
    }
  };
  const handleNotificationOrderUpdate = async () => {
    if (!notificationOrder) return;
    const freshOrder = await fetchOrderById(notificationOrder.id);
    if (freshOrder) {
      setNotificationOrder(freshOrder);
      setNotificationReceipt(freshOrder.receipt || null);
    }
  };
  const renderContent = () => {
    const companyKey = company?.slug || "super";
    // Create a unique key that changes on refresh to force re-render
    const componentKey = `${companyKey}-${refreshKey}`;

    // Wrap each content component with ReadOnlyContext provider
    const content = (() => {
      switch (activeTab) {
        case "overview":
          return isMarketing ? (
            <MarketingOverview key={componentKey} />
          ) : (
            <Overview key={componentKey} onNavigate={navigateFromOverview} />
          );
        case "leads":
          return <LeadsManagement key={componentKey} />;
        case "tasks":
          return <TasksManagement key={componentKey} />;
        case "targets":
          return <TargetsManagement key={componentKey} />;
        case "calendar":
          return <CalendarManagement key={componentKey} />;

        case "products":
          return <CompanyProducts key={componentKey} />;
        case "users":
          return <CompanyUsers key={componentKey} />;
        case "masterOrders":
          return <MasterOrders key={componentKey} />;
        case "companyOrders":
          return <CompanyOrders key={componentKey} />;
        case "payments":
          return <Payments key={componentKey} />;
        case "disputes":
          return <DisputesManagement key={componentKey} />;
        case "bankAccounts":
          return <BankManagement key={componentKey} />;
        case "profile":
          return <AdminProfile key={componentKey} />;
        case "categories":
          return <CategoryManagement key={componentKey} />;
        case "subcategories":
          return <SubCategoryManagement key={componentKey} />;
        case "superUsers":
          return <SuperAdminUsers />;
        case "add advertisment":
          return <AdManagement />;
        case "headcompanies":
          return <HeadCompanyManagement key={componentKey} />;
        case "companies":
          return <CompanyManagement key={componentKey} />;
        case "settings":
          return <SettingsPage key={componentKey} />;
        case "adminSubscriptions":
          return <SuperadminSubscriptions key={componentKey} />;
        case "billing":
          return <BillingPage key={componentKey} />;
        case "notifications":
          return (
            <NotificationsPage
              key={componentKey}
              onNotificationClick={handleNotificationClick}
            />
          );
        case "marketingAgents":
          return <MarketingAgentsManagement key={componentKey} />;
        case "serviceOfferings":
          return <CompanyServices key={componentKey} />;
        case "serviceBookings":
          return <ServiceBookings key={componentKey} />;
        case "serviceSubscriptions":
          return <ServiceSubscriptions key={componentKey} />;
        // case "portfolio":
        //   return <PortfolioManagement key={componentKey} />;
        case "availability":
          return <AvailabilityManagement key={componentKey} />;
        case "serviceStaff":
          return <StaffManagement key={componentKey} />;

        default:
          return (
            <Overview key={componentKey} onNavigate={navigateFromOverview} />
          );
      }
    })();

    return (
      <ReadOnlyContext.Provider key={companyKey} value={isViewer}>
        {content}
      </ReadOnlyContext.Provider>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/[0.025] font-sans text-gray-900">
      {/* Mobile overlay */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-secondary/25 backdrop-blur-[1px] lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed
          left-0
          top-0
          z-50
          flex
          h-screen
          flex-col
          border-r
          border-white/15
          bg-secondary
          text-white
          shadow-[4px_0_18px_rgba(0,0,0,0.08)]
          transition-all
          duration-200
          lg:relative

          ${sidebarCollapsed ? "w-14" : "w-[232px]"}

          ${
            isSidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        {/* Brand — matches the h-16 app header so the divider stays perfectly aligned */}
        <div
          className={`
            flex
            h-16
            shrink-0
            items-center
            border-b
            border-white/15
            px-2.5

            ${
              sidebarCollapsed
                ? "justify-center"
                : "gap-2.5"
            }
          `}
        >
          <div
            className="
              h-9
              w-9
              shrink-0
              overflow-hidden
              rounded-xl
              border
              border-white/20
              bg-white
              p-0.5
              shadow-sm
            "
          >
            <img
              src="/elilta1.jpg"
              alt="Elilita Logo"
              className="h-full w-full rounded-[9px] object-cover"
            />
          </div>

          {!sidebarCollapsed && (
            <div className="min-w-0 flex-1">
              <p
                className="
                  truncate
                  text-[14px]
                  font-bold
                  leading-none
                  tracking-[-0.02em]
                  text-white
                "
              >
                Elilita
              </p>

              <p
                className="
                  mt-1.5
                  text-[9px]
                  font-semibold
                  uppercase
                  leading-none
                  tracking-[0.11em]
                  text-white/50
                "
              >
                Admin
              </p>
            </div>
          )}

          {!sidebarCollapsed && (
            <button
              type="button"
              onClick={() => setIsSidebarOpen(false)}
              className="
                ml-auto
                flex
                h-7
                w-7
                items-center
                justify-center
                rounded-md
                text-white/60
                transition-colors
                hover:bg-white/10
                hover:text-white
                lg:hidden
              "
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <nav className="custom-scrollbar flex-1 space-y-0.5 overflow-y-auto px-2 py-2.5 scrollbar-thin">
          {isMarketing ? (
            <>
              <SidebarItem
                icon={<LayoutDashboard className="h-5 w-5" />}
                label="Performance"
                active={activeTab === "overview"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("overview")}
              />

              <SidebarItem
                icon={<Building2 className="h-5 w-5" />}
                label="Companies"
                active={activeTab === "companies"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("companies")}
              />
              <SidebarItem
                icon={<CreditCard className="h-5 w-5" />}
                label="Billing"
                active={activeTab === "billing"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("billing")}
              />
              <SidebarItem
                icon={<Users className="h-5 w-5" />}
                label="Leads"
                active={activeTab === "leads"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("leads")}
              />
              <SidebarItem
                icon={<ClipboardList className="h-5 w-5" />}
                label="Tasks"
                active={activeTab === "tasks"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("tasks")}
              />
              <SidebarItem
                icon={<Target className="h-5 w-5" />}
                label="Targets"
                active={activeTab === "targets"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("targets")}
              />
              <SidebarItem
                icon={<CalendarIcon className="h-5 w-5" />}
                label="Calendar"
                active={activeTab === "calendar"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("calendar")}
              />

              <SidebarItem
                icon={<User className="h-5 w-5" />}
                label="Profile"
                active={activeTab === "profile"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("profile")}
              />
            </>
          ) : (
            <>
              <SidebarItem
                icon={<LayoutDashboard className="h-5 w-5" />}
                label="Dashboard"
                active={activeTab === "overview"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("overview")}
              />

              {/* Platform Admin section – shown for super admin AND viewer */}
              {showPlatformAdmin && (
                <>
                  <div
                    className={`mb-1 mt-3 px-2.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45 ${sidebarCollapsed ? "hidden" : ""
                      }`}
                  >
                    Platform Admin
                  </div>
                  <SidebarItem
                    icon={<Layout className="h-5 w-5" />}
                    label="Categories"
                    active={activeTab === "categories"}
                    collapsed={sidebarCollapsed}
                    onClick={() => navigate("categories")}
                  />
                  <SidebarItem
                    icon={<Proportions className="h-5 w-5" />}
                    label="SubCategories"
                    active={activeTab === "subcategories"}
                    collapsed={sidebarCollapsed}
                    onClick={() => navigate("subcategories")}
                  />
                </>
              )}

              {isSuperAdmin && (
                <SidebarItem
                  icon={<Building2 className="h-5 w-5" />}
                  label="Head Companies"
                  active={activeTab === "headcompanies"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("headcompanies")}
                />
              )}
              {!isDispatcher && (
                <SidebarItem
                  icon={<Building2 className="h-5 w-5" />}
                  label={
                    !user?.memberships?.length ? "Companies" : "Company Detail"
                  }
                  active={activeTab === "companies"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("companies")}
                />
              )}
              {isSuperAdmin && (
                <SidebarItem
                  icon={<Users className="h-5 w-5" />}
                  label="User Management"
                  active={activeTab === "superUsers"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("superUsers")}
                />
              )}
              {isSuperAdmin && (
                <SidebarItem
                  icon={<Users className="h-5 w-5" />}
                  label="Marketing Agents"
                  active={activeTab === "marketingAgents"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("marketingAgents")}
                />
              )}
              {/* {showPlatformAdmin && ( */}
              {!isDispatcher && (
                <SidebarItem
                  icon={<Users className="h-5 w-5" />}
                  label="Ads Management"
                  active={activeTab === "add advertisment"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("add advertisment")}
                />
              )}
              {/* // )} */}
              {/* Bank Accounts - Below Ads Management */}
              {!isDispatcher && (
                <SidebarItem
                  icon={<Banknote className="h-5 w-5" />}
                  label="Bank Accounts"
                  active={activeTab === "bankAccounts"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("bankAccounts")}
                />
              )}

              <div
                className={`mb-1 mt-3 px-2.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45 ${sidebarCollapsed ? "hidden" : ""
                  }`}
              >
                Management
              </div>

              <OrdersMenu
                collapsed={sidebarCollapsed}
                activeTab={activeTab}
                onNavigate={navigate}
                showMasterOrders={showMasterOrders}
                ordersMenuOpen={ordersMenuOpen}
                onToggleOrdersMenu={() => setOrdersMenuOpen(!ordersMenuOpen)}
              />

              {!isDispatcher && (
                <SidebarItem
                  icon={<CreditCard className="h-5 w-5" />}
                  label="Payments"
                  active={activeTab === "payments"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("payments")}
                />
              )}

              {showPlatformAdmin && (
                <SidebarItem
                  icon={<AlertTriangle className="h-5 w-5 text-amber-400" />}
                  label="Disputes & Refunds"
                  active={activeTab === "disputes"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("disputes")}
                />
              )}

              <SidebarItem
                icon={<Package className="h-5 w-5" />}
                label="All Products"
                active={activeTab === "products"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("products")}
              />
              {showServiceMenu && (
                <>
                  <div
                    className={`mb-1 mt-3 px-2.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45 ${sidebarCollapsed ? "hidden" : ""}`}
                  >
                    Services
                  </div>
                  <SidebarItem
                    icon={<Wrench className="h-5 w-5" />}
                    label="My Services"
                    active={activeTab === "serviceOfferings"}
                    collapsed={sidebarCollapsed}
                    onClick={() => navigate("serviceOfferings")}
                  />
                  <SidebarItem
                    icon={<CalendarDays className="h-5 w-5" />}
                    label="Bookings"
                    active={activeTab === "serviceBookings"}
                    collapsed={sidebarCollapsed}
                    onClick={() => navigate("serviceBookings")}
                  />
                  <SidebarItem
                    icon={<Repeat className="h-5 w-5" />}
                    label="Recurring Contracts"
                    active={activeTab === "serviceSubscriptions"}
                    collapsed={sidebarCollapsed}
                    onClick={() => navigate("serviceSubscriptions")}
                  />
                  {/* <SidebarItem
                icon={<Images className="h-5 w-5" />}
                label="Portfolio"
                active={activeTab === "portfolio"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("portfolio")}
              /> */}
                  <SidebarItem
                    icon={<Clock className="h-5 w-5" />}
                    label="Availability"
                    active={activeTab === "availability"}
                    collapsed={sidebarCollapsed}
                    onClick={() => navigate("availability")}
                  />
                  <SidebarItem
                    icon={<Users className="h-5 w-5" />}
                    label="Dispatchers & Specialists"
                    active={activeTab === "serviceStaff"}
                    collapsed={sidebarCollapsed}
                    onClick={() => navigate("serviceStaff")}
                  />
                </>
              )}
              {/* Only for super admin (not viewer) */}
              <div
                className={`mb-1 mt-3 px-2.5 text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45 ${sidebarCollapsed ? "hidden" : ""}`}
              >
                Platform
              </div>
              {/* {!hideUsersSidebar && ( */}
              {!isDispatcher && (
                <SidebarItem
                  icon={<Users className="h-5 w-5" />}
                  label="All Users"
                  active={activeTab === "users"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("users")}
                />
              )}
              {/* )} */}

              <SidebarItem
                icon={<Bell className="h-5 w-5" />}
                label="Notifications"
                active={activeTab === "notifications"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("notifications")}
              />

              <SidebarItem
                icon={<User className="h-5 w-5" />}
                label="Profile"
                active={activeTab === "profile"}
                collapsed={sidebarCollapsed}
                onClick={() => navigate("profile")}
              />

              {isSuperAdmin && (
                <SidebarItem
                  icon={<CreditCard className="h-5 w-5" />}
                  label="Subscription Plans"
                  active={activeTab === "adminSubscriptions"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("adminSubscriptions")}
                />
              )}

              {!isDispatcher && (
                <SidebarItem
                  icon={<SettingsIcon className="h-5 w-5" />}
                  label="Settings"
                  active={activeTab === "settings"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("settings")}
                />
              )}

              {!isSuperAdmin && !isDispatcher && (
                <SidebarItem
                  icon={<CreditCard className="h-5 w-5" />}
                  label="Billing"
                  active={activeTab === "billing"}
                  collapsed={sidebarCollapsed}
                  onClick={() => navigate("billing")}
                />
              )}

              {/* <div className={`mt-8 px-4 ${sidebarCollapsed ? "hidden" : ""}`}>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
              Account
            </p>
          </div>
          <button
            onClick={logout}
            className={`flex items-center gap-3.5 w-full px-4 py-3.5 text-sm font-medium rounded-xl transition-all duration-200 group text-red-300 hover:bg-red-500/10 hover:text-red-200 ${
              sidebarCollapsed ? "justify-center px-2" : ""
            }`}
          >
            <LogOut className="h-5 w-5 text-red-300 group-hover:text-red-200" />
            {!sidebarCollapsed && <span>Logout</span>}
          </button> */}
            </>
          )}
        </nav>

        <div
          className={`
            mx-2
            mb-2
            flex
            shrink-0
            border-t
            border-white/15
            pt-2

            ${
              sidebarCollapsed
                ? "justify-center"
                : "justify-end"
            }
          `}
        >
          <button
            onClick={() => setSidebarCollapsed((prev) => !prev)}
            className="flex h-7 w-7 items-center justify-center rounded-md text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <PanelLeftOpen className="h-4 w-4" />
            ) : (
              <PanelLeftClose className="h-4 w-4" />
            )}
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex min-w-0 flex-1 flex-col overflow-hidden ">
        <header
          className={`
            sticky
            top-0
            z-30
            flex
            h-16
            shrink-0
            items-center
            justify-between
            border-b
            border-secondary/10
            bg-white
            px-2.5
            transition-shadow
            duration-150
            sm:px-3
            lg:px-4

            ${
              isScrolled
                ? "shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
                : ""
            }
          `}
        >
          {/* Left context */}
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <button
              type="button"
              onClick={() =>
                setIsSidebarOpen((prev) => !prev)
              }
              className="
                flex
                h-8
                w-8
                shrink-0
                items-center
                justify-center
                rounded-md
                border
                border-secondary/10
                bg-white
                text-secondary
                transition-colors
                hover:bg-secondary/[0.04]
                lg:hidden
              "
            >
              <Menu className="h-4 w-4" />
            </button>

            {isSuperAdmin && (
              <div
                className="
                  hidden
                  h-8
                  items-center
                  gap-1.5
                  rounded-md
                  border
                  border-secondary/10
                  bg-secondary/[0.035]
                  px-2.5
                  sm:flex
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />

                <span
                  className="
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.1em]
                    text-secondary/65
                  "
                >
                  Role
                </span>

                <span
                  className="
                    text-[11px]
                    font-bold
                    text-secondary
                  "
                >
                  {user?.role === "super_admin"
                    ? "Super Admin"
                    : user?.role || "Super Admin"}
                </span>
              </div>
            )}

            {isMarketing && (
              <div
                className="
                  hidden
                  h-8
                  items-center
                  gap-1.5
                  rounded-md
                  border
                  border-secondary/10
                  bg-secondary/[0.035]
                  px-2.5
                  sm:flex
                "
              >
                <span className="h-1.5 w-1.5 rounded-full bg-secondary" />

                <span className="text-[11px] font-bold text-secondary">
                  Marketing Agent
                </span>
              </div>
            )}

            {company &&
              !isSuperAdmin &&
              !isMarketing && (
                <div
                  className="
                    hidden
                    min-w-0
                    items-center
                    gap-2
                    sm:flex
                  "
                >
                  <div
                    className="
                      flex
                      h-8
                      w-8
                      shrink-0
                      items-center
                      justify-center
                      overflow-hidden
                      rounded-lg
                      border
                      border-secondary/10
                      bg-secondary/[0.05]
                    "
                  >
                    {companyLogo ? (
                      <img
                        src={companyLogo}
                        alt={company.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <Building2 className="h-4 w-4 text-secondary" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <div className="flex min-w-0 items-center gap-1.5">
                      <p
                        className="
                          max-w-[130px]
                          truncate
                          text-[11px]
                          font-bold
                          leading-none
                          text-gray-900
                          md:max-w-[200px]
                          lg:max-w-[280px]
                        "
                        title={company.name}
                      >
                        {company.name}
                      </p>

                      <span
                        className="
                          shrink-0
                          rounded-full
                          border
                          border-secondary/10
                          bg-secondary/[0.035]
                          px-1.5
                          py-0.5
                          text-[8px]
                          font-semibold
                          capitalize
                          leading-none
                          text-secondary
                        "
                      >
                        {company.role === "staff"
                          ? "Dispatcher"
                          : company.role}
                      </span>
                    </div>

                    <p
                      className="
                        mt-1
                        text-[8px]
                        font-medium
                        uppercase
                        leading-none
                        tracking-[0.08em]
                        text-gray-400
                      "
                    >
                      Active company
                    </p>
                  </div>
                </div>
              )}
          </div>

          {/* Right actions */}
          <div className="flex shrink-0 items-center gap-1">
            <NotificationBell
              onViewAll={() =>
                navigate("notifications")
              }
            />

            <RefreshButton
              onRefresh={handleRefresh}
              isLoading={isRefreshing}
            />

            <div className="relative">
              <button
                type="button"
                onClick={() =>
                  setProfileDropdownOpen(
                    !profileDropdownOpen,
                  )
                }
                className={`
                  flex
                  h-8
                  items-center
                  gap-1.5
                  rounded-lg
                  border
                  px-1
                  transition-colors
                  duration-150

                  ${
                    profileDropdownOpen
                      ? "border-secondary/20 bg-secondary/[0.04]"
                      : "border-transparent hover:border-secondary/10 hover:bg-secondary/[0.025]"
                  }
                `}
              >
                <div className="hidden min-w-0 text-right md:block">
                  <p
                    className="
                      max-w-[110px]
                      truncate
                      text-[10px]
                      font-bold
                      leading-none
                      text-gray-800
                    "
                  >
                    {user?.username ||
                      user?.email?.split("@")[0] ||
                      "User"}
                  </p>
                </div>

                <div
                  className="
                    flex
                    h-7
                    w-7
                    shrink-0
                    items-center
                    justify-center
                    overflow-hidden
                    rounded-full
                    bg-secondary
                    ring-2
                    ring-secondary/10
                  "
                >
                  {user?.profile_image ? (
                    <img
                      src={user.profile_image}
                      alt={user?.username || "User"}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <span className="text-[10px] font-bold uppercase text-white">
                      {user?.username?.[0] ||
                        user?.first_name?.[0] ||
                        "A"}
                    </span>
                  )}
                </div>
              </button>

              {profileDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-[60]"
                    onClick={() =>
                      setProfileDropdownOpen(false)
                    }
                  />

                  <div
                    className="
                      absolute
                      right-0
                      z-[70]
                      mt-1.5
                      w-52
                      overflow-hidden
                      rounded-lg
                      border
                      border-secondary/10
                      bg-white
                      p-1
                      shadow-[0_12px_30px_rgba(0,0,0,0.12)]
                    "
                  >
                    <div
                      className="
                        border-b
                        border-secondary/[0.07]
                        px-2.5
                        py-2
                      "
                    >
                      <p
                        className="
                          truncate
                          text-[10px]
                          font-medium
                          text-gray-700
                        "
                      >
                        {user?.email}
                      </p>

                      {company && (
                        <p
                          className="
                            mt-1
                            text-[9px]
                            font-semibold
                            capitalize
                            text-secondary
                          "
                        >
                          {company.role === "staff"
                            ? "Dispatcher"
                            : company.role}
                        </p>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        navigate("profile");
                        setProfileDropdownOpen(false);
                      }}
                      className="
                        mt-1
                        flex
                        h-8
                        w-full
                        items-center
                        gap-2
                        rounded-md
                        px-2.5
                        text-left
                        text-[11px]
                        font-medium
                        text-gray-700
                        transition-colors
                        hover:bg-secondary/[0.04]
                        hover:text-secondary
                      "
                    >
                      <Users className="h-3.5 w-3.5" />
                      My Profile
                    </button>

                    <button
                      type="button"
                      onClick={handleLogoutClick}
                      className="
                        mt-0.5
                        flex
                        h-8
                        w-full
                        items-center
                        gap-2
                        rounded-md
                        px-2.5
                        text-left
                        text-[11px]
                        font-medium
                        text-red-600
                        transition-colors
                        hover:bg-secondary/[0.04]
                      "
                    >
                      <LogOut className="h-3.5 w-3.5" />
                      Sign Out
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>
        {/* add div and padding - scrollable content area */}

        <div ref={scrollableRef} className="flex-1 overflow-y-auto p-2.5 sm:p-3 lg:p-4">
          {renderContent()}
        </div>
      </main>

      {/* Logout Confirmation Modal */}
      {showLogoutConfirm && (
        <div
          className="
            fixed
            inset-0
            z-[80]
            flex
            items-center
            justify-center
            bg-secondary/25
            p-4
            backdrop-blur-[1px]
          "
        >
          <div
            className="
              w-full
              max-w-xs
              overflow-hidden
              rounded-xl
              border
              border-secondary/10
              bg-white
              shadow-[0_18px_48px_rgba(0,0,0,0.14)]
            "
          >
            <div className="p-4">
              <div className="flex items-start gap-2.5">
                <div
                  className="
                    flex
                    h-8
                    w-8
                    shrink-0
                    items-center
                    justify-center
                    rounded-lg
                    bg-secondary/[0.07]
                  "
                >
                  <LogOut className="h-4 w-4 text-secondary" />
                </div>

                <div>
                  <h3 className="text-sm font-bold text-gray-900">
                    Sign out
                  </h3>

                  <p className="mt-1 text-[10px] leading-4 text-gray-500">
                    Are you sure you want to sign out of your account?
                  </p>
                </div>
              </div>
            </div>

            <div
              className="
                flex
                justify-end
                gap-2
                border-t
                border-secondary/[0.07]
                bg-secondary/[0.02]
                px-4
                py-2.5
              "
            >
              <button
                type="button"
                onClick={() =>
                  setShowLogoutConfirm(false)
                }
                className="
                  h-8
                  rounded-md
                  border
                  border-secondary/10
                  bg-white
                  px-3
                  text-[10px]
                  font-semibold
                  text-secondary
                  transition-colors
                  hover:bg-secondary/[0.04]
                "
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmLogout}
                className="
                  inline-flex
                  h-8
                  items-center
                  gap-1.5
                  rounded-md
                  bg-red-500
                  px-3
                  text-[10px]
                  font-semibold
                  text-white
                  transition-opacity
                  hover:opacity-90
                "
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {notificationOrder && (
        <VendorOrderDetailModal
          order={notificationOrder}
          receipt={notificationReceipt}
          onClose={() => {
            setNotificationOrder(null);
            setNotificationReceipt(null);
          }}
          onUpdate={handleNotificationOrderUpdate}
          readOnly={isViewer}
          onOpenLiveTracking={() => {
            // optionally open tracking map, e.g. setShowTrackingMap(true)
          }}
          allOrders={[]} // or pass existing orders if available
          onSelectOrder={(ord: any) => {
            setNotificationOrder(ord);
            setNotificationReceipt(ord.receipt || null);
          }}
        />
      )}
    </div>
  );
}

// Reusable SidebarItem
function SidebarItem({
  icon,
  label,
  active,
  collapsed,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  collapsed: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      title={collapsed ? label : undefined}
      onClick={onClick}
      className={`
        group
        flex
        h-9
        w-full
        items-center
        rounded-lg
        text-[12px]
        font-medium
        transition-colors
        duration-150
        [&_svg]:h-4
        [&_svg]:w-4

        ${
          collapsed
            ? "justify-center px-2"
            : "gap-2.5 px-3"
        }

        ${
          active
            ? "bg-white text-secondary shadow-sm"
            : "text-white/75 hover:bg-white/10 hover:text-white"
        }
      `}
    >
      <span className="shrink-0">
        {icon}
      </span>

      {!collapsed && (
        <span className="truncate">
          {label}
        </span>
      )}
    </button>
  );
}
