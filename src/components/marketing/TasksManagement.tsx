import React, { useState, useEffect, useMemo } from "react";
import {
  ClipboardList,
  Plus,
  Eye,
  Edit,
  Trash2,
  X,
  CheckCircle,
  Clock,
  AlertCircle,
  Calendar,
  Flag,
  FileDown,
} from "lucide-react";
import { SearchInput } from "../ui/SearchInput";
import { Pagination } from "../ui/Pagination";
import { CustomSelect } from "../ui/CustomSelect";
import FilterSortSheet from "../ui/FilterSortSheet";
import { FormModal } from "../ui/FormModal";
import { DeleteConfirmModal } from "../ui/DeleteConfirmModal";
import { useToast } from "../../hooks/useToast";
import { Toast } from "../ui/Toast";

// ─── Types ───────────────────────────────────────────────
interface Task {
  id: number;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "completed";
  priority: "low" | "medium" | "high";
  due_date: string;
  created_at: string;
  updated_at: string;
  assigned_to: number;
}

// ─── Mock Data ──────────────────────────────────────────
const mockTasks: Task[] = [
  {
    id: 1,
    title: "Follow up with Abyssinia Trading",
    description: "Call Abebe Kebede to discuss pricing and next steps.",
    status: "pending",
    priority: "high",
    due_date: "2025-02-20",
    created_at: "2025-01-16T10:00:00Z",
    updated_at: "2025-01-16T10:00:00Z",
    assigned_to: 4,
  },
  {
    id: 2,
    title: "Prepare proposal for Ethio Telecom",
    description: "Draft the service agreement and send for review.",
    status: "in_progress",
    priority: "medium",
    due_date: "2025-02-25",
    created_at: "2025-01-15T14:30:00Z",
    updated_at: "2025-01-16T09:00:00Z",
    assigned_to: 4,
  },
  {
    id: 3,
    title: "Send thank-you email to Zemen Bank",
    description:
      "After the meeting, send a follow-up email with meeting notes.",
    status: "completed",
    priority: "low",
    due_date: "2025-01-14",
    created_at: "2025-01-13T11:00:00Z",
    updated_at: "2025-01-14T08:30:00Z",
    assigned_to: 4,
  },
  {
    id: 4,
    title: "Schedule demo with Habesha Foods",
    description: "Arrange a product demo for Meron Ayele.",
    status: "pending",
    priority: "medium",
    due_date: "2025-02-28",
    created_at: "2025-01-16T16:00:00Z",
    updated_at: "2025-01-16T16:00:00Z",
    assigned_to: 4,
  },
];

// ─── Configs ─────────────────────────────────────────────
const statusConfig: Record<
  Task["status"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  pending: {
    label: "Pending",
    color: "border-secondary/15 bg-secondary/[0.07] text-secondary",
    icon: <Clock className="h-3 w-3" />,
  },
  in_progress: {
    label: "In Progress",
    color: "border-secondary/15 bg-secondary/[0.07] text-secondary",
    icon: <AlertCircle className="h-3 w-3" />,
  },
  completed: {
    label: "Completed",
    color: "border-secondary/15 bg-secondary/[0.07] text-secondary",
    icon: <CheckCircle className="h-3 w-3" />,
  },
};

const priorityConfig: Record<
  Task["priority"],
  { label: string; color: string; icon: React.ReactNode }
> = {
  low: {
    label: "Low",
    color: "border-secondary/15 bg-white text-secondary/65",
    icon: <Flag className="h-3 w-3" />,
  },
  medium: {
    label: "Medium",
    color: "border-secondary/15 bg-secondary/[0.04] text-secondary",
    icon: <Flag className="h-3 w-3" />,
  },
  high: {
    label: "High",
    color: "border-secondary/20 bg-secondary/[0.08] text-secondary",
    icon: <Flag className="h-3 w-3" />,
  },
};

