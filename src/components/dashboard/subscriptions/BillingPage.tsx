import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { CreditCard, CheckCircle2, Zap, Package, XCircle, Clock, AlertTriangle, ArrowUp, ArrowDown, Shield } from "lucide-react";
import { getSubscriptionPlans, getMySubscription, initializeSubscriptionPayment, verifySubscriptionPayment } from "../../../services/api";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { PageHeader } from "../../ui/PageHeader";
// ========== LOADING SKELETON ==========
const SkeletonCard = () => (
  <div className="bg-white rounded-3xl p-8 border-2 border-gray-100 shadow-sm animate-pulse">
    <div className="h-6 bg-gray-200 rounded w-32 mb-4" />
    <div className="h-4 bg-gray-200 rounded w-48 mb-6" />
    <div className="h-10 bg-gray-200 rounded w-24 mb-6" />
    <div className="space-y-4 mb-8">
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 bg-gray-200 rounded-full shrink-0 mt-0.5" />
        <div className="h-4 bg-gray-200 rounded w-48" />
      </div>
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 bg-gray-200 rounded-full shrink-0 mt-0.5" />
        <div className="h-4 bg-gray-200 rounded w-40" />
      </div>
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 bg-gray-200 rounded-full shrink-0 mt-0.5" />
        <div className="h-4 bg-gray-200 rounded w-44" />
      </div>
      <div className="flex items-start gap-3">
        <div className="h-5 w-5 bg-gray-200 rounded-full shrink-0 mt-0.5" />
        <div className="h-4 bg-gray-200 rounded w-36" />
      </div>
    </div>
    <div className="h-12 bg-gray-200 rounded-xl w-full" />
  </div>
);

const SkeletonCurrentPlan = () => (
  <div className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 animate-pulse">
    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
      <div className="flex-1">
        <div className="h-4 bg-gray-200 rounded w-24 mb-2" />
        <div className="h-10 bg-gray-200 rounded w-48 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-32" />
      </div>
      <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-w-[250px]">
        <div className="flex justify-between items-center mb-2">
          <div className="h-4 bg-gray-200 rounded w-32" />
          <div className="h-4 bg-gray-200 rounded w-16" />
        </div>
        <div className="w-full h-2 bg-gray-200 rounded-full" />
      </div>
    </div>
  </div>
);

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

type PlanAction = "current" | "upgrade" | "downgrade" | "free_locked" | "subscribe";
type PlanTier = "free" | "basic" | "advanced" | "premium";

interface PlanFeature {
  label: string;
  included: boolean;
}

const PLAN_TIER_FEATURES: Record<PlanTier, PlanFeature[]> = {
  free: [
    { label: "Vendor profile & basic storefront", included: true },
    { label: "Basic order management & notifications", included: true },
    { label: "Business analytics & reports", included: false },
    { label: "Promotions & discount campaigns", included: false },
    { label: "Customer insights", included: false },
    { label: "Multiple staff accounts", included: false },
    { label: "Advanced inventory & exportable reports", included: false },
    { label: "Advanced marketing & campaign tracking", included: false },
    { label: "Premium visibility & dedicated support", included: false },
  ],
  basic: [
    { label: "Professional vendor storefront", included: true },
    { label: "Full order management & notifications", included: true },
    { label: "Business analytics & reports", included: true },
    { label: "Promotions & discount campaigns", included: true },
    { label: "Customer insights", included: true },
    { label: "Multiple staff accounts", included: true },
    { label: "Advanced inventory & exportable reports", included: false },
    { label: "Advanced marketing & campaign tracking", included: false },
    { label: "Premium visibility & dedicated support", included: false },
  ],
  advanced: [
    { label: "Advanced storefront customization", included: true },
    { label: "Advanced order management & tracking", included: true },
    { label: "Business analytics & reports", included: true },
    { label: "Promotions & discount campaigns", included: true },
    { label: "Customer insights", included: true },
    { label: "Multiple staff accounts", included: true },
    { label: "Advanced inventory & exportable reports", included: true },
    { label: "Advanced marketing & campaign tracking", included: true },
    { label: "Premium visibility & dedicated support", included: false },
  ],
  premium: [
    { label: "Premium storefront customization", included: true },
    { label: "Advanced order management & tracking", included: true },
    { label: "Business analytics & reports", included: true },
    { label: "Promotions & discount campaigns", included: true },
    { label: "Customer insights", included: true },
    { label: "Multiple staff accounts", included: true },
    { label: "Advanced inventory & exportable reports", included: true },
    { label: "Advanced marketing & campaign tracking", included: true },
    { label: "Premium visibility & dedicated support", included: true },
  ],
};

