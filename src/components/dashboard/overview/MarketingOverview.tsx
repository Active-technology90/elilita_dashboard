




import { useState, useEffect, useMemo } from "react";
import {
  Building2,
  CreditCard,
  Award,
  Activity,
  Calendar,
  ShieldCheck,
  Users,
  TrendingUp,
  TrendingDown,
  Sparkles,
  Target,
  Clock,
  CheckCircle2,
  XCircle,
  LayoutGrid,
  List,
  BarChart3,
  PieChart,
  Zap,
  Crown,
  Star,
  Rocket,
  Briefcase,
  Layers,
  Flame,
} from "lucide-react";
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart as RePieChart,
  Pie,
  Cell,
} from "recharts";
import api, { getMarketingPerformance, getAdminMarketingAgentPerformance } from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";

interface Agent {
  id: number;
  username: string;
  email: string;
  first_name: string;
  last_name: string;
  is_marketing: boolean;
  daily_target: number;
  weekly_target: number;
}

interface TargetProgress {
  registered_today: number;
  daily_target: number;
  daily_progress_percentage: number;
  registered_this_week: number;
  weekly_target: number;
  weekly_progress_percentage: number;
}

interface CompanyInfo {
  id: number;
  name: string;
  slug: string;
  logo: string | null;
  is_active: boolean;
  created_at: string;
  business_type: string;
}

interface SubscriptionInfo {
  id: number;
  company_name: string;
  company_slug: string;
  plan_name: string;
  price: number;
  start_date: string;
  is_active: boolean;
}

interface DailyHistory {
  date: string;
  companies_registered_count: number;
  companies: CompanyInfo[];
  subscriptions_started: SubscriptionInfo[];
}

interface PerformanceData {
  agent: Agent;
  target_progress: TargetProgress;
  total_companies_registered: number;
  active_subscriptions_count: number;
  registrations_by_plan: Record<string, number>;
  daily_performance: DailyHistory[];
}

// ============================================================
// Vibrant Gradient Card (Shadows Reduced)
// ============================================================
interface VibrantGradientCardProps {
  title: string;
  value: number;
  icon: React.ReactNode;
  gradient: string;
  iconBg: string;
  subtitle?: string;
  trend?: number;
  progress?: number;
  progressLabel?: string;
  progressColor?: string;
  textColor?: string;
}

const VibrantGradientCard: React.FC<VibrantGradientCardProps> = ({
  title,
  value,
  icon,
  gradient,
  iconBg,
  subtitle,
  trend,
  progress,
  progressLabel,
  progressColor = "bg-gray-700",
  textColor = "text-white",
}) => (
  <div className={`relative overflow-hidden rounded-2xl p-6 bg-gradient-to-br ${gradient} shadow-sm hover:shadow transition-all duration-500 hover:scale-[1.02] group`}>
    <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-20 translate-x-20"></div>
    <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full translate-y-12 -translate-x-12"></div>
    <div className="absolute top-1/2 right-1/4 w-16 h-16 bg-white/5 rounded-full animate-pulse"></div>

    <div className="relative z-10">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-[10px] font-medium uppercase tracking-wider ${textColor === 'text-white' ? 'text-white/80 group-hover:text-secondary/80' : 'text-gray-500 group-hover:text-secondary/80'} transition-colors duration-300`}>{title}</span>
            {trend !== undefined && (
              <span className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[8px] font-bold ${trend >= 0 ? 'bg-green-400/30 text-green-200 group-hover:bg-secondary/30 group-hover:text-secondary' : 'bg-red-400/30 text-red-200 group-hover:bg-secondary/30 group-hover:text-secondary'
                } transition-colors duration-300`}>
                {trend >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                {trend >= 0 ? '+' : ''}{trend}%
              </span>
            )}
          </div>
          <p className={`text-3xl font-black tracking-tight ${textColor} group-hover:text-secondary transition-colors duration-300`}>{value.toLocaleString()}</p>
          {subtitle && <p className={`text-[11px] mt-0.5 ${textColor === 'text-white' ? 'text-white/70 group-hover:text-secondary/70' : 'text-gray-400 group-hover:text-secondary/70'} transition-colors duration-300`}>{subtitle}</p>}
        </div>
        <div className={`h-12 w-12 rounded-2xl ${iconBg} backdrop-blur-sm flex items-center justify-center flex-shrink-0 group-hover:rotate-6 transition-transform duration-300 border border-white/20 shadow-sm group-hover:border-secondary/50`}>
          <div className={`${textColor === 'text-white' ? 'text-white group-hover:text-secondary' : 'text-gray-700 group-hover:text-secondary'} transition-colors duration-300`}>{icon}</div>
        </div>
      </div>

      {progress !== undefined && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-1.5">
            <span className={`text-[10px] ${textColor === 'text-white' ? 'text-white/80 group-hover:text-secondary/80' : 'text-gray-500 group-hover:text-secondary/80'} transition-colors duration-300`}>{progressLabel || 'Progress'}</span>
            <span className={`text-xs font-bold ${textColor} group-hover:text-secondary transition-colors duration-300`}>{Math.round(progress)}%</span>
          </div>
          <div className={`w-full h-2 rounded-full overflow-hidden backdrop-blur-sm ${textColor === 'text-white' ? 'bg-white/20' : 'bg-gray-200/80'}`}>
            <div
              className={`h-full ${progressColor} rounded-full transition-all duration-1000 ease-out shadow-sm group-hover:bg-secondary`}
              style={{ width: `${Math.min(progress, 100)}%` }}
            >
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  </div>
);

// ============================================================
// Glassmorphism Stat Card (Shadows Reduced)
// ============================================================
interface GlassStatCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  iconBg: string;
  iconColor: string;
  subtitle?: string;
  badge?: string;
  trend?: number;
  borderColor?: string;
}

