// src/components/admin/subscriptions/BillingPage.tsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  Crown,
  Package,
  RefreshCw,
  Shield,
  Sparkles,
  Store,
  XCircle,
  Zap,
} from "lucide-react";
import {
  getSubscriptionPlans,
  getMySubscription,
  initializeSubscriptionPayment,
  verifySubscriptionPayment,
} from "../../../services/api";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { PageHeader } from "../../ui/PageHeader";

interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: string;
  can_ad_company_detail: boolean;
  can_ad_companies_list: boolean;
  can_ad_home_page: boolean;
  max_featured_products: number;
  max_products: number;
}

interface ActiveSubscription {
  id: number;
  plan: SubscriptionPlan;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_expired: boolean;
  days_remaining: number | null;
  allowed_max_featured_products: number;
  allowed_max_products: number;
  current_featured_products?: number;
  current_products?: number;
}

type PlanAction =
  | "current"
  | "upgrade"
  | "downgrade"
  | "free_locked"
  | "subscribe";

type PlanTier =
  | "free"
  | "basic"
  | "advanced"
  | "premium"
  | "custom";

type PlanMeta = {
  name: string;
  positioning: string;
  purpose: string;
  audience: string;
  highlights: string[];
};

type Feedback = {
  tone: "success" | "error" | "info";
  message: string;
} | null;

const GOLD = {
  text: "text-[#8A6500]",
  darkText: "text-[#6D4E00]",
  border: "border-[#D9B24C]",
  softBorder: "border-[#E8D08A]",
  softBg: "bg-[#FFF9E8]",
  mutedBg: "bg-[#FBF4DC]",
  button:
    "border border-[#E7C86E] bg-[#F4C44E] text-[#4E3900] shadow-sm hover:bg-[#F0BC37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C86E] focus-visible:ring-offset-2",
};

const PLAN_META: Record<Exclude<PlanTier, "custom">, PlanMeta> = {
  free: {
    name: "Free",
    positioning: "Start Selling",
    purpose: "Establish your business presence on Elilita.",
    audience: "New and small vendors",
    highlights: [
      "Basic storefront and vendor profile",
      "Limited product catalogue",
      "Basic order and inventory management",
      "Basic sales dashboard",
      "Standard support",
    ],
  },
  basic: {
    name: "Basic",
    positioning: "Grow Your Store",
    purpose: "Get the tools you need to manage and grow your online business.",
    audience: "Small and growing businesses",
    highlights: [
      "Professional storefront",
      "Expanded product catalogue",
      "Full order management",
      "Basic analytics and promotions",
      "Priority support and onboarding assistance",
    ],
  },
  advanced: {
    name: "Advanced",
    positioning: "Scale Your Business",
    purpose: "Manage more products, orders, customers and marketing activities.",
    audience: "Established businesses",
    highlights: [
      "Advanced storefront and inventory",
      "Advanced order management",
      "Sales, product and order analytics",
      "Featured products and marketing tools",
      "Role-based staff access",
    ],
  },
  premium: {
    name: "Premium",
    positioning: "Maximize Your Business",
    purpose: "Get maximum visibility, analytics, marketing and operational capabilities.",
    audience: "Large and high-volume businesses",
    highlights: [
      "Premium storefront and priority visibility",
      "Unlimited product listing",
      "Advanced analytics and customer insights",
      "Premium promotional opportunities",
      "Priority support and business assistance",
    ],
  },
};

const PLAN_ORDER: PlanTier[] = [
  "free",
  "basic",
  "advanced",
  "premium",
  "custom",
];


type PlanFeatureItem = {
  label: string;
  enabled: boolean;
};

const PLAN_FEATURES: Record<
  Exclude<PlanTier, "custom">,
  PlanFeatureItem[]
