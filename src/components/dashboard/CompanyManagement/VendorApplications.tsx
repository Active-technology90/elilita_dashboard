// src/components/dashboard/CompanyManagement/VendorApplications.tsx
import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  FileCheck,
  Search,
  RefreshCw,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Building2,
  User,
  MapPin,
  ExternalLink,
  FileText,
  ShieldCheck,
  Send,
  Loader2,
  X,
  Percent,
  Calendar,
  Inbox,
  MessageSquare,
  Check,
  Copy,
  Phone,
  Mail,
  BriefcaseBusiness,
  Layers,
  FolderTree,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  getAdminVendorApplications,
  approveVendorApplication,
  requestVendorApplicationRevision,
  rejectVendorApplication,
  type VendorApplication,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { Toast } from "../../ui/Toast";
import { DataTable, type Column } from "../../ui/DataTable";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import PageHeader from "../../ui/PageHeader";
import { formatDate, formatDateTime } from "../../../utils/dateFormatter";

const STATUS_CONFIG: Record<
  string,
  {
    label: string;
    labelAm: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
  }
> = {
  pending: {
    label: "Pending Review",
    labelAm: "በግምገማ ላይ",
    bg: "bg-amber-50",
    text: "text-amber-800",
    border: "border-amber-200",
    dot: "bg-amber-500",
  },
  revision_requested: {
    label: "Revision Requested",
    labelAm: "ክለሳ ተጠይቋል",
    bg: "bg-blue-50",
    text: "text-blue-800",
    border: "border-blue-200",
    dot: "bg-blue-500",
  },
  approved: {
    label: "Approved & Live",
    labelAm: "ጸድቆ ስራ ላይ",
    bg: "bg-emerald-50",
    text: "text-emerald-800",
    border: "border-emerald-200",
    dot: "bg-emerald-500",
  },
  rejected: {
    label: "Rejected",
    labelAm: "ውድቅ ተደርጓል",
    bg: "bg-rose-50",
    text: "text-rose-800",
    border: "border-rose-200",
    dot: "bg-rose-500",
  },
};

const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
}> = ({ title, value, icon: Icon }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-5 hover:shadow-md transition-all hover:-translate-y-0.5"
  >
    <div className="flex items-center justify-between">
      <div className="min-w-0">
        <p className="text-[11px] sm:text-xs font-semibold uppercase tracking-wider text-gray-500 truncate">
          {title}
        </p>
        <p className="text-2xl sm:text-3xl font-bold text-gray-900 mt-1">
          {value}
        </p>
      </div>
      <div className="p-2.5 sm:p-3 rounded-xl bg-gradient-to-br shadow-sm shrink-0">
        <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-secondary" />
      </div>
    </div>
  </motion.div>
);

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};
const Card = ({
  children,
  title,
  titleKey,
  icon: Icon,
  className = "",
  t,
}: {
  children?: React.ReactNode;
  title?: string;
  titleKey?: string;
  icon: React.ElementType;
  className?: string;
  t?: (key: string) => string;
}) => {
  const translate = t ?? ((key: string) => key);

  return (
    <motion.div
      variants={itemVariants}
      className={`min-w-0 h-full rounded-2xl border border-purple-100/60 bg-white p-3 shadow-sm transition-all duration-200 hover:border-purple-200 hover:shadow-md sm:p-3 ${className}`}
    >
      <div className="mb-2 flex items-center gap-3 border-b border-gray-100 pb-2">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#6750A4]/10">
          <Icon className="h-4 w-4 text-[#6750A4]" />
        </div>

        <h4 className="min-w-0 text-sm font-bold text-gray-900">
          {titleKey ? translate(titleKey) : title}
        </h4>
      </div>

      {children}
    </motion.div>
  );
};
export default function VendorApplications(): React.JSX.Element {
  const { i18n } = useTranslation();
  const isAmharic = i18n.language?.startsWith("am");
  const tr = (en: string, am: string) => (isAmharic ? am : en);

  const { toast, showToast } = useToast();

  const [applications, setApplications] = useState<VendorApplication[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Selected for review modal
  const [selectedApp, setSelectedApp] = useState<VendorApplication | null>(null);

  // Review actions state
  const [actionTab, setActionTab] = useState<"approve" | "revision" | "reject">("approve");
  const [platformFee, setPlatformFee] = useState<string>("2.50");
  const [graceMonths, setGraceMonths] = useState<number>(3);
  const [adminNotes, setAdminNotes] = useState<string>("");
  const [revisionFeedback, setRevisionFeedback] = useState<string>("");
  const [rejectionReason, setRejectionReason] = useState<string>("");
  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Fetch applications
  const fetchApplications = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getAdminVendorApplications();
      const list = Array.isArray(res.data) ? res.data : (res.data as any)?.results || [];
      setApplications(list);
    } catch (err: any) {
      console.error("Failed to load vendor applications:", err);
      showToast(
        "error",
        tr("Failed to load vendor applications.", "የሻጭ ማመልከቻዎችን ማምጣት አልተቻለም።")
      );
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [statusFilter, searchTerm]);

  // Filtered applications
  const filteredApplications = useMemo(() => {
    return applications.filter((app) => {
      if (statusFilter !== "all" && app.status !== statusFilter) return false;
      if (searchTerm.trim()) {
        const q = searchTerm.toLowerCase().trim();
        return (
          app.reference_code?.toLowerCase().includes(q) ||
          app.name?.toLowerCase().includes(q) ||
          app.tin_number?.toLowerCase().includes(q) ||
          app.contact_name?.toLowerCase().includes(q) ||
          app.contact_email?.toLowerCase().includes(q)
        );
      }
      return true;
    });
  }, [applications, statusFilter, searchTerm]);

  const paginatedApplications = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredApplications.slice(start, start + pageSize);
  }, [filteredApplications, currentPage]);

  // Counts
  const counts = useMemo(
    () => ({
      all: applications.length,
      pending: applications.filter((a) => a.status === "pending").length,
      revision_requested: applications.filter((a) => a.status === "revision_requested").length,
      approved: applications.filter((a) => a.status === "approved").length,
      rejected: applications.filter((a) => a.status === "rejected").length,
    }),
    [applications]
  );

  // Open review modal
  const handleOpenReview = (app: VendorApplication) => {
    setSelectedApp(app);
    setActionTab("approve");
    setPlatformFee("2.50");
    setGraceMonths(3);
    setAdminNotes(app.admin_notes || "");
    setRevisionFeedback(app.revision_feedback || "");
    setRejectionReason("");
  };

  // Action: Approve & Promote
  const handleApprove = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      const res = await approveVendorApplication(selectedApp.id, {
        platform_fee_percent: platformFee,
        platform_fee_grace_period_months: graceMonths,
        admin_notes: adminNotes,
      });

      showToast(
        "success",
        res.data.message ||
          tr("Company approved and owner onboarding email sent!", "ኩባንያው ጸድቆ የባለቤት ማስጀመሪያ ኢሜይል ተልኳል!")
      );

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? {
                ...a,
                status: "approved",
                promoted_company_slug: res.data.company_slug,
                admin_notes: adminNotes,
              }
            : a
        )
      );
      setSelectedApp(null);
    } catch (err: any) {
      console.error("Approval error:", err);
      const msg =
        err.response?.data?.detail ||
        tr("Failed to approve application.", "ማመልከቻውን ማጽደቅ አልተቻለም።");
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Action: Request Revision
  const handleRequestRevision = async () => {
    if (!selectedApp) return;
    if (!revisionFeedback.trim()) {
      showToast(
        "error",
        tr("Please provide revision feedback instructions for the vendor.", "እባክዎ ለሻጩ የክለሳ መመሪያ ያቅርቡ።")
      );
      return;
    }
    try {
      setActionLoading(true);
      const res = await requestVendorApplicationRevision(selectedApp.id, {
        revision_feedback: revisionFeedback.trim(),
      });

      showToast(
        "success",
        res.data.message ||
          tr("Revision request email dispatched to applicant.", "የክለሳ ጥያቄ ኢሜይል ለአመልካቹ ተልኳል።")
      );

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? { ...a, status: "revision_requested", revision_feedback: revisionFeedback.trim() }
            : a
        )
      );
      setSelectedApp(null);
    } catch (err: any) {
      console.error("Revision request error:", err);
      const msg =
        err.response?.data?.detail || tr("Failed to request revision.", "ክለሳ መጠየቅ አልተቻለም።");
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };
const [copiedField, setCopiedField] = useState("");