const GlassStatCard: React.FC<GlassStatCardProps> = ({
  title,
  value,
  icon,
  iconBg,
  iconColor,
  subtitle,
  badge,
  trend,
  borderColor = "border-white/50",
}) => (
  <div className={`relative overflow-hidden bg-white/70 backdrop-blur-md rounded-2xl p-5 border ${borderColor} shadow-sm hover:shadow transition-all duration-300 group`}>
    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/20 to-transparent rounded-full -translate-y-16 translate-x-16"></div>

    <div className="relative flex items-start justify-between">
      <div className="flex-1">
        <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{title}</p>
        <p className="text-2xl font-black text-gray-800 mt-1.5">{value}</p>
        {subtitle && <p className="text-[10px] text-gray-400 mt-0.5">{subtitle}</p>}
        {trend !== undefined && (
          <div className={`flex items-center gap-1 mt-1.5 text-xs font-semibold ${trend >= 0 ? 'text-emerald-600' : 'text-red-600'
            }`}>
            {trend >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trend >= 0 ? '+' : ''}{trend}%
          </div>
        )}
      </div>
      <div className={`h-11 w-11 rounded-xl ${iconBg} flex items-center justify-center flex-shrink-0 group-hover:scale-110 group-hover:rotate-3 transition-all duration-300 shadow-sm`}>
        <div className={iconColor}>{icon}</div>
      </div>
    </div>
    {badge && (
      <div className="relative mt-3">
        <span className="inline-block text-[9px] font-bold text-gray-600 bg-white/80 backdrop-blur-sm px-3 py-1 rounded-full border border-gray-200/50 shadow-sm">
          {badge}
        </span>
      </div>
    )}
  </div>
);

// ============================================================
//  Progress Ring 
// ============================================================
interface ColorfulProgressRingProps {
  value: number;
  max: number;
  label: string;
  sublabel: string;
  color: string;
  icon: React.ReactNode;
  bgGradient?: string;
  ringBg?: string;
}

