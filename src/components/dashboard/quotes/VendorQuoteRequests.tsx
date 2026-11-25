
import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Package,
  Send,
  Eye,
  RefreshCw,
  Phone,
  MapPin,
  X,
  Loader2,
  Repeat,
  Inbox,
  Clock,
  MessageSquare,
  CheckCircle2,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import {
  getQuoteRequests,
  submitVendorQuote,
  rejectQuoteRequest,
} from "../../../services/api";
import type {
  ProductQuoteRequest,
  QuoteStatus,
  VendorSubmitQuotePayload,
} from "../../../types";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useReadOnly } from "../AdminDashboard";
import { DataTable, type Column } from "../../ui/DataTable";
import { Pagination } from "../../ui/Pagination";
import { SearchInput } from "../../ui/SearchInput";
import PageHeader from "../../ui/PageHeader";
import toast from "react-hot-toast";
import { CompanySelector } from "../company-products/CompanySelector";
import { useAuth } from "../../../context/authContext";
import { useCompaniesList } from "../../../hooks/useCompaniesList";
import { formatCurrency } from "../../../utils/currency";

const STATUS_CONFIG: Record<
  QuoteStatus,
  {
    label: string;
    labelAm: string;
    bg: string;
    text: string;
    border: string;
  }
> = {
  pending: {
    label: "Pending Quote",
    labelAm: "ዋጋ የሚጠብቅ",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  quoted: {
    label: "Quote Sent",
    labelAm: "ዋጋ ተልኳል",
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
  },
  accepted: {
    label: "Accepted",
    labelAm: "ተቀባይነት አግኝቷል",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  converted: {
    label: "Converted to Order",
    labelAm: "ወደ ትዕዛዝ ተቀይሯል",
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
  },
  rejected: {
    label: "Declined",
    labelAm: "ውድቅ ተደርጓል",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  expired: {
    label: "Expired",
    labelAm: "ጊዜው አልፏል",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
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

export default function VendorQuoteRequests() {
  const { i18n } = useTranslation("dashboard");
  const { t } = useTranslation("product");

  const isAmharic = i18n.language?.startsWith("am");

  const tr = (en: string, am: string) => (isAmharic ? am : en);

  const { user } = useAuth();
  const readOnly = useReadOnly();

  const { company, switchCompany, clearCompany } =
    useCurrentCompany();

  const {
    companies,
    isLoading: isLoadingCompanies,
  } = useCompaniesList();

  const companySlug = company?.slug ?? null;
  const isSuperAdmin = !user?.memberships?.length;
  const showSelector = isSuperAdmin && !companySlug;

  const [activeTab, setActiveTab] = useState<"all" | QuoteStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const pageSize = 10;

  const [loading, setLoading] = useState(true);
  const [quoteList, setQuoteList] = useState<ProductQuoteRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  const [selectedQuoteForAction, setSelectedQuoteForAction] =
    useState<ProductQuoteRequest | null>(null);

  const [detailQuote, setDetailQuote] =
    useState<ProductQuoteRequest | null>(null);

  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [rejectingQuoteId, setRejectingQuoteId] =
    useState<number | null>(null);

  const [quotePrice, setQuotePrice] = useState("");
  const [leadTimeDays, setLeadTimeDays] = useState("5");
  const [validityHours, setValidityHours] = useState("72");
  const [vendorNotes, setVendorNotes] = useState("");

  const getStatusConfig = (status: QuoteStatus) =>
    STATUS_CONFIG[status] || STATUS_CONFIG.pending;

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 350);

    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchQuotes = useCallback(
    async (page: number = currentPage) => {
      setLoading(true);

      try {
        const params: any = {
          page,
          page_size: pageSize,
          scope: "vendor",
        };

        if (company?.slug) {
          params.company_slug = company.slug;
        }

        if (activeTab !== "all") {
          params.status = activeTab;
        }

        if (debouncedSearch) {
          params.search = debouncedSearch;
        }

        const res = await getQuoteRequests(params);

        if (res.data) {
          setQuoteList(res.data.results || []);
          setTotalCount(res.data.count || 0);
        }
      } catch (err: any) {
        console.error("Failed to load quote requests:", err);

        toast.error(
          tr(
            "Failed to load price quote requests.",
            "የዋጋ ጥያቄዎችን ማምጣት አልተቻለም።",
          ),
        );
      } finally {
        setLoading(false);
      }
    },
    [currentPage, company?.slug, activeTab, debouncedSearch, isAmharic],
  );

  useEffect(() => {
    fetchQuotes(currentPage);
  }, [fetchQuotes, currentPage]);

  const handleOpenSubmitModal = (quote: ProductQuoteRequest) => {
    setSelectedQuoteForAction(quote);
    setQuotePrice(quote.quoted_price || "");

    setLeadTimeDays(
      quote.quoted_lead_time_days
        ? String(quote.quoted_lead_time_days)
        : "5",
    );

    setValidityHours("72");
    setVendorNotes(quote.vendor_notes || "");
  };

  const handleCloseSubmitModal = () => {
    setSelectedQuoteForAction(null);
    setQuotePrice("");
    setLeadTimeDays("5");
    setValidityHours("72");
    setVendorNotes("");
  };

  const handleSubmitQuote = async () => {
    if (!selectedQuoteForAction) return;

    const priceNum = parseFloat(quotePrice);

    if (isNaN(priceNum) || priceNum <= 0) {
      toast.error(
        tr(
          "Please enter a valid positive quote price.",
          "እባክዎ ከዜሮ በላይ የሆነ ትክክለኛ ዋጋ ያስገቡ።",
        ),
      );
      return;
    }

    setSubmittingQuote(true);

    try {
      const payload: VendorSubmitQuotePayload = {
        quoted_price: priceNum,
        quoted_lead_time_days: parseInt(leadTimeDays) || 5,
        validity_hours: parseInt(validityHours) || 72,
        vendor_notes: vendorNotes.trim(),
      };

      await submitVendorQuote(selectedQuoteForAction.id, payload);

      toast.success(
        tr(
          "Proforma quote submitted to customer successfully!",
          "የዋጋ ፕሮፎርማው ለደንበኛው በተሳካ ሁኔታ ተልኳል!",
        ),
      );

      handleCloseSubmitModal();
      fetchQuotes(currentPage);
    } catch (err: any) {
      console.error("Failed to submit quote:", err);

      toast.error(
        err.response?.data?.detail ||
          tr(
            "Failed to submit proforma quote.",
            "የዋጋ ፕሮፎርማውን መላክ አልተቻለም።",
          ),
      );
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleReject = async (quoteId: number) => {
    if (
      !window.confirm(
        tr(
          "Are you sure you want to decline this quote request?",
          "ይህን የዋጋ ጥያቄ ውድቅ ማድረግ ይፈልጋሉ?",
        ),
      )
    ) {
      return;
    }

    setRejectingQuoteId(quoteId);

    try {
      await rejectQuoteRequest(quoteId);

      toast.success(
        tr(
          "Quote request declined.",
          "የዋጋ ጥያቄው ውድቅ ተደርጓል።",
        ),
      );

      fetchQuotes(currentPage);
    } catch (err: any) {
      console.error("Failed to decline quote:", err);

      toast.error(
        tr(
          "Failed to decline quote request.",
          "የዋጋ ጥያቄውን ውድቅ ማድረግ አልተቻለም።",
        ),
      );
    } finally {
      setRejectingQuoteId(null);
    }
  };

  const pendingCount = useMemo(
    () => quoteList.filter((q) => q.status === "pending").length,
    [quoteList],
  );

  const quotedCount = useMemo(
    () => quoteList.filter((q) => q.status === "quoted").length,
    [quoteList],
  );

  const convertedCount = useMemo(
    () => quoteList.filter((q) => q.status === "converted").length,
    [quoteList],
  );

  if (showSelector) {
    return (
      <CompanySelector
        companies={companies}
        isLoading={isLoadingCompanies}
        title={t("companySelector.title")}
        subtitle={t("companySelector.subtitle")}
        searchPlaceholder={t("companySelector.searchPlaceholder")}
        onSelect={(slug, name) => {
          const membership = user?.memberships?.find(
            (m: any) => m.company_slug === slug,
          );

          const role =
            membership?.role ?? (isSuperAdmin ? "admin" : "staff");

          switchCompany({ slug, name, role });
        }}
        onBack={clearCompany}
      />
    );
  }

  const columns: Column<ProductQuoteRequest>[] = [
    {
      key: "id",
      header: tr("ID & Date", "መለያ ቁጥር እና ቀን"),
      className: "whitespace-nowrap font-medium text-secondary",
      render: (quote) => (
        <div>
          <div className="font-bold text-secondary">#{quote.id}</div>
          <div className="text-[11px] text-gray-400">
            {new Date(quote.created_at).toLocaleDateString(
              isAmharic ? "am-ET" : "en-US",
              {
                month: "short",
                day: "numeric",
                year: "numeric",
              },
            )}
          </div>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: tr("Customer", "ደንበኛ"),
      render: (quote) => (
        <div className="min-w-[130px]">
          <div className="font-semibold text-gray-900 text-sm">
            {quote.customer_name || `User #${quote.customer}`}
          </div>
          {quote.customer_phone && (
            <div className="flex items-center gap-1 text-[11px] text-gray-500 mt-0.5">
              <Phone className="h-3 w-3 text-gray-400" />
              <span>{quote.customer_phone}</span>
            </div>
          )}
        </div>
      ),
    },
    {
      key: "product_title",
      header: tr("Product & Qty", "ምርት እና ብዛት"),
      render: (quote) => (
        <div className="flex items-center gap-2.5 min-w-[200px]">
          {quote.product_primary_image ? (
            <img
              src={quote.product_primary_image}
              alt=""
              className="h-10 w-10 rounded-lg object-cover border border-gray-100 shrink-0"
            />
          ) : (
            <div className="h-10 w-10 rounded-lg bg-gray-100 flex items-center justify-center shrink-0">
              <Package className="h-5 w-5 text-gray-400" />
            </div>
          )}
          <div className="min-w-0">
            <div className="font-semibold text-gray-900 text-sm truncate max-w-[220px]">
              {quote.product_title ||
                tr("Custom Product", "በተለየ ጥያቄ የተዘጋጀ ምርት")}
            </div>
            <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-secondary/10 text-[10px] font-semibold text-secondary">
              <span>
                {tr("Qty:", "ብዛት:")} {quote.requested_qty}
              </span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "specs",
      header: tr("Specifications", "የምርት መስፈርቶች"),
      render: (quote) => {
        const specEntries = Object.entries(quote.specs || {});

        if (specEntries.length === 0 && !quote.customer_notes) {
          return <span className="text-xs text-gray-400">—</span>;
        }

        return (
          <div className="max-w-[220px] text-xs">
            {specEntries.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-1">
                {specEntries.slice(0, 3).map(([key, val]) => (
                  <span
                    key={key}
                    className="inline-block px-1.5 py-0.5 rounded bg-gray-100 text-[10px] text-gray-700 font-medium"
                  >
                    <strong>{key}:</strong> {String(val)}
                  </span>
                ))}
                {specEntries.length > 3 && (
                  <span className="text-[10px] text-gray-400">
                    +{specEntries.length - 3} {tr("more", "ተጨማሪ")}
                  </span>
                )}
              </div>
            )}
            {quote.customer_notes && (
              <p
                className="text-[11px] text-gray-500 italic truncate"
                title={quote.customer_notes}
              >
                "{quote.customer_notes}"
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: tr("Status", "ሁኔታ"),
      className: "whitespace-nowrap",
      render: (quote) => {
        const cfg = getStatusConfig(quote.status);

        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold border ${cfg.bg} ${cfg.text} ${cfg.border}`}
          >
            <span
              className={`h-1.5 w-1.5 rounded-full ${
                quote.status === "pending"
                  ? "bg-amber-500 animate-pulse"
                  : quote.status === "quoted"
                    ? "bg-blue-500"
                    : quote.status === "converted"
                      ? "bg-emerald-500"
                      : "bg-gray-400"
              }`}
            />
            {isAmharic ? cfg.labelAm : cfg.label}
          </span>
        );
      },
    },
    {
      key: "quoted_price",
      header: tr("Quoted Offer", "የቀረበ ዋጋ"),
      className: "whitespace-nowrap",
      render: (quote) => {
        if (!quote.quoted_price) {
          return (
            <span className="text-xs text-gray-400 italic">
              {tr("Not quoted yet", "ዋጋ ገና አልቀረበም")}
            </span>
          );
        }

        return (
          <div>
            <div className="font-bold text-secondary text-sm">
              {formatCurrency(parseFloat(quote.quoted_price))}
            </div>
            {quote.quoted_lead_time_days && (
              <div className="text-[10px] text-gray-500 font-medium">
                {isAmharic
                  ? `የማምረቻ ጊዜ: ${quote.quoted_lead_time_days} ቀናት`
                  : `Lead time: ${quote.quoted_lead_time_days} days`}
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: tr("Actions", "እርምጃዎች"),
      className: "whitespace-nowrap text-right",
      render: (quote) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setDetailQuote(quote)}
            title={tr("View Details", "ዝርዝር መረጃ ይመልከቱ")}
            aria-label={tr("View Details", "ዝርዝር መረጃ ይመልከቱ")}
            className="p-1.5 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 hover:text-secondary transition"
          >
            <Eye className="h-4 w-4" />
          </button>

          {quote.status === "pending" && !readOnly && (
            <>
              <button
                type="button"
                onClick={() => handleOpenSubmitModal(quote)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-secondary text-white text-xs font-semibold shadow-sm hover:bg-secondary-light transition active:scale-95"
              >
                <Send className="h-3.5 w-3.5" />
                <span>{tr("Send Quote", "ዋጋ ላክ")}</span>
              </button>

              <button
                type="button"
                disabled={rejectingQuoteId === quote.id}
                onClick={() => handleReject(quote.id)}
                title={tr("Decline Inquiry", "ጥያቄውን ውድቅ አድርግ")}
                aria-label={tr("Decline Inquiry", "ጥያቄውን ውድቅ አድርግ")}
                className="p-1.5 rounded-lg border border-rose-200 text-rose-600 hover:bg-rose-50 transition"
              >
                {rejectingQuoteId === quote.id ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <X className="h-4 w-4" />
                )}
              </button>
            </>
          )}

          {quote.status === "quoted" && !readOnly && (
            <button
              type="button"
              onClick={() => handleOpenSubmitModal(quote)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-blue-200 text-blue-700 hover:bg-blue-50 text-xs font-semibold transition"
            >
              <span>{tr("Edit Offer", "ዋጋውን አስተካክል")}</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  const tabs: {
    id: "all" | QuoteStatus;
    label: string;
    labelAm: string;
  }[] = [
    { id: "all", label: "All", labelAm: "ሁሉም" },
    { id: "pending", label: "Pending", labelAm: "ምላሽ የሚጠብቁ" },
    { id: "quoted", label: "Quoted", labelAm: "ዋጋ የተላከላቸው" },
    { id: "converted", label: "Converted", labelAm: "ወደ ትዕዛዝ የተቀየሩ" },
    { id: "rejected", label: "Declined", labelAm: "ውድቅ የተደረጉ" },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <div className="w-full">
        <PageHeader
          title={tr(
            "Price Quotes & Proformas",
            "የዋጋ ጥያቄዎች እና ፕሮፎርማዎች",
          )}
          description={tr(
            "Review custom specifications from customers and issue professional proforma quotes.",
            "ደንበኞች ያቀረቡትን የምርት መስፈርቶች ይመልከቱ፣ ዋጋ ያስሉ እና ፕሮፎርማ ይላኩ።",
          )}
          icon={FileText}
          loading={loading && quoteList.length === 0}
          badge={
            readOnly ? (
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 sm:text-xs">
                {tr("View only", "ለእይታ ብቻ")}
              </span>
            ) : undefined
          }
          actions={
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-secondary shadow-sm transition hover:border-secondary/30 hover:bg-secondary/5 sm:text-sm"
                  title={tr("Switch Company", "ኩባንያ ቀይር")}
                >
                  <Repeat className="h-4 w-4" />
                  <span>{tr("Switch Company", "ኩባንያ ቀይር")}</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => fetchQuotes(currentPage)}
                disabled={loading}
                className="inline-flex min-h-10 items-center justify-center gap-2 rounded-xl bg-secondary px-3.5 py-2 text-xs font-semibold text-white shadow-sm transition hover:bg-secondary/90 disabled:opacity-60 sm:text-sm"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
                <span>{tr("Refresh", "አድስ")}</span>
              </button>
            </div>
          }
          actionMobile={
            <div className="flex items-center gap-1.5">
              {isSuperAdmin && (
                <button
                  type="button"
                  onClick={clearCompany}
                  className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-white px-2.5 text-[11px] font-semibold text-secondary shadow-sm transition hover:border-secondary/30 hover:bg-secondary/5"
                  title={tr("Switch Company", "ኩባንያ ቀይር")}
                >
                  <Repeat className="h-3.5 w-3.5" />
                </button>
              )}

              <button
                type="button"
                onClick={() => fetchQuotes(currentPage)}
                disabled={loading}
                className="inline-flex h-9 items-center justify-center gap-1.5 rounded-lg bg-secondary px-2.5 text-[11px] font-semibold text-white shadow-sm transition hover:bg-secondary/90 disabled:opacity-60"
                title={tr("Refresh", "አድስ")}
              >
                <RefreshCw
                  className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`}
                />
              </button>
            </div>
          }
          className="mb-5 sm:mb-6"
        />

        <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard
            title={tr("Total Inquiries", "ጠቅላላ የዋጋ ጥያቄዎች")}
            value={totalCount}
            icon={Inbox}
          />
          <StatCard
            title={tr("Pending Action", "ምላሽ የሚጠብቁ")}
            value={pendingCount}
            icon={Clock}
          />
          <StatCard
            title={tr("Awaiting Customer", "የደንበኛን ምላሽ የሚጠብቁ")}
            value={quotedCount}
            icon={MessageSquare}
          />
          <StatCard
            title={tr("Converted Orders", "ወደ ትዕዛዝ የተቀየሩ")}
            value={convertedCount}
            icon={CheckCircle2}
          />
        </div>

        <div className="sticky -top-6 z-[2] -mt-6 mb-4 w-full bg-white pt-6">
          <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar flex-1">
                {tabs.map((tab) => {
                  const active = activeTab === tab.id;

                  return (
                    <motion.button
                      key={tab.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        setActiveTab(tab.id);
                        setCurrentPage(1);
                      }}
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
                    "Search customer, phone, product...",
                    "በደንበኛ ስም፣ ስልክ ወይም ምርት ይፈልጉ...",
                  )}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200/80 shadow-sm overflow-hidden bg-white">
          <DataTable
            columns={columns}
            data={quoteList}
            loading={loading}
            emptyMessage={tr(
              "No price quote requests found.",
              "ምንም የዋጋ ጥያቄ አልተገኘም።",
            )}
          />

          {totalCount > pageSize && (
            <div className="border-t border-gray-100 p-3">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / pageSize)}
                onPageChange={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>

      {/* Submit Proforma Modal */}
   {selectedQuoteForAction && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-2 sm:p-4"
    onClick={(e) =>
      e.target === e.currentTarget && handleCloseSubmitModal()
    }
  >
    <div className="flex max-h-[94vh] w-full max-w-xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">

      {/* Header */}
      <div className="border-b border-gray-100 bg-gradient-to-r from-secondary/10 via-white to-white px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900">
                {tr("Submit Proforma Quote", "የዋጋ ፕሮፎርማ ላክ")}
              </h3>
              <p className="mt-1 truncate text-xs text-gray-500">
                {tr("Inquiry", "ጥያቄ")} #{selectedQuoteForAction.id}
                {selectedQuoteForAction.customer_name && (
                  <> · {selectedQuoteForAction.customer_name}</>
                )}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCloseSubmitModal}
            disabled={submittingQuote}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700 disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={tr("Close", "ዝጋ")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 space-y-5 overflow-y-auto p-4 custom-scrollbar sm:p-5">

        {/* Product Summary */}
        <section className="rounded-2xl border border-gray-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {tr("Requested Product", "የተጠየቀው ምርት")}
            </h4>
            <span className="rounded-full bg-secondary/10 px-2.5 py-1 text-[10px] font-bold text-secondary">
              #{selectedQuoteForAction.id}
            </span>
          </div>

          <div className="flex items-center gap-3">
            {selectedQuoteForAction.product_primary_image ? (
              <img
                src={selectedQuoteForAction.product_primary_image}
                alt={selectedQuoteForAction.product_title || "Product"}
                className="h-16 w-16 shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <Package className="h-7 w-7 text-gray-400" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-gray-900">
                {selectedQuoteForAction.product_title ||
                  tr("Custom Product", "በተለየ ጥያቄ የተዘጋጀ ምርት")}
              </p>

              <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-secondary/5 px-2.5 py-1.5">
                <span className="text-[10px] text-gray-500">
                  {tr("Quantity", "ብዛት")}
                </span>
                <span className="text-xs font-bold text-secondary">
                  {selectedQuoteForAction.requested_qty}{" "}
                  {tr("units", "ክፍሎች")}
                </span>
              </div>
            </div>
          </div>

          {/* Specifications */}
          {Object.keys(selectedQuoteForAction.specs || {}).length > 0 && (
            <div className="mt-4 border-t border-gray-100 pt-3">
              <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                {tr("Product Specifications", "የምርት መስፈርቶች")}
              </p>

              <div className="flex flex-wrap gap-2">
                {Object.entries(selectedQuoteForAction.specs).map(
                  ([k, v]) => (
                    <div
                      key={k}
                      className="rounded-lg border border-gray-100 bg-gray-50 px-2.5 py-1.5"
                    >
                      <span className="text-[10px] text-gray-400">{k}</span>
                      <span className="ml-1 text-[11px] font-bold text-gray-700">
                        {String(v)}
                      </span>
                    </div>
                  )
                )}
              </div>
            </div>
          )}

          {/* Customer Note */}
          {selectedQuoteForAction.customer_notes && (
            <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/60 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
                {tr("Customer Note", "የደንበኛ ማስታወሻ")}
              </p>
              <p className="whitespace-pre-wrap text-xs leading-relaxed text-amber-950">
                {selectedQuoteForAction.customer_notes}
              </p>
            </div>
          )}
        </section>

        {/* Quote Form */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
              <FileText className="h-4 w-4" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-gray-900">
                {tr("Quotation Details", "የዋጋ ዝርዝር")}
              </h4>
              <p className="text-[10px] text-gray-400">
                {tr(
                  "Enter your offer and delivery terms",
                  "የዋጋ እና የማድረሻ ውሎችን ያስገቡ"
                )}
              </p>
            </div>
          </div>

          {/* Unit Price */}
          <div className="rounded-xl border border-secondary/20 bg-secondary/[0.03] p-4">
            <label className="mb-2 block text-xs font-bold text-gray-800">
              {tr("Quoted Unit Price", "የአንድ እቃ ዋጋ")}
              <span className="ml-1 text-red-500">*</span>
              <span className="ml-1 font-medium text-gray-400">
                (ETB)
              </span>
            </label>

            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-bold text-gray-400">
                ETB
              </span>

              <input
                type="number"
                step="0.01"
                min="0"
                value={quotePrice}
                onChange={(e) => setQuotePrice(e.target.value)}
                placeholder="0.00"
                className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-14 pr-4 text-base font-bold text-gray-900 outline-none transition placeholder:font-normal placeholder:text-gray-300 focus:border-secondary focus:ring-2 focus:ring-secondary/15"
              />
            </div>

            {parseFloat(quotePrice) > 0 && (
              <div className="mt-3 flex items-center justify-between gap-3 border-t border-secondary/10 pt-3">
                <div>
                  <p className="text-[10px] font-medium text-gray-500">
                    {tr("Total quotation amount", "ጠቅላላ የዋጋ ጥያቄ")}
                  </p>
                  <p className="mt-0.5 text-[10px] text-gray-400">
                    {selectedQuoteForAction.requested_qty}{" "}
                    {tr("units", "ክፍሎች")} ×{" "}
                    {formatCurrency(parseFloat(quotePrice))}
                  </p>
                </div>

                <strong className="text-base font-extrabold text-secondary">
                  {formatCurrency(
                    parseFloat(quotePrice) *
                      selectedQuoteForAction.requested_qty
                  )}
                </strong>
              </div>
            )}
          </div>

          {/* Lead Time and Validity */}
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                {tr("Production Lead Time", "የማምረቻ ጊዜ")}
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={leadTimeDays}
                  onChange={(e) => setLeadTimeDays(e.target.value)}
                  placeholder="e.g. 5"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-16 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400">
                  {tr("Days", "ቀናት")}
                </span>
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold text-gray-700">
                {tr("Offer Validity", "ዋጋው የሚቆይበት ጊዜ")}
              </label>

              <div className="relative">
                <input
                  type="number"
                  min="1"
                  value={validityHours}
                  onChange={(e) => setValidityHours(e.target.value)}
                  placeholder="e.g. 72"
                  className="w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 pr-20 text-sm outline-none transition focus:border-secondary focus:ring-2 focus:ring-secondary/15"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-gray-400">
                  {tr("Hours", "ሰዓታት")}
                </span>
              </div>
            </div>
          </div>

          {/* Vendor Notes */}
          <div>
            <label className="mb-1.5 block text-xs font-bold text-gray-700">
              {tr("Vendor Notes & Terms", "የሻጭ ማስታወሻ እና የሽያጭ ውሎች")}
              <span className="ml-1 font-normal text-gray-400">
                ({tr("Optional", "አማራጭ")})
              </span>
            </label>

            <textarea
              rows={3}
              value={vendorNotes}
              onChange={(e) => setVendorNotes(e.target.value)}
              placeholder={tr(
                "e.g. Production begins immediately upon payment. 1-year structural guarantee included.",
                "ለምሳሌ፦ ክፍያ ከተፈጸመ በኋላ ምርቱ መዘጋጀት ይጀምራል። የአንድ ዓመት ዋስትና ተካትቷል።"
              )}
              className="w-full resize-y rounded-xl border border-gray-200 bg-white px-3.5 py-3 text-xs leading-relaxed text-gray-700 outline-none transition placeholder:text-gray-400 focus:border-secondary focus:ring-2 focus:ring-secondary/15"
            />
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="flex flex-col-reverse gap-2 border-t border-gray-100 bg-gray-50/80 px-5 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <p className="hidden text-[10px] text-gray-400 sm:block">
          {tr("Inquiry", "ጥያቄ")} #{selectedQuoteForAction.id}
        </p>

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={handleCloseSubmitModal}
            disabled={submittingQuote}
            className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-semibold text-gray-600 transition hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {tr("Cancel", "ይቅር")}
          </button>

          <button
            type="button"
            onClick={handleSubmitQuote}
            disabled={submittingQuote}
            className="flex items-center justify-center gap-2 rounded-xl bg-secondary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-secondary-light active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submittingQuote ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                <span>{tr("Submitting...", "በመላክ ላይ...")}</span>
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                <span>{tr("Send Proforma", "ፕሮፎርማ ላክ")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  </div>
)}

      {/* Detail Modal */}
   {detailQuote && (
  <div
    className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-sm p-2 sm:p-4"
    onClick={(e) =>
      e.target === e.currentTarget && setDetailQuote(null)
    }
  >
    <div className="flex max-h-[94vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in-95 duration-200">

      {/* Header */}
      <div className="relative border-b border-gray-100 bg-gradient-to-r from-secondary/10 via-white to-white px-5 py-4 sm:px-6">
        <div className="flex items-start justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
              <FileText className="h-5 w-5" />
            </div>

            <div className="min-w-0">
              <h3 className="text-base font-bold text-gray-900">
                {tr("Quotation Request", "የዋጋ ጥያቄ")} #{detailQuote.id}
              </h3>
              <p className="mt-1 text-xs text-gray-500">
                {tr("Received on", "የተቀበለበት ቀን")} ·{" "}
                {new Intl.DateTimeFormat(
                  isAmharic ? "am-ET" : "en-US",
                  {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "numeric",
                    minute: "2-digit",
                  }
                ).format(new Date(detailQuote.created_at))}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setDetailQuote(null)}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-gray-400 transition hover:bg-gray-100 hover:text-gray-700"
            aria-label={tr("Close", "ዝጋ")}
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 space-y-5 overflow-y-auto p-4 custom-scrollbar sm:p-6">

        {/* Status */}
        {(() => {
          const cfg = getStatusConfig(detailQuote.status);

          return (
            <div className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/80 px-4 py-3">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  {tr("Request Status", "የጥያቄው ሁኔታ")}
                </p>
                <p className="mt-0.5 text-sm font-semibold text-gray-800">
                  {tr("Current status", "አሁን ያለው ሁኔታ")}
                </p>
              </div>

              <span
                className={`inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold ${cfg.bg} ${cfg.text} ${cfg.border}`}
              >
                {isAmharic ? cfg.labelAm : cfg.label}
              </span>
            </div>
          );
        })()}

        {/* Product Information */}
        <section className="rounded-2xl border border-gray-100 p-4">
          <div className="mb-3 flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-400">
              {tr("Product Information", "የምርት መረጃ")}
            </h4>
          </div>

          <div className="flex items-center gap-4">
            {detailQuote.product_primary_image ? (
              <img
                src={detailQuote.product_primary_image}
                alt={detailQuote.product_title || "Product"}
                className="h-20 w-20 shrink-0 rounded-xl border border-gray-100 bg-gray-50 object-cover"
              />
            ) : (
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-xl bg-gray-100">
                <Package className="h-8 w-8 text-gray-400" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-gray-900">
                {detailQuote.product_title ||
                  tr("Custom Product", "በተለየ ጥያቄ የተዘጋጀ ምርት")}
              </h4>

              <div className="mt-2 inline-flex items-center gap-2 rounded-lg bg-secondary/5 px-3 py-1.5">
                <span className="text-xs text-gray-500">
                  {tr("Requested quantity", "የተጠየቀው ብዛት")}
                </span>
                <span className="text-sm font-bold text-secondary">
                  {detailQuote.requested_qty} {tr("units", "ክፍሎች")}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Customer and Specifications */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Customer Details */}
          <section className="rounded-2xl border border-gray-100 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <User className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-gray-800">
                {tr("Customer Details", "የደንበኛ መረጃ")}
              </h4>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                  {tr("Customer name", "የደንበኛ ስም")}
                </p>
                <p className="font-semibold text-gray-800">
                  {detailQuote.customer_name ||
                    `User #${detailQuote.customer}`}
                </p>
              </div>

              {detailQuote.customer_phone && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {tr("Phone number", "ስልክ ቁጥር")}
                  </p>
                  <p className="flex items-center gap-2 font-medium text-gray-700">
                    <Phone className="h-3.5 w-3.5 text-gray-400" />
                    {detailQuote.customer_phone}
                  </p>
                </div>
              )}

              {detailQuote.shipping_address_text && (
                <div>
                  <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                    {tr("Shipping address", "የማድረሻ አድራሻ")}
                  </p>
                  <p className="flex items-start gap-2 leading-relaxed text-gray-700">
                    <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-gray-400" />
                    {detailQuote.shipping_address_text}
                  </p>
                </div>
              )}
            </div>
          </section>

          {/* Specifications */}
          <section className="rounded-2xl border border-gray-100 p-4">
            <div className="mb-3 flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-purple-50 text-purple-600">
                <Package className="h-4 w-4" />
              </div>
              <h4 className="text-xs font-bold text-gray-800">
                {tr("Custom Specifications", "የምርት ልዩ መስፈርቶች")}
              </h4>
            </div>

            {Object.keys(detailQuote.specs || {}).length > 0 ? (
              <div className="grid grid-cols-1 gap-2">
                {Object.entries(detailQuote.specs).map(([k, v]) => (
                  <div
                    key={k}
                    className="rounded-lg bg-gray-50 px-3 py-2"
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      {k}
                    </p>
                    <p className="mt-0.5 break-words text-xs font-bold text-gray-800">
                      {String(v)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-lg bg-gray-50 p-3 text-xs italic text-gray-400">
                {tr(
                  "No custom specifications provided.",
                  "ምንም ልዩ የምርት መስፈርት አልተገለጸም።"
                )}
              </p>
            )}
          </section>
        </div>

        {/* Customer Notes */}
        {detailQuote.customer_notes && (
          <section className="rounded-xl border border-amber-200 bg-amber-50/60 p-4">
            <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-amber-700">
              {tr("Customer Note", "የደንበኛ ማስታወሻ")}
            </p>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-amber-950">
              {detailQuote.customer_notes}
            </p>
          </section>
        )}

        {/* Vendor Quotation */}
        {detailQuote.quoted_price && (
          <section className="overflow-hidden rounded-2xl border border-blue-200">
            <div className="flex items-center gap-2 border-b border-blue-100 bg-blue-50/80 px-4 py-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-100 text-blue-700">
                <FileText className="h-4 w-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-blue-950">
                  {tr("Proforma Offer Submitted", "የቀረበ የዋጋ ፕሮፎርማ")}
                </h4>
                <p className="text-[10px] text-blue-700">
                  {tr("Vendor quotation details", "የሻጭ የዋጋ ዝርዝር")}
                </p>
              </div>
            </div>

            <div className="space-y-3 p-4">
              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  {tr("Quoted Unit Price", "የአንድ እቃ ዋጋ")}
                </span>
                <strong className="text-sm font-bold text-gray-900">
                  {formatCurrency(parseFloat(detailQuote.quoted_price))}
                </strong>
              </div>

              <div className="flex items-center justify-between gap-3">
                <span className="text-xs text-gray-500">
                  {tr("Total Proforma Offer", "ጠቅላላ የፕሮፎርማ ዋጋ")}
                </span>
                <strong className="text-base font-extrabold text-secondary">
                  {formatCurrency(
                    parseFloat(detailQuote.quoted_price) *
                      detailQuote.requested_qty
                  )}
                </strong>
              </div>

              {detailQuote.quoted_lead_time_days && (
                <div className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-500">
                    {tr("Production Lead Time", "የማምረቻ ጊዜ")}
                  </span>
                  <strong className="text-xs text-gray-800">
                    {detailQuote.quoted_lead_time_days}{" "}
                    {tr("business days", "የሥራ ቀናት")}
                  </strong>
                </div>
              )}

              {detailQuote.valid_until && (
                <div className="flex items-center justify-between gap-3">
                  <span className="shrink-0 text-xs text-gray-500">
                    {tr("Offer Valid Until", "የዋጋ ቅናሹ የሚያበቃበት ቀን")}
                  </span>
                  <span className="text-right text-xs font-semibold text-gray-800">
                    {new Intl.DateTimeFormat(
                      isAmharic ? "am-ET" : "en-US",
                      {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      }
                    ).format(new Date(detailQuote.valid_until))}
                  </span>
                </div>
              )}

              {detailQuote.vendor_notes && (
                <div className="rounded-xl border border-blue-100 bg-blue-50/50 p-3">
                  <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-blue-700">
                    {tr("Vendor Terms", "የሻጭ ውሎች")}
                  </p>
                  <p className="whitespace-pre-wrap text-xs leading-relaxed text-gray-700">
                    {detailQuote.vendor_notes}
                  </p>
                </div>
              )}
            </div>
          </section>
        )}

        {/* Master Order */}
        {detailQuote.master_order && (
          <section className="flex items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <CheckCircle2 className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-emerald-900">
                {isAmharic
                  ? `ወደ ዋና ትዕዛዝ ቁጥር ${detailQuote.master_order} ተቀይሯል`
                  : `Converted into Master Order #${detailQuote.master_order}`}
              </p>
              <p className="mt-1 text-xs leading-relaxed text-emerald-800">
                {tr(
                  "The customer accepted this quote and it has entered the normal order fulfillment process.",
                  "ደንበኛው የቀረበውን ዋጋ ተቀብሏል። ትዕዛዙም ወደ መደበኛው የትዕዛዝ ማስፈጸሚያ ሂደት ገብቷል።"
                )}
              </p>
            </div>
          </section>
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/80 px-5 py-3 sm:px-6">
        <span className="text-[10px] font-medium text-gray-400">
          {tr("Quotation", "የዋጋ ጥያቄ")} #{detailQuote.id}
        </span>

        <button
          type="button"
          onClick={() => setDetailQuote(null)}
          className="rounded-xl bg-secondary px-5 py-2.5 text-xs font-bold text-white shadow-sm transition hover:opacity-90 active:scale-[0.98]"
        >
          {tr("Close", "ዝጋ")}
        </button>
      </div>
    </div>
  </div>
)}
    </div>
  );
}