const handleCopy = async (value: string, field: string) => {
  if (!value) return;

  try {
    await navigator.clipboard.writeText(value);
    setCopiedField(field);
    setTimeout(() => setCopiedField(""), 1500);
  } catch {
    console.error("Failed to copy text");
  }
};
  // Action: Reject
  const handleReject = async () => {
    if (!selectedApp) return;
    try {
      setActionLoading(true);
      const res = await rejectVendorApplication(selectedApp.id, {
        rejection_reason: rejectionReason.trim(),
      });

      showToast(
        "success",
        res.data.message ||
          tr("Application rejected and vendor notified.", "ማመልከቻው ውድቅ ተደርጓል፤ ሻጩም ተመልክቷል።")
      );

      setApplications((prev) =>
        prev.map((a) =>
          a.id === selectedApp.id
            ? {
                ...a,
                status: "rejected",
                admin_notes: rejectionReason.trim()
                  ? `${a.admin_notes || ""}\nRejection Reason: ${rejectionReason.trim()}`
                  : a.admin_notes,
              }
            : a
        )
      );
      setSelectedApp(null);
    } catch (err: any) {
      console.error("Rejection error:", err);
      const msg =
        err.response?.data?.detail ||
        tr("Failed to reject application.", "ማመልከቻውን ውድቅ ማድረግ አልተቻለም።");
      showToast("error", msg);
    } finally {
      setActionLoading(false);
    }
  };

  // Columns for DataTable
  const columns: Column<VendorApplication>[] = [
    {
      key: "reference_code",
      header: tr("Ref Code & Date", "ማጣቀሻ እና ቀን"),
      className: "whitespace-nowrap font-medium text-secondary",
      render: (app) => (
        <div>
          <div className="font-mono font-bold text-secondary">#{app.reference_code}</div>
          <div className="text-[11px] text-gray-400">
            {formatDate(app.created_at, i18n.language)}
          </div>
        </div>
      ),
    },
    {
      key: "name",
      header: tr("Business Name", "የንግድ ስም"),
      render: (app) => (
        <div className="min-w-[150px]">
          <div className="font-semibold text-gray-900 text-sm">{app.name}</div>
          {app.name_am && (
            <div className="text-[11px] text-gray-500 mt-0.5">{app.name_am}</div>
          )}
        </div>
      ),
    },
    {
      key: "category",
      header: tr("Category", "ምድብ"),
      render: (app) => (
        <div className="min-w-[130px]">
          <div className="font-medium text-gray-800 text-sm">
            {app.category_name || tr("Uncategorized", "ያልተመደበ")}
          </div>
          {app.sub_category_name && (
            <div className="text-[10px] text-gray-500 mt-0.5">{app.sub_category_name}</div>
          )}
        </div>
      ),
    },
    {
      key: "contact",
      header: tr("Applicant Contact", "የአመልካች እውቂያ"),
      render: (app) => (
        <div className="min-w-[150px]">
          <div className="font-medium text-gray-800 text-sm">{app.contact_name}</div>
          <div className="text-[11px] text-gray-400 mt-0.5">{app.contact_email}</div>
        </div>
      ),
    },
    {
      key: "tin_number",
      header: tr("TIN Number", "TIN ቁጥር"),
      className: "whitespace-nowrap font-mono text-sm text-gray-700",
      render: (app) => app.tin_number,
    },
    {
      key: "status",
      header: tr("Status", "ሁኔታ"),
      className: "whitespace-nowrap",
      render: (app) => {
        const cfg = STATUS_CONFIG[app.status] || STATUS_CONFIG.pending;
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
            {isAmharic ? cfg.labelAm : cfg.label}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: tr("Actions", "እርምጃዎች"),
      className: "whitespace-nowrap text-right",
      render: (app) => (
        <button
          type="button"
          onClick={() => handleOpenReview(app)}
          className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-white text-xs font-semibold shadow-sm hover:bg-secondary-light transition active:scale-95"
        >
          <Eye className="h-3.5 w-3.5" />
          {tr("Review KYC", "KYC ይገምግሙ")}
        </button>
      ),
    },
  ];

  const tabs: { id: string; label: string; labelAm: string }[] = [
    { id: "all", label: "All", labelAm: "ሁሉም" },
    { id: "pending", label: "Pending", labelAm: "በመጠባበቅ" },
    { id: "revision_requested", label: "Revisions", labelAm: "ክለሳዎች" },
    { id: "approved", label: "Approved", labelAm: "የጸደቁ" },
    { id: "rejected", label: "Rejected", labelAm: "የውድቅ የተደረጉ" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <Toast toast={toast} />

      <div className="w-full">
        <PageHeader
          title={tr("Vendor Self-Registration Requests", "የሻጭ ራስ-ምዝገባ ጥያቄዎች")}
          description={tr(
            "Review submitted Trade Licenses and compliance documents, request revisions, or approve & promote stores.",
            "የቀረቡ የንግድ ፈቃዶችን እና የተገዢነት ሰነዶችን ይገምግሙ፣ ክለሳ ይጠይቁ ወይም ሱቆችን ያጽድቁ እና ያስተዋውቁ።"
          )}
          icon={FileCheck}
          loading={loading && applications.length === 0}
          badge={
            counts.pending > 0 ? (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-[10px] font-semibold text-amber-800 sm:text-xs">
                <Clock className="h-3 w-3" />
                {counts.pending} {tr("Pending", "በመጠባበቅ")}
              </span>
            ) : undefined
          }
          actions={
            <button
              type="button"
              onClick={fetchApplications}
              disabled={loading}
              className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 disabled:opacity-60 sm:text-sm"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              <span>{tr("Refresh", "አድስ")}</span>
            </button>
          }
          actionMobile={
            <button
              type="button"
              onClick={fetchApplications}
              disabled={loading}
              className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-secondary px-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-secondary/90 disabled:opacity-60"
              title={tr("Refresh", "አድስ")}
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
            </button>
          }
          className="mb-5 sm:mb-6"
        />

        {/* Stat Cards */}
        <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title={tr("Total Requests", "ጠቅላላ ጥያቄዎች")}
            value={counts.all}
            icon={Inbox}
          />
          <StatCard
            title={tr("Pending Review", "በግምገማ ላይ")}
            value={counts.pending}
            icon={Clock}
          />
          <StatCard
            title={tr("Awaiting Revision", "ክለሳ የሚጠብቁ")}
            value={counts.revision_requested}
            icon={MessageSquare}
          />
          <StatCard
            title={tr("Approved & Live", "ጸድቀው ስራ ላይ")}
            value={counts.approved}
            icon={CheckCircle2}
          />
        </div>

        {/* Sticky Tabs + Search */}
        <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6">
          <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar flex-1">
                {tabs.map((tab) => {
                  const active = statusFilter === tab.id;
                  return (
                    <motion.button
                      key={tab.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => setStatusFilter(tab.id)}
                      className={`h-10 shrink-0 rounded-xl border px-3.5 text-xs font-semibold whitespace-nowrap transition ${
                        active
                          ? "border-secondary bg-secondary text-white shadow-sm"
                          : "border-secondary/15 bg-white text-secondary hover:bg-secondary/[0.05]"
                      }`}
                    >
                      {isAmharic ? tab.labelAm : tab.label}
                    </motion.button>
                  );
                })}
              </div>

              <div className="w-full shrink-0 sm:w-64">
                <SearchInput
                  value={searchTerm}
                  onChange={setSearchTerm}
                  placeholder={tr(
                    "Search Reference, Name, TIN...",
                    "በማጣቀሻ፣ ስም ወይም TIN ይፈልጉ..."
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        {/* DataTable */}
        <div className="rounded-xl border border-gray-200/80 shadow-sm overflow-hidden bg-white">
          <DataTable
            columns={columns}
            data={paginatedApplications}
            loading={loading}
            emptyMessage={
              searchTerm || statusFilter !== "all"
                ? tr(
                    "No vendor applications match your selected filter criteria.",
                    "ከመረጡት ማጣሪያ ጋር የሚዛመድ የሻጭ ማመልከቻ የለም።"
                  )
                : tr(
                    "No public vendor registration applications have been submitted yet.",
                    "እስካሁን የቀረበ የህዝብ ሻጭ ምዝገባ ማመልከቻ የለም።"
                  )
            }
          />

          {filteredApplications.length > pageSize && (
            <div className="border-t border-gray-100 p-3">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(filteredApplications.length / pageSize)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* FULL REVIEW MODAL */}
   
{selectedApp && (
  <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-950/65 p-2 backdrop-blur-sm sm:p-4">
    <div className="flex max-h-[95vh] w-full max-w-5xl flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">

      {/* HEADER */}
      <div className="relative shrink-0 overflow-hidden border-b border-gray-100 bg-secondary/20 px-4 py-4 sm:px-6">
        <div className="absolute inset-y-0 left-0 w-1 bg-[#6750A4]" />

        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#6750A4]/10 text-[#6750A4]">
              <Building2 className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="truncate text-base font-bold text-gray-900 sm:text-lg">
                  {selectedApp.name}
                </h3>

                <span className="rounded-md border border-gray-200 bg-gray-50 px-2 py-1 font-mono text-[10px] font-semibold text-gray-600">
                  {selectedApp.reference_code}
                </span>
              </div>

              <p className="mt-1 flex flex-wrap items-center gap-1.5 text-xs text-gray-500">
                <span>{tr("Submitted on", "የቀረበበት ቀን")}</span>
                <span className="text-gray-300">•</span>
                <span>{formatDateTime(selectedApp.created_at, i18n.language)}</span>
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <span
              className={`hidden items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-bold sm:inline-flex ${
                STATUS_CONFIG[selectedApp.status]?.bg
              } ${STATUS_CONFIG[selectedApp.status]?.text} ${
                STATUS_CONFIG[selectedApp.status]?.border
              }`}
            >
              <span
                className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selectedApp.status]?.dot}`}
              />
              {isAmharic
                ? STATUS_CONFIG[selectedApp.status]?.labelAm
                : STATUS_CONFIG[selectedApp.status]?.label}
            </span>

            <button
              type="button"
              onClick={() => setSelectedApp(null)}
              aria-label={tr("Close modal", "መስኮቱን ዝጋ")}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 text-gray-400 transition hover:border-gray-300 hover:bg-gray-50 hover:text-gray-700"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-3 flex sm:hidden">
          <span
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-bold ${
              STATUS_CONFIG[selectedApp.status]?.bg
            } ${STATUS_CONFIG[selectedApp.status]?.text} ${
              STATUS_CONFIG[selectedApp.status]?.border
            }`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${STATUS_CONFIG[selectedApp.status]?.dot}`}
            />
            {isAmharic
              ? STATUS_CONFIG[selectedApp.status]?.labelAm
              : STATUS_CONFIG[selectedApp.status]?.label}
          </span>
        </div>
      </div>

      {/* MODAL BODY */}
      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#F8F8FB] p-3 custom-scrollbar sm:p-6">

        {/* APPROVED BANNER */}
      {selectedApp.status === "approved" && (
  <div className="flex items-start gap-3 rounded-xl border border-purple-200 bg-purple-50/50 p-3">
    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white text-[#6750A4] shadow-sm">
      <CheckCircle2 className="h-5 w-5" />
    </div>

    <div className="min-w-0 flex-1">
      <div className="flex flex-wrap items-center gap-2">
        <p className="text-sm font-bold text-gray-900">
          {tr("Application Approved", "ማመልከቻው ጸድቋል")}
        </p>

        <span className="rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-semibold text-[#6750A4]">
          {tr("Approved", "ጸድቋል")}
        </span>
      </div>

      <p className="mt-1 text-xs leading-relaxed text-gray-600">
        {tr(
          "This company was verified, approved, and promoted to an active store.",
          "ይህ ኩባንያ ተረጋግጦ፣ ጸድቆ እና ንቁ ወደሆነ ሱቅ ተስተዋውቋል።"
        )}
      </p>

      {selectedApp.promoted_company_slug && (
        <div className="mt-2 flex flex-wrap items-center gap-2 rounded-lg border border-purple-100 bg-white px-2.5 py-2">
          <span className="text-[10px] font-medium text-gray-500">
            {tr("Active Company Slug", "የንቁ ኩባንያ Slug")}
          </span>

          <strong className="break-all font-mono text-xs font-semibold text-[#6750A4]">
            {selectedApp.promoted_company_slug}
          </strong>
        </div>
      )}
    </div>
  </div>
)}

        {/* REVISION BANNER */}
        {selectedApp.status === "revision_requested" && (
          <div className="flex items-start gap-3 rounded-xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-blue-900">
                {tr("Revision has been requested:", "ክለሳ ተጠይቋል፦")}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-blue-800">
                {selectedApp.revision_feedback}
              </p>
            </div>
          </div>
        )}

        {/* REJECTED BANNER */}
        {selectedApp.status === "rejected" && (
          <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-rose-100 text-rose-600">
              <XCircle className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-rose-900">
                {tr("This application was rejected.", "ይህ ማመልከቻ ውድቅ ተደርጓል።")}
              </p>
              {selectedApp.admin_notes && (
                <p className="mt-1 text-xs leading-relaxed text-rose-800">
                  {selectedApp.admin_notes}
                </p>
              )}
            </div>
          </div>
        )}

        {/* INFORMATION GRID */}
      {/* INFORMATION GRID */}
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">

  {/* BUSINESS PROFILE */}
{/* BUSINESS PROFILE */}
<Card
  title={tr("Business Profile", "የንግድ መገለጫ")}
  icon={Building2}
  className="h-full"
>
  <div className="space-y-3">

    {/* Business Name */}
    <div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/70 to-white p-3">
      <div className="flex items-start gap-2.5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#6750A4]/10 text-[#6750A4]">
          <Building2 className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <p className="mb-1 text-[10px] font-medium uppercase tracking-wide text-gray-500">
            {tr("Business Name", "የንግድ ስም")}
          </p>

          <h3 className="break-words text-sm font-bold text-gray-900">
            {selectedApp.name || "—"}
          </h3>

          {selectedApp.name_am && (
            <p className="mt-1 break-words text-xs font-medium text-gray-600">
              {selectedApp.name_am}
            </p>
          )}
        </div>
      </div>
    </div>

    {/* Business Information */}
    <div className="grid grid-cols-2 gap-2">

      {/* Category */}
      <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50/70 p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <Layers className="h-3.5 w-3.5 shrink-0 text-[#6750A4]" />
          <span className="text-[10px] text-gray-500">
            {tr("Category", "ምድብ")}
          </span>
        </div>

        <p className="break-words text-xs font-semibold text-gray-900">
          {selectedApp.category_name || tr("N/A", "የለም")}
        </p>
      </div>

      {/* Sub-Category */}
      <div className="min-w-0 rounded-lg border border-gray-100 bg-gray-50/70 p-2.5">
        <div className="mb-1.5 flex items-center gap-1.5">
          <FolderTree className="h-3.5 w-3.5 shrink-0 text-[#6750A4]" />
          <span className="text-[10px] text-gray-500">
            {tr("Sub-Category", "ንዑስ ምድብ")}
          </span>
        </div>

        <p className="break-words text-xs font-semibold text-gray-900">
          {selectedApp.sub_category_name || tr("N/A", "የለም")}
        </p>
      </div>

      {/* Operating Type */}
      <div className="col-span-2 flex items-center justify-between gap-2 rounded-lg border border-gray-100 bg-gray-50/70 px-3 py-2">
        <div className="flex items-center gap-2">
          <BriefcaseBusiness className="h-3.5 w-3.5 text-[#6750A4]" />
          <span className="text-xs text-gray-500">
            {tr("Operating Type", "የስራ አይነት")}
          </span>
        </div>

        <span className="rounded-full bg-purple-100 px-2.5 py-1 text-[10px] font-semibold capitalize text-[#6750A4]">
          {selectedApp.business_type || tr("N/A", "የለም")}
        </span>
      </div>
    </div>

    {/* Business Description */}
    {selectedApp.description && (
      <div className="rounded-lg border border-gray-100 p-3">
        <div className="mb-1.5 flex items-center gap-1.5">
          <FileText className="h-3.5 w-3.5 text-[#6750A4]" />
          <span className="text-[10px] font-bold uppercase tracking-wide text-gray-500">
            {tr("Overview", "አጠቃላይ እይታ")}
          </span>
        </div>

        <p className="text-xs leading-relaxed text-gray-700">
          {selectedApp.description}
        </p>
      </div>
    )}

  </div>
</Card>
  {/* APPLICANT & SIGNATORY */}
<Card
  title={tr("Applicant & Signatory", "አመልካች እና ፈራሚ")}
  icon={User}
  className="h-full"
>
  <div className="space-y-2">

 {/* Applicant Profile & Contact — One Section */}
{/* Applicant Profile */}
<div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/70 to-white p-2 shadow-sm">
  <div className="flex items-center gap-3">
    {/* Applicant Avatar */}
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6750A4]/15 text-2xl font-bold text-[#6750A4] ring-1 ring-purple-100">
      {selectedApp.contact_name?.charAt(0)?.toUpperCase() || "A"}
    </div>

    {/* Applicant Details */}
    <div className="min-w-0 flex-1 space-y-1">
      <p className="truncate text-lg font-bold leading-tight text-gray-900">
        {selectedApp.contact_name || "—"}
      </p>

      {/* Phone */}
      <div className="flex min-w-0 items-center gap-2">
        <Phone className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="text-xs text-gray-500">
          {tr("Phone", "ስልክ")}
        </span>
        <span className="truncate text-xs font-semibold text-gray-800">
          {selectedApp.contact_phone || "—"}
        </span>

        {selectedApp.contact_phone && (
          <button
            type="button"
            onClick={() =>
              handleCopy(selectedApp.contact_phone || "", "phone")
            }
            title={tr("Copy phone", "ስልክ ቅዳ")}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-gray-400 transition hover:bg-purple-100 hover:text-[#6750A4]"
          >
            {copiedField === "phone" ? (
              <Check className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <Copy className="h-3.5 w-3.5" />
            )}
          </button>
        )}
      </div>

      {/* Email */}
      <div className="flex min-w-0 items-center gap-2">
        <Mail className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="text-xs text-gray-500">
          {tr("Email", "ኢሜይል")}
        </span>
        <span className="truncate text-xs font-medium text-gray-700">
          {selectedApp.contact_email || "—"}
        </span>
      </div>
    </div>
  </div>
</div>

{/* Authorized Signatory */}
<div className="rounded-xl border border-purple-100 bg-gradient-to-r from-purple-50/70 to-white p-2 shadow-sm">
  <div className="flex items-center gap-3">
    {/* Signatory Avatar */}
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#6750A4]/15 text-2xl font-bold text-[#6750A4] ring-1 ring-purple-100">
      {(selectedApp.terms_signatory_name || selectedApp.contact_name)
        ?.charAt(0)
        ?.toUpperCase() || "A"}
    </div>

    {/* Signatory Details */}
    <div className="min-w-0 flex-1 space-y-1">
      <p className="truncate text-lg font-bold leading-tight text-gray-900">
        {selectedApp.terms_signatory_name || selectedApp.contact_name || "—"}
      </p>

      <div className="flex min-w-0 items-center gap-2">
        <ShieldCheck className="h-4 w-4 shrink-0 text-gray-400" />
        <span className="text-xs text-gray-500">
          {tr("Title", "ማዕረግ")}
        </span>
        <span className="truncate text-xs font-semibold text-gray-800">
          {selectedApp.terms_signatory_role || tr("Owner", "ባለቤት")}
        </span>
      </div>

      <p className="text-[10px] font-medium text-gray-400">
        {tr("Authorized Signatory", "ስልጣን ያለው ፈራሚ")}
      </p>
    </div>
  </div>
</div>

    {/* Terms Agreement */}
    <div className="flex flex-wrap items-center justify-between gap-1.5 rounded-md bg-emerald-50 px-2.5 py-2">
      <span className="text-[10px] font-medium text-gray-600">
        {tr("Terms Agreed", "ውሎች ተስማምተዋል")}
      </span>

      <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        {tr("Agreed on", "የተስማሙበት")}{" "}
        {formatDate(selectedApp.created_at, i18n.language)}
      </span>
    </div>

  </div>
</Card>
  {/* LOCATION & GPS */}
  <Card
    title={tr("Location & GPS Pin", "አካባቢ እና GPS ፒን")}
    icon={MapPin}
    t={tr}
    className="h-full"
  >
    <div className="space-y-3 text-xs">
      <div>
        <span className="mb-2 block text-gray-500">
          {tr("Premise Address", "የግቢ አድራሻ")}
        </span>
        <p className="rounded-lg border border-gray-100 bg-gray-50 p-3 leading-relaxed text-gray-800">
          {selectedApp.address}
        </p>
      </div>

      {selectedApp.latitude && selectedApp.longitude && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-100 bg-gray-50 p-3">
          <div>
            <span className="mb-1 block text-[10px] text-gray-400">
              {tr("GPS Coordinates", "GPS መጋጠሚያዎች")}
            </span>
            <span className="font-mono text-xs font-semibold text-gray-700">
              {selectedApp.latitude}, {selectedApp.longitude}
            </span>
          </div>

          <a
            href={`https://www.google.com/maps?q=${selectedApp.latitude},${selectedApp.longitude}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#6750A4]/10 px-3 py-2 text-[11px] font-bold text-[#6750A4] transition hover:bg-[#6750A4]/15"
          >
            <MapPin className="h-3.5 w-3.5" />
            {tr("Open Map", "ካርታ ክፈት")}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  </Card>

  {/* ERCA TAX */}
  <Card
    title={tr("ERCA Tax Compliance", "የERCA ግብር ተገዢነት")}
    icon={ShieldCheck}
    t={tr}
    className="h-full"
  >
    <div className="space-y-3 text-xs">
      <div className="flex justify-between gap-4">
        <span className="text-gray-500">
          {tr("TIN Number", "TIN ቁጥር")}
        </span>
        <span className="font-mono font-bold text-gray-900">
          {selectedApp.tin_number}
        </span>
      </div>

      <div className="flex justify-between gap-4">
        <span className="text-gray-500">
          {tr("Tax Type", "የግብር አይነት")}
        </span>
        <span className="font-semibold capitalize text-gray-800">
          {selectedApp.tax_type?.replace("_", " ")}
        </span>
      </div>

      {selectedApp.vat_registration_number && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">
            {tr("VAT Number", "የVAT ቁጥር")}
          </span>
          <span className="font-mono text-gray-800">
            {selectedApp.vat_registration_number}
          </span>
        </div>
      )}

      {selectedApp.fan_number && (
        <div className="flex justify-between gap-4">
          <span className="text-gray-500">
            {tr("FAN Number", "የFAN ቁጥር")}
          </span>
          <span className="font-mono text-gray-800">
            {selectedApp.fan_number}
          </span>
        </div>
      )}
    </div>
  </Card>
</div>
        {/* KYC DOCUMENTS */}
        <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm sm:p-5">
          <div className="mb-4 flex items-center justify-between gap-3 border-b border-gray-100 pb-3">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6750A4]/10 text-[#6750A4]">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-gray-900">
                  {tr("KYC Verification Documents", "የKYC ማረጋገጫ ሰነዶች")}
                </h4>
                <p className="mt-0.5 text-[10px] text-gray-400">
                  {tr("Review the submitted company documents", "የቀረቡትን የኩባንያ ሰነዶች ይመርምሩ")}
                </p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {/* TRADE LICENSE */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3 transition hover:border-gray-300">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-600">
                  <FileCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900">
                    {tr("Trade License", "የንግድ ፈቃድ")}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {tr("Required KYC Document", "አስፈላጊ የKYC ሰነድ")}
                  </p>
                </div>
              </div>

              {selectedApp.license_file ? (
                <a
                  href={selectedApp.license_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#6750A4] px-3 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-[#57418F]"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {tr("View", "ተመልከት")}
                </a>
              ) : (
                <span className="shrink-0 rounded-lg bg-rose-50 px-2.5 py-1.5 text-[10px] font-bold text-rose-600">
                  {tr("Not Uploaded", "አልተሰቀለም")}
                </span>
              )}
            </div>

            {/* MOA */}
            <div className="flex items-center justify-between gap-3 rounded-xl border border-gray-200 bg-gray-50/70 p-3 transition hover:border-gray-300">
              <div className="flex min-w-0 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                  <FileText className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-gray-900">
                    {tr("Memorandum of Association (MOA)", "የማህበር ማቋቋሚያ ሰነድ (MOA)")}
                  </p>
                  <p className="mt-1 text-[10px] text-gray-500">
                    {tr("PLC Legal Structure Document", "የPLC ህጋዊ መዋቅር ሰነድ")}
                  </p>
                </div>
              </div>

              {selectedApp.moa_file ? (
                <a
                  href={selectedApp.moa_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-gray-800 px-3 py-2 text-[11px] font-bold text-white shadow-sm transition hover:bg-gray-900"
                >
                  <Eye className="h-3.5 w-3.5" />
                  {tr("View", "ተመልከት")}
                </a>
              ) : (
                <span className="shrink-0 rounded-lg bg-gray-100 px-2.5 py-1.5 text-[10px] font-semibold text-gray-500">
                  {tr("Optional · Not Uploaded", "አማራጭ · አልተሰቀለም")}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* SUPERADMIN DECISION CONTROLS */}
        {selectedApp.status !== "approved" && (
          <div className="overflow-hidden rounded-xl border border-[#6750A4]/20 bg-white shadow-sm">

            {/* ACTION HEADER */}
            <div className="border-b border-gray-100 bg-[#6750A4]/[0.035] p-4 sm:p-5">
              <div className="flex flex-col gap-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#6750A4]/10 text-[#6750A4]">
                    <ShieldCheck className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">
                      {tr("Superadmin Verification Action", "የሱፐር አድሚን ማረጋገጫ እርምጃ")}
                    </h4>
                    <p className="mt-0.5 text-[10px] text-gray-500">
                      {tr("Choose an action for this application", "ለዚህ ማመልከቻ እርምጃ ይምረጡ")}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-2 rounded-xl bg-gray-100 p-1">
                  <button
                    type="button"
                    onClick={() => setActionTab("approve")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] font-bold transition-all sm:text-xs ${
                      actionTab === "approve"
                        ? "bg-emerald-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    {tr("Approve", "አጽድቅ")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionTab("revision")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] font-bold transition-all sm:text-xs ${
                      actionTab === "revision"
                        ? "bg-blue-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    <AlertTriangle className="h-3.5 w-3.5" />
                    {tr("Revision", "ክለሳ")}
                  </button>

                  <button
                    type="button"
                    onClick={() => setActionTab("reject")}
                    className={`flex items-center justify-center gap-1.5 rounded-lg px-2 py-2.5 text-[10px] font-bold transition-all sm:text-xs ${
                      actionTab === "reject"
                        ? "bg-rose-600 text-white shadow-sm"
                        : "text-gray-600 hover:bg-white hover:text-gray-900"
                    }`}
                  >
                    <XCircle className="h-3.5 w-3.5" />
                    {tr("Reject", "ውድቅ")}
                  </button>
                </div>
              </div>
            </div>

            {/* APPROVE */}
            {actionTab === "approve" && (
              <div className="space-y-4 p-4 sm:p-5">
                <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-3">
                  <p className="text-xs leading-relaxed text-emerald-900">
                    {tr(
                      "Approving this request will create an active Company entity, seed starter subscriptions, assign",
                      "ይህን ጥያቄ ማጽደቅ ንቁ የኩባንያ አካል ይፈጥራል፣ የመጀመሪያ ምዝገባዎችን ይዘራል፣ እና"
                    )}{" "}
                    <strong className="font-bold">{selectedApp.contact_email}</strong>{" "}
                    {tr(
                      "as owner, and send them a secure 48-hour password setup email.",
                      "እንደ ባለቤት ይመድባል፣ ከዚያም የ48 ሰዓት የይለፍ ቃል ማዋቀሪያ ኢሜይል ይልካል።"
                    )}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-[11px] font-bold text-gray-700">
                      {tr("Platform Fee Commission (%)", "የመድረክ ክፍያ ኮሚሽን (%)")}
                    </label>
                    <div className="relative">
                      <Percent className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        step="0.01"
                        value={platformFee}
                        onChange={(e) => setPlatformFee(e.target.value)}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-gray-900 outline-none transition focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-[11px] font-bold text-gray-700">
                      {tr("Promotional Grace Period (Months)", "የማስተዋወቂያ ነፃ ጊዜ (በወራት)")}
                    </label>
                    <div className="relative">
                      <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                      <input
                        type="number"
                        min="0"
                        value={graceMonths}
                        onChange={(e) => setGraceMonths(Number(e.target.value) || 0)}
                        className="w-full rounded-lg border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-xs font-semibold text-gray-900 outline-none transition focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/10"
                      />
                    </div>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="mb-2 block text-[11px] font-bold text-gray-700">
                      {tr("Internal Approval Notes (Optional)", "የውስጥ የማጽደቅ ማስታወሻ (አማራጭ)")}
                    </label>
                    <textarea
                      rows={3}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder={tr(
                        "e.g. License verified against ERCA registry, valid until Dec 2027",
                        "ለምሳሌ፦ ፈቃዱ ከERCA መዝገብ ጋር ተረጋግጧል፣ እስከ ታህሳስ 2027 ድረስ የሚሰራ"
                      )}
                      className="w-full resize-y rounded-lg border border-gray-200 bg-white px-3 py-2.5 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-[#6750A4] focus:ring-2 focus:ring-[#6750A4]/10"
                    />
                  </div>
                </div>

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={actionLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-emerald-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CheckCircle2 className="h-4 w-4" />
                    )}
                    {tr("Approve Company & Send 48h Invitation", "ኩባንያውን አጽድቅ እና የ48 ሰዓት ግብዣ ላክ")}
                  </button>
                </div>
              </div>
            )}

            {/* REQUEST REVISION */}
            {actionTab === "revision" && (
              <div className="space-y-4 p-4 sm:p-5">
                <div className="rounded-lg border border-blue-100 bg-blue-50/70 p-3">
                  <p className="text-xs leading-relaxed text-blue-900">
                    {tr("An email will be dispatched to", "ኢሜይል ይላካል ወደ")}{" "}
                    <strong>{selectedApp.contact_email}</strong>{" "}
                    {tr(
                      "with your feedback requesting document re-upload or clarification.",
                      "ከእርስዎ አስተያየት ጋር ሰነድ እንደገና እንዲሰቀል ወይም ማብራሪያ እንዲሰጥ ይጠይቃል።"
                    )}
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold text-gray-700">
                    {tr("Revision Instructions / Feedback", "የክለሳ መመሪያ / አስተያየት")}{" "}
                    <span className="text-rose-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={revisionFeedback}
                    onChange={(e) => setRevisionFeedback(e.target.value)}
                    placeholder={tr(
                      "e.g. Please provide a clear, color scan of your renewed Trade License; the current upload is cut off.",
                      "ለምሳሌ፦ እባክዎ የታደሰ የንግድ ፈቃድዎን ግልጽ የቀለም ስካን ያቅርቡ፤ የአሁኑ ጭነት ተቆርጧል።"
                    )}
                    className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10"
                  />
                </div>

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={handleRequestRevision}
                    disabled={actionLoading || !revisionFeedback.trim()}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                    {tr("Send Revision Email", "የክለሳ ኢሜይል ላክ")}
                  </button>
                </div>
              </div>
            )}

            {/* REJECT */}
            {actionTab === "reject" && (
              <div className="space-y-4 p-4 sm:p-5">
                <div className="rounded-lg border border-rose-100 bg-rose-50/70 p-3">
                  <p className="text-xs leading-relaxed text-rose-900">
                    {tr(
                      "Reject this application. An email notification will be dispatched to",
                      "ይህን ማመልከቻ ውድቅ ያድርጉ። የኢሜይል ማሳወቂያ ይላካል ወደ"
                    )}{" "}
                    <strong>{selectedApp.contact_email}</strong>.
                  </p>
                </div>

                <div>
                  <label className="mb-2 block text-[11px] font-bold text-gray-700">
                    {tr("Rejection Reason (Optional)", "የውድቅ ምክንያት (አማራጭ)")}
                  </label>
                  <textarea
                    rows={4}
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder={tr(
                      "e.g. Ineligible business category under our platform terms.",
                      "ለምሳሌ፦ በመድረካችን ውሎች መሰረት ብቁ ያልሆነ የንግድ ምድብ።"
                    )}
                    className="w-full resize-y rounded-lg border border-gray-200 px-3 py-2.5 text-xs text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-rose-500 focus:ring-2 focus:ring-rose-500/10"
                  />
                </div>

                <div className="flex justify-end border-t border-gray-100 pt-4">
                  <button
                    type="button"
                    onClick={handleReject}
                    disabled={actionLoading}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-rose-600 px-5 py-3 text-xs font-bold text-white shadow-sm transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                  >
                    {actionLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <XCircle className="h-4 w-4" />
                    )}
                    {tr("Confirm Rejection", "ውድቅ መደረጉን አረጋግጥ")}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {/* STICKY FOOTER */}
      <div className="flex shrink-0 flex-col-reverse gap-3 border-t border-gray-200 bg-white px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="hidden items-center gap-2 text-[10px] text-gray-400 sm:flex">
          <span className="rounded bg-gray-100 px-2 py-1 font-semibold text-gray-500">
            ID #{selectedApp.id}
          </span>
          <span>{tr("Reference:", "ማጣቀሻ፦")}</span>
          <span className="font-mono font-semibold text-gray-600">
            {selectedApp.reference_code}
          </span>
        </p>

        <button
          type="button"
          onClick={() => setSelectedApp(null)}
          className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-gray-200 bg-white px-5 py-2.5 text-xs font-bold text-gray-700 transition hover:border-gray-300 hover:bg-gray-50 sm:w-auto"
        >
          <X className="h-3.5 w-3.5" />
          {tr("Close", "ዝጋ")}
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}