const getPlanTier = (plan: SubscriptionPlan, planIndex: number): PlanTier => {
  const normalizedName = plan.name.toLowerCase();

  if (parseFloat(plan.price) === 0 || /\b(free|starter)\b/.test(normalizedName)) return "free";
  if (/\bbasic\b/.test(normalizedName)) return "basic";
  if (/\b(advanced|professional|pro)\b/.test(normalizedName)) return "advanced";
  if (/\b(premium|business|bussiness|enterprise)\b/.test(normalizedName)) return "premium";

  return (["free", "basic", "advanced", "premium"] as PlanTier[])[Math.min(planIndex, 3)];
};

const PlanFeatureRow = ({ label, included }: PlanFeature) => (
  <li className="flex items-start gap-3">
    {included ? (
      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" aria-hidden="true" />
    ) : (
      <XCircle className="w-5 h-5 text-gray-300 shrink-0 mt-0.5" aria-hidden="true" />
    )}
    <span className={`text-sm ${included ? "text-gray-700" : "text-gray-400 line-through"}`}>
      {label}
    </span>
  </li>
);

export default function BillingPage() {
  const { company } = useCurrentCompany();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [activeSub, setActiveSub] = useState<ActiveSubscription | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [subscribingTo, setSubscribingTo] = useState<number | null>(null);

  const isAuthorized = company?.role === "owner" || company?.role === "admin";

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const txRef = queryParams.get("sub_tx_ref");
    
    if (txRef && company?.slug) {
      verifyPaymentAndFetch(txRef);
    } else {
      fetchData();
    }
  }, [company?.slug]);

  const verifyPaymentAndFetch = async (txRef: string, attempt = 1) => {
    const MAX_RETRIES = 3;
    const RETRY_DELAY_MS = 3000;

    try {
      setIsLoading(true);
      const res = await verifySubscriptionPayment(txRef);
      
      if (res.data?.message) {
        window.history.replaceState({}, document.title, window.location.pathname);
        fetchData();
        return;
      }
    } catch (error: any) {
      console.error(`Payment verification attempt ${attempt} failed`, error);
      
      const errorMsg = error?.response?.data?.error || "";
      if (attempt < MAX_RETRIES && errorMsg.includes("pending")) {
        setTimeout(() => verifyPaymentAndFetch(txRef, attempt + 1), RETRY_DELAY_MS);
        return;
      }
    }
    
    window.history.replaceState({}, document.title, window.location.pathname);
    fetchData();
  };

  const fetchData = async () => {
    try {
      setIsLoading(true);
      const [plansRes, subRes] = await Promise.all([
        getSubscriptionPlans(),
        getMySubscription(company?.slug),
      ]);
      setPlans(plansRes.data?.results || plansRes.data || []);
      setActiveSub(subRes.data);
    } catch (error) {
      console.error("Failed to load billing data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubscribe = async (planId: number) => {
    if (!company?.slug) return;
    if (!isAuthorized) {
      alert("Only company owners and admins can manage or edit subscriptions.");
      return;
    }
    try {
      setSubscribingTo(planId);
      const res = await initializeSubscriptionPayment(company.slug, planId);
      
      if (res.data.message) {
        alert("Plan activated successfully!");
        fetchData();
      } else if (res.data.checkout_url) {
        window.location.href = res.data.checkout_url;
      }
    } catch (error: any) {
      console.error("Payment initialization failed", error);
      const msg = error?.response?.data?.error || "Failed to initialize payment. Please try again.";
      alert(msg);
    } finally {
      setSubscribingTo(null);
    }
  };

  // ── Determine what action each plan card should show ──
  const getPlanAction = (plan: SubscriptionPlan): PlanAction => {
    if (!activeSub || activeSub.is_expired) return "subscribe";
    
    const currentPrice = parseFloat(activeSub.plan?.price || "0");
    const cardPrice = parseFloat(plan.price);
    
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
          icon: <Shield className="w-5 h-5" />,
          className: "bg-gray-100 text-gray-400 cursor-not-allowed",
          disabled: true,
        };
      case "upgrade":
        return {
          label: "Upgrade",
          icon: <ArrowUp className="w-5 h-5" />,
          className: "bg-gradient-to-r from-amber-500 to-orange-500 text-white hover:shadow-lg hover:shadow-amber-200",
          disabled: false,
        };
      case "downgrade":
        return {
          label: "Downgrade",
          icon: <ArrowDown className="w-5 h-5" />,
          className: "bg-white border-2 border-gray-300 text-gray-600 hover:border-gray-400 hover:bg-gray-50",
          disabled: false,
        };
      case "free_locked":
        return {
          label: "Auto on Expiry",
          icon: <Clock className="w-5 h-5" />,
          className: "bg-gray-50 text-gray-400 cursor-not-allowed border border-gray-200",
          disabled: true,
        };
      case "subscribe":
        return {
          label: "Subscribe Now",
          icon: <CreditCard className="w-5 h-5" />,
          className: "bg-gradient-to-r from-secondary to-indigo-600 text-white hover:shadow-lg hover:from-secondary-dark hover:to-indigo-700",
          disabled: false,
        };
    }
  };

  // if (isLoading) {
  //   return (
  //     <div className="p-8 flex justify-center items-center h-full">
  //       <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-secondary"></div>
  //     </div>
  //   );
  // }

  const currentPlanPrice = parseFloat(activeSub?.plan?.price || "0");
  const isFree = currentPlanPrice === 0;
  const isExpired = activeSub?.is_expired ?? false;
  const daysRemaining = activeSub?.days_remaining;

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-3 py-4 sm:space-y-8 sm:p-6 lg:p-2 ">
      <PageHeader
        title="Billing & Subscription"
        description="Manage your company's active plan and limits."
        icon={CreditCard}
        loading={isLoading}
      />

      {/* Current Subscription Section */}
      {isLoading ? (
        <SkeletonCurrentPlan />
      ) : (
      <div className={`bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-8 shadow-sm border relative overflow-hidden ${
        isExpired ? "border-red-200" : "border-gray-100"
      }`}>
        {/* Background Accent */}
        <div className={`absolute top-0 right-0 p-16 rounded-bl-[100px] -z-0 ${
          isExpired 
            ? "bg-gradient-to-br from-red-500/5 to-red-500/10" 
            : "bg-gradient-to-br from-secondary/5 to-secondary/10"
        }`}></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-1">
              Current Plan
            </h2>
            <div className="flex items-end gap-3 flex-wrap">
              <span className={`text-4xl font-black bg-clip-text text-transparent ${
                isExpired
                  ? "bg-gradient-to-r from-red-500 to-rose-600"
                  : "bg-gradient-to-r from-secondary to-indigo-600"
              }`}>
                {activeSub?.plan?.name || "Free / Starter"}
              </span>
              
              {/* Status Badge */}
              {isExpired ? (
                <span className="mb-1 px-3 py-1 bg-red-100 text-red-700 text-xs font-bold rounded-full flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" /> Expired
                </span>
              ) : isFree ? (
                <span className="mb-1 px-3 py-1 bg-gray-100 text-gray-500 text-xs font-bold rounded-full">
                  Lifetime Free
                </span>
              ) : daysRemaining !== null && daysRemaining !== undefined ? (
                <span className={`mb-1 px-3 py-1 text-xs font-bold rounded-full flex items-center gap-1 ${
                  daysRemaining <= 7
                    ? "bg-amber-100 text-amber-700"
                    : "bg-emerald-100 text-emerald-700"
                }`}>
                  <Clock className="w-3 h-3" />
                  {daysRemaining === 0 ? "Expires today" : `${daysRemaining} days remaining`}
                </span>
              ) : null}
            </div>

            {/* Expiration Warning */}
            {!isExpired && !isFree && daysRemaining !== null && daysRemaining !== undefined && daysRemaining <= 7 && daysRemaining > 0 && (
              <p className="text-amber-600 text-sm mt-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Your plan expires soon. Renew or upgrade to avoid losing premium features.
              </p>
            )}
            {isExpired && (
              <p className="text-red-600 text-sm mt-2 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4" />
                Your plan has expired. Subscribe to a plan below to restore premium features.
              </p>
            )}
          </div>
          
          <div className="grid sm:grid-cols-2 gap-4 w-full md:w-auto">
            {/* Public / Active Products Limit */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-w-[220px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Public Products
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {activeSub?.current_products || 0} / {activeSub?.allowed_max_products === -1 ? 'Unlimited' : (activeSub?.allowed_max_products || 0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${
                    activeSub?.allowed_max_products !== -1 && (activeSub?.current_products || 0) >= (activeSub?.allowed_max_products || 0) 
                      ? 'bg-red-500' 
                      : 'bg-secondary'
                  }`}
                  style={{ 
                    width: activeSub?.allowed_max_products === -1 
                      ? '100%' 
                      : `${Math.min(100, ((activeSub?.current_products || 0) / Math.max(1, activeSub?.allowed_max_products || 1)) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>

            {/* Featured Products Limit */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-100 min-w-[220px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-600 flex items-center gap-2">
                  <Zap className="w-4 h-4 text-amber-500" /> Featured Products
                </span>
                <span className="text-sm font-bold text-gray-900">
                  {activeSub?.current_featured_products || 0} / {activeSub?.allowed_max_featured_products === -1 ? 'Unlimited' : (activeSub?.allowed_max_featured_products || 0)}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-2 rounded-full ${
                    activeSub?.allowed_max_featured_products !== -1 && (activeSub?.current_featured_products || 0) >= (activeSub?.allowed_max_featured_products || 0) 
                      ? 'bg-red-500' 
                      : 'bg-amber-500'
                  }`}
                  style={{ 
                    width: activeSub?.allowed_max_featured_products === -1 
                      ? '100%' 
                      : `${Math.min(100, ((activeSub?.current_featured_products || 0) / Math.max(1, activeSub?.allowed_max_featured_products || 1)) * 100)}%` 
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
      )}

      {/* Pricing Plans Section */}
      <div>
        {isLoading ? (
          <div className="flex items-center gap-2 mb-6 animate-pulse">
            <div className="h-6 w-6 bg-gray-200 rounded" />
            <div className="h-8 bg-gray-200 rounded w-40" />
          </div>
        ) : (
          <h2 className="text-2xl font-bold text-secondary mb-6 flex items-center gap-2">
            <Zap className="w-6 h-6 text-amber-500" /> {isExpired ? "Reactivate Your Plan" : "Available Plans"}
          </h2>
        )}

        {isLoading ? (
          <div className="grid md:grid-cols-3 gap-8">
            {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : (
          <>
        {!isAuthorized && (
          <div className="mb-8 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 flex items-center gap-2 max-w-3xl">
            <AlertTriangle className="w-5 h-5 shrink-0 text-amber-600" />
            <span>Only company owners and admins can manage or edit subscription plans.</span>
          </div>
        )}

            <div className="grid md:grid-cols-3 gap-8">
              {plans.map((plan, planIndex) => {
            const action = getPlanAction(plan);
            const btnCfg = getButtonConfig(action);
            const cardPrice = parseFloat(plan.price);
            const planTier = getPlanTier(plan, planIndex);
            const maxProducts = plan.max_products ?? 15;
            const maxFeaturedProducts = plan.max_featured_products ?? 0;

            return (
              <motion.div
                key={plan.id}
                whileHover={isAuthorized ? { y: -8 } : {}}
                className={`bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-6 lg:p-8 border-2 transition-all shadow-sm relative flex flex-col ${
                  isAuthorized ? "hover:shadow-xl" : ""
                } ${
                  action === "current" 
                    ? "border-secondary ring-4 ring-secondary/10" 
                    : action === "upgrade"
                    ? "border-amber-200 hover:border-amber-300"
                    : "border-gray-100"
                }`}
              >
                {/* Top Badge */}
                {action === "current" && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-secondary text-white px-4 py-1 rounded-full text-xs font-bold shadow-md">
                    CURRENT PLAN
                  </div>
                )}
                {action === "upgrade" && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-1 rounded-full text-xs font-bold shadow-md flex items-center gap-1">
                    <ArrowUp className="w-3 h-3" /> UPGRADE
                  </div>
                )}

                <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
                <p className="text-gray-500 text-sm mt-2 min-h-[40px]">{plan.description}</p>
                
                <div className="my-6">
                  <span className="text-4xl font-black text-gray-900">
                    {cardPrice === 0 ? "Free" : `${plan.price} ETB`}
                  </span>
                  {cardPrice > 0 && <span className="text-gray-500">/mo</span>}
                </div>

                <p className="mb-4 text-xs font-bold uppercase tracking-wider text-gray-400">
                  What's included
                </p>
                <ul className="space-y-4 mb-8 flex-1">
                  <PlanFeatureRow
                    included={maxProducts !== 0}
                    label={
                      maxProducts === -1
                        ? "Unlimited public products" 
                        : `Post up to ${maxProducts} public products`
                    }
                  />
                  <PlanFeatureRow
                    included={maxFeaturedProducts !== 0}
                    label={
                      maxFeaturedProducts === -1
                        ? "Unlimited featured products" 
                        : `Can feature up to ${maxFeaturedProducts} products`
                    }
                  />
                  <PlanFeatureRow label="Ads on Company Detail Page" included={plan.can_ad_company_detail} />
                  <PlanFeatureRow label="Ads on Companies List Page" included={plan.can_ad_companies_list} />
                  <PlanFeatureRow label="Premium Homepage Ads" included={plan.can_ad_home_page} />
                  {PLAN_TIER_FEATURES[planTier].map((feature) => (
                    <PlanFeatureRow key={feature.label} {...feature} />
                  ))}
                </ul>

                <button
                  onClick={() => handleSubscribe(plan.id)}
                  disabled={!isAuthorized || btnCfg.disabled || subscribingTo === plan.id}
                  className={`w-full py-3.5 rounded-xl font-bold transition-all flex justify-center items-center gap-2 ${
                    !isAuthorized && action !== "current" && action !== "free_locked"
                      ? "bg-gray-100 text-gray-400 border-none cursor-not-allowed" 
                      : btnCfg.className
                  }`}
                  title={!isAuthorized ? "Only company owners or admins can modify subscription plans" : undefined}
                >
                  {subscribingTo === plan.id ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  ) : (
                    <>
                      {btnCfg.icon}
                      {btnCfg.label}
                    </>
                  )}
                </button>

                {/* Contextual helper text below button */}
                {action === "upgrade" && !isExpired && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Starts a new 30-day cycle immediately
                  </p>
                )}
                {action === "downgrade" && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Starts a new 30-day cycle at this tier
                  </p>
                )}
                {action === "free_locked" && (
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Activates automatically when your plan expires
                  </p>
                )}
              </motion.div>
            );
          })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
