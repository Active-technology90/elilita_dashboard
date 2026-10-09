import { useState, useEffect, useMemo } from "react";
import {
  Users,
  Building2,
  Award,
  Eye,
  Edit,
  X,
  Target,
  Mail,
  Phone,
  TrendingUp,
  CheckCircle,
  User,
  AlertTriangle,
  CalendarDays,
  Sun,
  CalendarRange,
} from "lucide-react";
import AgentPersonalInfoModal from "./AgentPersonalInfoModal";
import AgentAuditModal from "./AgentAuditModal";
import { getAdminMarketingAgents, updateUser } from "../../../services/api";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect } from "../../ui/CustomSelect";
import BottomSheet from "../../ui/BottomSheet";
import FilterSortSheet from "../../ui/FilterSortSheet";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { FormModal } from "../../ui/FormModal";
import PageHeader from "../../ui/PageHeader";
import { DataTable, type Column } from "../../ui/DataTable";

/* ==========================================================================
   Types
   ========================================================================== */

interface MarketingAgent {
  id: number;
  username: string;
  email: string;
  phone_number: string | null;
  first_name: string;
  last_name: string;
  profile_image: string | null;
  companies_count: number;
  daily_target: number;
  weekly_target: number;
  is_active: boolean;
  companies_today?: number;
  companies_this_week?: number;
  companies?: Array<{
    id: number;
    name?: string;
    created_at: string;
  }>;
}

interface AgentProgress {
  daily: { actual: number; target: number; percent: number };
  weekly: { actual: number; target: number; percent: number };
  worstPercent: number;
  rank: {
    label: string;
    color: string;
    icon: React.ReactNode;
  };
}

/* ==========================================================================
   Skeleton stat card
   ========================================================================== */

const SkeletonStatCard: React.FC = () => (
  <div className="rounded-xl border border-secondary/10 bg-white px-4 py-4">
    <div className="h-3 w-20 rounded bg-secondary/[0.08]" />
    <div className="mt-2 h-6 w-16 rounded bg-secondary/[0.08]" />
    <div className="mt-1 h-3 w-24 rounded bg-secondary/[0.06]" />
  </div>
);

/* ==========================================================================
   Progress helpers
   ========================================================================== */

const startOfWeekLocal = (d: Date): Date => {
  const date = new Date(d);
  const day = date.getDay();
  const diff = (day + 6) % 7;
  date.setDate(date.getDate() - diff);
  date.setHours(0, 0, 0, 0);
  return date;
};

const isSameLocalDay = (a: Date, b: Date): boolean =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

const resolvePeriodCounts = (
  agent: MarketingAgent,
): { today: number; thisWeek: number } => {
  if (
    typeof agent.companies_today === "number" &&
    typeof agent.companies_this_week === "number"
  ) {
    return {
      today: agent.companies_today,
      thisWeek: agent.companies_this_week,
    };
  }

  if (Array.isArray(agent.companies) && agent.companies.length > 0) {
    const now = new Date();
    const weekStart = startOfWeekLocal(now);

    let today = 0;
    let thisWeek = 0;

    for (const c of agent.companies) {
      const d = new Date(c.created_at);
      if (Number.isNaN(d.getTime())) continue;
      if (isSameLocalDay(d, now)) today += 1;
      if (d >= weekStart) thisWeek += 1;
    }

    return { today, thisWeek };
  }

  return { today: 0, thisWeek: 0 };
};

/**
 * Rank tokens now use the standard palette only:
 *   emerald = Top performer
 *   indigo  = On track
 *   amber   = Needs attention
 *   gray    = No progress
 */
