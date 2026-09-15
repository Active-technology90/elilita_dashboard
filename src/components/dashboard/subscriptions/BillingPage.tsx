// src/components/admin/subscriptions/BillingPage.tsx

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  AlertTriangle,
  ArrowDown,
  ArrowUp,
  CheckCircle2,
  Clock,
  CreditCard,
  Package,
  Shield,
  Sparkles,
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
  highlights: string[];
};

const PLAN_META: Record<
  Exclude<PlanTier, "custom">,
  PlanMeta
> = {
  free: {
    name: "Free",
    positioning: "Start Selling",
    purpose:
      "Establish your business presence on Elilita.",
    highlights: [
      "Basic storefront",
      "Limited product catalogue",
      "Basic order & inventory management",
      "Basic sales dashboard",
    ],
  },

  basic: {
    name: "Basic",
    positioning: "Grow Your Store",
    purpose:
      "Get the tools you need to manage and grow your online business.",
    highlights: [
      "Professional storefront",
      "Expanded product catalogue",
      "Full order management",
      "Basic analytics & promotions",
    ],
  },

  advanced: {
    name: "Advanced",
    positioning: "Scale Your Business",
    purpose:
      "Manage more products, orders, customers and marketing activities.",
    highlights: [
      "Advanced storefront & inventory",
      "Advanced order management",
      "Advanced analytics",
      "Featured products & marketing tools",
    ],
  },

  premium: {
    name: "Premium",
    positioning: "Maximize Your Business",
    purpose:
      "Get maximum visibility, analytics, marketing and operational capabilities.",
    highlights: [
      "Premium storefront & priority visibility",
      "Unlimited product listing",
      "Advanced analytics & customer insights",
      "Priority marketing & support",
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

const resolvePlanTier = (
  plan?: Partial<SubscriptionPlan> | null,
): PlanTier => {
  if (!plan) return "custom";

  const name = String(plan.name || "")
    .trim()
    .toLowerCase();

  const price = Number(plan.price ?? 0);

  if (
    name.includes("premium") ||
    name.includes("enterprise")
  ) {
    return "premium";
  }

  if (
    name.includes("advanced") ||
    name.includes("professional") ||
    name === "pro"
  ) {
    return "advanced";
  }

  if (name.includes("basic")) {
    return "basic";
  }

  if (
    name.includes("free") ||
    name.includes("starter") ||
    price === 0
  ) {
    return "free";
  }

  return "custom";
};

const getPlanMeta = (
  plan: SubscriptionPlan,
): PlanMeta => {
  const tier = resolvePlanTier(plan);

  if (tier !== "custom") {
    return PLAN_META[tier];
  }

  return {
    name: plan.name,
    positioning: "Custom Plan",
    purpose:
      plan.description ||
      "Custom subscription configuration.",
    highlights: [],
  };
};

const formatEtb = (value: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
  }).format(value);

const formatDate = (
  value?: string | null,
) => {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "—";
  }

  return new Intl.DateTimeFormat(
    "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  ).format(date);
};

const formatLimit = (
  value?: number | null,
) => {
  if (value === -1) return "Unlimited";

  return String(value ?? 0);
};

const calculateUsage = (
  current: number,
  limit: number,
) => {
  if (limit === -1) {
    return current > 0 ? 100 : 0;
  }

  if (limit <= 0) {
    return 0;
  }

  return Math.min(
    100,
    (current / limit) * 100,
  );
};

const SkeletonCard = () => (
  <div
    className="
      animate-pulse
      rounded-xl
      border
      border-secondary/10
      bg-white
      p-4
    "
  >
    <div className="h-3 w-20 rounded bg-gray-200" />
    <div className="mt-2 h-6 w-28 rounded bg-gray-200" />
    <div className="mt-3 h-8 w-32 rounded bg-gray-200" />

    <div className="mt-4 space-y-2">
      {Array.from({ length: 5 }).map(
        (_, index) => (
          <div
            key={index}
            className="h-3 rounded bg-gray-100"
            style={{
              width: `${
                92 - index * 7
              }%`,
            }}
          />
        ),
      )}
    </div>

    <div className="mt-4 h-9 rounded-lg bg-gray-100" />
  </div>
);

const SkeletonCurrentPlan = () => (
  <div
    className="
      animate-pulse
      rounded-xl
      border
      border-secondary/10
      bg-white
      p-4
    "
  >
    <div
      className="
        grid
        gap-4
        lg:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]
      "
    >
      <div>
        <div className="h-3 w-20 rounded bg-gray-200" />
        <div className="mt-2 h-8 w-44 rounded bg-gray-200" />
        <div className="mt-2 h-3 w-64 max-w-full rounded bg-gray-100" />
      </div>

      <div className="grid gap-2 sm:grid-cols-2">
        <div className="h-20 rounded-lg bg-gray-100" />
        <div className="h-20 rounded-lg bg-gray-100" />
      </div>
    </div>
  </div>
);

export default function BillingPage() {
  const { company } = useCurrentCompany();

  const [plans, setPlans] =
    useState<SubscriptionPlan[]>([]);

  const [
    activeSub,
    setActiveSub,
  ] =
    useState<ActiveSubscription | null>(
      null,
    );

  const [isLoading, setIsLoading] =
    useState(true);

  const [
    subscribingTo,
    setSubscribingTo,
  ] = useState<number | null>(null);

  const isAuthorized =
    company?.role === "owner" ||
    company?.role === "admin";

  const fetchData = useCallback(
    async () => {
      try {
        setIsLoading(true);

        const [plansRes, subRes] =
          await Promise.all([
            getSubscriptionPlans(),
            getMySubscription(
              company?.slug,
            ),
          ]);

        setPlans(
          plansRes.data?.results ||
            plansRes.data ||
            [],
        );

        setActiveSub(
          subRes.data || null,
        );
      } catch (error) {
        console.error(
          "Failed to load billing data",
          error,
        );
      } finally {
        setIsLoading(false);
      }
    },
    [company?.slug],
  );

  const verifyPaymentAndFetch =
    useCallback(
      async (
        txRef: string,
        attempt = 1,
      ) => {
        const MAX_RETRIES = 3;
        const RETRY_DELAY_MS = 3000;

        try {
          setIsLoading(true);

          const res =
            await verifySubscriptionPayment(
              txRef,
            );

          if (res.data?.message) {
            window.history.replaceState(
              {},
              document.title,
              window.location.pathname,
            );

            await fetchData();
            return;
          }
        } catch (error: any) {
          console.error(
            `Payment verification attempt ${attempt} failed`,
            error,
          );

          const errorMsg =
            error?.response?.data
              ?.error || "";

          if (
            attempt < MAX_RETRIES &&
            errorMsg.includes("pending")
          ) {
            window.setTimeout(
              () => {
                void verifyPaymentAndFetch(
                  txRef,
                  attempt + 1,
                );
              },
              RETRY_DELAY_MS,
            );

            return;
          }
        }

        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );

        await fetchData();
      },
      [fetchData],
    );

  useEffect(() => {
    const queryParams =
      new URLSearchParams(
        window.location.search,
      );

    const txRef =
      queryParams.get("sub_tx_ref");

    if (
      txRef &&
      company?.slug
    ) {
      void verifyPaymentAndFetch(
        txRef,
      );
    } else {
      void fetchData();
    }
  }, [
    company?.slug,
    fetchData,
    verifyPaymentAndFetch,
  ]);

  const handleSubscribe = async (
    planId: number,
  ) => {
    if (!company?.slug) {
      return;
    }

    if (!isAuthorized) {
      alert(
        "Only company owners and admins can manage subscriptions.",
      );
      return;
    }

    try {
      setSubscribingTo(planId);

      const res =
        await initializeSubscriptionPayment(
          company.slug,
          planId,
        );

      if (res.data?.message) {
        alert(
          "Plan activated successfully!",
        );

        await fetchData();

        return;
      }

      if (
        res.data?.checkout_url
      ) {
        window.location.href =
          res.data.checkout_url;
      }
    } catch (error: any) {
      console.error(
        "Payment initialization failed",
        error,
      );

      alert(
        error?.response?.data?.error ||
          "Failed to initialize payment. Please try again.",
      );
    } finally {
      setSubscribingTo(null);
    }
  };

  const getPlanAction = (
    plan: SubscriptionPlan,
  ): PlanAction => {
    if (
      !activeSub ||
      activeSub.is_expired
    ) {
      return "subscribe";
    }

    const currentPrice = Number(
      activeSub.plan?.price || 0,
    );

    const cardPrice = Number(
      plan.price || 0,
    );

    if (
      activeSub.plan?.id === plan.id
    ) {
      return "current";
    }

    if (
      cardPrice === 0 &&
      currentPrice > 0
    ) {
      return "free_locked";
    }

    if (
      cardPrice > currentPrice
    ) {
      return "upgrade";
    }

    return "downgrade";
  };

  const getButtonConfig = (
    action: PlanAction,
  ) => {
    switch (action) {
      case "current":
        return {
          label: "Current Plan",
          icon: (
            <Shield className="h-3.5 w-3.5" />
          ),
          disabled: true,
          className:
            "cursor-not-allowed border border-secondary/10 bg-secondary/[0.04] text-secondary/55",
        };

      case "upgrade":
        return {
          label: "Upgrade",
          icon: (
            <ArrowUp className="h-3.5 w-3.5" />
          ),
          disabled: false,
          className:
            "bg-secondary text-white hover:opacity-90",
        };

      case "downgrade":
        return {
          label: "Downgrade",
          icon: (
            <ArrowDown className="h-3.5 w-3.5" />
          ),
          disabled: false,
          className:
            "border border-secondary/15 bg-white text-secondary hover:bg-secondary/[0.04]",
        };

      case "free_locked":
        return {
          label: "Free on Expiry",
          icon: (
            <Clock className="h-3.5 w-3.5" />
          ),
          disabled: true,
          className:
            "cursor-not-allowed border border-secondary/10 bg-secondary/[0.025] text-secondary/45",
        };

      case "subscribe":
        return {
          label: "Subscribe",
          icon: (
            <CreditCard className="h-3.5 w-3.5" />
          ),
          disabled: false,
          className:
            "bg-secondary text-white hover:opacity-90",
        };
    }
  };

  const sortedPlans = useMemo(
    () =>
      [...plans].sort((a, b) => {
        const aOrder =
          PLAN_ORDER.indexOf(
            resolvePlanTier(a),
          );

        const bOrder =
          PLAN_ORDER.indexOf(
            resolvePlanTier(b),
          );

        if (aOrder !== bOrder) {
          return aOrder - bOrder;
        }

        return (
          Number(a.price || 0) -
          Number(b.price || 0)
        );
      }),
    [plans],
  );

  const currentPlanPrice =
    Number(
      activeSub?.plan?.price || 0,
    );

  const isFree =
    currentPlanPrice === 0;

  const isExpired =
    activeSub?.is_expired ?? false;

  const daysRemaining =
    activeSub?.days_remaining;

  const currentPlanMeta =
    activeSub?.plan
      ? getPlanMeta(
          activeSub.plan,
        )
      : PLAN_META.free;

  const currentProducts =
    activeSub?.current_products || 0;

  const currentFeaturedProducts =
    activeSub
      ?.current_featured_products ||
    0;

  const allowedProducts =
    activeSub
      ?.allowed_max_products ?? 0;

  const allowedFeaturedProducts =
    activeSub
      ?.allowed_max_featured_products ??
    0;

  return (
    <div
      className="
        mx-auto
        w-full
        max-w-[1500px]
        space-y-4
        px-1
        pb-4
        sm:px-2
      "
    >
      <PageHeader
        title="Billing & Subscription"
        description="Manage your current plan, usage and available subscription tiers."
        icon={CreditCard}
        loading={isLoading}
      />

      {/* =====================================================
          CURRENT PLAN
      ====================================================== */}

      {isLoading ? (
        <SkeletonCurrentPlan />
      ) : (
        <section
          className={`
            rounded-xl
            border
            bg-white
            p-3.5
            shadow-[0_1px_3px_rgba(0,0,0,0.035)]
            sm:p-4

            ${
              isExpired
                ? "border-secondary/25"
                : "border-secondary/10"
            }
          `}
        >
          <div
            className="
              grid
              gap-4
              lg:grid-cols-[minmax(0,1fr)_minmax(320px,460px)]
              lg:items-center
            "
          >
            <div className="min-w-0">
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <p
                  className="
                    text-[9px]
                    font-semibold
                    uppercase
                    tracking-[0.12em]
                    text-secondary/60
                  "
                >
                  Current plan
                </p>

                <span
                  className="
                    rounded-full
                    bg-secondary/[0.06]
                    px-2
                    py-0.5
                    text-[9px]
                    font-semibold
                    text-secondary
                  "
                >
                  {isExpired
                    ? "Expired"
                    : isFree
                      ? "Lifetime Free"
                      : daysRemaining !==
                            null &&
                          daysRemaining !==
                            undefined
                        ? daysRemaining === 0
                          ? "Expires today"
                          : `${daysRemaining} days remaining`
                        : "Active"}
                </span>
              </div>

              <div
                className="
                  mt-1.5
                  flex
                  flex-wrap
                  items-end
                  gap-x-3
                  gap-y-1
                "
              >
                <h2
                  className="
                    text-2xl
                    font-extrabold
                    tracking-[-0.04em]
                    text-secondary
                    sm:text-3xl
                  "
                >
                  {currentPlanMeta.name}
                </h2>

                <span
                  className="
                    pb-0.5
                    text-[10px]
                    font-semibold
                    text-gray-400
                  "
                >
                  {
                    currentPlanMeta.positioning
                  }
                </span>
              </div>

              <p
                className="
                  mt-1.5
                  max-w-2xl
                  text-[11px]
                  leading-5
                  text-gray-500
                "
              >
                {currentPlanMeta.purpose}
              </p>

              <div
                className="
                  mt-3
                  flex
                  flex-wrap
                  gap-x-5
                  gap-y-2
                "
              >
                <div>
                  <p
                    className="
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-[0.08em]
                      text-gray-400
                    "
                  >
                    Price
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-gray-900">
                    {isFree
                      ? "Free"
                      : `ETB ${formatEtb(
                          currentPlanPrice,
                        )} / month`}
                  </p>
                </div>

                <div>
                  <p
                    className="
                      text-[9px]
                      font-medium
                      uppercase
                      tracking-[0.08em]
                      text-gray-400
                    "
                  >
                    Renewal
                  </p>

                  <p className="mt-0.5 text-xs font-bold text-gray-900">
                    {isFree
                      ? "No renewal required"
                      : formatDate(
                          activeSub?.end_date,
                        )}
                  </p>
                </div>
              </div>

              {!isExpired &&
                !isFree &&
                daysRemaining !== null &&
                daysRemaining !==
                  undefined &&
                daysRemaining <= 7 &&
                daysRemaining > 0 && (
                  <div
                    className="
                      mt-3
                      flex
                      max-w-xl
                      items-start
                      gap-2
                      rounded-lg
                      border
                      border-secondary/10
                      bg-secondary/[0.025]
                      px-2.5
                      py-2
                      text-[10px]
                      leading-4
                      text-gray-600
                    "
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />

                    Your plan expires soon.
                    Renew or upgrade to keep
                    premium capabilities.
                  </div>
                )}

              {isExpired && (
                <div
                  className="
                    mt-3
                    flex
                    max-w-xl
                    items-start
                    gap-2
                    rounded-lg
                    border
                    border-secondary/15
                    bg-secondary/[0.035]
                    px-2.5
                    py-2
                    text-[10px]
                    leading-4
                    text-gray-600
                  "
                >
                  <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-secondary" />

                  Your subscription has
                  expired. Select a plan
                  below to restore paid
                  capabilities.
                </div>
              )}
            </div>

            {/* Current backend usage */}
            <div
              className="
                grid
                gap-2
                sm:grid-cols-2
              "
            >
              <div
                className="
                  rounded-lg
                  border
                  border-secondary/[0.08]
                  bg-secondary/[0.02]
                  p-3
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-2
                  "
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                    <Package className="h-3.5 w-3.5 text-secondary" />
                    Public products
                  </span>

                  <span className="text-[10px] font-bold text-secondary">
                    {currentProducts} /{" "}
                    {formatLimit(
                      allowedProducts,
                    )}
                  </span>
                </div>

                <div
                  className="
                    mt-2
                    h-1.5
                    overflow-hidden
                    rounded-full
                    bg-secondary/[0.08]
                  "
                >
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{
                      width: `${calculateUsage(
                        currentProducts,
                        allowedProducts,
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div
                className="
                  rounded-lg
                  border
                  border-secondary/[0.08]
                  bg-secondary/[0.02]
                  p-3
                "
              >
                <div
                  className="
                    flex
                    items-center
                    justify-between
                    gap-2
                  "
                >
                  <span className="flex items-center gap-1.5 text-[10px] font-medium text-gray-600">
                    <Zap className="h-3.5 w-3.5 text-secondary" />
                    Featured products
                  </span>

                  <span className="text-[10px] font-bold text-secondary">
                    {
                      currentFeaturedProducts
                    }{" "}
                    /{" "}
                    {formatLimit(
                      allowedFeaturedProducts,
                    )}
                  </span>
                </div>

                <div
                  className="
                    mt-2
                    h-1.5
                    overflow-hidden
                    rounded-full
                    bg-secondary/[0.08]
                  "
                >
                  <div
                    className="h-full rounded-full bg-secondary"
                    style={{
                      width: `${calculateUsage(
                        currentFeaturedProducts,
                        allowedFeaturedProducts,
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* =====================================================
          AVAILABLE PLANS
      ====================================================== */}

      <section>
        <div
          className="
            mb-3
            flex
            flex-col
            gap-2
            sm:flex-row
            sm:items-end
            sm:justify-between
          "
        >
          <div>
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-secondary" />

              <p
                className="
                  text-[9px]
                  font-semibold
                  uppercase
                  tracking-[0.12em]
                  text-secondary/65
                "
              >
                Subscription tiers
              </p>
            </div>

            <h2
              className="
                mt-0.5
                text-base
                font-bold
                tracking-[-0.02em]
                text-gray-900
              "
            >
              {isExpired
                ? "Reactivate your plan"
                : "Available plans"}
            </h2>
          </div>

          <span
            className="
              w-fit
              rounded-md
              border
              border-secondary/10
              bg-white
              px-2
              py-1
              text-[9px]
              font-semibold
              text-secondary
            "
          >
            Monthly billing
          </span>
        </div>

        {!isAuthorized &&
          !isLoading && (
            <div
              className="
                mb-3
                rounded-lg
                border
                border-secondary/10
                bg-white
                px-3
                py-2
                text-[10px]
                text-gray-600
              "
            >
              Only company owners and
              admins can change the
              subscription.
            </div>
          )}

        {isLoading ? (
          <div
            className="
              grid
              gap-3
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {Array.from({
              length: 4,
            }).map((_, index) => (
              <SkeletonCard key={index} />
            ))}
          </div>
        ) : sortedPlans.length === 0 ? (
          <div
            className="
              rounded-xl
              border
              border-secondary/10
              bg-white
              px-4
              py-8
              text-center
            "
          >
            <CreditCard className="mx-auto h-5 w-5 text-secondary/50" />

            <p className="mt-2 text-sm font-semibold text-gray-800">
              No plans available
            </p>

            <p className="mt-1 text-[10px] text-gray-500">
              Subscription plans will
              appear here when they are
              configured.
            </p>
          </div>
        ) : (
          <div
            className="
              grid
              items-stretch
              gap-3
              sm:grid-cols-2
              xl:grid-cols-4
            "
          >
            {sortedPlans.map((plan) => {
              const action =
                getPlanAction(plan);

              const button =
                getButtonConfig(action);

              const price = Number(
                plan.price || 0,
              );

              const meta =
                getPlanMeta(plan);

              const isCurrent =
                action === "current";

              const isUpgrade =
                action === "upgrade";

              const isDowngrade =
                action === "downgrade";

              const visibilityItems = [
                {
                  label: "Company page ads",
                  enabled:
                    plan.can_ad_company_detail,
                },
                {
                  label: "Company list ads",
                  enabled:
                    plan.can_ad_companies_list,
                },
                {
                  label: "Home page ads",
                  enabled:
                    plan.can_ad_home_page,
                },
              ];

              return (
                <article
                  key={plan.id}
                  className={`
                    relative
                    flex
                    min-w-0
                    flex-col
                    overflow-hidden
                    rounded-xl
                    border
                    bg-white
                    p-3.5
                    shadow-[0_1px_3px_rgba(0,0,0,0.035)]
                    transition-all
                    duration-150

                    ${
                      isCurrent
                        ? "border-secondary shadow-[0_2px_8px_rgba(0,0,0,0.05)]"
                        : "border-secondary/10 hover:border-secondary/20 hover:shadow-sm"
                    }
                  `}
                >
                  {/* Card state */}
                  <div
                    className="
                      flex
                      min-h-5
                      items-center
                      justify-between
                      gap-2
                    "
                  >
                    <p
                      className="
                        min-w-0
                        truncate
                        text-[9px]
                        font-semibold
                        uppercase
                        tracking-[0.1em]
                        text-secondary/60
                      "
                    >
                      {meta.positioning}
                    </p>

                    {isCurrent && (
                      <span
                        className="
                          shrink-0
                          rounded-full
                          bg-secondary
                          px-1.5
                          py-0.5
                          text-[8px]
                          font-bold
                          uppercase
                          tracking-[0.06em]
                          text-white
                        "
                      >
                        Current
                      </span>
                    )}

                    {!isCurrent &&
                      isUpgrade && (
                        <span
                          className="
                            inline-flex
                            shrink-0
                            items-center
                            gap-0.5
                            rounded-full
                            bg-secondary/[0.07]
                            px-1.5
                            py-0.5
                            text-[8px]
                            font-bold
                            uppercase
                            tracking-[0.06em]
                            text-secondary
                          "
                        >
                          <ArrowUp className="h-2.5 w-2.5" />
                          Upgrade
                        </span>
                      )}

                    {!isCurrent &&
                      isDowngrade && (
                        <span
                          className="
                            inline-flex
                            shrink-0
                            items-center
                            gap-0.5
                            rounded-full
                            border
                            border-secondary/10
                            px-1.5
                            py-0.5
                            text-[8px]
                            font-bold
                            uppercase
                            tracking-[0.06em]
                            text-secondary/65
                          "
                        >
                          <ArrowDown className="h-2.5 w-2.5" />
                          Lower tier
                        </span>
                      )}
                  </div>

                  {/* Plan identity */}
                  <div className="mt-1">
                    <h3
                      className="
                        truncate
                        text-lg
                        font-extrabold
                        tracking-[-0.03em]
                        text-gray-900
                      "
                    >
                      {meta.name}
                    </h3>

                    <div className="mt-2 flex items-end gap-1">
                      <span
                        className="
                          text-[26px]
                          font-extrabold
                          leading-none
                          tracking-[-0.04em]
                          text-secondary
                        "
                      >
                        {price === 0
                          ? "Free"
                          : `${formatEtb(
                              price,
                            )} ETB`}
                      </span>

                      {price > 0 && (
                        <span
                          className="
                            pb-0.5
                            text-[10px]
                            font-medium
                            text-gray-400
                          "
                        >
                          /mo
                        </span>
                      )}
                    </div>

                    <p
                      className="
                        mt-2
                        min-h-[40px]
                        text-[10px]
                        leading-4
                        text-gray-500
                      "
                    >
                      {plan.description ||
                        meta.purpose}
                    </p>
                  </div>

                  {/* Main benefits */}
                  {meta.highlights.length >
                    0 && (
                    <div className="mt-3">
                      <p
                        className="
                          text-[8px]
                          font-semibold
                          uppercase
                          tracking-[0.1em]
                          text-gray-400
                        "
                      >
                        Main benefits
                      </p>

                      <ul className="mt-2 space-y-1.5">
                        {meta.highlights.map(
                          (feature) => (
                            <li
                              key={feature}
                              className="flex items-start gap-1.5"
                            >
                              <CheckCircle2 className="mt-0.5 h-3 w-3 shrink-0 text-secondary" />

                              <span
                                className="
                                  text-[10px]
                                  leading-4
                                  text-gray-600
                                "
                              >
                                {feature}
                              </span>
                            </li>
                          ),
                        )}
                      </ul>
                    </div>
                  )}

                  {/* Backend-controlled limits */}
                  <div
                    className="
                      mt-3
                      border-t
                      border-secondary/[0.07]
                      pt-2.5
                    "
                  >
                    <p
                      className="
                        text-[8px]
                        font-semibold
                        uppercase
                        tracking-[0.1em]
                        text-gray-400
                      "
                    >
                      Limits & visibility
                    </p>

                    <div
                      className="
                        mt-2
                        grid
                        grid-cols-2
                        gap-1.5
                      "
                    >
                      <div
                        className="
                          rounded-md
                          bg-secondary/[0.035]
                          px-2
                          py-1.5
                        "
                      >
                        <p className="text-[8px] uppercase tracking-[0.05em] text-gray-400">
                          Products
                        </p>

                        <p className="mt-0.5 text-[10px] font-bold text-secondary">
                          {formatLimit(
                            plan.max_products,
                          )}
                        </p>
                      </div>

                      <div
                        className="
                          rounded-md
                          bg-secondary/[0.035]
                          px-2
                          py-1.5
                        "
                      >
                        <p className="text-[8px] uppercase tracking-[0.05em] text-gray-400">
                          Featured
                        </p>

                        <p className="mt-0.5 text-[10px] font-bold text-secondary">
                          {formatLimit(
                            plan.max_featured_products,
                          )}
                        </p>
                      </div>
                    </div>

                    <ul className="mt-2 space-y-1.5">
                      {visibilityItems.map(
                        (item) => (
                          <li
                            key={item.label}
                            className="
                              flex
                              items-center
                              gap-1.5
                            "
                          >
                            {item.enabled ? (
                              <CheckCircle2 className="h-3 w-3 shrink-0 text-secondary" />
                            ) : (
                              <XCircle className="h-3 w-3 shrink-0 text-gray-300" />
                            )}

                            <span
                              className={`
                                text-[9px]

                                ${
                                  item.enabled
                                    ? "text-gray-600"
                                    : "text-gray-400"
                                }
                              `}
                            >
                              {item.label}
                            </span>
                          </li>
                        ),
                      )}
                    </ul>
                  </div>

                  {/* CTA pinned to bottom */}
                  <div className="mt-auto pt-3">
                    <button
                      type="button"
                      onClick={() =>
                        handleSubscribe(
                          plan.id,
                        )
                      }
                      disabled={
                        !isAuthorized ||
                        button.disabled ||
                        subscribingTo ===
                          plan.id
                      }
                      className={`
                        inline-flex
                        h-9
                        w-full
                        items-center
                        justify-center
                        gap-1.5
                        rounded-lg
                        text-[11px]
                        font-bold
                        transition-all
                        duration-150

                        ${
                          !isAuthorized &&
                          action !==
                            "current" &&
                          action !==
                            "free_locked"
                            ? "cursor-not-allowed border border-gray-100 bg-gray-50 text-gray-300"
                            : button.className
                        }
                      `}
                      title={
                        !isAuthorized
                          ? "Only company owners or admins can modify subscription plans"
                          : undefined
                      }
                    >
                      {subscribingTo ===
                      plan.id ? (
                        <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                      ) : (
                        <>
                          {button.icon}
                          {button.label}
                        </>
                      )}
                    </button>

                    {action ===
                      "upgrade" &&
                      !isExpired && (
                        <p
                          className="
                            mt-1.5
                            text-center
                            text-[9px]
                            leading-4
                            text-gray-400
                          "
                        >
                          Starts after
                          successful payment
                          verification.
                        </p>
                      )}

                    {action ===
                      "downgrade" && (
                        <p
                          className="
                            mt-1.5
                            text-center
                            text-[9px]
                            leading-4
                            text-gray-400
                          "
                        >
                          Downgrade timing
                          follows your current
                          subscription policy.
                        </p>
                      )}

                    {action ===
                      "free_locked" && (
                        <p
                          className="
                            mt-1.5
                            text-center
                            text-[9px]
                            leading-4
                            text-gray-400
                          "
                        >
                          Free access becomes
                          available after the
                          paid plan ends.
                        </p>
                      )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