const ColorfulProgressRing: React.FC<ColorfulProgressRingProps> = ({
  value,
  max,
  label,
  sublabel,
  color,
  bgGradient = "from-white/80 to-gray-50/80",
  ringBg = "#E5E7EB",
}) => {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const circumference = 2 * Math.PI * 54;
  const offset = circumference - (percentage / 100) * circumference;

  //  Determine if progress is complete (100%)
  const isComplete = percentage >= 100;
  // Use green color when complete, otherwise use the provided color
  const activeColor = isComplete ? '#22C55E' : color;

  return (
    <div className={`relative overflow-hidden bg-gradient-to-br ${bgGradient} backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50 hover:shadow-lg hover:scale-[1.02] transition-all duration-500 group`}>
      <div className={`absolute -inset-1 bg-gradient-to-r ${activeColor}/20 opacity-0 group-hover:opacity-100 blur-2xl transition-opacity duration-500`}></div>

      <div className="relative flex flex-col md:flex-row items-center gap-8">
        <div className="relative w-36 h-36 shrink-0 group-hover:scale-105 transition-transform duration-500">
          <svg className="w-full h-full transform -rotate-90 group-hover:brightness-110 group-hover:saturate-150 transition-all duration-500">
            <circle cx="72" cy="72" r="54" stroke={ringBg} strokeWidth="10" fill="transparent" />
            <circle
              cx="72"
              cy="72"
              r="54"
              stroke={activeColor}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              className="transition-all duration-1000 ease-out group-hover:stroke-[12] group-hover:brightness-110 group-hover:saturate-150"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center group-hover:scale-105 transition-transform duration-500">
            <span className="text-4xl font-black text-gray-800 group-hover:text-gray-900 transition-colors duration-500">{value}</span>
            <span className="text-[11px] font-semibold text-gray-400 group-hover:text-gray-500 transition-colors duration-500">/ {max}</span>
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 transition-transform duration-500 group-hover:scale-110">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 group-hover:opacity-100 transition-opacity duration-500`} style={{ backgroundColor: activeColor }}></span>
            <span className={`relative inline-flex rounded-full h-4 w-4`} style={{ backgroundColor: activeColor }}></span>
          </div>
        </div>

        <div className="flex-1 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2 mb-2.5 flex-wrap">
            <span className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-full transition-all duration-500 group-hover:scale-105" style={{ backgroundColor: `${activeColor}20`, color: activeColor }}>
              {label}
            </span>
            {percentage >= 100 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-emerald-600 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300/50 group-hover:scale-105 transition-transform duration-500">
                <CheckCircle2 className="h-3 w-3" /> Achieved!
              </span>
            )}
            {percentage >= 80 && percentage < 100 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-600 bg-amber-100/80 px-2.5 py-1 rounded-full border border-amber-300/50 group-hover:scale-105 transition-transform duration-500">
                <Flame className="h-3 w-3" /> Almost there!
              </span>
            )}
            {percentage >= 50 && percentage < 80 && (
              <span className="inline-flex items-center gap-1 text-[9px] font-bold text-blue-600 bg-blue-100/80 px-2.5 py-1 rounded-full border border-blue-300/50 group-hover:scale-105 transition-transform duration-500">
                <Activity className="h-3 w-3" /> In progress
              </span>
            )}
          </div>
          <h3 className="text-lg font-bold text-gray-800 group-hover:text-gray-900 transition-colors duration-500">{sublabel}</h3>

          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-gray-500 group-hover:text-gray-600 transition-colors duration-500">Progress</span>
              <span className="text-sm font-bold transition-all duration-500 group-hover:scale-105" style={{ color: activeColor }}>{Math.round(percentage)}%</span>
            </div>
            <div className="w-full h-2.5 bg-gray-100 rounded-full overflow-hidden shadow-inner group-hover:shadow-md transition-shadow duration-500">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative group-hover:brightness-110 group-hover:saturate-150"
                style={{
                  width: `${percentage}%`,
                  background: `linear-gradient(90deg, ${activeColor}88, ${activeColor})`,
                  boxShadow: `0 0 20px ${activeColor}40`
                }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
              </div>
            </div>
          </div>

          <p className="text-xs text-gray-500 mt-3 flex items-center gap-1.5 group-hover:text-gray-600 transition-colors duration-500">
            {percentage >= 100 ? '🎉 Target achieved! Outstanding performance!' :
              percentage >= 80 ? '🔥 On fire! Keep pushing to the finish line!' :
                percentage >= 50 ? '💪 Making solid progress. Keep going!' :
                  '🚀 Getting started. Every step counts!'}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================
// Main Component
// ============================================================
export default function MarketingOverview({ agentId, initialAgent }: { agentId?: number; initialAgent?: any }) {
  const [loading, setLoading] = useState(true);
  const [_refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [data, setData] = useState<PerformanceData | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const { toast, showToast } = useToast();

  const [companyData, setCompanyData] = useState<any>(null);
  const [_companyLoading, setCompanyLoading] = useState(false);

  const fetchPerformance = async (showRefresh = false) => {
    try {
      if (showRefresh) setRefreshing(true);
      else setLoading(true);
      setError("");

      if (agentId) {
        try {
          const res = await getAdminMarketingAgentPerformance(agentId);
          setData(res.data);
        } catch (apiErr: any) {
          if (apiErr?.response?.status === 404 && initialAgent) {
            console.warn(
              "Agent performance endpoint returned 404; displaying overview from agent profile",
              initialAgent
            );
            const dailyTarget = Number(initialAgent.daily_target) || 0;
            const weeklyTarget = Number(initialAgent.weekly_target) || 0;
            const companiesCount = Number(initialAgent.companies_count) || 0;
            setData({
              agent: {
                id: initialAgent.id,
                username: initialAgent.username || `Agent #${agentId}`,
                email: initialAgent.email || "",
                first_name: initialAgent.first_name || "",
                last_name: initialAgent.last_name || "",
                is_marketing: true,
                daily_target: dailyTarget,
                weekly_target: weeklyTarget,
              },
              target_progress: {
                registered_today: 0,
                daily_target: dailyTarget,
                daily_progress_percentage: 0,
                registered_this_week: 0,
                weekly_target: weeklyTarget,
                weekly_progress_percentage: 0,
              },
              total_companies_registered: companiesCount,
              active_subscriptions_count: 0,
              registrations_by_plan: {},
              daily_performance: [],
            });
            return;
          }
          throw apiErr;
        }
      } else {
        const res = await getMarketingPerformance();
        setData(res.data);
      }

      if (showRefresh) {
        showToast("success", "Dashboard refreshed successfully ✨");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.error || err.response?.data?.detail || "Failed to load performance metrics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      setCompanyLoading(true);
      const res = await api.get('/companies/?ordering=name&page_size=20');
      setCompanyData(res.data);
    } catch (error) {
      console.error('Failed to fetch companies:', error);
    } finally {
      setCompanyLoading(false);
    }
  };

  useEffect(() => {
    fetchPerformance();
    fetchCompanies();
  }, [agentId, initialAgent]);

  const chartData = useMemo(() => {
    if (!data?.daily_performance) return [];
    return [...data.daily_performance]
      .reverse()
      .map((day) => ({
        date: day.date,
        Registrations: day.companies_registered_count,
        Subscriptions: day.subscriptions_started.length,
      }));
  }, [data]);

  const trends = useMemo(() => {
    if (!data?.daily_performance || data.daily_performance.length < 2) {
      return { registrations: 0, subscriptions: 0 };
    }
    const today = data.daily_performance[0];
    const yesterday = data.daily_performance[1] || today;
    return {
      registrations: today.companies_registered_count - yesterday.companies_registered_count,
      subscriptions: today.subscriptions_started.length - yesterday.subscriptions_started.length,
    };
  }, [data]);

  const totalSubscriptions = useMemo(() => {
    if (!data?.registrations_by_plan) return 0;
    return Object.values(data.registrations_by_plan).reduce((sum, count) => sum + count, 0);
  }, [data]);

  const pieData = useMemo(() => {
    if (!data?.registrations_by_plan) return [];
    return Object.entries(data.registrations_by_plan).map(([name, value]) => ({
      name,
      value,
    }));
  }, [data]);

  const activeCompaniesCount = useMemo(() => {
    if (!companyData?.results) return 0;
    return companyData.results.filter((company: any) => company.is_active).length;
  }, [companyData]);

  const featuredCount = useMemo(() => {
    if (!companyData?.results) return 0;
    return companyData.results.filter((company: any) => company.is_featured).length;
  }, [companyData]);

  const uniqueCategories = useMemo(() => {
    if (!companyData?.results) return 0;
    const categories = new Set(companyData.results.map((company: any) => company.category_name));
    return categories.size;
  }, [companyData]);

  const categoryData = useMemo(() => {
    if (!companyData?.results) return [];
    const categoryMap = new Map();
    companyData.results.forEach((company: any) => {
      const name = company.category_name || 'Uncategorized';
      categoryMap.set(name, (categoryMap.get(name) || 0) + 1);
    });
    return Array.from(categoryMap.entries()).map(([name, count]) => ({ name, count }));
  }, [companyData]);

  const COLORS = ['#7C3AED', '#EC4899', '#10B981', '#F59E0B', '#3B82F6', '#EF4444'];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 sm:p-6 lg:p-8">
        <Toast toast={toast} />

        {/* ============================================================ */}
        {/* HEADER SKELETON */}
        {/* ============================================================ */}
        <div className="mb-8">
          <div className="relative overflow-hidden bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-gray-200/70"></div>
                <div>
                  <div className="h-8 w-48 bg-gray-200/70 rounded-lg"></div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-2.5 h-2.5 rounded-full bg-gray-200/70"></div>
                    <div className="h-4 w-32 bg-gray-200/70 rounded"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-10 w-24 bg-gray-200/70 rounded-xl"></div>
                <div className="h-10 w-28 bg-gray-200/70 rounded-xl"></div>
              </div>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* COMPANY STATS CARDS SKELETON (4 cards) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="bg-white/70 backdrop-blur-md rounded-2xl p-5 border border-white/50 shadow-sm animate-pulse">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-3 w-20 bg-gray-200/70 rounded"></div>
                  <div className="h-8 w-16 bg-gray-200/70 rounded mt-1.5"></div>
                  <div className="h-3 w-24 bg-gray-200/70 rounded mt-0.5"></div>
                </div>
                <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* VIBRANT GRADIENT STATS ROW SKELETON (4 cards) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="relative overflow-hidden rounded-2xl p-6 bg-gray-200/70 shadow-sm animate-pulse h-[120px]">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="h-3 w-24 bg-gray-300/70 rounded"></div>
                  <div className="h-8 w-16 bg-gray-300/70 rounded mt-1"></div>
                  <div className="h-3 w-32 bg-gray-300/70 rounded mt-0.5"></div>
                </div>
                <div className="h-12 w-12 rounded-2xl bg-gray-300/70"></div>
              </div>
              <div className="mt-4">
                <div className="flex items-center justify-between mb-1.5">
                  <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
                  <div className="h-3 w-8 bg-gray-300/70 rounded"></div>
                </div>
                <div className="w-full h-2 bg-gray-300/70 rounded-full"></div>
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* PROGRESS RINGS SKELETON (2 cards) */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-gray-200/70 backdrop-blur-sm rounded-3xl p-6 shadow-sm border border-white/50 animate-pulse">
              <div className="flex flex-col md:flex-row items-center gap-8">
                <div className="w-36 h-36 shrink-0 rounded-full bg-gray-300/70"></div>
                <div className="flex-1 text-center md:text-left">
                  <div className="h-6 w-32 bg-gray-300/70 rounded-full mx-auto md:mx-0"></div>
                  <div className="h-8 w-48 bg-gray-300/70 rounded mt-2"></div>
                  <div className="mt-4">
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="h-3 w-16 bg-gray-300/70 rounded"></div>
                      <div className="h-3 w-8 bg-gray-300/70 rounded"></div>
                    </div>
                    <div className="w-full h-2.5 bg-gray-300/70 rounded-full"></div>
                  </div>
                  <div className="h-4 w-40 bg-gray-300/70 rounded mt-3"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* CATEGORY DISTRIBUTION CHART SKELETON */}
        {/* ============================================================ */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm mb-6 animate-pulse">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
            <div>
              <div className="h-5 w-48 bg-gray-200/70 rounded"></div>
              <div className="h-3 w-32 bg-gray-200/70 rounded"></div>
            </div>
          </div>
          <div className="h-[280px] w-full bg-gray-200/70 rounded-xl"></div>
        </div>

        {/* ============================================================ */}
        {/* SUBSCRIPTIONS BREAKDOWN SKELETON */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm animate-pulse">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
              <div>
                <div className="h-5 w-48 bg-gray-200/70 rounded"></div>
                <div className="h-3 w-32 bg-gray-200/70 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="relative overflow-hidden rounded-2xl p-5 border bg-gray-200/70 h-[100px]"></div>
              ))}
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200/70 rounded"></div>
                <div className="h-3 w-24 bg-gray-200/70 rounded"></div>
              </div>
            </div>
            <div className="h-[220px] w-full bg-gray-200/70 rounded-xl"></div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* CHART SECTION SKELETON */}
        {/* ============================================================ */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm mb-6 animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
              <div>
                <div className="h-5 w-48 bg-gray-200/70 rounded"></div>
                <div className="h-3 w-32 bg-gray-200/70 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-5">
              <div className="h-3 w-20 bg-gray-200/70 rounded-full"></div>
              <div className="h-3 w-20 bg-gray-200/70 rounded-full"></div>
            </div>
          </div>
          <div className="h-[300px] w-full bg-gray-200/70 rounded-xl"></div>
        </div>

        {/* ============================================================ */}
        {/* RECENT COMPANIES SKELETON */}
        {/* ============================================================ */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm mb-6 animate-pulse">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
              <div>
                <div className="h-5 w-48 bg-gray-200/70 rounded"></div>
                <div className="h-3 w-32 bg-gray-200/70 rounded"></div>
              </div>
            </div>
            <div className="h-6 w-20 bg-gray-200/70 rounded-full"></div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/50 bg-white/40">
                <div className="w-12 h-12 rounded-xl bg-gray-200/70"></div>
                <div className="flex-1">
                  <div className="h-4 w-32 bg-gray-200/70 rounded"></div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="h-3 w-16 bg-gray-200/70 rounded"></div>
                    <div className="w-1 h-1 bg-gray-200/70 rounded-full"></div>
                    <div className="h-3 w-12 bg-gray-200/70 rounded"></div>
                  </div>
                </div>
                <div className="h-2 w-2 rounded-full bg-gray-200/70"></div>
              </div>
            ))}
          </div>
        </div>

        {/* ============================================================ */}
        {/* COMPANY OVERVIEW SKELETON */}
        {/* ============================================================ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm lg:col-span-1 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200/70 rounded"></div>
                <div className="h-3 w-24 bg-gray-200/70 rounded"></div>
              </div>
            </div>
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-gray-200/40">
                  <div className="h-4 w-24 bg-gray-200/70 rounded"></div>
                  <div className="h-4 w-8 bg-gray-200/70 rounded"></div>
                </div>
              ))}
            </div>
          </div>
          <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm lg:col-span-2 animate-pulse">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
              <div>
                <div className="h-5 w-32 bg-gray-200/70 rounded"></div>
                <div className="h-3 w-24 bg-gray-200/70 rounded"></div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="p-3 bg-white/40 rounded-xl border border-gray-200/40">
                  <div className="flex items-center justify-between mb-1">
                    <div className="h-4 w-16 bg-gray-200/70 rounded"></div>
                    <div className="h-4 w-8 bg-gray-200/70 rounded"></div>
                  </div>
                  <div className="w-full h-2 bg-gray-200/70 rounded-full"></div>
                  <div className="h-3 w-12 bg-gray-200/70 rounded mt-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Company Status Overview skeleton (2 cards) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm animate-pulse">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
                <div>
                  <div className="h-5 w-32 bg-gray-200/70 rounded"></div>
                  <div className="h-3 w-24 bg-gray-200/70 rounded"></div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="h-4 w-16 bg-gray-200/70 rounded"></div>
                    <div className="h-4 w-8 bg-gray-200/70 rounded"></div>
                  </div>
                  <div className="w-full h-3 bg-gray-200/70 rounded-full"></div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <div className="h-4 w-16 bg-gray-200/70 rounded"></div>
                    <div className="h-4 w-8 bg-gray-200/70 rounded"></div>
                  </div>
                  <div className="w-full h-3 bg-gray-200/70 rounded-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ============================================================ */}
        {/* DAILY ACTIVITY LOG SKELETON */}
        {/* ============================================================ */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm animate-pulse">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gray-200/70"></div>
              <div>
                <div className="h-5 w-48 bg-gray-200/70 rounded"></div>
                <div className="h-3 w-32 bg-gray-200/70 rounded"></div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-6 w-20 bg-gray-200/70 rounded-full"></div>
              <div className="h-6 w-20 bg-gray-200/70 rounded-full"></div>
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {[1, 2].map((i) => (
              <div key={i} className="rounded-2xl p-5 border border-gray-200/50 bg-white/40">
                <div className="flex items-center justify-between pb-3 border-b border-gray-200/60">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-xl bg-gray-200/70"></div>
                    <div className="h-5 w-24 bg-gray-200/70 rounded"></div>
                  </div>
                  <div className="flex gap-2">
                    <div className="h-5 w-12 bg-gray-200/70 rounded-full"></div>
                    <div className="h-5 w-12 bg-gray-200/70 rounded-full"></div>
                  </div>
                </div>
                <div className="mt-3 space-y-3">
                  <div className="h-4 w-32 bg-gray-200/70 rounded"></div>
                  <div className="flex flex-wrap gap-2">
                    <div className="h-8 w-20 bg-gray-200/70 rounded-xl"></div>
                    <div className="h-8 w-20 bg-gray-200/70 rounded-xl"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[500px] p-8 bg-gradient-to-br from-slate-50 via-white to-indigo-50/30">
        <div className="bg-white/80 backdrop-blur-xl rounded-3xl p-12 max-w-lg text-center border border-white/50 shadow-sm">
          <div className="w-24 h-24 bg-gradient-to-br from-red-100 to-rose-100 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm">
            <XCircle className="h-12 w-12 text-red-500" />
          </div>
          <h3 className="text-2xl font-bold text-gray-800 mb-2">Dashboard Unavailable</h3>
          <p className="text-sm text-gray-500">{error || "No data returned from the server"}</p>
          <button
            onClick={() => fetchPerformance()}
            className="mt-8 px-8 py-3.5 bg-gradient-to-r from-secondary to-purple-700 text-white rounded-xl text-sm font-bold hover:shadow transition-all active:scale-95 shadow-sm shadow-secondary/30"
          >
            Retry Loading
          </button>
        </div>
      </div>
    );
  }

  const {
    agent,
    target_progress,
    total_companies_registered,
    // active_subscriptions_count, 
    registrations_by_plan, daily_performance
  } = data;

  const planColors: Record<string, string> = {
    Starter: "bg-blue-100/70 text-blue-700 border-blue-300/50",
    Pro: "bg-purple-100/70 text-purple-700 border-purple-300/50",
    Enterprise: "bg-emerald-100/70 text-emerald-700 border-emerald-300/50",
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-indigo-50/30 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite;
        }
      `}</style>

      {/* ============================================================ */}
      {/* HEADER  */}
      {/* ============================================================ */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-secondary to-purple-700 flex items-center justify-center shadow-sm shadow-secondary/30 relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-secondary to-purple-700 rounded-2xl animate-pulse opacity-50"></div>
              <Rocket className="h-8 w-8 text-white relative z-10" />
            </div>
            <div>
              <h1 className="text-3xl font-black text-gray-900 tracking-tight">
                <span className="text-secondary">Performance</span> <span className="text-gray-900">Hub</span>
                <span className="ml-2 inline-block text-[8px] font-bold text-emerald-600 bg-emerald-100/80 px-2.5 py-1 rounded-full border border-emerald-300/50 align-middle">
                  LIVE
                </span>
              </h1>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
                <p className="text-sm text-gray-500">
                  Tracking <span className="font-semibold text-gray-700">{agent.first_name || agent.username}</span>
                  <span className="text-gray-300 mx-1.5">•</span>
                  <span className="text-gray-400">ID: {agent.id}</span>
                  <span className="text-gray-300 mx-1.5">•</span>
                  <span className="text-emerald-600 font-medium">{total_companies_registered} companies</span>
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-white/70 backdrop-blur-sm rounded-xl p-1 border border-gray-200/50 shadow-sm">
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "grid" ? "bg-secondary text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <LayoutGrid className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2.5 rounded-lg transition-all ${viewMode === "list" ? "bg-secondary text-white shadow-sm" : "text-gray-400 hover:text-gray-600"}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* COMPANY STATS CARDS -  */}
      {/* ============================================================ */}
      {companyData?.results && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <GlassStatCard
            title="Total Companies"
            value={companyData.count || 0}
            icon={<Building2 className="h-5 w-5" />}
            iconBg="bg-blue-100"
            iconColor="text-blue-600"
            subtitle="Registered companies"
            badge="All time"
          />
          <GlassStatCard
            title="Active Companies"
            value={activeCompaniesCount}
            icon={<ShieldCheck className="h-5 w-5" />}
            iconBg="bg-emerald-100"
            iconColor="text-emerald-600"
            subtitle="Live on platform"
            badge="Active"
          />
          <GlassStatCard
            title="Featured Companies"
            value={featuredCount}
            icon={<Star className="h-5 w-5" />}
            iconBg="bg-amber-100"
            iconColor="text-amber-600"
            subtitle="Premium listings"
            badge="⭐ Featured"
          />
          <GlassStatCard
            title="Categories"
            value={uniqueCategories}
            icon={<Layers className="h-5 w-5" />}
            iconBg="bg-purple-100"
            iconColor="text-purple-600"
            subtitle="Business types"
            badge="Categories"
          />
        </div>
      )}

      {/* ============================================================ */}
      {/*  PROGRESS RINGS */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <ColorfulProgressRing
          value={target_progress.registered_today}
          max={target_progress.daily_target}
          label="Today's Goal"
          sublabel="Daily Company Onboardings"
          color="#7C3AED"
          icon={<Target className="h-5 w-5" />}
          bgGradient="from-purple-100/80 via-indigo-50/80 to-white/80"
          ringBg="#E5E7EB"
        />
        <ColorfulProgressRing
          value={target_progress.registered_this_week}
          max={target_progress.weekly_target}
          label="Weekly Quota"
          sublabel="Weekly Company Onboardings"
          color="#8B5CF6"
          icon={<Award className="h-5 w-5" />}
          bgGradient="from-purple-100/80 via-indigo-50/80 to-white/80"
          ringBg="#E5E7EB"
        />
      </div>

      {/* ============================================================ */}
      {/* VIBRANT GRADIENT STATS ROW */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <VibrantGradientCard
          title="Total Companies"
          value={total_companies_registered}
          icon={<Building2 className="h-6 w-6" />}
          gradient="from-indigo-100 via-purple-100 to-pink-100"
          iconBg="bg-white/50"
          subtitle="All time registrations"
          trend={trends.registrations}
          progress={target_progress.daily_progress_percentage}
          progressLabel="Daily progress"
          progressColor="bg-indigo-500"
          textColor="text-gray-800"
        />
        <VibrantGradientCard
          title="Daily Registrations"
          value={target_progress.registered_today}
          icon={<Target className="h-6 w-6" />}
          gradient="from-blue-100 via-blue-200 to-indigo-100"
          iconBg="bg-white/50"
          subtitle={`of ${target_progress.daily_target} target`}
          progress={target_progress.daily_progress_percentage}
          progressLabel="Daily target"
          progressColor="bg-blue-500"
          textColor="text-gray-800"
        />
        <VibrantGradientCard
          title="Weekly Registrations"
          value={target_progress.registered_this_week}
          icon={<Calendar className="h-6 w-6" />}
          gradient="from-amber-100 via-orange-100 to-red-100"
          iconBg="bg-white/50"
          subtitle={`of ${target_progress.weekly_target} target`}
          progress={target_progress.weekly_progress_percentage}
          progressLabel="Weekly target"
          progressColor="bg-amber-500"
          textColor="text-gray-800"
        />
      </div>

      {/* ============================================================ */}
      {/* CATEGORY DISTRIBUTION - NEW CHART SECTION */}
      {/* ============================================================ */}
      {categoryData.length > 0 && (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm mb-6">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-400 to-indigo-600 flex items-center justify-center shadow-sm shadow-indigo-400/30">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Companies by Category</h3>
              <p className="text-[11px] text-gray-400">Distribution across business categories</p>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="name" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} allowDecimals={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "12px",
                    fontSize: "12px",
                  }}
                />
                <Bar dataKey="count" fill="#7C3AED" radius={[4, 4, 0, 0]}>
                  {categoryData.map((_entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* SUBSCRIPTIONS BREAKDOWN - Colorful Glass */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="lg:col-span-2 bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm">
          <div className="flex items-center gap-3 mb-5">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-400/30">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Subscription Breakdown</h3>
              <p className="text-[11px] text-gray-400">Plan distribution across all companies</p>
            </div>
          </div>

          {Object.keys(registrations_by_plan).length === 0 ? (
            <div className="py-12 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CreditCard className="h-8 w-8 text-gray-300" />
              </div>
              <p className="text-gray-400 font-medium">No active subscriptions found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {Object.entries(registrations_by_plan).map(([planName, count]) => {
                const percentage = totalSubscriptions > 0 ? (count / totalSubscriptions) * 100 : 0;
                const colorClass = planColors[planName] || "bg-gray-100/70 text-gray-600 border-gray-300/50";

                return (
                  <div
                    key={planName}
                    className={`relative overflow-hidden rounded-2xl p-5 border ${colorClass} transition-all hover:scale-[1.02] hover:shadow`}
                  >
                    <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-white/30 to-transparent rounded-full -translate-y-12 translate-x-12"></div>
                    <div className="relative">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-sm font-bold">{planName}</span>
                        <span className="text-2xl font-black text-gray-800">{count}</span>
                      </div>
                      <div className="w-full h-3 bg-white/60 rounded-full overflow-hidden shadow-inner">
                        <div
                          className="h-full rounded-full transition-all duration-1000 ease-out relative"
                          style={{
                            width: `${percentage}%`,
                            background: `linear-gradient(90deg, ${COLORS[0]}88, ${COLORS[0]})`,
                          }}
                        >
                          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer"></div>
                        </div>
                      </div>
                      <p className="text-[10px] font-medium text-gray-500 mt-2">
                        {percentage > 0 ? `${Math.round(percentage)}% of total subscriptions` : 'No active subscriptions'}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Pie Chart - Colorful Glass */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm shadow-purple-400/30">
              <PieChart className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Distribution</h3>
              <p className="text-[11px] text-gray-400">Visual overview</p>
            </div>
          </div>
          {pieData.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={220}>
                <RePieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {pieData.map((_entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "rgba(255,255,255,0.95)",
                      backdropFilter: "blur(12px)",
                      border: "1px solid rgba(255,255,255,0.5)",
                      borderRadius: "12px",
                      fontSize: "12px",
                      boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                    }}
                  />
                </RePieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {pieData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-[10px] font-semibold text-gray-600">{entry.name}</span>
                    <span className="text-[9px] text-gray-400">({entry.value})</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-[220px] text-gray-400">
              <p className="text-sm">No data available</p>
            </div>
          )}
        </div>
      </div>

      {/* ============================================================ */}
      {/* CHART SECTION -  */}
      {/* ============================================================ */}
      {chartData.length > 0 && (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm mb-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center shadow-sm shadow-blue-400/30">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Performance Trends</h3>
                <p className="text-[11px] text-gray-400">Timeline of onboarding history</p>
              </div>
            </div>
            <div className="flex items-center gap-5 text-[11px] font-semibold">
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-secondary shadow-sm shadow-secondary/30"></span>
                <span className="text-gray-600">Registrations</span>
              </span>
              <span className="flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/30"></span>
                <span className="text-gray-600">Subscriptions</span>
              </span>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRegs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#7C3AED" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#7C3AED" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorSubs" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                <XAxis dataKey="date" stroke="#9CA3AF" fontSize={10} tickLine={false} />
                <YAxis stroke="#9CA3AF" fontSize={10} tickLine={false} allowDecimals={false} width={30} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "rgba(255,255,255,0.95)",
                    backdropFilter: "blur(12px)",
                    border: "1px solid rgba(255,255,255,0.5)",
                    borderRadius: "12px",
                    fontSize: "12px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.08)",
                  }}
                  labelStyle={{ fontWeight: "bold", color: "#374151" }}
                />
                <Area type="monotone" dataKey="Registrations" stroke="#7C3AED" strokeWidth={3} fillOpacity={1} fill="url(#colorRegs)" />
                <Area type="monotone" dataKey="Subscriptions" stroke="#10B981" strokeWidth={3} fillOpacity={1} fill="url(#colorSubs)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* RECENT COMPANIES - */}
      {/* ============================================================ */}
      {companyData?.results && companyData.results.length > 0 && (
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm mb-6">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center shadow-sm shadow-cyan-400/30">
                <Building2 className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-800">Recent Companies</h3>
                <p className="text-[11px] text-gray-400">Latest registrations on the platform</p>
              </div>
            </div>
            <span className="text-xs font-semibold text-gray-500 bg-gray-100/80 px-3 py-1.5 rounded-full border border-gray-200/50 shadow-sm">
              {companyData.results.length} shown
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
            {companyData.results.slice(0, 6).map((company: any) => (
              <div
                key={company.id}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-200/50 bg-white/40 hover:bg-white/60 transition-all hover:shadow-sm"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                  {company.logo ? (
                    <img src={company.logo} alt={company.name} className="w-full h-full object-cover" />
                  ) : (
                    <Building2 className="h-6 w-6 text-gray-400" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{company.name}</p>
                  <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                    <span className="text-[10px] font-medium text-gray-500">{company.category_name}</span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${company.is_active
                      ? 'bg-emerald-100/70 text-emerald-700 border border-emerald-300/50'
                      : 'bg-red-100/70 text-red-700 border border-red-300/50'
                      }`}>
                      {company.is_active ? 'Active' : 'Inactive'}
                    </span>
                    {company.is_featured && (
                      <span className="text-[9px] font-bold text-amber-600 bg-amber-100/70 px-2 py-0.5 rounded-full border border-amber-300/50">
                        ⭐ Featured
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex-shrink-0">
                  <div className={`w-2 h-2 rounded-full ${company.is_active ? 'bg-emerald-400' : 'bg-red-400'}`}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* COMPANY OVERVIEW -  */}
      {/* ============================================================ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        {/* Registered By Stats */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm lg:col-span-1">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-sm shadow-blue-400/30">
              <Users className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Registered By</h3>
              <p className="text-[11px] text-gray-400">Who registered the companies</p>
            </div>
          </div>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-gray-200/40">
              <span className="text-sm font-medium text-gray-600">Marketing Team</span>
              <span className="text-sm font-bold text-secondary">
                {companyData?.results?.filter((c: any) => c.registered_by_username === 'marketingone').length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-gray-200/40">
              <span className="text-sm font-medium text-gray-600">Kaleb</span>
              <span className="text-sm font-bold text-purple-600">
                {companyData?.results?.filter((c: any) => c.registered_by_username === 'kaleb').length || 0}
              </span>
            </div>
            <div className="flex items-center justify-between p-3 bg-white/40 rounded-xl border border-gray-200/40">
              <span className="text-sm font-medium text-gray-600">Unassigned</span>
              <span className="text-sm font-bold text-gray-400">
                {companyData?.results?.filter((c: any) => !c.registered_by_username).length || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Business Type Distribution */}
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm lg:col-span-2">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-sm shadow-emerald-400/30">
              <Briefcase className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Business Types</h3>
              <p className="text-[11px] text-gray-400">Distribution by business model</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {['brand', 'store', 'service'].map((type) => {
              const count = companyData?.results?.filter((c: any) => c.business_type === type).length || 0;
              const percentage = companyData?.count ? Math.round((count / companyData.count) * 100) : 0;
              return (
                <div key={type} className="p-3 bg-white/40 rounded-xl border border-gray-200/40">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-600 capitalize">{type}</span>
                    <span className="text-sm font-bold text-gray-800">{count}</span>
                  </div>
                  <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-1000"
                      style={{
                        width: `${percentage}%`,
                        background: type === 'brand' ? '#7C3AED' : type === 'store' ? '#10B981' : '#3B82F6'
                      }}
                    />
                  </div>
                  <p className="text-[9px] text-gray-400 mt-1">{percentage}% of total</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Company Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-600 flex items-center justify-center shadow-sm shadow-amber-400/30">
              <Activity className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Company Status</h3>
              <p className="text-[11px] text-gray-400">Active vs Inactive</p>
            </div>
          </div>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">Active</span>
                <span className="text-sm font-bold text-emerald-600">{activeCompaniesCount}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-400 to-teal-500 rounded-full transition-all duration-1000"
                  style={{ width: `${companyData?.count ? (activeCompaniesCount / companyData.count) * 100 : 0}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-600">Inactive</span>
                <span className="text-sm font-bold text-red-600">{companyData?.count ? companyData.count - activeCompaniesCount : 0}</span>
              </div>
              <div className="w-full h-3 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-red-400 to-rose-500 rounded-full transition-all duration-1000"
                  style={{ width: `${companyData?.count ? ((companyData.count - activeCompaniesCount) / companyData.count) * 100 : 0}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center shadow-sm shadow-purple-400/30">
              <Star className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Featured Status</h3>
              <p className="text-[11px] text-gray-400">Premium featured companies</p>
            </div>
          </div>
          <div className="flex items-center justify-center py-4">
            <div className="text-center">
              <p className="text-4xl font-black text-amber-600">{featuredCount}</p>
              <p className="text-sm text-gray-500 mt-1">Featured Companies</p>
              <div className="mt-3 flex items-center justify-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className={`h-4 w-4 ${i < Math.min(Math.ceil(featuredCount / 2), 5) ? 'text-amber-400 fill-amber-400' : 'text-gray-300'}`} />
                ))}
              </div>
              <p className="text-[10px] text-gray-400 mt-2">
                {companyData?.count ? Math.round((featuredCount / companyData.count) * 100) : 0}% of total companies
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ============================================================ */}
      {/* DAILY ACTIVITY LOG - Colorful Glass */}
      {/* ============================================================ */}
      <div className="bg-white/60 backdrop-blur-xl rounded-3xl p-6 border border-white/50 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-sm shadow-amber-400/30">
              <Clock className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-base font-bold text-gray-800">Daily Activity Log</h3>
              <p className="text-[11px] text-gray-400">Chronological audit of registrations and subscriptions</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-gray-600 bg-gray-100/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-gray-200/50 shadow-sm">
              📅 {daily_performance.length} days
            </span>
            <span className="text-xs font-semibold text-emerald-600 bg-emerald-100/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-emerald-300/50 shadow-sm">
              🏢 {total_companies_registered} total
            </span>
          </div>
        </div>

        {daily_performance.length === 0 ? (
          <div className="py-20 text-center">
            <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-10 w-10 text-gray-300" />
            </div>
            <p className="text-base font-semibold text-gray-500">No activity history found</p>
            <p className="text-sm text-gray-400 mt-1">Start registering companies to build your log!</p>
          </div>
        ) : (
          <div className={`grid gap-4 ${viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"}`}>
            {daily_performance.map((day, index) => {
              const isLatest = index === 0;
              const hasActivity = day.companies.length > 0 || day.subscriptions_started.length > 0;

              return (
                <div
                  key={day.date}
                  className={`relative overflow-hidden rounded-2xl p-5 border transition-all hover:shadow ${isLatest
                    ? 'border-secondary/30 bg-gradient-to-br from-secondary/10 via-purple-50/50 to-transparent'
                    : 'border-gray-200/50 bg-white/40 hover:bg-white/60'
                    }`}
                >
                  {isLatest && (
                    <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-secondary/20 to-purple-500/20 rounded-full -translate-y-16 translate-x-16"></div>
                  )}

                  <div className="relative flex items-center justify-between pb-3 border-b border-gray-200/60">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${isLatest ? 'bg-gradient-to-br from-secondary to-purple-600 text-white shadow-sm shadow-secondary/30' : 'bg-gray-100 text-gray-400'
                        }`}>
                        <Calendar className="h-4 w-4" />
                      </div>
                      <div>
                        <span className="text-sm font-bold text-gray-800">{day.date}</span>
                        {isLatest && (
                          <span className="ml-2 inline-flex items-center gap-1 text-[9px] font-bold text-secondary bg-secondary/10 px-2.5 py-0.5 rounded-full border border-secondary/20">
                            <Zap className="h-2.5 w-2.5" /> Latest
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full ${day.companies_registered_count > 0
                        ? 'bg-secondary/10 text-secondary border border-secondary/20'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                        🏢 {day.companies_registered_count}
                      </span>
                      <span className={`text-[9px] font-bold px-3 py-1.5 rounded-full ${day.subscriptions_started.length > 0
                        ? 'bg-emerald-100/70 text-emerald-600 border border-emerald-300/50'
                        : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                        💳 {day.subscriptions_started.length}
                      </span>
                    </div>
                  </div>

                  {hasActivity ? (
                    <div className="relative mt-3 space-y-4">
                      {day.companies.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Building2 className="h-3 w-3" /> Companies ({day.companies.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {day.companies.slice(0, 5).map((company) => (
                              <span
                                key={company.id}
                                className="inline-flex items-center gap-2 text-[10px] font-medium bg-white px-3 py-1.5 rounded-xl border border-gray-200/50 shadow-sm hover:shadow transition-all"
                              >
                                {company.logo ? (
                                  <img src={company.logo} alt="" className="w-5 h-5 rounded-full object-cover" />
                                ) : (
                                  <div className="w-5 h-5 rounded-full bg-gradient-to-br from-secondary to-purple-600 flex items-center justify-center text-[8px] font-bold text-white">
                                    {company.name[0]}
                                  </div>
                                )}
                                {company.name}
                              </span>
                            ))}
                            {day.companies.length > 5 && (
                              <span className="text-[10px] text-gray-400 font-medium px-2 py-1.5 bg-gray-50 rounded-xl">
                                +{day.companies.length - 5} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}

                      {day.subscriptions_started.length > 0 && (
                        <div>
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-2">
                            <Crown className="h-3 w-3" /> Subscriptions ({day.subscriptions_started.length})
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {day.subscriptions_started.slice(0, 4).map((sub) => (
                              <span
                                key={sub.id}
                                className="text-[10px] font-medium bg-gradient-to-r from-emerald-100/70 to-teal-100/70 text-emerald-700 px-3 py-1.5 rounded-xl border border-emerald-300/50 shadow-sm hover:shadow transition-all"
                              >
                                {sub.company_name} · <span className="font-bold">{sub.plan_name}</span>
                              </span>
                            ))}
                            {day.subscriptions_started.length > 4 && (
                              <span className="text-[10px] text-gray-400 font-medium px-2 py-1.5 bg-gray-50 rounded-xl">
                                +{day.subscriptions_started.length - 4} more
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="relative mt-3 text-center py-4">
                      <p className="text-[11px] text-gray-400 italic">No activity recorded on this day</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}