> = {
  free: [
    { label: "Basic storefront and vendor profile", enabled: true },
    { label: "Limited product catalogue and basic categories", enabled: true },
    { label: "Basic inventory and stock information", enabled: true },
    { label: "Receive, accept, reject and update orders", enabled: true },
    { label: "Basic customer notifications", enabled: true },
    { label: "1 staff account", enabled: true },
    { label: "Basic sales dashboard and store status", enabled: true },
    { label: "Standard support, Help Center and knowledge base", enabled: true },
    { label: "Business analytics", enabled: false },
    { label: "Promotional tools", enabled: false },
    { label: "Featured products", enabled: false },
    { label: "Advertising opportunities", enabled: false },
    { label: "Advanced reports", enabled: false },
    { label: "Premium visibility", enabled: false },
  ],
  basic: [
    { label: "Professional storefront", enabled: true },
    { label: "Up to 100 products", enabled: true },
    { label: "Multiple product categories and search visibility", enabled: true },
    { label: "Full order management and order notifications", enabled: true },
    { label: "Basic inventory management", enabled: true },
    { label: "Basic sales reports and business insights", enabled: true },
    { label: "Basic promotions, discounts and product highlighting", enabled: true },
    { label: "Paid advertising opportunities", enabled: true },
    { label: "2 staff accounts", enabled: true },
    { label: "Standard priority support and onboarding assistance", enabled: true },
    { label: "Featured products", enabled: false },
    { label: "Advanced reports", enabled: false },
    { label: "Advanced marketing", enabled: false },
    { label: "Premium visibility", enabled: false },
    { label: "Dedicated support", enabled: false },
  ],
  advanced: [
    { label: "All Basic plan features", enabled: true },
    { label: "Advanced storefront customization", enabled: true },
    { label: "Up to 500 products and bulk product management", enabled: true },
    { label: "Advanced inventory management", enabled: true },
    { label: "Advanced order dashboard, filtering and tracking", enabled: true },
    { label: "Sales, product, order and revenue analytics", enabled: true },
    { label: "Featured products and promotional campaigns", enabled: true },
    { label: "Advertising participation", enabled: true },
    { label: "Customer insights and promotional targeting", enabled: true },
    { label: "5 staff accounts with role-based access", enabled: true },
    { label: "Staff activity monitoring", enabled: true },
    { label: "Advanced and exportable reports", enabled: true },
    { label: "Priority support", enabled: true },
    { label: "Premium visibility", enabled: false },
    { label: "Dedicated support", enabled: false },
  ],
  premium: [
    { label: "All Advanced plan features", enabled: true },
    { label: "Premium storefront customization and priority visibility", enabled: true },
    { label: "Unlimited product listing", enabled: true },
    { label: "Advanced inventory and bulk product management", enabled: true },
    { label: "Advanced product analytics and performance comparison", enabled: true },
    { label: "Priority featured products and premium promotional placement", enabled: true },
    { label: "Advanced campaigns and featured vendor opportunities", enabled: true },
    { label: "Advanced customer analytics and segmentation", enabled: true },
    { label: "Advanced operations and business performance monitoring", enabled: true },
    { label: "Multiple staff accounts with role-based permissions", enabled: true },
    { label: "Advanced and historical reporting", enabled: true },
    { label: "Priority support and dedicated account support where applicable", enabled: true },
  ],
};

const resolvePlanTier = (
  plan?: Partial<SubscriptionPlan> | null,
): PlanTier => {
  if (!plan) return "custom";

  const name = String(plan.name || "")
    .trim()
    .toLowerCase();
  const price = Number(plan.price ?? 0);

  if (name.includes("premium") || name.includes("enterprise")) {
    return "premium";
  }

  if (
    name.includes("advanced") ||
    name.includes("professional") ||
    name.includes("standard") ||
    name === "pro"
  ) {
    return "advanced";
  }

  if (name.includes("basic")) return "basic";

  if (
    name.includes("free") ||
    name.includes("starter") ||
    price === 0
  ) {
    return "free";
  }

  return "custom";
};

const getPlanMeta = (plan: SubscriptionPlan): PlanMeta => {
  const tier = resolvePlanTier(plan);

  if (tier !== "custom") return PLAN_META[tier];

  return {
    name: plan.name,
    positioning: "Custom Plan",
    purpose: plan.description || "Custom subscription configuration.",
    audience: "Custom business needs",
    highlights: [],
  };
};

const formatEtb = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (value?: string | null) => {
  if (!value) return "—";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(date);
};

const formatLimit = (value?: number | null) => {
  if (value === -1) return "Unlimited";
  return String(value ?? 0);
};

const calculateUsage = (current: number, limit: number) => {
  if (limit === -1) return 100;
  if (limit <= 0) return 0;
  return Math.min(100, Math.max(0, (current / limit) * 100));
};

const SkeletonCard = () => (
  <div className="animate-pulse rounded-xl border border-gray-200/80 bg-white p-5 shadow-sm">
    <div className="h-3 w-24 rounded bg-slate-200" />
    <div className="mt-3 h-7 w-32 rounded bg-slate-200" />
    <div className="mt-3 h-9 w-36 rounded bg-slate-100" />
    <div className="mt-5 space-y-2.5">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-3 rounded bg-slate-100"
          style={{ width: `${94 - index * 7}%` }}
        />
      ))}
    </div>
    <div className="mt-5 h-11 rounded-xl bg-slate-100" />
  </div>
);

