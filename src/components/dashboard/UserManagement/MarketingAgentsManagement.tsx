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
  TrendingDown,
  CheckCircle,
  User,
  ZoomIn,
  AlertTriangle,
} from "lucide-react";
import AgentPersonalInfoModal from "./AgentPersonalInfoModal";
import { getAdminMarketingAgents, updateUser } from "../../../services/api";
import MarketingOverview from "../overview/MarketingOverview";
import { SearchInput } from "../../ui/SearchInput";
import { CustomSelect } from "../../ui/CustomSelect";
import BottomSheet from "../../ui/BottomSheet";
import FilterSortSheet from "../../ui/FilterSortSheet";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { FormModal } from "../../ui/FormModal";
import PageHeader from "../../ui/PageHeader";
import { DataTable, type Column } from "../../ui/DataTable";

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
}

// ============================================================
// Stat Card Component
// ============================================================
// interface StatCardProps {
//   title: string;
//   value: number;
//   icon: React.ReactNode;
//   gradient: string;
//   subtitle?: string;
// }

// const StatCard: React.FC<StatCardProps> = ({
//   title,
//   value,
//   icon,
//   gradient,
//   subtitle,
// }) => (
//   <div
//     className={`bg-gradient-to-br ${gradient} rounded-2xl p-4 sm:p-5 shadow-md transition-all hover:shadow-lg hover:-translate-y-0.5`}
//   >
//     <div className="flex items-center justify-between">
//       <div>
//         <p className="text-xs font-medium text-white/70 uppercase tracking-wider">
//           {title}
//         </p>
//         <p className="text-2xl sm:text-3xl font-bold text-white mt-2">
//           {value}
//         </p>
//         {subtitle && (
//           <p className="text-[10px] text-white/60 mt-1">{subtitle}</p>
//         )}
//       </div>
//       <div className="h-10 w-10 sm:h-12 sm:w-12 bg-white/20 rounded-2xl flex items-center justify-center backdrop-blur-sm">
//         {icon}
//       </div>
//     </div>
//   </div>
// );

// ============================================================
// Skeleton Card (for loading) - matches real stat card exactly
// ============================================================
const SkeletonStatCard: React.FC = () => (
  <div className="bg-gray-200/60 rounded-2xl p-4 sm:p-5 shadow-sm border border-gray-200/40">
    <div className="flex items-center justify-between">
      <div>
        <div className="h-3 w-20 bg-gray-300/70 rounded"></div>
        <div className="h-8 w-16 bg-gray-300/70 rounded mt-2"></div>
        <div className="h-3 w-24 bg-gray-300/70 rounded mt-1"></div>
      </div>
      <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gray-300/70 rounded-2xl"></div>
    </div>
  </div>
);