const getAgentProgress = (agent: MarketingAgent): AgentProgress => {
  const { today, thisWeek } = resolvePeriodCounts(agent);

  const dayTarget = agent.daily_target ?? 0;
  const weekTarget = agent.weekly_target ?? 0;

  const dayPercent =
    dayTarget > 0
      ? Math.min(100, Math.round((today / dayTarget) * 100))
      : 0;

  const weekPercent =
    weekTarget > 0
      ? Math.min(100, Math.round((thisWeek / weekTarget) * 100))
      : 0;

  const worstPercent =
    dayTarget > 0 && weekTarget > 0
      ? Math.min(dayPercent, weekPercent)
      : Math.max(dayPercent, weekPercent);

  let rank: AgentProgress["rank"];

  if (worstPercent >= 80) {
    rank = {
      label: "Top Performer",
      color: "bg-emerald-50 text-emerald-700 border-emerald-200",
      icon: <Award className="h-3 w-3" />,
    };
  } else if (worstPercent >= 50) {
    rank = {
      label: "On Track",
      color: "bg-indigo-50 text-indigo-700 border-indigo-200",
      icon: <TrendingUp className="h-3 w-3" />,
    };
  } else if (today > 0 || thisWeek > 0) {
    rank = {
      label: "Needs Attention",
      color: "bg-amber-50 text-amber-700 border-amber-200",
      icon: <AlertTriangle className="h-3 w-3" />,
    };
  } else {
    rank = {
      label: "No Progress",
      color: "bg-gray-50 text-gray-500 border-gray-200",
      icon: null,
    };
  }

  return {
    daily: { actual: today, target: dayTarget, percent: dayPercent },
    weekly: { actual: thisWeek, target: weekTarget, percent: weekPercent },
    worstPercent,
    rank,
  };
};

/**
 * Standard progress bar palette:
 *   ≥80% → emerald
 *   ≥50% → indigo
 *   >0%  → amber
 *    0%  → gray
 */
const progressBarColor = (percent: number): string => {
  if (percent >= 80) return "bg-emerald-500";
  if (percent >= 50) return "bg-indigo-500";
  if (percent > 0) return "bg-amber-500";
  return "bg-gray-300";
};

/* ==========================================================================
   Main component
   ========================================================================== */