// ─── Component ──────────────────────────────────────────
// ─── Skeleton Components ──────────────────────────────────
const SkeletonTaskRow: React.FC = () => (
  <tr className="group transition-all duration-150 border-b border-secondary/[0.08] animate-pulse">
    <td className="py-3.5 px-5">
      <div className="space-y-1">
        <div className="h-4 w-32 bg-secondary/[0.09] rounded"></div>
        <div className="h-3 w-48 bg-secondary/[0.09] rounded"></div>
      </div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-6 w-16 bg-secondary/[0.09] rounded-full"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-6 w-16 bg-secondary/[0.09] rounded-full"></div>
    </td>
    <td className="py-3.5 px-5">
      <div className="h-4 w-20 bg-secondary/[0.09] rounded"></div>
    </td>
    <td className="py-3.5 px-5 text-right">
      <div className="flex items-center justify-end gap-1.5">
        <div className="h-8 w-8 rounded-full bg-secondary/[0.09]"></div>
        <div className="h-8 w-8 rounded-full bg-secondary/[0.09]"></div>
        <div className="h-8 w-8 rounded-full bg-secondary/[0.09]"></div>
      </div>
    </td>
  </tr>
);

const SkeletonTaskTable: React.FC<{ rowCount?: number }> = ({
  rowCount = 5,
}) => (
  <div className="bg-white rounded-2xl border border-secondary/15/60 shadow-sm overflow-hidden animate-pulse">
    <div className="hidden w-full overflow-x-auto lg:block scrollbar-thin scrollbar-track-secondary/[0.04] scrollbar-thumb-secondary/20">
      <table className="w-full">
        <thead>
          <tr className="border-b border-secondary/10 bg-secondary/[0.035]">
            {["Task", "Status", "Priority", "Due Date", "Actions"].map((h) => (
              <th key={h} className="text-left py-3.5 px-5">
                <div className="h-4 w-12 bg-secondary/[0.09] rounded"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {[...Array(rowCount)].map((_, i) => (
            <SkeletonTaskRow key={i} />
          ))}
        </tbody>
      </table>
    </div>
    {/* Mobile skeleton cards */}
    <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:hidden">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="bg-white rounded-2xl border border-secondary/10 p-4 shadow-sm flex flex-col gap-3"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1">
              <div className="h-4 w-24 bg-secondary/[0.09] rounded mb-1"></div>
              <div className="h-3 w-32 bg-secondary/[0.09] rounded"></div>
            </div>
            <div className="h-5 w-16 bg-secondary/[0.09] rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-5 w-16 bg-secondary/[0.09] rounded-full"></div>
            <div className="h-3 w-20 bg-secondary/[0.09] rounded"></div>
          </div>
          <div className="flex items-center justify-end gap-1 border-t border-secondary/[0.08] pt-2">
            <div className="h-6 w-6 rounded-full bg-secondary/[0.09]"></div>
            <div className="h-6 w-6 rounded-full bg-secondary/[0.09]"></div>
            <div className="h-6 w-6 rounded-full bg-secondary/[0.09]"></div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

export default function TasksManagement() {
  const { toast, showToast } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & search
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");
  const [sort, setSort] = useState<string>("due_date|asc");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [filterSheetOpen, setFilterSheetOpen] = useState(false);

  // Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [viewingTask, setViewingTask] = useState<Task | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [deletingTask, setDeletingTask] = useState<Task | null>(null);

  const [newTask, setNewTask] = useState<Partial<Task>>({
    title: "",
    description: "",
    status: "pending",
    priority: "medium",
    due_date: "",
  });
  const [editFormData, setEditFormData] = useState<Partial<Task>>({});

  // ─── Fetch mock data ──────────────────────────────────
  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true);
        await new Promise((resolve) => setTimeout(resolve, 500));
        setTasks(mockTasks);
        setError(null);
      } catch {
        setError("Failed to load tasks.");
      } finally {
        setLoading(false);
      }
    };
    fetchTasks();
  }, []);

  // ─── Filter & sort ─────────────────────────────────────
  const filteredTasks = useMemo(() => {
    let result = [...tasks];

    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (t) =>
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term),
      );
    }
    if (statusFilter !== "all") {
      result = result.filter((t) => t.status === statusFilter);
    }
    if (priorityFilter !== "all") {
      result = result.filter((t) => t.priority === priorityFilter);
    }

    const [field, order] = sort.split("|");
    result.sort((a, b) => {
      let valA = a[field as keyof Task] as string;
      let valB = b[field as keyof Task] as string;
      if (typeof valA === "string") valA = valA.toLowerCase();
      if (typeof valB === "string") valB = valB.toLowerCase();
      if (order === "asc") return valA > valB ? 1 : valA < valB ? -1 : 0;
      return valA < valB ? 1 : valA > valB ? -1 : 0;
    });
    return result;
  }, [tasks, searchTerm, statusFilter, priorityFilter, sort]);

  const paginatedTasks = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredTasks.slice(start, start + pageSize);
  }, [filteredTasks, currentPage, pageSize]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, statusFilter, priorityFilter, sort, pageSize]);

  // ─── Sort & filter options ────────────────────────────
  const sortOptions = [
    { label: "Due Date (Earliest)", value: "due_date|asc" },
    { label: "Due Date (Latest)", value: "due_date|desc" },
    { label: "Title (A-Z)", value: "title|asc" },
    { label: "Title (Z-A)", value: "title|desc" },
    { label: "Created (Newest)", value: "created_at|desc" },
    { label: "Created (Oldest)", value: "created_at|asc" },
  ];

  const statusOptions = [
    { label: "All Statuses", value: "all" },
    ...Object.entries(statusConfig).map(([k, v]) => ({
      label: v.label,
      value: k,
    })),
  ];

  const priorityOptions = [
    { label: "All Priorities", value: "all" },
    ...Object.entries(priorityConfig).map(([k, v]) => ({
      label: v.label,
      value: k,
    })),
  ];

  // ─── CRUD handlers ─────────────────────────────────────
  const handleAddTask = () => {
    if (!newTask.title?.trim()) {
      showToast("error", "Title is required");
      return;
    }
    const task: Task = {
      id: Math.max(...tasks.map((t) => t.id), 0) + 1,
      title: newTask.title,
      description: newTask.description || "",
      status: (newTask.status as Task["status"]) || "pending",
      priority: (newTask.priority as Task["priority"]) || "medium",
      due_date: newTask.due_date || new Date().toISOString().split("T")[0],
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      assigned_to: 4,
    };
    setTasks([task, ...tasks]);
    setIsModalOpen(false);
    setNewTask({
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      due_date: "",
    });
    showToast("success", "Task added successfully");
  };

  const handleView = (task: Task) => setViewingTask(task);

  const handleEdit = (task: Task) => {
    setEditingTask(task);
    setEditFormData({ ...task });
  };

  const handleUpdateTask = () => {
    if (!editingTask) return;
    if (!editFormData.title?.trim()) {
      showToast("error", "Title is required");
      return;
    }
    const updated: Task = {
      ...editingTask,
      title: editFormData.title,
      description: editFormData.description || "",
      status: (editFormData.status as Task["status"]) || editingTask.status,
      priority:
        (editFormData.priority as Task["priority"]) || editingTask.priority,
      due_date: editFormData.due_date || editingTask.due_date,
      updated_at: new Date().toISOString(),
    };
    setTasks(tasks.map((t) => (t.id === editingTask.id ? updated : t)));
    setEditingTask(null);
    setEditFormData({});
    showToast("success", "Task updated successfully");
  };

  const handleDelete = (task: Task) => setDeletingTask(task);
  const handleConfirmDelete = () => {
    if (!deletingTask) return;
    setTasks(tasks.filter((t) => t.id !== deletingTask.id));
    setDeletingTask(null);
    showToast("success", "Task deleted successfully");
  };

  // ─── Export CSV ────────────────────────────────────────
  const handleExport = () => {
    const headers = [
      "Title",
      "Description",
      "Status",
      "Priority",
      "Due Date",
      "Created",
    ];
    const rows = filteredTasks.map((t) => [
      t.title,
      t.description,
      statusConfig[t.status].label,
      priorityConfig[t.priority].label,
      t.due_date,
      new Date(t.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `tasks_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    showToast("success", "Export successful");
  };

  // ─── Loading & error states ────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen space-y-4 bg-white p-3 font-sans sm:p-4 lg:p-6 animate-pulse">
        {/* ─── Header Skeleton ──────────────────────────────── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="h-8 w-32 bg-secondary/[0.09] rounded mb-2"></div>
            <div className="h-4 w-64 bg-secondary/[0.09] rounded"></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-20 bg-secondary/[0.09] rounded-xl"></div>
            <div className="h-10 w-28 bg-secondary/[0.09] rounded-xl"></div>
          </div>
        </div>

        {/* ─── Table Controls Skeleton ────────────────────────── */}
        <div className="flex flex-col md:flex-row gap-3 w-full items-start md:items-center">
          <div className="w-full md:flex-1 h-10 bg-secondary/[0.09] rounded-xl"></div>
          <div className="hidden md:flex flex-col sm:flex-row items-center gap-2">
            <div className="w-44 h-10 bg-secondary/[0.09] rounded-xl"></div>
            <div className="w-36 h-10 bg-secondary/[0.09] rounded-xl"></div>
            <div className="w-36 h-10 bg-secondary/[0.09] rounded-xl"></div>
            <div className="w-10 h-10 bg-secondary/[0.09] rounded-xl"></div>
          </div>
        </div>

        {/* ─── Table Skeleton ────────────────────────────────── */}
        <SkeletonTaskTable rowCount={pageSize} />

        {/* ─── Pagination Skeleton ────────────────────────────── */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4 px-3 sm:px-5 py-3 sm:py-4 border-t border-secondary/15 bg-secondary/[0.035]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-4">
            <div className="h-6 w-24 bg-secondary/[0.09] rounded-full"></div>
            <div className="h-8 w-24 bg-secondary/[0.09] rounded-full"></div>
          </div>
          <div className="flex items-center gap-2">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-8 w-8 bg-secondary/[0.09] rounded-full"
              ></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-secondary/10 bg-white p-6 text-center">
        <p className="text-secondary">{error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-4 px-4 py-2 bg-secondary text-white rounded-xl text-sm"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen space-y-4 bg-white p-3 font-sans sm:p-4 lg:p-6">
      <Toast toast={toast} />
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="flex items-center gap-2 text-lg font-bold tracking-tight text-secondary sm:text-xl">
            <ClipboardList className="h-5 w-5 text-secondary" />
            Tasks
          </h1>
          <p className="text-xs sm:text-sm text-secondary/50 mt-1">
            Manage your daily to‑dos and follow‑ups efficiently
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-secondary/10 bg-white px-3 text-xs font-semibold text-secondary/65 transition hover:bg-secondary/[0.04]"
          >
            <FileDown className="h-4 w-4" />
            Export
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-secondary px-3.5 text-xs font-semibold text-white transition hover:bg-secondary/90 active:scale-[0.98]"
          >
            <Plus className="h-4 w-4" />
            Add Task
          </button>
        </div>
      </div>

      <div className="sticky -top-6 z-[2] -mt-6 w-full bg-white pt-6">
        <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
          <div className="flex w-full items-center gap-2">
            <div className="min-w-0 flex-1">
              <SearchInput
                value={searchTerm}
                onChange={setSearchTerm}
                placeholder="Search tasks by title or description..."
                debounceMs={300}
                showClearButton={true}
                showMobileFilter={true}
                onMobileFilterClick={() => setFilterSheetOpen(true)}
                activeFilterCount={
                  (statusFilter !== "all" ? 1 : 0) +
                  (priorityFilter !== "all" ? 1 : 0)
                }
                className="w-full"
              />
            </div>

            <div className="relative z-[110] hidden w-44 shrink-0 md:block">
              <CustomSelect
                value={sort}
                onChange={(value) => {
                  setSort(value);
                  setCurrentPage(1);
                }}
                options={sortOptions}
                placeholder="Sort by..."
                className="w-full"
              />
            </div>

            <div className="relative z-[110] hidden w-36 shrink-0 md:block">
              <CustomSelect
                value={statusFilter}
                onChange={(value) => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
                options={statusOptions}
                placeholder="Status"
                className="w-full"
              />
            </div>

            <div className="relative z-[110] hidden w-36 shrink-0 md:block">
              <CustomSelect
                value={priorityFilter}
                onChange={(value) => {
                  setPriorityFilter(value);
                  setCurrentPage(1);
                }}
                options={priorityOptions}
                placeholder="Priority"
                className="w-full"
              />
            </div>

            <div className="relative z-[110] w-[104px] shrink-0 sm:w-[118px]">
              <CustomSelect
                value={String(pageSize)}
                onChange={(value) => {
                  setPageSize(Number(value));
                  setCurrentPage(1);
                }}
                options={[
                  { value: "5", label: "5 / page" },
                  { value: "10", label: "10 / page" },
                  { value: "25", label: "25 / page" },
                  { value: "50", label: "50 / page" },
                ]}
                placeholder="10 / page"
                className="w-full text-xs"
              />
            </div>

            {(statusFilter !== "all" ||
              priorityFilter !== "all" ||
              searchTerm.trim() !== "" ||
              sort !== "due_date|asc") && (
              <button
                type="button"
                onClick={() => {
                  setStatusFilter("all");
                  setPriorityFilter("all");
                  setSort("due_date|asc");
                  setSearchTerm("");
                  setCurrentPage(1);
                }}
                aria-label="Clear all filters"
                title="Clear all filters"
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-secondary/15 bg-white text-secondary transition hover:bg-secondary/[0.05] focus:outline-none focus:ring-2 focus:ring-secondary/15 md:flex"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Table */}
      {filteredTasks.length === 0 ? (
        <div className="rounded-xl border border-secondary/10 bg-white px-4 py-14 text-center shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
          <ClipboardList className="mx-auto mb-3 h-10 w-10 text-secondary/25" />
          <p className="text-sm font-semibold text-secondary">No tasks found</p>
          <p className="mt-1 text-xs text-secondary/45">
            Try adjusting your search or filters.
          </p>
        </div>
      ) : (
        <div className="w-full overflow-hidden rounded-xl border border-secondary/10 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
          <div className="hidden w-full overflow-x-auto lg:block scrollbar-thin scrollbar-track-secondary/[0.04] scrollbar-thumb-secondary/20">
            <table className="w-full">
              <thead>
                <tr className="border-b border-secondary/10 bg-secondary/[0.035]">
                  <th className="text-left py-3.5 px-5 text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/55">
                    Task
                  </th>
                  <th className="text-left py-3.5 px-5 text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/55">
                    Status
                  </th>
                  <th className="text-left py-3.5 px-5 text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/55">
                    Priority
                  </th>
                  <th className="text-left py-3.5 px-5 text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/55">
                    Due Date
                  </th>
                  <th className="text-right py-3.5 px-5 text-[10px] font-semibold uppercase tracking-[0.06em] text-secondary/55">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedTasks.map((task, index) => (
                  <tr
                    key={task.id}
                    className={`group transition-all duration-150 ${index !== paginatedTasks.length - 1 ? "border-b border-secondary/[0.08]" : ""} hover:bg-secondary/[0.025]`}
                  >
                    <td className="py-3.5 px-5">
                      <div>
                        <p className="font-semibold text-secondary text-sm">
                          {task.title}
                        </p>
                        <p className="text-xs text-secondary/50 truncate max-w-[300px]">
                          {task.description}
                        </p>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[task.status].color}`}
                      >
                        {statusConfig[task.status].icon}
                        {statusConfig[task.status].label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${priorityConfig[task.priority].color}`}
                      >
                        {priorityConfig[task.priority].icon}
                        {priorityConfig[task.priority].label}
                      </span>
                    </td>
                    <td className="py-3.5 px-5 text-sm text-secondary/65">
                      {task.due_date}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleView(task)}
                          className="p-1.5 rounded-full hover:bg-secondary/[0.06] transition"
                          title="View"
                        >
                          <Eye className="h-4 w-4 text-secondary/35 hover:text-secondary" />
                        </button>
                        <button
                          onClick={() => handleEdit(task)}
                          className="p-1.5 rounded-full hover:bg-secondary/[0.06] transition"
                          title="Edit"
                        >
                          <Edit className="h-4 w-4 text-secondary/35 hover:text-secondary" />
                        </button>
                        <button
                          onClick={() => handleDelete(task)}
                          className="p-1.5 rounded-full hover:bg-secondary/[0.05] transition"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4 text-secondary/35 hover:text-secondary" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-2 lg:hidden">
            {paginatedTasks.map((task) => (
              <div
                key={task.id}
                className="flex flex-col gap-3 rounded-xl border border-secondary/10 bg-white p-3 shadow-[0_1px_2px_rgba(0,0,0,0.03)] transition hover:bg-secondary/[0.015]"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-secondary text-sm truncate">
                      {task.title}
                    </p>
                    <p className="text-xs text-secondary/50 truncate">
                      {task.description}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold border ${statusConfig[task.status].color}`}
                  >
                    {statusConfig[task.status].icon}
                    {statusConfig[task.status].label}
                  </span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border ${priorityConfig[task.priority].color}`}
                  >
                    {priorityConfig[task.priority].icon}
                    {priorityConfig[task.priority].label}
                  </span>
                  <span className="text-secondary/50 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    {task.due_date}
                  </span>
                </div>
                <div className="flex items-center justify-end gap-1 border-t border-secondary/[0.08] pt-2">
                  <button className="p-1 rounded-full hover:bg-secondary/[0.06] transition">
                    <Eye className="h-4 w-4 text-secondary/35" />
                  </button>
                  <button className="p-1 rounded-full hover:bg-secondary/[0.06] transition">
                    <Edit className="h-4 w-4 text-secondary/35" />
                  </button>
                  <button className="p-1 rounded-full hover:bg-secondary/[0.05] transition">
                    <Trash2 className="h-4 w-4 text-secondary/35" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pagination */}
      {filteredTasks.length > pageSize && (
        <Pagination
          currentPage={currentPage}
          totalPages={Math.ceil(filteredTasks.length / pageSize)}
          onPageChange={setCurrentPage}
          pageSize={pageSize}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setCurrentPage(1);
          }}
          pageSizeOptions={[5, 10, 25, 50]}
          enableUrlSync={false}
        />
      )}

      {/* Filter Sheet */}
      <FilterSortSheet
        open={filterSheetOpen}
        onClose={() => setFilterSheetOpen(false)}
        sortOptions={sortOptions}
        tempSort={sort}
        onTempSortChange={setSort}
        categoryOptions={statusOptions}
        tempCategory={statusFilter}
        onTempCategoryChange={setStatusFilter}
        categoryNameMap={Object.fromEntries(
          Object.entries(statusConfig).map(([k, v]) => [k, v.label]),
        )}
        onApply={() => {
          setFilterSheetOpen(false);
          setCurrentPage(1);
        }}
        onClearAll={() => {
          setSort("due_date|asc");
          setStatusFilter("all");
          setPriorityFilter("all");
          setSearchTerm("");
          setFilterSheetOpen(false);
          setCurrentPage(1);
        }}
      />

      {/* ─── Add Task Modal ──────────────────────────────── */}
      <FormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setNewTask({
            title: "",
            description: "",
            status: "pending",
            priority: "medium",
            due_date: "",
          });
        }}
        title="Add New Task"
        onSubmit={handleAddTask}
        submitting={false}
        maxWidth="lg"
      >
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
              Title <span className="text-secondary">*</span>
            </label>
            <input
              type="text"
              value={newTask.title || ""}
              onChange={(e) =>
                setNewTask({ ...newTask, title: e.target.value })
              }
              className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              placeholder="e.g. Follow up with client"
              required
            />
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
              Description
            </label>
            <textarea
              value={newTask.description || ""}
              onChange={(e) =>
                setNewTask({ ...newTask, description: e.target.value })
              }
              className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-none"
              rows={2}
              placeholder="Describe the task..."
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
              Status
            </label>
            <select
              value={newTask.status || "pending"}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  status: e.target.value as Task["status"],
                })
              }
              className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              <option value="pending">Pending</option>
              <option value="in_progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
              Priority
            </label>
            <select
              value={newTask.priority || "medium"}
              onChange={(e) =>
                setNewTask({
                  ...newTask,
                  priority: e.target.value as Task["priority"],
                })
              }
              className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </div>
          <div className="md:col-span-2">
            <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
              Due Date
            </label>
            <input
              type="date"
              value={newTask.due_date || ""}
              onChange={(e) =>
                setNewTask({ ...newTask, due_date: e.target.value })
              }
              className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
            />
          </div>
        </div>
      </FormModal>

      {/* ─── View Modal ───────────────────────────────────── */}
      {viewingTask && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-secondary/35 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-xl font-bold text-secondary">Task Details</h2>
              <button
                onClick={() => setViewingTask(null)}
                className="p-1.5 rounded-full hover:bg-secondary/[0.06] transition"
              >
                <X className="h-5 w-5 text-secondary/50" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider">
                  Title
                </p>
                <p className="text-lg font-semibold text-secondary">
                  {viewingTask.title}
                </p>
              </div>
              <div>
                <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider">
                  Description
                </p>
                <p className="text-secondary/75">
                  {viewingTask.description || "No description"}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider">
                    Status
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${statusConfig[viewingTask.status].color}`}
                  >
                    {statusConfig[viewingTask.status].icon}
                    {statusConfig[viewingTask.status].label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider">
                    Priority
                  </p>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${priorityConfig[viewingTask.priority].color}`}
                  >
                    {priorityConfig[viewingTask.priority].icon}
                    {priorityConfig[viewingTask.priority].label}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider">
                    Due Date
                  </p>
                  <p className="text-sm text-secondary/75">
                    {viewingTask.due_date}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold text-secondary/50 uppercase tracking-wider">
                    Created
                  </p>
                  <p className="text-sm text-secondary/75">
                    {new Date(viewingTask.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setViewingTask(null)}
                className="px-5 py-2 bg-secondary text-white rounded-xl text-sm font-bold hover:shadow-lg transition active:scale-95"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Edit Modal ───────────────────────────────────── */}
      {editingTask && (
        <FormModal
          isOpen={!!editingTask}
          onClose={() => {
            setEditingTask(null);
            setEditFormData({});
          }}
          title="Edit Task"
          onSubmit={handleUpdateTask}
          submitting={false}
          maxWidth="lg"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
                Title <span className="text-secondary">*</span>
              </label>
              <input
                type="text"
                value={editFormData.title || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, title: e.target.value })
                }
                className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
                required
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
                Description
              </label>
              <textarea
                value={editFormData.description || ""}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    description: e.target.value,
                  })
                }
                className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20 resize-none"
                rows={2}
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
                Status
              </label>
              <select
                value={editFormData.status || "pending"}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    status: e.target.value as Task["status"],
                  })
                }
                className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              >
                <option value="pending">Pending</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
                Priority
              </label>
              <select
                value={editFormData.priority || "medium"}
                onChange={(e) =>
                  setEditFormData({
                    ...editFormData,
                    priority: e.target.value as Task["priority"],
                  })
                }
                className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-secondary/50 uppercase tracking-wider mb-1.5">
                Due Date
              </label>
              <input
                type="date"
                value={editFormData.due_date || ""}
                onChange={(e) =>
                  setEditFormData({ ...editFormData, due_date: e.target.value })
                }
                className="w-full border-2 border-secondary/15 rounded-xl px-4 py-2.5 text-sm font-medium focus:outline-none focus:border-secondary focus:ring-2 focus:ring-secondary/20"
              />
            </div>
          </div>
        </FormModal>
      )}

      {/* ─── Delete Confirmation ──────────────────────────── */}
      <DeleteConfirmModal
        isOpen={!!deletingTask}
        title={deletingTask?.title || ""}
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletingTask(null)}
      />
    </div>
  );
}