const SkeletonCurrentPlan = () => (
  <div className="animate-pulse overflow-hidden rounded-2xl border border-[#EEE4C4] bg-white p-5 shadow-sm sm:p-6">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div>
        <div className="h-3 w-28 rounded bg-slate-200" />
        <div className="mt-3 h-10 w-52 rounded bg-slate-200" />
        <div className="mt-3 h-3 w-80 max-w-full rounded bg-slate-100" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="h-24 rounded-2xl bg-[#FFF9E8]" />
        <div className="h-24 rounded-2xl bg-[#FFF9E8]" />
      </div>
    </div>
  </div>
);

const UsageCard = ({
  icon,
  label,
  current,
  limit,
}: {
  icon: ReactNode;
  label: string;
  current: number;
  limit: number;
}) => {
  const unlimited = limit === -1;
  const percentage = calculateUsage(current, limit);

  return (
    <div className="rounded-2xl border border-[#EEE4C4] bg-[#FFFEFA] p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="text-[#D39D15]">{icon}</span>
          {label}
        </div>
        <span className="text-xs font-extrabold text-slate-900">
          {current} / {formatLimit(limit)}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#F4E7BD]">
        <div
          className="h-full rounded-full bg-[#E0B43B] transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-[11px] text-slate-500">
        {unlimited
          ? "Unlimited on this plan."
          : `${Math.max(0, limit - current)} remaining on your current limit.`}
      </p>
    </div>
  );
};

export default function BillingPage() {
  const { company } = useCurrentCompany();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const isAuthorized =
    company?.role === "owner" || company?.role === "admin";

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const [plansRes, subRes] = await Promise.all([
        getSubscriptionPlans(),
        getMySubscription(company?.slug),
      ]);

      setPlans(plansRes.data?.results || plansRes.data || []);
      setActiveSub(subRes.data || null);
    } catch (error) {
      console.error("Failed to load billing data", error);
      setLoadError(
        "We could not load your subscription information. Check your connection and try again.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [company?.slug]);

  const verifyPaymentAndFetch = useCallback(
    async (txRef: string, attempt = 1) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 3000;

      try {
        setIsLoading(true);
        setFeedback({
          tone: "info",
          message: "Verifying your subscription payment…",
        });

        const res = await verifySubscriptionPayment(txRef);

        if (res.data?.message) {
          window.history.replaceState({}, document.title, window.location.pathname);
          setFeedback({
            tone: "success",
            message: "Payment verified. Your subscription is now up to date.",
          });
          await fetchData();
          return;
        }
      } catch (error: any) {
        console.error(`Payment verification attempt ${attempt} failed`, error);
        const errorMsg = error?.response?.data?.error || "";

        if (attempt < MAX_RETRIES && errorMsg.toLowerCase().includes("pending")) {
          window.setTimeout(() => {
            void verifyPaymentAndFetch(txRef, attempt + 1);
          }, RETRY_DELAY_MS);
          return;
        }

        setFeedback({
          tone: "error",
          message:
            errorMsg ||
            "We could not verify the payment yet. Refresh the page or try again in a moment.",
        });
      }

      window.history.replaceState({}, document.title, window.location.pathname);
      await fetchData();
    },
    [fetchData],
  );

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const txRef = queryParams.get("sub_tx_ref");

    if (txRef && company?.slug) {
      void verifyPaymentAndFetch(txRef);
    } else {
      void fetchData();
    }
  }, [company?.slug, fetchData, verifyPaymentAndFetch]);

  const handleSubscribe = async (planId: number) => {
    if (!company?.slug) return;

    if (!isAuthorized) {
      setFeedback({
        tone: "error",
        message: "Only company owners and admins can manage subscriptions.",
      });
      return;
    }

    try {
      setSubscribingTo(planId);
      setFeedback(null);

      const res = await initializeSubscriptionPayment(company.slug, planId);

      if (res.data?.message) {
        setFeedback({
          tone: "success",
          message: "Plan activated successfully.",
        });
        await fetchData();
        return;
      }

      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
        return;
      }

      setFeedback({
        tone: "error",
        message: "The payment service did not return a checkout link. Please try again.",
      });
    } catch (error: any) {
      console.error("Payment initialization failed", error);
      setFeedback({
        tone: "error",
        message:
          error?.response?.data?.error ||
          "Failed to initialize payment. Please try again.",
      });
    } finally {
      setSubscribingTo(null);
    }
  };

  const getPlanAction = (plan: SubscriptionPlan): PlanAction => {
    if (!activeSub || activeSub.is_expired) return "subscribe";

    const currentPrice = Number(activeSub.plan?.price || 0);
    const cardPrice = Number(plan.price || 0);

    if (activeSub.plan?.id === plan.id) return "current";
    if (cardPrice === 0 && currentPrice > 0) return "free_locked";
    if (cardPrice > currentPrice) return "upgrade";
    return "downgrade";
  };

  const getButtonConfig = (action: PlanAction) => {
    switch (action) {
      case "current":
        return {
          label: "Current Plan",
          icon: <Shield className="h-4 w-4" />,
          disabled: true,
          className:
            "cursor-not-allowed border border-[#CDBDF2] bg-[#F4F0FF] text-[#7050BF]",
        };
      case "upgrade":
        return {
          label: "Upgrade Plan",
          icon: <ArrowUp className="h-4 w-4" />,
          disabled: false,
          className: GOLD.button,
        };
      case "downgrade":
        return {
          label: "Choose Lower Plan",
          icon: <ArrowDown className="h-4 w-4" />,
          disabled: false,
          className:
            "border border-slate-300 bg-white text-slate-700 hover:border-slate-400 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300 focus-visible:ring-offset-2",
        };
      case "free_locked":
        return {
          label: "Free After Expiry",
          icon: <Clock className="h-4 w-4" />,
          disabled: true,
          className:
            "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400",
        };
      case "subscribe":
        return {
          label: "Choose Plan",
          icon: <CreditCard className="h-4 w-4" />,
          disabled: false,
          className:
            "border border-[#E7C86E] bg-[#F4C44E] text-[#4E3900] shadow-sm hover:bg-[#F0BC37] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#E7C86E] focus-visible:ring-offset-2",
        };
    }
  };

  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) => {
        const aOrder = PLAN_ORDER.indexOf(resolvePlanTier(a));
        const bOrder = PLAN_ORDER.indexOf(resolvePlanTier(b));

        if (aOrder !== bOrder) return aOrder - bOrder;
        return Number(a.price || 0) - Number(b.price || 0);
      }),
    [plans],
  );

  const currentPlanPrice = Number(activeSub?.plan?.price || 0);
  const currentTier = resolvePlanTier(activeSub?.plan);
  const isFree = currentPlanPrice === 0;
  const isExpired = activeSub?.is_expired ?? false;
  const daysRemaining = activeSub?.days_remaining;
  const currentPlanMeta = activeSub?.plan
    ? getPlanMeta(activeSub.plan)
    : PLAN_META.free;

  const currentProducts = activeSub?.current_products || 0;
  const currentFeaturedProducts = activeSub?.current_featured_products || 0;
  const allowedProducts = activeSub?.allowed_max_products ?? 0;
  const allowedFeaturedProducts =
    activeSub?.allowed_max_featured_products ?? 0;

  const status = isExpired
    ? "Expired"
    : isFree
      ? "Free"
      : daysRemaining !== null &&
          daysRemaining !== undefined &&
          daysRemaining <= 7
        ? "Expiring"
        : activeSub?.is_active
          ? "Active"
          : "Pending";

  const statusClass = isExpired
    ? "border-red-200 bg-red-50 text-red-700"
    : status === "Expiring"
      ? "border-amber-200 bg-amber-50 text-amber-700"
      : "border-[#E7D089] bg-[#FFF7DD] text-[#8A6500]";

  return (
    <div className="mx-auto w-full max-w-[1500px] space-y-5 px-1 pb-8 sm:px-2">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your plan, usage, renewal, and available plans."
        icon={CreditCard}
        loading={isLoading}
              className="mb-5 sm:mb-6"
      />

      {feedback && (
        <div
          role="status"
          className={`flex items-start justify-between gap-3 rounded-xl border px-4 py-3 text-sm shadow-sm ${
            feedback.tone === "success"
              ? "border-emerald-200 bg-emerald-50 text-emerald-800"
              : feedback.tone === "error"
                ? "border-red-200 bg-red-50 text-red-800"
                : "border-[#E8D08A] bg-[#FFF9E8] text-[#6D4E00]"
          }`}
        >
          <div className="flex min-w-0 items-start gap-2.5">
            {feedback.tone === "success" ? (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0" />
            ) : feedback.tone === "error" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
            ) : (
              <Clock className="mt-0.5 h-4 w-4 shrink-0" />
            )}
            <p>{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold opacity-70 hover:opacity-100"
            aria-label="Dismiss message"
          >
            Dismiss
          </button>
        </div>
      )}

      {loadError && !isLoading && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-600" />
              <div>
                <p className="font-semibold text-red-900">Subscription data unavailable</p>
                <p className="mt-1 text-sm text-red-700">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void fetchData()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-red-200 bg-white px-4 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50"
            >
              <RefreshCw className="h-4 w-4" />
              Retry
            </button>
          </div>
        </div>
      )}

      {isLoading ? (
        <SkeletonCurrentPlan />
      ) : (
        <section className="rounded-2xl border border-[#EEE4C4] bg-white p-5 shadow-sm sm:p-6">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-[#B88917]">
                  Current subscription
                </span>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${statusClass}`}>
                  {status}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">
                  {activeSub?.plan?.name || currentPlanMeta.name}
                </h2>
                <span className="pb-1 text-sm font-semibold text-[#8A6500]">
                  {currentPlanMeta.positioning}
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                {currentPlanMeta.purpose}
              </p>

              <div className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-[#EEE4C4] bg-[#FFFCF2] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Price</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    {isFree ? "Free" : `ETB ${formatEtb(currentPlanPrice)} / month`}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#EEE4C4] bg-[#FFFCF2] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Started</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    {formatDate(activeSub?.start_date)}
                  </p>
                </div>
                <div className="rounded-2xl border border-[#EEE4C4] bg-[#FFFCF2] px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Renewal</p>
                  <p className="mt-1 text-sm font-extrabold text-slate-900">
                    {isFree ? "No renewal required" : formatDate(activeSub?.end_date)}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Store className="h-4 w-4 text-[#D39D15]" />
                Best suited for {currentPlanMeta.audience.toLowerCase()}.
              </div>

              {!isExpired &&
                !isFree &&
                daysRemaining !== null &&
                daysRemaining !== undefined &&
                daysRemaining <= 7 &&
                daysRemaining > 0 && (
                  <div className="mt-4 flex max-w-2xl items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-700">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                    Your plan expires in {daysRemaining} day{daysRemaining === 1 ? "" : "s"}. Renew or upgrade to keep paid capabilities available.
                  </div>
                )}

              {isExpired && (
                <div className="mt-4 flex max-w-2xl items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-700">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
                  Your subscription has expired. Choose a plan below to restore paid capabilities.
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              <UsageCard
                icon={<Package className="h-4 w-4" />}
                label="Public products"
                current={currentProducts}
                limit={allowedProducts}
              />
              <UsageCard
                icon={<Zap className="h-4 w-4" />}
                label="Featured products"
                current={currentFeaturedProducts}
                limit={allowedFeaturedProducts}
              />
            </div>
          </div>
        </section>
      )}

      <section>
        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-[#D39D15]" />
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[#8A6500]">
                Available plans
              </p>
            </div>
            <h2 className="mt-1 text-xl font-bold tracking-[-0.025em] text-slate-900">
              {isExpired ? "Reactivate your business" : "Pick the plan that fits your store"}
            </h2>
            <p className="mt-1 text-xs text-slate-500">
              Clear monthly pricing, simple limits, and only the most important features shown.
            </p>
          </div>

          <span className="w-fit rounded-full border border-[#E8D08A] bg-[#FFF9E8] px-3 py-1.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A5700]">
            Monthly billing · ETB
          </span>
        </div>

        {!isAuthorized && !isLoading && (
          <div className="mb-3 flex items-start gap-2.5 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-xs text-slate-600">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-500" />
            Only company owners and admins can change the subscription. You can still review plan benefits and limits.
          </div>
        )}

        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : sortedPlans.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center shadow-sm">
            <CreditCard className="mx-auto h-6 w-6 text-slate-400" />
            <p className="mt-3 text-sm font-semibold text-slate-800">No plans available</p>
            <p className="mt-1 text-xs text-slate-500">Subscription plans will appear here when they are configured.</p>
          </div>
        ) : (
          <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {sortedPlans.map((plan) => {
              const action = getPlanAction(plan);
              const button = getButtonConfig(action);
              const price = Number(plan.price || 0);
              const meta = getPlanMeta(plan);
              const tier = resolvePlanTier(plan);
              const isCurrent = action === "current";
              const isUpgrade = action === "upgrade";
              const isDowngrade = action === "downgrade";
              const isAdvanced = tier === "advanced";
              const isPremium = tier === "premium";

              const includedItems =
                tier !== "custom"
                  ? PLAN_FEATURES[tier]
                  : [
                      {
                        label:
                          plan.max_products === -1
                            ? "Unlimited public products"
                            : `Post up to ${formatLimit(plan.max_products)} public products`,
                        enabled: true,
                      },
                      {
                        label:
                          plan.max_featured_products > 0
                            ? `Can feature up to ${formatLimit(plan.max_featured_products)} products`
                            : "Can feature up to 0 products",
                        enabled: plan.max_featured_products > 0,
                      },
                      { label: "Ads on Company Detail Page", enabled: plan.can_ad_company_detail },
                      { label: "Ads on Companies List Page", enabled: plan.can_ad_companies_list },
                      { label: "Ads on Home Page", enabled: plan.can_ad_home_page },
                    ];

              return (
                <article
                  key={plan.id}
                  className={`relative mt-3 flex min-w-0 flex-col overflow-visible rounded-[26px] border bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
                    isCurrent
                      ? "border-[#7050BF]"
                      : isUpgrade || isPremium || isAdvanced
                        ? "border-[#EAD487]"
                        : "border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {isCurrent ? (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#7050BF] px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] text-white shadow-sm">
                      Current Plan
                    </div>
                  ) : isUpgrade ? (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#F59E0B] px-4 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] text-white shadow-sm">
                      ↑ Upgrade
                    </div>
                  ) : null}

                  <div className="min-h-6">
                    <p className="min-w-0 truncate text-[11px] font-semibold text-slate-900">
                      {plan.name}
                    </p>
                  </div>

                  <div className="mt-8 flex items-end gap-1.5">
                    <span className="text-[30px] font-black leading-none tracking-[-0.045em] text-slate-950">
                      {price === 0 ? "Free" : `${formatEtb(price)} ETB`}
                    </span>
                    {price > 0 && <span className="pb-0.5 text-[11px] font-semibold text-slate-400">/mo</span>}
                  </div>

                  <p className="mt-3 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">
                    What&apos;s included
                  </p>

                  <ul className="mt-4 space-y-3">
                    {includedItems.map((item) => (
                      <li key={item.label} className="flex items-center gap-2.5">
                        {item.enabled ? (
                          <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-500" />
                        ) : (
                          <XCircle className="h-4 w-4 shrink-0 text-slate-300" />
                        )}
                        <span className={`text-[11px] leading-5 ${item.enabled ? "text-slate-700" : "text-slate-400 line-through"}`}>
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  <div className="mt-4 rounded-2xl border border-[#F2E5BA] bg-[#FFFBEE] px-3 py-2.5">
                    <p className="text-[10px] font-semibold text-[#8A6500]">{meta.positioning}</p>
                    <p className="mt-1 text-[10px] leading-4 text-slate-500">
                      {plan.description || meta.purpose}
                    </p>
                  </div>

                  <div className="mt-auto pt-5">
                    <button
                      type="button"
                      onClick={() => void handleSubscribe(plan.id)}
                      disabled={!isAuthorized || button.disabled || subscribingTo === plan.id}
                      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition-all duration-200 disabled:translate-y-0 disabled:shadow-none ${
                        !isAuthorized && action !== "current" && action !== "free_locked"
                          ? "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-300"
                          : button.className
                      }`}
                      title={!isAuthorized ? "Only company owners or admins can modify subscription plans" : undefined}
                    >
                      {subscribingTo === plan.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-current/30 border-t-current" />
                      ) : (
                        <>
                          {button.icon}
                          {button.label}
                        </>
                      )}
                    </button>

                    {action === "upgrade" && !isExpired && (
                      <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                        Starts after successful payment verification.
                      </p>
                    )}

                    {action === "downgrade" && (
                      <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                        Downgrade timing follows policy.
                      </p>
                    )}

                    {action === "free_locked" && (
                      <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                        Free access becomes available after the paid plan ends.
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section className="rounded-2xl border border-[#E8D08A] bg-[#FFFDF6] p-4 shadow-sm sm:p-5">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#FBF0C8] text-[#8A6500]">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Plan notes</h3>
              <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-600">
                Upgrades can be requested at any time. Paid features become available after successful payment verification. Downgrades follow the billing policy.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-[#E8D08A] bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-[#7A5700]">
            <Shield className="h-3.5 w-3.5" />
            Owner / Admin managed
          </div>
        </div>
      </section>
    </div>
  );
}