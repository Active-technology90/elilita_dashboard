// src/components/admin/subscriptions/BillingPage.tsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useTranslation } from "react-i18next";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  BadgeCheck,
  Check,
  Clock,
  CreditCard,
  Package,
  RefreshCw,
  Shield,

  Store,
  Users,
  X,
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
  plan_type?: "product" | "service";
  description: string;
  price: string;
  six_month_price?: string | null;
  annual_price?: string | null;
  six_month_savings_percent?: number;
  annual_savings_percent?: number;
  six_month_monthly_equivalent?: string | null;
  annual_monthly_equivalent?: string | null;
  duration_days?: number;
  max_featured_products: number;
  max_products: number;
  max_services?: number;
  max_staff_members?: number;
}

interface ActiveSubscription {
  id: number;
  company_business_type?: string;
  plan: SubscriptionPlan;
  billing_cycle?: "monthly" | "six_month" | "annual";
  last_payment_amount?: string;
  has_used_free_trial?: boolean;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  is_expired: boolean;
  days_remaining: number | null;
  allowed_max_featured_products: number;
  allowed_max_products: number;
  allowed_max_services?: number;
  allowed_max_staff_members?: number;
  current_featured_products?: number;
  current_products?: number;
  current_services?: number;
  current_staff_members?: number;
}

type PlanAction =
  | "current"
  | "upgrade"
  | "downgrade"
  | "free_locked"
  | "free_used"
  | "subscribe";

type PlanTier = "free" | "basic" | "advanced" | "premium" | "custom";

type Translate = any;

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

/**
 * ACCENT — reserved ONLY for the primary upgrade / subscribe CTA.
 * Palette: Material 3 purple (#6750A4) with #574290 hover shade.
 */
const ACCENT = {
  button:
    "bg-[#6750A4] text-white shadow-sm hover:bg-[#574290] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#6750A4] focus-visible:ring-offset-2",
};