export default function MarketingAgentsManagement() {
  const { toast, showToast } = useToast();
  const [agents, setAgents] = useState<MarketingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingAgent, setEditingAgent] = useState<MarketingAgent | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MarketingAgent>>({});
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [personalModalAgent, setPersonalModalAgent] =
    useState<MarketingAgent | null>(null);
  const [zoomImageAgent, setZoomImageAgent] = useState<MarketingAgent | null>(
    null,
  );

  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [filterSheetOpen, setFilterSheetOpen] = useState(false);
  const [tempSort, setTempSort] = useState("name|asc");
  const [tempCategory, setTempCategory] = useState("all");

  const sortOptions = [
    { label: "Name (A-Z)", value: "name|asc", icon: <Users className="h-4 w-4" /> },
    { label: "Name (Z-A)", value: "name|desc", icon: <Users className="h-4 w-4" /> },
    { label: "Most Companies", value: "companies_count|desc", icon: <Building2 className="h-4 w-4" /> },
    { label: "Least Companies", value: "companies_count|asc", icon: <Building2 className="h-4 w-4" /> },
    { label: "Highest Daily Target", value: "daily_target|desc", icon: <Target className="h-4 w-4" /> },
    { label: "Highest Weekly Target", value: "weekly_target|desc", icon: <Award className="h-4 w-4" /> },
  ];

  const categoryOptions = [
    { label: "All Agents", value: "all", icon: <Users className="h-4 w-4" /> },
    { label: "Active", value: "active", icon: <CheckCircle className="h-4 w-4" /> },
    { label: "Inactive", value: "inactive", icon: <X className="h-4 w-4" /> },
  ];

  const categoryNameMap: Record<string, string> = {
    active: "Active",
    inactive: "Inactive",
  };

  const fetchAgents = async () => {
    try {
      setLoading(true);
      setError("");
      const res = await getAdminMarketingAgents();
      setAgents(res.data);
    } catch (err: any) {
      console.error(err);
      setError("Failed to load marketing agents list");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAgents();
  }, []);

  const filteredAgents = useMemo(() => {
    let result = [...agents];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.username.toLowerCase().includes(term) ||
          (a.first_name && a.first_name.toLowerCase().includes(term)) ||
          (a.last_name && a.last_name.toLowerCase().includes(term)) ||
          a.email.toLowerCase().includes(term) ||
          (a.phone_number && a.phone_number.includes(term)),
      );
    }

    if (tempCategory === "active") {
      result = result.filter((a) => a.is_active === true);
    } else if (tempCategory === "inactive") {
      result = result.filter((a) => a.is_active === false);
    }

    const [field, order] = tempSort.split("|");
    result.sort((a, b) => {
      let valA: any = a[field as keyof MarketingAgent];
      let valB: any = b[field as keyof MarketingAgent];

      if (typeof valA === "string") {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (order === "asc") {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      }
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    });

    return result;
  }, [agents, searchTerm, tempCategory, tempSort]);

  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAgents.slice(start, start + pageSize);
  }, [filteredAgents, currentPage, pageSize]);

  const stats = useMemo(() => {
    const totalAgents = agents.length;
    const totalCompanies = agents.reduce(
      (sum, a) => sum + a.companies_count,
      0,
    );
    const activeAgents = agents.filter((a) => a.is_active).length;
    const avgDailyTarget =
      agents.length > 0
        ? Math.round(
            agents.reduce((sum, a) => sum + a.daily_target, 0) / agents.length,
          )
        : 0;

    const totalToday = agents.reduce(
      (sum, a) => sum + resolvePeriodCounts(a).today,
      0,
    );
    const totalThisWeek = agents.reduce(
      (sum, a) => sum + resolvePeriodCounts(a).thisWeek,
      0,
    );

    return {
      totalAgents,
      totalCompanies,
      activeAgents,
      avgDailyTarget,
      totalToday,
      totalThisWeek,
    };
  }, [agents]);

  const getInitials = (
    firstName: string,
    lastName: string,
    username: string,
  ): string => {
    if (firstName && lastName)
      return `${firstName[0]}${lastName[0]}`.toUpperCase();
    if (firstName) return firstName[0].toUpperCase();
    if (username) return username[0].toUpperCase();
    return "U";
  };

  const formatPhone = (phone: string | null): string => {
    if (!phone) return "—";
    const cleaned = phone.replace(/\D/g, "");
    if (cleaned.length === 12 && cleaned.startsWith("251")) {
      return `+251 ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 12)}`;
    }
    return phone;
  };

  const openEditModal = (agent: MarketingAgent) => {
    setEditingAgent(agent);
    setEditFormData({
      first_name: agent.first_name || "",
      last_name: agent.last_name || "",
      email: agent.email,
      phone_number: agent.phone_number || "",
      daily_target: agent.daily_target,
      weekly_target: agent.weekly_target,
      is_active: agent.is_active,
    });
  };

  const handleEditSave = async () => {
    if (!editingAgent) return;
    try {
      await updateUser(editingAgent.id, {
        first_name: editFormData.first_name,
        last_name: editFormData.last_name,
        email: editFormData.email,
        phone_number: editFormData.phone_number,
        daily_target: editFormData.daily_target,
        weekly_target: editFormData.weekly_target,
        is_active: editFormData.is_active,
      });
      showToast("success", "Agent updated successfully");
      setEditingAgent(null);
      await fetchAgents();
    } catch (err: any) {
      showToast("error", err.message || "Failed to update agent");
    }
  };

  /* ─── Columns ─────────────────────────────────────────────────── */

  const agentColumns: Column<MarketingAgent>[] = [
    {
      key: "agent",
      header: "Agent",
      render: (agent) => {
        const { rank } = getAgentProgress(agent);
        return (
          <div className="flex min-w-0 items-center gap-3">
            {agent.profile_image ? (
              <img
                src={agent.profile_image}
                alt={agent.username}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-full border border-secondary/15 object-cover"
                onClick={() => setZoomImageAgent(agent)}
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary/[0.08] text-sm font-semibold text-secondary">
                {getInitials(
                  agent.first_name,
                  agent.last_name,
                  agent.username,
                )}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate font-semibold text-gray-900">
                  {agent.first_name && agent.last_name
                    ? `${agent.first_name} ${agent.last_name}`
                    : agent.username}
                </p>
                <span
                  className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${rank.color}`}
                >
                  {rank.icon}
                  {rank.label}
                </span>
                <button
                  type="button"
                  onClick={() => setPersonalModalAgent(agent)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-secondary/[0.06] hover:text-secondary"
                  title="View profile"
                >
                  <User className="h-3.5 w-3.5" />
                </button>
              </div>
              <p className="text-xs text-gray-400">@{agent.username}</p>
            </div>
          </div>
        );
      },
    },
    {
      key: "contact",
      header: "Contact",
      render: (agent) => (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm text-gray-700">
            <Mail className="h-3.5 w-3.5 text-secondary/60" />
            {agent.email}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5 text-secondary/60" />
            {formatPhone(agent.phone_number)}
          </p>
        </div>
      ),
    },
    {
      key: "targets",
      header: "Targets",
      textMode: "nowrap",
      render: (agent) => (
        <div className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-medium text-gray-800">
            <Sun className="h-3.5 w-3.5 text-amber-500" />
            {agent.daily_target} / day
          </p>
          <p className="flex items-center gap-1.5 text-xs text-gray-500">
            <CalendarDays className="h-3.5 w-3.5 text-indigo-500" />
            {agent.weekly_target} / week
          </p>
        </div>
      ),
    },
    {
      key: "performance",
      header: "Performance",
      textMode: "nowrap",
      render: (agent) => {
        const { daily, weekly } = getAgentProgress(agent);

        return (
          <div className="min-w-[200px] space-y-2">
            {/* Today */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-amber-600">
                  <Sun className="h-3 w-3" />
                  Today
                </span>
                <span className="text-[11px] font-medium text-gray-700">
                  <span className="font-bold text-gray-900">
                    {daily.actual}
                  </span>
                  <span className="text-gray-400">/{daily.target}</span>
                  <span className="ml-1.5 text-gray-400">
                    {daily.percent}%
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary/[0.06]">
                <div
                  className={`h-full rounded-full transition-all ${progressBarColor(
                    daily.percent,
                  )}`}
                  style={{ width: `${daily.percent}%` }}
                />
              </div>
            </div>

            {/* This week */}
            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="inline-flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wide text-indigo-600">
                  <CalendarRange className="h-3 w-3" />
                  This week
                </span>
                <span className="text-[11px] font-medium text-gray-700">
                  <span className="font-bold text-gray-900">
                    {weekly.actual}
                  </span>
                  <span className="text-gray-400">/{weekly.target}</span>
                  <span className="ml-1.5 text-gray-400">
                    {weekly.percent}%
                  </span>
                </span>
              </div>
              <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-secondary/[0.06]">
                <div
                  className={`h-full rounded-full transition-all ${progressBarColor(
                    weekly.percent,
                  )}`}
                  style={{ width: `${weekly.percent}%` }}
                />
              </div>
            </div>
          </div>
        );
      },
    },
    {
      key: "status",
      header: "Status",
      textMode: "nowrap",
      render: (agent) => (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium ${
            agent.is_active
              ? "border-emerald-200 bg-emerald-50 text-emerald-700"
              : "border-gray-200 bg-gray-50 text-gray-500"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full ${
              agent.is_active ? "bg-emerald-500" : "bg-gray-400"
            }`}
          />
          {agent.is_active ? "Active" : "Inactive"}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      className: "text-right",
      textMode: "nowrap",
      render: (agent) => (
        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={() => openEditModal(agent)}
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-secondary/15 bg-white text-secondary/70 transition hover:bg-secondary/[0.04] hover:text-secondary"
            title="Edit agent"
          >
            <Edit className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setSelectedAgentId(agent.id);
              setSelectedAgentName(
                agent.first_name && agent.last_name
                  ? `${agent.first_name} ${agent.last_name}`
                  : agent.username,
              );
            }}
            className="inline-flex h-9 items-center gap-2 rounded-lg bg-secondary px-3 text-sm font-semibold text-white transition hover:bg-secondary/90"
          >
            <Eye className="h-4 w-4" />
            Audit
          </button>
        </div>
      ),
    },
  ];

  /* ─── Skeleton ───────────────────────────────────────────────── */

  const renderSkeleton = () => (
    <div className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="h-6 w-44 rounded bg-secondary/[0.08]" />
          <div className="mt-2 h-4 w-72 max-w-full rounded bg-secondary/[0.06]" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-20 rounded-xl bg-secondary/[0.06]" />
          <div className="h-10 w-24 rounded-xl bg-secondary/[0.06]" />
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      <div className="mb-5 flex w-full flex-col items-start gap-3 md:flex-row md:items-center">
        <div className="h-10 w-full rounded-xl bg-secondary/[0.06] md:flex-1" />
        <div className="hidden flex-col items-center gap-2 sm:flex-row md:flex">
          <div className="h-10 w-48 rounded-xl bg-secondary/[0.06]" />
          <div className="h-10 w-40 rounded-xl bg-secondary/[0.06]" />
          <div className="h-10 w-10 rounded-xl bg-secondary/[0.06]" />
        </div>
      </div>

      <DataTable
        data={[]}
        columns={agentColumns}
        loading
        loadingRows={5}
        stickyColumns={1}
      />
    </div>
  );

  if (loading) {
    return renderSkeleton();
  }

  /* ─── Render ─────────────────────────────────────────────────── */

  return (
    <div className="rounded-2xl border border-secondary/10 bg-white p-4 shadow-sm sm:p-6 lg:p-8">
      <PageHeader
        title="Marketing Agents"
        description="Manage agent targets, status, and onboarding activity."
        icon={Users}
        badge={
          <span className="inline-flex items-center rounded-full border border-secondary/10 bg-secondary/[0.06] px-2.5 py-1 text-[10px] font-semibold text-secondary sm:text-xs">
            {agents.length} agents
          </span>
        }
        actions={
          <button
            type="button"
            onClick={() => {
              const headers = [
                "Username",
                "Email",
                "Phone",
                "Companies (total)",
                "Today",
                "This week",
                "Daily Target",
                "Weekly Target",
                "Status",
              ];
              const rows = filteredAgents.map((agent) => {
                const { daily, weekly } = getAgentProgress(agent);
                return [
                  agent.username,
                  agent.email,
                  agent.phone_number || "",
                  agent.companies_count,
                  daily.actual,
                  weekly.actual,
                  agent.daily_target,
                  agent.weekly_target,
                  agent.is_active ? "Active" : "Inactive",
                ];
              });
              const csv = [
                headers.join(","),
                ...rows.map((row) => row.join(",")),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `agents_${new Date()
                .toISOString()
                .split("T")[0]}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-secondary/15 bg-white px-3.5 py-2 text-xs font-semibold text-secondary shadow-sm transition hover:bg-secondary/[0.04] sm:text-sm"
          >
            Export
          </button>
        }
        className="mb-6"
      />

      {/* Inactive agents alert banner */}
      {agents.filter((a) => !a.is_active).length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <AlertTriangle className="h-5 w-5 flex-shrink-0 text-amber-500" />
          <span className="text-amber-700">
            <span className="font-semibold">
              {agents.filter((a) => !a.is_active).length}
            </span>{" "}
            inactive agents found.
            <button
              onClick={() => {
                setTempCategory("inactive");
                setCurrentPage(1);
              }}
              className="ml-1 font-medium underline underline-offset-2 transition hover:text-amber-800"
            >
              View inactive agents
            </button>
          </span>
          <button
            onClick={() => setTempCategory("all")}
            className="ml-auto text-amber-600 transition hover:text-amber-800"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Top stats — one row of 4 */}
      <div className="mb-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: "Total Agents",
            value: stats.totalAgents,
            icon: <Users className="h-4 w-4" />,
            tone: "secondary",
          },
          {
            label: "Companies Registered",
            value: stats.totalCompanies,
            icon: <Building2 className="h-4 w-4" />,
            tone: "secondary",
          },
          {
            label: "Active Agents",
            value: stats.activeAgents,
            icon: <CheckCircle className="h-4 w-4" />,
            tone: "emerald",
          },
          {
            label: "Avg Daily Target",
            value: stats.avgDailyTarget,
            icon: <Target className="h-4 w-4" />,
            tone: "secondary",
          },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-secondary/10 bg-white px-4 py-4 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition-colors hover:border-secondary/20"
          >
            <div className="flex items-center justify-between gap-2">
              <p className="truncate text-[10px] font-semibold uppercase tracking-[0.07em] text-secondary/50">
                {item.label}
              </p>
              <span
                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                  item.tone === "emerald"
                    ? "bg-emerald-50 text-emerald-600"
                    : "bg-secondary/[0.06] text-secondary"
                }`}
              >
                {item.icon}
              </span>
            </div>
            <p className="mt-1.5 text-xl font-bold tracking-tight text-secondary">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Today / This week aggregate row */}
      <div className="mb-5 grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-amber-200 bg-amber-50/60 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-amber-700">
            <Sun className="h-3.5 w-3.5" /> Today
          </p>
          <p className="mt-1 text-lg font-bold text-amber-900">
            {stats.totalToday}
            <span className="ml-1 text-xs font-medium text-amber-700/70">
              onboarded
            </span>
          </p>
        </div>
        <div className="rounded-xl border border-indigo-200 bg-indigo-50/60 px-4 py-3">
          <p className="flex items-center gap-1.5 text-xs font-semibold text-indigo-700">
            <CalendarRange className="h-3.5 w-3.5" /> This week
          </p>
          <p className="mt-1 text-lg font-bold text-indigo-900">
            {stats.totalThisWeek}
            <span className="ml-1 text-xs font-medium text-indigo-700/70">
              onboarded
            </span>
          </p>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="mb-5 rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
        <div className="grid gap-2.5 md:grid-cols-[minmax(0,1fr)_190px_170px_auto]">
          <SearchInput
            value={searchTerm}
            onChange={(value) => {
              setSearchTerm(value);
              setCurrentPage(1);
            }}
            placeholder="Search agents..."
            debounceMs={300}
            showClearButton
            showMobileFilter
            onMobileFilterClick={() => setFilterSheetOpen(true)}
            activeFilterCount={tempCategory !== "all" ? 1 : 0}
            className="w-full"
          />

          <CustomSelect
            value={tempSort}
            onChange={(value) => {
              setTempSort(value);
              setCurrentPage(1);
            }}
            options={sortOptions}
            placeholder="Sort"
            className="hidden w-full md:block"
          />

          <CustomSelect
            value={tempCategory}
            onChange={(value) => {
              setTempCategory(value);
              setCurrentPage(1);
            }}
            options={categoryOptions}
            placeholder="Status"
            className="hidden w-full md:block"
          />

          {(tempCategory !== "all" ||
            tempSort !== "name|asc" ||
            searchTerm.trim() !== "") && (
            <button
              type="button"
              onClick={() => {
                setTempCategory("all");
                setTempSort("name|asc");
                setSearchTerm("");
                setCurrentPage(1);
              }}
              className="hidden h-10 items-center justify-center gap-1.5 rounded-xl border border-secondary/15 bg-white px-3 text-sm font-medium text-secondary transition hover:bg-secondary/[0.04] md:inline-flex"
            >
              <X className="h-4 w-4" />
              Clear
            </button>
          )}
        </div>
      </div>

      <DataTable
        data={paginatedAgents}
        columns={agentColumns}
        errorMessage={error || null}
        onRetry={fetchAgents}
        emptyMessage="No marketing agents found matching your query."
        currentPage={currentPage}
        totalPages={Math.ceil(filteredAgents.length / pageSize)}
        onPageChange={setCurrentPage}
        totalItems={filteredAgents.length}
        itemsPerPage={pageSize}
        stickyColumns={1}
      />

      {/* Audit modal */}
      {selectedAgentId && (
        <AgentAuditModal
          agentId={selectedAgentId}
          agentName={selectedAgentName}
          initialAgent={agents.find((a) => a.id === selectedAgentId)}
          onClose={() => {
            setSelectedAgentId(null);
            setSelectedAgentName("");
          }}
        />
      )}

      {/* Personal info modal */}
      {personalModalAgent && (
        <AgentPersonalInfoModal
          agent={personalModalAgent}
          onClose={() => setPersonalModalAgent(null)}
        />
      )}

      {/* Image zoom modal */}
      {zoomImageAgent && zoomImageAgent.profile_image && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setZoomImageAgent(null)}
        >
          <div
            className="relative flex h-full w-full max-w-4xl items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImageAgent.profile_image}
              alt={zoomImageAgent.username}
              className="max-h-full max-w-full rounded-2xl border-4 border-white/20 object-contain shadow-2xl"
            />
            <button
              onClick={() => setZoomImageAgent(null)}
              className="absolute right-4 top-4 rounded-full bg-black/50 p-2 text-white shadow-lg transition-colors hover:bg-black/70"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="absolute bottom-6 left-0 right-0 mx-auto max-w-md rounded-full bg-black/30 px-4 py-2 text-center text-sm font-medium text-white/80 backdrop-blur-sm">
              {zoomImageAgent.first_name && zoomImageAgent.last_name
                ? `${zoomImageAgent.first_name} ${zoomImageAgent.last_name}`
                : zoomImageAgent.username}
              <span className="mx-2 text-white/40">•</span>
              @{zoomImageAgent.username}
            </div>
          </div>
        </div>
      )}

      {/* Filter & sort sheet */}
      <FilterSortSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        sortOptions={sortOptions}
        tempSort={tempSort}
        onTempSortChange={setTempSort}
        categoryOptions={categoryOptions}
        tempCategory={tempCategory}
        onTempCategoryChange={setTempCategory}
        categoryNameMap={categoryNameMap}
        onApply={() => {
          setFilterSheetOpen(false);
          setCurrentPage(1);
        }}
        onClearAll={() => {
          setTempSort("name|asc");
          setTempCategory("all");
          setSearchTerm("");
          setFilterSheetOpen(false);
          setCurrentPage(1);
        }}
      />

      {/* Mobile bottom sheet for filters */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter Agents"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">
            Search by agent name, username, or email
          </p>
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search agents..."
            debounceMs={300}
            showClearButton={true}
            className="w-full"
          />
          <button
            onClick={() => {
              setSearchTerm("");
              setSheetOpen(false);
              setCurrentPage(1);
            }}
            className="w-full rounded-xl bg-secondary/[0.06] py-3 text-sm font-semibold text-secondary transition hover:bg-secondary/[0.1]"
          >
            Reset Filters
          </button>
        </div>
      </BottomSheet>

      {/* Edit agent modal */}
      {editingAgent && (
        <FormModal
          isOpen={!!editingAgent}
          onClose={() => {
            setEditingAgent(null);
            setEditFormData({});
          }}
          title="Edit Marketing Agent"
          onSubmit={handleEditSave}
          submitting={false}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary/60">
                First Name
              </label>
              <input
                type="text"
                value={editFormData.first_name || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    first_name: e.target.value,
                  })
                }
                className="w-full rounded-xl border-2 border-secondary/15 px-4 py-2.5 text-sm font-medium transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary/60">
                Last Name
              </label>
              <input
                type="text"
                value={editFormData.last_name || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    last_name: e.target.value,
                  })
                }
                className="w-full rounded-xl border-2 border-secondary/15 px-4 py-2.5 text-sm font-medium transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary/60">
                Email
              </label>
              <input
                type="email"
                value={editFormData.email || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, email: e.target.value })
                }
                className="w-full rounded-xl border-2 border-secondary/15 px-4 py-2.5 text-sm font-medium transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary/60">
                Phone
              </label>
              <input
                type="text"
                value={editFormData.phone_number || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    phone_number: e.target.value,
                  })
                }
                className="w-full rounded-xl border-2 border-secondary/15 px-4 py-2.5 text-sm font-medium transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary/60">
                Daily Target
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.daily_target || 0}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    daily_target: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border-2 border-secondary/15 px-4 py-2.5 text-sm font-medium transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-secondary/60">
                Weekly Target
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.weekly_target || 0}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    weekly_target: Number(e.target.value),
                  })
                }
                className="w-full rounded-xl border-2 border-secondary/15 px-4 py-2.5 text-sm font-medium transition-all focus:border-secondary focus:outline-none focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex cursor-pointer items-center gap-3">
                <input
                  type="checkbox"
                  checked={editFormData.is_active ?? true}
                  onChange={(e) =>
                    setEditFormData({
                      ...editFormData,
                      is_active: e.target.checked,
                    })
                  }
                  className="h-5 w-5 cursor-pointer rounded border-secondary/30 text-secondary transition-all focus:ring-2 focus:ring-secondary"
                />
                <span className="text-sm font-semibold text-gray-700">
                  Active Agent
                </span>
                <span
                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                    editFormData.is_active
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {editFormData.is_active ? "Active" : "Inactive"}
                </span>
              </label>
            </div>
          </div>
        </FormModal>
      )}

      <Toast toast={toast} />
    </div>
  );
}