// ============================================================
// Main Component
// ============================================================
export default function MarketingAgentsManagement() {
  const { toast, showToast } = useToast();
  const [agents, setAgents] = useState<MarketingAgent[]>([]);
  const [loading, setLoading] = useState(true);
  // ... (keep all existing states)
  const [editingAgent, setEditingAgent] = useState<MarketingAgent | null>(null);
  const [editFormData, setEditFormData] = useState<Partial<MarketingAgent>>({});
  const [error, setError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedAgentId, setSelectedAgentId] = useState<number | null>(null);
  const [selectedAgentName, setSelectedAgentName] = useState("");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [personalModalAgent, setPersonalModalAgent] = useState<MarketingAgent | null>(null);
  const [zoomImageAgent, setZoomImageAgent] = useState<MarketingAgent | null>(null);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Filter/Sort Sheet state
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

    // Search filter
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (a) =>
          a.username.toLowerCase().includes(term) ||
          (a.first_name && a.first_name.toLowerCase().includes(term)) ||
          (a.last_name && a.last_name.toLowerCase().includes(term)) ||
          a.email.toLowerCase().includes(term) ||
          (a.phone_number && a.phone_number.includes(term))
      );
    }

    // Category filter (active/inactive)
    if (tempCategory === "active") {
      result = result.filter((a) => a.is_active === true);
    } else if (tempCategory === "inactive") {
      result = result.filter((a) => a.is_active === false);
    }

    // Sort
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
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });

    return result;
  }, [agents, searchTerm, tempCategory, tempSort]);

  // Paginated agents
  const paginatedAgents = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;
    return filteredAgents.slice(start, end);
  }, [filteredAgents, currentPage, pageSize]);

  // Stats
  const stats = useMemo(() => {
    const totalAgents = agents.length;
    const totalCompanies = agents.reduce((sum, a) => sum + a.companies_count, 0);
    const activeAgents = agents.filter((a) => a.is_active).length;
    const avgDailyTarget = agents.length > 0
      ? Math.round(agents.reduce((sum, a) => sum + a.daily_target, 0) / agents.length)
      : 0;
    return { totalAgents, totalCompanies, activeAgents, avgDailyTarget };
  }, [agents]);

  const getInitials = (firstName: string, lastName: string, username: string): string => {
    if (firstName && lastName) return `${firstName[0]}${lastName[0]}`.toUpperCase();
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
  // ─── Performance Ranking ──────────────────────────────
  const getPerformanceRank = (agent: MarketingAgent) => {
    const weeklyProgress = agent.daily_target > 0
      ? Math.min(100, (agent.companies_count / (agent.daily_target * 7)) * 100)
      : 0;

    if (weeklyProgress >= 80) {
      return {
        label: "Top Performer",
        color: "bg-emerald-100 text-emerald-700 border-emerald-200",
        icon: <Award className="h-3 w-3" />,
      };
    }
    if (weeklyProgress >= 50) {
      return {
        label: "On Track",
        color: "bg-blue-100 text-blue-700 border-blue-200",
        icon: <TrendingUp className="h-3 w-3" />,
      };
    }
    if (weeklyProgress > 0) {
      return {
        label: "Needs Attention",
        color: "bg-amber-100 text-amber-700 border-amber-200",
        icon: <TrendingDown className="h-3 w-3" />,
      };
    }
    return {
      label: "No Progress",
      color: "bg-gray-100 text-gray-500 border-gray-200",
      icon: null,
    };
  };

  // ─── Edit Agent ─────────────────────────────────────────
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
      await fetchAgents(); // refresh
    } catch (err: any) {
      showToast("error", err.message || "Failed to update agent");
    }
  };

  const agentColumns: Column<MarketingAgent>[] = [
    {
      key: "agent",
      header: "Agent",
      render: (agent) => {
        const rank = getPerformanceRank(agent);
        return (
          <div className="flex min-w-0 items-center gap-3">
            {agent.profile_image ? (
              <img
                src={agent.profile_image}
                alt={agent.username}
                className="h-10 w-10 shrink-0 cursor-pointer rounded-full border border-gray-200 object-cover"
                onClick={() => setZoomImageAgent(agent)}
              />
            ) : (
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gray-100 text-sm font-semibold text-gray-700">
                {getInitials(agent.first_name, agent.last_name, agent.username)}
              </div>
            )}

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <p className="truncate font-semibold text-gray-900">
                  {agent.first_name && agent.last_name
                    ? `${agent.first_name} ${agent.last_name}`
                    : agent.username}
                </p>
                <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium ${rank.color}`}>
                  {rank.icon}
                  {rank.label}
                </span>
                <button
                  type="button"
                  onClick={() => setPersonalModalAgent(agent)}
                  className="inline-flex h-7 w-7 items-center justify-center rounded-lg text-gray-500 transition hover:bg-gray-100 hover:text-secondary"
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
            <Mail className="h-3.5 w-3.5 text-gray-400" />
            {agent.email}
          </p>
          <p className="flex items-center gap-1.5 text-sm text-gray-600">
            <Phone className="h-3.5 w-3.5 text-gray-400" />
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
          <p className="text-sm font-medium text-gray-800">
            {agent.daily_target} / day
          </p>
          <p className="text-xs text-gray-500">
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
        const progress =
          agent.daily_target > 0
            ? Math.min(
                100,
                Math.round(
                  (agent.companies_count / (agent.daily_target * 7)) * 100,
                ),
              )
            : 0;

        return (
          <div className="min-w-[130px]">
            <div className="flex items-center justify-between gap-3">
              <span className="text-sm font-semibold text-gray-800">
                {agent.companies_count} companies
              </span>
              <span className="text-xs text-gray-500">{progress}%</span>
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100">
              <div
                className="h-full rounded-full bg-secondary"
                style={{ width: `${progress}%` }}
              />
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
            className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 bg-white text-gray-600 transition hover:bg-gray-50 hover:text-secondary"
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

  // ─── Loading skeleton renderer ──────────────────────────────
  const renderSkeleton = () => (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      {/* Page header skeleton */}
      <div className="mb-5 flex flex-col gap-3 sm:mb-6 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 flex-1">
          <div className="h-6 w-44 rounded bg-gray-200" />
          <div className="mt-2 h-4 w-72 max-w-full rounded bg-gray-100" />
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-20 rounded-xl bg-gray-100" />
          <div className="h-10 w-24 rounded-xl bg-gray-100" />
        </div>
      </div>

      {/* Stats Skeleton */}
      <div className="mb-6 grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <SkeletonStatCard key={i} />
        ))}
      </div>

      {/* Table Controls Skeleton */}
      <div className="mb-5 flex w-full flex-col items-start gap-3 bg-white md:flex-row md:items-center">
        <div className="w-full md:flex-1 h-10 bg-gray-300/70 rounded-xl"></div>
        <div className="hidden md:flex flex-col sm:flex-row items-center gap-2">
          <div className="w-48 h-10 bg-gray-300/70 rounded-xl"></div>
          <div className="w-40 h-10 bg-gray-300/70 rounded-xl"></div>
          <div className="w-10 h-10 bg-gray-300/70 rounded-xl"></div>
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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <PageHeader
        title="Marketing Agents"
        description="Manage agent targets, status, and onboarding activity."
        icon={Users}
        badge={
          <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-50 px-2.5 py-1 text-[10px] font-semibold text-gray-600 sm:text-xs">
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
                "Companies",
                "Daily Target",
                "Weekly Target",
                "Status",
              ];
              const rows = filteredAgents.map((agent) => [
                agent.username,
                agent.email,
                agent.phone_number || "",
                agent.companies_count,
                agent.daily_target,
                agent.weekly_target,
                agent.is_active ? "Active" : "Inactive",
              ]);
              const csv = [
                headers.join(","),
                ...rows.map((row) => row.join(",")),
              ].join("\n");
              const blob = new Blob([csv], { type: "text/csv" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = `agents_${new Date().toISOString().split("T")[0]}.csv`;
              link.click();
              URL.revokeObjectURL(url);
            }}
            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-gray-200 bg-white px-3.5 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:bg-gray-50 sm:text-sm"
          >
            Export
          </button>
        }
        className="mb-6"
      />

      {/* Inactive agents alert banner */}
      {agents.filter(a => !a.is_active).length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm">
          <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0" />
          <span className="text-amber-700">
            <span className="font-semibold">{agents.filter(a => !a.is_active).length}</span> inactive agents found.
            <button
              onClick={() => { setTempCategory("inactive"); setCurrentPage(1); }}
              className="ml-1 font-medium underline underline-offset-2 hover:text-amber-800 transition"
            >
              View inactive agents
            </button>
          </span>
          <button
            onClick={() => setTempCategory("all")}
            className="ml-auto text-amber-600 hover:text-amber-800 transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          { label: "Total Agents", value: stats.totalAgents },
          { label: "Companies Registered", value: stats.totalCompanies },
          { label: "Active Agents", value: stats.activeAgents },
          { label: "Avg Daily Target", value: stats.avgDailyTarget },
        ].map((item) => (
          <div
            key={item.label}
            className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
          >
            <p className="text-xs font-medium text-gray-500">{item.label}</p>
            <p className="mt-1 text-xl font-semibold text-gray-900">
              {item.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-5 rounded-xl border border-gray-200 bg-white p-2.5 shadow-sm">
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
              className="hidden h-10 items-center justify-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 text-sm font-medium text-gray-600 transition hover:bg-gray-50 md:inline-flex"
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

      {/* Audit Modal Overlay */}
      {selectedAgentId && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden bg-black/50 p-4">
          <div className="flex h-[90dvh] w-full max-w-6xl flex-col overflow-hidden rounded-2xl bg-white shadow-xl">
            {/* Modal Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-6 py-4">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-secondary">
                  Auditing Agent: {selectedAgentName}
                </h2>
                <p className="text-secondary/60 text-xs mt-0.5">
                  Detailed registration activity and metrics for agent #{selectedAgentId}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedAgentId(null);
                  setSelectedAgentName("");
                }}
                className="p-1.5 rounded-full bg-secondary/10 hover:bg-secondary/20 text-secondary transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Scrollable Audit Report content */}
            <div className="flex-1 overflow-y-auto bg-white">
              <MarketingOverview agentId={selectedAgentId} />
            </div>
          </div>
        </div>
      )}
      {/* Personal Info Modal - MOVED OUTSIDE the Audit modal */}
      {personalModalAgent && (
        <AgentPersonalInfoModal
          agent={personalModalAgent}
          onClose={() => setPersonalModalAgent(null)}
        />
      )}

      {/* Image Zoom Modal */}
      {zoomImageAgent && zoomImageAgent.profile_image && (
        <div
          className="fixed inset-0 z-[300] flex items-center justify-center bg-black/75 p-4"
          onClick={() => setZoomImageAgent(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] w-full h-full flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={zoomImageAgent.profile_image}
              alt={zoomImageAgent.username}
              className="max-w-full max-h-full object-contain rounded-2xl shadow-2xl border-4 border-white/20"
            />
            <button
              onClick={() => setZoomImageAgent(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-black/50 hover:bg-black/70 text-white transition-colors shadow-lg"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="absolute bottom-6 left-0 right-0 text-center text-white/80 text-sm font-medium bg-black/30 py-2 px-4 mx-auto max-w-md rounded-full backdrop-blur-sm">
              {zoomImageAgent.first_name && zoomImageAgent.last_name
                ? `${zoomImageAgent.first_name} ${zoomImageAgent.last_name}`
                : zoomImageAgent.username}
              <span className="mx-2 text-white/40">•</span>
              @{zoomImageAgent.username}
            </div>
          </div>
        </div>
      )}

      {/* Filter & Sort Sheet - Using FilterSortSheet component */}
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
          // The filteredAgents useMemo already uses tempSort and tempCategory
          // So we just close the sheet and reset to page 1
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

      {/* Simple BottomSheet for additional mobile filters if needed */}
      <BottomSheet
        open={sheetOpen}
        onClose={() => setSheetOpen(false)}
        title="Filter Agents"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-500">Search by agent name, username, or email</p>
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
            className="w-full py-3 bg-gray-100 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-200 transition"
          >
            Reset Filters
          </button>
        </div>
      </BottomSheet>
      {/* Edit Agent Modal */}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                First Name
              </label>
              <input
                type="text"
                value={editFormData.first_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, first_name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Last Name
              </label>
              <input
                type="text"
                value={editFormData.last_name || ""}
                onChange={(e) => setEditFormData({ ...editFormData, last_name: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Email
              </label>
              <input
                type="email"
                value={editFormData.email || ""}
                onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Phone
              </label>
              <input
                type="text"
                value={editFormData.phone_number || ""}
                onChange={(e) => setEditFormData({ ...editFormData, phone_number: e.target.value })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Daily Target
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.daily_target || 0}
                onChange={(e) => setEditFormData({ ...editFormData, daily_target: Number(e.target.value) })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">
                Weekly Target
              </label>
              <input
                type="number"
                min="0"
                value={editFormData.weekly_target || 0}
                onChange={(e) => setEditFormData({ ...editFormData, weekly_target: Number(e.target.value) })}
                className="w-full border-2 border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium transition-all focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
            <div className="md:col-span-2">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={editFormData.is_active ?? true}
                  onChange={(e) => setEditFormData({ ...editFormData, is_active: e.target.checked })}
                  className="h-5 w-5 text-secondary focus:ring-secondary focus:ring-2 border-gray-300 rounded cursor-pointer transition-all"
                />
                <span className="text-sm font-semibold text-gray-700">Active Agent</span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${editFormData.is_active ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                  {editFormData.is_active ? 'Active' : 'Inactive'}
                </span>
              </label>
            </div>
          </div>
        </FormModal>
      )}

      {/* Toast */}
      <Toast toast={toast} />
    </div>
  );
}