const PLAN_META: Record<Exclude<PlanTier, "custom">, PlanMeta> = {
  free: {
    name: "Free",
    positioning: "positioning.free",
    purpose: "purpose.free",
    audience: "audience.free",
    highlights: [
      "planHighlights.free.0",
      "planHighlights.free.1",
      "planHighlights.free.2",
      "planHighlights.free.3",
      "planHighlights.free.4",
    ],
  },
  basic: {
    name: "Basic",
    positioning: "positioning.basic",
    purpose: "purpose.basic",
    audience: "audience.basic",
    highlights: [
      "planHighlights.basic.0",
      "planHighlights.basic.1",
      "planHighlights.basic.2",
      "planHighlights.basic.3",
      "planHighlights.basic.4",
    ],
  },
  advanced: {
    name: "Advanced",
    positioning: "positioning.advanced",
    purpose: "purpose.advanced",
    audience: "audience.advanced",
    highlights: [
      "planHighlights.advanced.0",
      "planHighlights.advanced.1",
      "planHighlights.advanced.2",
      "planHighlights.advanced.3",
      "planHighlights.advanced.4",
    ],
  },
  premium: {
    name: "Premium",
    positioning: "positioning.premium",
    purpose: "purpose.premium",
    audience: "audience.premium",
    highlights: [
      "planHighlights.premium.0",
      "planHighlights.premium.1",
      "planHighlights.premium.2",
      "planHighlights.premium.3",
      "planHighlights.premium.4",
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
  match: string;
  enabled: boolean;
};

const PLAN_FEATURES: Record<Exclude<PlanTier, "custom">, PlanFeatureItem[]> = {
  free: [
    {
      label: "features.limitedCatalogue",
      match: "limited product catalogue",
      enabled: true,
    },
    {
      label: "features.staffOne",
      match: "1 staff account",
      enabled: true,
    },
    {
      label: "features.featuredProducts",
      match: "featured products",
      enabled: false,
    },
  ],

  basic: [
    {
      label: "features.publicProducts",
      match: "up to 100 products",
      enabled: true,
    },
    {
      label: "features.staffTwo",
      match: "2 staff accounts",
      enabled: true,
    },
    {
      label: "features.featuredProducts",
      match: "featured products",
      enabled: false,
    },
  ],

  advanced: [
    {
      label: "features.publicProducts",
      match: "up to 500 products",
      enabled: true,
    },
    {
      label: "features.staffFive",
      match: "5 staff accounts",
      enabled: true,
    },
    {
      label: "features.featuredProducts",
      match: "featured products included",
      enabled: true,
    },
  ],

  premium: [
    {
      label: "features.unlimitedProducts",
      match: "unlimited product listing",
      enabled: true,
    },
    {
      label: "features.multipleStaff",
      match: "multiple staff accounts",
      enabled: true,
    },
    {
      label: "features.premiumVisibility",
      match: "priority featured products",
      enabled: true,
    },
  ],
};

const resolvePlanTier = (
  plan?: Partial<SubscriptionPlan> | null,
): PlanTier => {
  if (!plan) return "custom";

  const name = String(plan.name || "").trim().toLowerCase();
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

  if (name.includes("free") || name.includes("starter") || price === 0) {
    return "free";
  }

  return "custom";
};

const getPlanMeta = (plan: SubscriptionPlan, t: Translate): PlanMeta => {
  const tier = resolvePlanTier(plan);

  if (tier !== "custom") {
    const meta = PLAN_META[tier];

    return {
      name: meta.name,
      positioning: t(meta.positioning),
      purpose: t(meta.purpose),
      audience: t(meta.audience),
      highlights: meta.highlights.map((key) => t(key)),
    };
  }

  return {
    name: plan.name,
    positioning: t("positioning.custom"),
    purpose: plan.description || t("purpose.custom"),
    audience: t("audience.custom"),
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

const formatLimit = (value: number | null | undefined, t: Translate) => {
  if (value === -1) return t("usage.unlimited");
  return String(value ?? 0);
};

const calculateUsage = (current: number, limit: number) => {
  if (limit === -1) return 100;
  if (limit <= 0) return 0;
  return Math.min(100, Math.max(0, (current / limit) * 100));
};

const getDynamicPlanFeatures = (
  plan: SubscriptionPlan,
  tier: PlanTier,
  t: Translate,
  isServiceCompany = false,
): PlanFeatureItem[] => {
  const staffCount = plan.max_staff_members ?? 5;
  const serviceLimit = plan.max_services ?? 15;
  const hasFeatured =
    plan.max_featured_products === -1 || plan.max_featured_products > 0;

  const productsLabel =
    plan.max_products === -1
      ? t("features.unlimitedProductsDynamic")
      : t("features.publicProducts", {
          count: formatLimit(plan.max_products, t),
        });

  const servicesLabel =
    serviceLimit === -1
      ? t("features.unlimitedActiveServices")
      : t("features.activeServicesUpTo", {
          count: formatLimit(serviceLimit, t),
        });

  const staffLabel =
    staffCount === -1
      ? t("features.unlimitedStaff")
      : staffCount === 1
        ? t("features.oneStaff")
        : t("features.staffAccounts", {
            count: formatLimit(staffCount, t),
          });

  const featuredLabel =
    plan.max_featured_products === -1
      ? t("features.featuredUnlimited")
      : plan.max_featured_products > 0
        ? t("features.featuredCount", {
            count: formatLimit(plan.max_featured_products, t),
          })
        : t("features.featuredGeneric");

  if (tier === "custom") {
    return [
      isServiceCompany
        ? {
            label: servicesLabel,
            match: "services",
            enabled: serviceLimit !== 0,
          }
        : {
            label: productsLabel,
            match: "products",
            enabled: plan.max_products !== 0,
          },
      {
        label: staffLabel,
        match: "staff",
        enabled: staffCount !== 0,
      },
      ...(!isServiceCompany
        ? [
            {
              label: featuredLabel,
              match: "featured",
              enabled: hasFeatured,
            },
          ]
        : []),
      {
        label: t("features.storefrontManagement"),
        match: "storefront",
        enabled: true,
      },
      {
        label: t("features.orderInventoryManagement"),
        match: "orders",
        enabled: true,
      },
      {
        label: t("features.standardNotifications"),
        match: "notifications",
        enabled: true,
      },
    ];
  }

  return PLAN_FEATURES[tier]
    .filter(
      (item) => !(isServiceCompany && item.match.includes("featured product")),
    )
    .map((item) => {
      const lower = item.match;

      // Match product/service quota entries
      if (
        (lower.includes("catalogue") ||
          lower.includes("product listing") ||
          (lower.includes("product") && lower.includes("up to"))) &&
        !lower.includes("featured")
      ) {
        if (isServiceCompany) {
          return {
            ...item,
            label: servicesLabel,
            enabled: serviceLimit !== 0,
          };
        }
        const extra = lower.includes("bulk")
          ? ` ${t("features.bulkManagement")}`
          : "";

        return {
          ...item,
          label: `${productsLabel}${extra}`,
          enabled: plan.max_products !== 0,
        };
      }

      // Match staff quota entries
      if (lower.includes("staff")) {
        const hasRole = lower.includes("role");

        return {
          ...item,
          label: hasRole
            ? `${staffLabel} ${t("features.roleBasedAccess")}`
            : staffLabel,
          enabled: staffCount !== 0,
        };
      }

      // Match featured products quota entries
      if (lower.includes("featured product")) {
        const extraPromo =
          lower.includes("promotional") || lower.includes("placement");

        return {
          ...item,
          label:
            extraPromo && hasFeatured
              ? `${featuredLabel} ${t("features.promotionalPlacement")}`
              : featuredLabel,
          enabled: hasFeatured,
        };
      }

      return {
        ...item,
        label: t(item.label),
      };
    });
};

const SkeletonCard = () => (
  <div className="animate-pulse rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
    <div className="h-11 w-11 rounded-xl bg-slate-100" />
    <div className="mt-4 h-4 w-24 rounded bg-slate-100" />
    <div className="mt-1.5 h-3 w-32 rounded bg-slate-100" />
    <div className="mt-5 h-9 w-28 rounded bg-slate-100" />
    <div className="mt-2 h-5 w-16 rounded bg-slate-100" />
    <div className="mt-5 space-y-3">
      {Array.from({ length: 5 }).map((_, index) => (
        <div
          key={index}
          className="h-3 rounded bg-slate-100"
          style={{ width: `${94 - index * 7}%` }}
        />
      ))}
    </div>
    <div className="mt-6 h-11 rounded-xl bg-slate-100" />
  </div>
);

const SkeletonCurrentPlan = () => (
  <div className="animate-pulse overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)]">
      <div>
        <div className="h-3 w-28 rounded bg-slate-100" />
        <div className="mt-3 h-9 w-52 rounded bg-slate-100" />
        <div className="mt-3 h-3 w-80 max-w-full rounded bg-slate-100" />
        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
          <div className="h-16 rounded-2xl bg-slate-100" />
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
        <div className="h-24 rounded-2xl bg-slate-100" />
        <div className="h-24 rounded-2xl bg-slate-100" />
      </div>
    </div>
  </div>
);

const UsageCard = ({
  icon,
  label,
  current,
  limit,
  t,
}: {
  icon: ReactNode;
  label: string;
  current: number;
  limit: number;
  t: Translate;
}) => {
  const unlimited = limit === -1;
  const percentage = calculateUsage(current, limit);

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-2.5 text-sm font-semibold text-slate-800">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#6750A4]/10 text-[#6750A4]">
            {icon}
          </span>
          {label}
        </div>
        <span className="text-xs font-bold text-slate-700">
          {current} / {formatLimit(limit, t)}
        </span>
      </div>

      <div className="mt-3 h-2 overflow-hidden rounded-full bg-slate-100">
        <div
          className="h-full rounded-full bg-[#6750A4] transition-[width] duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>

      <p className="mt-2 text-[11px] text-slate-400">
        {unlimited
          ? t("usage.unlimitedOnPlan")
          : t("usage.remaining", {
              count: Math.max(0, limit - current),
            })}
      </p>
    </div>
  );
};

export default function BillingPage() {
  const { t } = useTranslation("billingPage");
  const { company } = useCurrentCompany();

  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
const [billingCycle, setBillingCycle] = useState<
  "monthly" | "six_month" | "annual"
>("annual");
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState<number | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback>(null);

  const isAuthorized = company?.role === "owner" || company?.role === "admin";

  const isServiceCompany =
    activeSub?.company_business_type === "service" ||
    activeSub?.plan?.plan_type === "service";

  const fetchData = useCallback(async () => {
    try {
      setIsLoading(true);
      setLoadError(null);

      const subRes = await getMySubscription(company?.slug);
      const subData: ActiveSubscription | null = subRes.data || null;
      setActiveSub(subData);

      const resolvedPlanType: "product" | "service" =
        subData?.company_business_type === "service" ||
        subData?.plan?.plan_type === "service"
          ? "service"
          : "product";

      const plansRes = await getSubscriptionPlans(resolvedPlanType);
      setPlans(plansRes.data?.results || plansRes.data || []);
    } catch (error) {
      console.error("Failed to load billing data", error);
      setLoadError(t("alerts.loadErrorDescription"));
    } finally {
      setIsLoading(false);
    }
  }, [company?.slug, t]);

  const verifyPaymentAndFetch = useCallback(
    async (txRef: string, attempt = 1) => {
      const MAX_RETRIES = 3;
      const RETRY_DELAY_MS = 3000;

      try {
        setIsLoading(true);
        setFeedback({
          tone: "info",
          message: t("alerts.verifyingPayment"),
        });

        const res = await verifySubscriptionPayment(txRef);

        if (res.data?.message) {
          window.history.replaceState(
            {},
            document.title,
            window.location.pathname,
          );
          setFeedback({
            tone: "success",
            message: t("alerts.paymentVerified"),
          });
          await fetchData();
          return;
        }
      } catch (error: any) {
        console.error(`Payment verification attempt ${attempt} failed`, error);
        const errorMsg = error?.response?.data?.error || "";

        if (
          attempt < MAX_RETRIES &&
          errorMsg.toLowerCase().includes("pending")
        ) {
          window.setTimeout(() => {
            void verifyPaymentAndFetch(txRef, attempt + 1);
          }, RETRY_DELAY_MS);
          return;
        }

        setFeedback({
          tone: "error",
          message: errorMsg || t("alerts.paymentVerificationFailed"),
        });
      }

      window.history.replaceState(
        {},
        document.title,
        window.location.pathname,
      );
      await fetchData();
    },
    [fetchData, t],
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
        message: t("alerts.unauthorized"),
      });
      return;
    }

    try {
      setSubscribingTo(planId);
      setFeedback(null);

      const res = await initializeSubscriptionPayment(
        company.slug,
        planId,
        billingCycle,
      );

      if (res.data?.message) {
        setFeedback({
          tone: "success",
          message: t("alerts.paymentInitialized"),
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
        message: t("alerts.checkoutLinkMissing"),
      });
    } catch (error: any) {
      console.error("Payment initialization failed", error);
      setFeedback({
        tone: "error",
        message:
          error?.response?.data?.error ||
          t("alerts.paymentInitializationFailed"),
      });
    } finally {
      setSubscribingTo(null);
    }
  };

  const getPlanAction = (plan: SubscriptionPlan): PlanAction => {
    const cardPrice = Number(plan.price || 0);

    if (!activeSub || activeSub.is_expired) {
      if (
        cardPrice === 0 &&
        (activeSub?.has_used_free_trial || activeSub?.is_expired)
      ) {
        return "free_used";
      }
      return "subscribe";
    }

    const currentPrice = Number(activeSub.plan?.price || 0);
    const currentCycle = activeSub.billing_cycle || "monthly";
    const cycleRank = { monthly: 1, six_month: 2, annual: 3 };

    if (activeSub.plan?.id === plan.id) {
      if (cycleRank[billingCycle] > cycleRank[currentCycle]) return "upgrade";
      return "current";
    }
    if (cardPrice === 0 && currentPrice > 0) return "free_locked";
    if (cardPrice === 0 && activeSub.has_used_free_trial) return "free_used";
    if (cardPrice > currentPrice) {
      if (
        currentPrice > 0 &&
        cycleRank[billingCycle] < cycleRank[currentCycle]
      ) {
        return "downgrade";
      }
      return "upgrade";
    }
    return "downgrade";
  };

  const maxSixMonthSavings = useMemo(
    () => Math.max(0, ...plans.map((p) => p.six_month_savings_percent || 0)),
    [plans],
  );
  const maxAnnualSavings = useMemo(
    () => Math.max(0, ...plans.map((p) => p.annual_savings_percent || 0)),
    [plans],
  );
  const hasSixMonthPlans = useMemo(
    () =>
      plans.some(
        (p) => p.six_month_price != null && Number(p.six_month_price) > 0,
      ),
    [plans],
  );
  const hasAnnualPlans = useMemo(
    () =>
      plans.some(
        (p) => p.annual_price != null && Number(p.annual_price) > 0,
      ),
    [plans],
  );

  const unusedCredit = useMemo(() => {
    if (!activeSub || activeSub.is_expired) return 0;
    const paid = Number(activeSub.last_payment_amount || 0);
    if (paid <= 0) return 0;
    const totalDays =
      activeSub.billing_cycle === "annual"
        ? 365
        : activeSub.billing_cycle === "six_month"
          ? 180
          : activeSub.plan?.duration_days || 30;
    const remaining = activeSub.days_remaining ?? 0;
    if (remaining <= 0 || totalDays <= 0) return 0;
    return Math.round((remaining / totalDays) * paid * 100) / 100;
  }, [activeSub]);

  const getButtonConfig = (action: PlanAction) => {
    switch (action) {
      case "current":
        return {
          label: t("currentPlan"),
          icon: <Shield className="h-4 w-4" />,
          disabled: true,
          className:
            "cursor-not-allowed border border-slate-200 bg-white text-slate-700",
        };

      case "upgrade":
        return {
          label: t("upgradePlan"),
          icon: <ArrowUp className="h-4 w-4" />,
          disabled: false,
          className: ACCENT.button,
        };

      case "downgrade":
        return {
          label: t("chooseLowerPlan"),
          icon: <ArrowDown className="h-4 w-4" />,
          disabled: true,
          className:
            "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400",
        };

      case "free_locked":
        return {
          label: t("freeAfterExpiry"),
          icon: <Clock className="h-4 w-4" />,
          disabled: true,
          className:
            "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400",
        };

      case "free_used":
        return {
          label: t("freeTrialUsed"),
          icon: <Shield className="h-4 w-4" />,
          disabled: true,
          className:
            "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-400",
        };

      case "subscribe":
        return {
          label: t("choosePlan"),
          icon: <CreditCard className="h-4 w-4" />,
          disabled: false,
          className: ACCENT.button,
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
  const isFree = currentPlanPrice === 0;
  const isExpired = activeSub?.is_expired ?? false;
  const daysRemaining = activeSub?.days_remaining;

  const currentPlanMeta = activeSub?.plan
    ? getPlanMeta(activeSub.plan, t)
    : {
        ...PLAN_META.free,
        positioning: t(PLAN_META.free.positioning),
        purpose: t(PLAN_META.free.purpose),
        audience: t(PLAN_META.free.audience),
        highlights: PLAN_META.free.highlights.map((key) => t(key)),
      };

  const currentProducts = activeSub?.current_products || 0;
  const currentServices = activeSub?.current_services || 0;
  const currentFeaturedProducts = activeSub?.current_featured_products || 0;
  const currentStaff = activeSub?.current_staff_members || 0;
  const allowedProducts = activeSub?.allowed_max_products ?? 0;
  const allowedServices = activeSub?.allowed_max_services ?? 15;
  const allowedFeaturedProducts =
    activeSub?.allowed_max_featured_products ?? 0;
  const allowedStaff = activeSub?.allowed_max_staff_members ?? 5;

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

  const statusClass =
    status === "Expired" || status === "Pending"
      ? "border-slate-200 bg-slate-100 text-slate-500"
      : status === "Expiring"
        ? "border-amber-200 bg-amber-50 text-amber-700"
        : status === "Free"
          ? "border-[#6750A4]/30 bg-[#6750A4]/10 text-[#6750A4]"
          : "border-emerald-200 bg-emerald-50 text-emerald-700";

  const statusLabel =
    status === "Expired"
      ? t("subscriptionStatus.expired")
      : status === "Free"
        ? t("subscriptionStatus.free")
        : status === "Expiring"
          ? t("subscriptionStatus.expiring")
          : status === "Active"
            ? t("subscriptionStatus.active")
            : t("subscriptionStatus.pending");

  return (
    <div className="mx-auto w-full max-w-[1280px] space-y-6 px-1 pb-10 sm:px-2">
      <PageHeader
        title={t("pageTitle")}
        description={t("pageDescription")}
        icon={CreditCard}
        loading={isLoading}
        className="mb-4 sm:mb-5"
      />

      {feedback && (
        <div
          role="status"
          className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm"
        >
          <div className="flex min-w-0 items-start gap-2.5">
            {feedback.tone === "success" ? (
              <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
            ) : feedback.tone === "error" ? (
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
            ) : (
              <Clock className="mt-0.5 h-4 w-4 shrink-0 text-[#6750A4]" />
            )}
            <p>{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="shrink-0 rounded-md px-2 py-0.5 text-xs font-semibold text-slate-500 hover:text-slate-800"
            aria-label={t("alerts.dismiss")}
          >
            {t("alerts.dismiss")}
          </button>
        </div>
      )}

      {loadError && !isLoading && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-start gap-3">
              <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
              <div>
                <p className="font-semibold text-slate-800">
                  {t("alerts.loadErrorTitle")}
                </p>
                <p className="mt-1 text-sm text-slate-500">{loadError}</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => void fetchData()}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50"
            >
              <RefreshCw className="h-4 w-4" />
              {t("alerts.retry")}
            </button>
          </div>
        </div>
      )}

      {/* ================= CURRENT SUBSCRIPTION ================= */}
      {isLoading ? (
        <SkeletonCurrentPlan />
      ) : (
        <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(320px,420px)] lg:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2.5">
                <span className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
                  {t("currentSubscription")}
                </span>
                <span
                  className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.08em] ${statusClass}`}
                >
                  {statusLabel}
                </span>
              </div>

              <div className="mt-3 flex flex-wrap items-end gap-x-3 gap-y-1">
                <h2 className="text-3xl font-black tracking-[-0.04em] text-slate-900 sm:text-4xl">
                  {activeSub?.plan?.name || currentPlanMeta.name}
                </h2>
                <span className="pb-1 text-sm font-semibold text-[#6750A4]">
                  {currentPlanMeta.positioning}
                </span>
              </div>

              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500">
                {currentPlanMeta.purpose}
              </p>

              <div className="mt-5 grid max-w-3xl gap-3 sm:grid-cols-3">
                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {t("billingDetails.price")}
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-slate-800">
                    {isFree
                      ? t("billingDetails.free")
                      : t("billingDetails.monthlyPrice", {
                          price: formatEtb(currentPlanPrice),
                        })}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {t("billingDetails.started")}
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-slate-800">
                    {formatDate(activeSub?.start_date)}
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50/70 px-4 py-3">
                  <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">
                    {isFree
                      ? t("billingDetails.trialPeriodEnds")
                      : t("billingDetails.renewal")}
                  </p>
                  <p className="mt-1 text-sm font-extrabold text-slate-800">
                    {activeSub?.end_date
                      ? formatDate(activeSub.end_date)
                      : isFree
                        ? t("billingDetails.noExpiry")
                        : "—"}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex items-center gap-2 text-xs text-slate-500">
                <Store className="h-4 w-4 text-[#6750A4]" />
                {t("billingDetails.bestSuitedFor", {
                  audience: currentPlanMeta.audience.toLowerCase(),
                })}
              </div>

              {!isExpired &&
                daysRemaining !== null &&
                daysRemaining !== undefined &&
                daysRemaining <= 7 &&
                daysRemaining > 0 && (
                  <div className="mt-4 flex max-w-2xl items-start gap-2.5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs leading-5 text-amber-800">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    {t("alerts.expiringWarning", {
                      count: daysRemaining,
                    })}
                  </div>
                )}

              {isExpired && (
                <div className="mt-4 flex max-w-2xl items-start gap-2.5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-xs leading-5 text-red-800">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                  <div>
                    <span className="font-semibold">
                      {t("alerts.expiredTitle")}
                    </span>{" "}
                    {t("alerts.expiredDescription")}
                  </div>
                </div>
              )}
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
              {isServiceCompany ? (
                <UsageCard
                  icon={<Package className="h-4 w-4" />}
                  label={t("usage.activeServices")}
                  current={currentServices}
                  limit={allowedServices}
                  t={t}
                />
              ) : (
                <>
                  <UsageCard
                    icon={<Package className="h-4 w-4" />}
                    label={t("usage.publicProducts")}
                    current={currentProducts}
                    limit={allowedProducts}
                    t={t}
                  />
                  <UsageCard
                    icon={<Zap className="h-4 w-4" />}
                    label={t("usage.featuredProducts")}
                    current={currentFeaturedProducts}
                    limit={allowedFeaturedProducts}
                    t={t}
                  />
                </>
              )}
              <UsageCard
                icon={<Users className="h-4 w-4" />}
                label={t("usage.staffMembers")}
                current={currentStaff}
                limit={allowedStaff}
                t={t}
              />
            </div>
          </div>
        </section>
      )}

      {/* ================= PLANS ================= */}
      <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
        <div className="text-center">
          <h2 className="text-2xl font-bold tracking-[-0.03em] text-slate-900 sm:text-3xl">
            {isExpired ? t("plans.reactivate") : t("plans.heroTitle")}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {t("plans.currentPlanSubtitle", {
              plan: activeSub?.plan?.name || currentPlanMeta.name,
            })}
          </p>
        </div>

        {/* Billing cycle toggle */}
        <div className="mt-6 flex justify-center">
          {hasSixMonthPlans || hasAnnualPlans ? (
            <div className="inline-flex flex-wrap items-center justify-center gap-1 rounded-full bg-slate-100 p-1">
              <button
                type="button"
                onClick={() => setBillingCycle("monthly")}
                className={`rounded-full px-4 py-2 text-xs font-bold transition ${
                  billingCycle === "monthly"
                    ? "bg-white text-slate-900 shadow-sm"
                    : "text-slate-500 hover:text-slate-700"
                }`}
              >
                {t("billingCycle.monthly")}
              </button>

              {hasSixMonthPlans && (
                <button
                  type="button"
                  onClick={() => setBillingCycle("six_month")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                    billingCycle === "six_month"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>{t("billingCycle.sixMonth")}</span>
                  {maxSixMonthSavings > 0 && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                      {t("billingCycle.save", {
                        percent: maxSixMonthSavings,
                      })}
                    </span>
                  )}
                </button>
              )}

              {hasAnnualPlans && (
                <button
                  type="button"
                  onClick={() => setBillingCycle("annual")}
                  className={`inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-bold transition ${
                    billingCycle === "annual"
                      ? "bg-white text-slate-900 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  <span>{t("billingCycle.annual")}</span>
                  {maxAnnualSavings > 0 && (
                    <span className="rounded-full bg-emerald-100 px-1.5 py-0.5 text-[10px] font-extrabold text-emerald-700">
                      {t("billingCycle.save", {
                        percent: maxAnnualSavings,
                      })}
                    </span>
                  )}
                </button>
              )}
            </div>
          ) : (
            <span className="rounded-full bg-slate-100 px-4 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
              {t("billingDetails.monthlyBilling")}
            </span>
          )}
        </div>

        {!isAuthorized && !isLoading && (
          <div className="mt-4 flex items-start justify-center gap-2 text-xs text-slate-500">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-slate-400" />
            <span className="max-w-xl text-center">
              {t("alerts.accessNotice")}
            </span>
          </div>
        )}

        {isLoading ? (
          <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : sortedPlans.length === 0 ? (
          <div className="mt-8 rounded-2xl border border-slate-200 bg-white px-5 py-12 text-center">
            <CreditCard className="mx-auto h-6 w-6 text-slate-300" />
            <p className="mt-3 text-sm font-semibold text-slate-700">
              {t("alerts.noPlans")}
            </p>
            <p className="mt-1 text-xs text-slate-400">
              {t("alerts.noPlansDescription")}
            </p>
          </div>
        ) : (
          <div className="mt-8 grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-4">
            {sortedPlans.map((plan) => {
              const action = getPlanAction(plan);
              const button = getButtonConfig(action);
              const baseMonthlyPrice = Number(plan.price || 0);
              const selectedTotalPrice =
                baseMonthlyPrice === 0
                  ? 0
                  : billingCycle === "six_month"
                    ? plan.six_month_price != null
                      ? Number(plan.six_month_price)
                      : null
                    : billingCycle === "annual"
                      ? plan.annual_price != null
                        ? Number(plan.annual_price)
                        : null
                      : baseMonthlyPrice;
              const isCycleUnavailable =
                baseMonthlyPrice > 0 && selectedTotalPrice === null;
              const effectiveMonthlyPrice =
                selectedTotalPrice === null
                  ? baseMonthlyPrice
                  : billingCycle === "six_month"
                    ? Number(
                        plan.six_month_monthly_equivalent ??
                          selectedTotalPrice / 6,
                      )
                    : billingCycle === "annual"
                      ? Number(
                          plan.annual_monthly_equivalent ??
                            selectedTotalPrice / 12,
                        )
                      : baseMonthlyPrice;
              const savingsPercent =
                billingCycle === "six_month"
                  ? plan.six_month_savings_percent || 0
                  : billingCycle === "annual"
                    ? plan.annual_savings_percent || 0
                    : 0;
              const dueToday =
                action === "upgrade" &&
                selectedTotalPrice !== null &&
                unusedCredit > 0
                  ? Math.max(
                      1,
                      Math.round((selectedTotalPrice - unusedCredit) * 100) /
                        100,
                    )
                  : null;
              const price = baseMonthlyPrice;
              const meta = getPlanMeta(plan, t);
              const tier = resolvePlanTier(plan);
              const isCurrent = action === "current";
              const isUpgrade = action === "upgrade";

              const includedItems = getDynamicPlanFeatures(
                plan,
                tier,
                t,
                isServiceCompany,
              );

              return (
                <article
                  key={plan.id}
                  className={`relative flex min-w-0 flex-col rounded-2xl border-2 bg-white p-6 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg ${
                    isCurrent || isUpgrade
                      ? "border-[#6750A4] shadow-md"
                      : "border-[#6750A4]/25 hover:border-[#6750A4]/50"
                  }`}
                >
                  {isCurrent ? (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6750A4] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] text-white shadow-sm">
                      {t("currentPlan")}
                    </div>
                  ) : isUpgrade ? (
                    <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#6750A4] px-3 py-1 text-[10px] font-extrabold uppercase tracking-[0.05em] text-white shadow-sm">
                      {t("upgradeBadge")}
                    </div>
                  ) : null}

                  {/* Icon */}
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#6750A4] text-white shadow-sm">
                   <BadgeCheck className="h-5 w-5" />
                  </div>

                  {/* Name + positioning */}
                  <h3 className="mt-4 text-lg font-bold tracking-[-0.01em] text-slate-900">
                    {plan.name}
                  </h3>
                  <p className="mt-0.5 text-[11px] font-medium text-slate-500">
                    {meta.positioning}
                  </p>

                  {/* Price */}
                  <div className="mt-5">
                    {isCycleUnavailable ? (
                      <p className="text-sm font-semibold text-slate-400">
                        {t("billingCycle.monthlyOnly")}
                      </p>
                    ) : (
                      <div className="flex flex-wrap items-end gap-1.5">
                        <span className="text-4xl font-extrabold leading-none tracking-[-0.04em] text-slate-900">
                          {price === 0
                            ? t("billingDetails.free")
                            : `${formatEtb(effectiveMonthlyPrice)} ETB`}
                        </span>
                        {price > 0 && (
                          <span className="pb-1 text-[11px] font-semibold text-slate-400">
                            / {t("billingCycle.monthlyShort")}
                          </span>
                        )}
                      </div>
                    )}

                    <div className="mt-2 flex flex-wrap items-center gap-1.5">
                      <span className="inline-block rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-600">
                        {t(`tiers.${tier}`)}
                      </span>
                      {savingsPercent > 0 && (
                        <span className="inline-block rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-extrabold text-emerald-700">
                          {t("billingCycle.save", { percent: savingsPercent })}
                        </span>
                      )}
                    </div>

                    {price > 0 &&
                      billingCycle !== "monthly" &&
                      selectedTotalPrice !== null && (
                        <p className="mt-2 text-[11px] text-slate-500">
                          <span className="mr-1.5 line-through text-slate-400">
                            {formatEtb(baseMonthlyPrice)} ETB
                          </span>
                          {t("billingCycle.billed", {
                            amount: formatEtb(selectedTotalPrice),
                            period:
                              billingCycle === "annual"
                                ? t("billingCycle.months12")
                                : t("billingCycle.months6"),
                          })}
                        </p>
                      )}
                  </div>

                  {/* Features */}
                  <p className="mt-5 text-[10px] font-bold uppercase tracking-[0.11em] text-slate-400">
                    {t("plans.included")}
                  </p>

                  <ul className="mt-3 space-y-2.5">
                    {includedItems.map((item) => (
                      <li key={item.label} className="flex items-start gap-2">
                        <span
                          className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded ${
                            item.enabled
                              ? "bg-[#6750A4] text-white"
                              : "bg-slate-200 text-slate-400"
                          }`}
                        >
                          {item.enabled ? (
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          ) : (
                            <X className="h-2.5 w-2.5" strokeWidth={3} />
                          )}
                        </span>
                        <span
                          className={`text-[11px] leading-5 ${
                            item.enabled
                              ? "text-slate-700"
                              : "text-slate-400 line-through"
                          }`}
                        >
                          {item.label}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <div className="mt-auto pt-6">
                    <button
                      type="button"
                      onClick={() => void handleSubscribe(plan.id)}
                      disabled={
                        !isAuthorized ||
                        button.disabled ||
                        isCycleUnavailable ||
                        subscribingTo === plan.id
                      }
                      className={`inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-extrabold transition-all duration-200 disabled:translate-y-0 disabled:shadow-none ${
                        !isAuthorized &&
                        action !== "current" &&
                        action !== "free_locked"
                          ? "cursor-not-allowed border border-slate-200 bg-slate-50 text-slate-300"
                          : button.className
                      }`}
                      title={
                        !isAuthorized
                          ? t("alerts.unauthorizedTooltip")
                          : undefined
                      }
                    >
                      {subscribingTo === plan.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <>
                          {button.icon}
                          {button.label}
                        </>
                      )}
                    </button>

                    {action === "upgrade" && !isExpired && (
                      <p className="mt-2 text-center text-[10px] leading-4 text-slate-500">
                        {dueToday !== null
                          ? t("plans.dueToday", {
                              amount: formatEtb(dueToday),
                              credit: formatEtb(unusedCredit),
                            })
                          : t("plans.startsAfterPayment")}
                      </p>
                    )}

                    {action === "downgrade" && (
                      <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                        {t("plans.downgradePolicy")}
                      </p>
                    )}

                    {action === "free_locked" && (
                      <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                        {t("plans.freeAfterPaid")}
                      </p>
                    )}

                    {action === "free_used" && (
                      <p className="mt-2 text-center text-[10px] leading-4 text-slate-400">
                        {t("plans.freeTrialUsedNote")}
                      </p>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* ================= NOTES ================= */}
      <section className="rounded-3xl border border-slate-200 bg-slate-50/70 p-5 shadow-sm sm:p-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="flex items-start gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#6750A4]/10 text-[#6750A4]">
              <BadgeCheck className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-800">
                {t("notes.title")}
              </h3>
              <p className="mt-1 max-w-4xl text-xs leading-5 text-slate-500">
                {t("notes.description")}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-[10px] font-bold uppercase tracking-[0.08em] text-slate-600">
            <Shield className="h-3.5 w-3.5 text-[#6750A4]" />
            {t("notes.managedBy")}
          </div>
        </div>
      </section>
    </div>
  );
}