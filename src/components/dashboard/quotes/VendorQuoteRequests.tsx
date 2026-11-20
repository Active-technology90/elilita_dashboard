import { useState, useEffect, useCallback, useMemo } from "react";
import {
  FileText,
  Package,
  Send,
  Eye,
  RefreshCw,
  Phone,
  MapPin,
  Sparkles,
  X,
  Loader2,
} from "lucide-react";
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
import toast from "react-hot-toast";

const STATUS_CONFIG: Record<
  QuoteStatus,
  { label: string; labelAm: string; bg: string; text: string; border: string }
> = {
  pending: {
    label: "Pending Quote",
    labelAm: "ዋጋ ያልተሰጠው",
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
  },
  quoted: {
    label: "Quote Sent",
    labelAm: "ዋጋ የተሰጠው",
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
    labelAm: "ውድቅ የተደረገ",
    bg: "bg-rose-50",
    text: "text-rose-700",
    border: "border-rose-200",
  },
  expired: {
    label: "Expired",
    labelAm: "ጊዜው ያለፈበት",
    bg: "bg-gray-100",
    text: "text-gray-600",
    border: "border-gray-200",
  },
};

export default function VendorQuoteRequests() {
  const { i18n } = useTranslation("dashboard");
  const isAmharic = i18n.language?.startsWith("am");
  const readOnly = useReadOnly();
  const { company } = useCurrentCompany();

  const [activeTab, setActiveTab] = useState<"all" | QuoteStatus>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [loading, setLoading] = useState(true);
  const [quoteList, setQuoteList] = useState<ProductQuoteRequest[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [selectedQuoteForAction, setSelectedQuoteForAction] =
    useState<ProductQuoteRequest | null>(null);
  const [detailQuote, setDetailQuote] = useState<ProductQuoteRequest | null>(
    null,
  );
  const [submittingQuote, setSubmittingQuote] = useState(false);
  const [rejectingQuoteId, setRejectingQuoteId] = useState<number | null>(null);

  // Form states for quote submission
  const [quotePrice, setQuotePrice] = useState<string>("");
  const [leadTimeDays, setLeadTimeDays] = useState<string>("5");
  const [validityHours, setValidityHours] = useState<string>("72");
  const [vendorNotes, setVendorNotes] = useState<string>("");

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
        toast.error("Failed to load price quote requests");
      } finally {
        setLoading(false);
      }
    },
    [currentPage, pageSize, company, activeTab, debouncedSearch],
  );

  useEffect(() => {
    fetchQuotes(currentPage);
  }, [fetchQuotes, currentPage]);

  const handleOpenSubmitModal = (quote: ProductQuoteRequest) => {
    setSelectedQuoteForAction(quote);
    setQuotePrice(quote.quoted_price || "");
    setLeadTimeDays(
      quote.quoted_lead_time_days ? String(quote.quoted_lead_time_days) : "5",
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
      toast.error("Please enter a valid positive quote price");
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
        isAmharic
          ? "የዋጋ ፕሮፎርማ ለደንበኛው በተሳካ ሁኔታ ተልኳል"
          : "Proforma quote submitted to customer successfully!",
      );
      handleCloseSubmitModal();
      fetchQuotes(currentPage);
    } catch (err: any) {
      console.error("Failed to submit quote:", err);
      toast.error(
        err.response?.data?.detail || "Failed to submit proforma quote",
      );
    } finally {
      setSubmittingQuote(false);
    }
  };

  const handleReject = async (quoteId: number) => {
    if (
      !window.confirm(
        isAmharic
          ? "ይህንን የዋጋ ጥያቄ ውድቅ ማድረግ ይፈልጋሉ?"
          : "Are you sure you want to decline this quote request?",
      )
    ) {
      return;
    }
    setRejectingQuoteId(quoteId);
    try {
      await rejectQuoteRequest(quoteId);
      toast.success(
        isAmharic ? "ጥያቄው ውድቅ ተደርጓል" : "Quote request declined",
      );
      fetchQuotes(currentPage);
    } catch (err: any) {
      console.error("Failed to decline quote:", err);
      toast.error("Failed to decline quote request");
    } finally {
      setRejectingQuoteId(null);
    }
  };

  // Stats calculation
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

  const columns: Column<ProductQuoteRequest>[] = [
    {
      key: "id",
      header: isAmharic ? "መለያ / ቀን" : "ID & Date",
      className: "whitespace-nowrap font-medium text-secondary",
      render: (quote) => (
        <div>
          <div className="font-bold text-secondary">#{quote.id}</div>
          <div className="text-[11px] text-gray-400">
            {new Date(quote.created_at).toLocaleDateString("en-US", {
              month: "short",
              day: "numeric",
              year: "numeric",
            })}
          </div>
        </div>
      ),
    },
    {
      key: "customer_name",
      header: isAmharic ? "ደንበኛ" : "Customer",
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
      header: isAmharic ? "ምርት & ብዛት" : "Product & Qty",
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
              {quote.product_title || "Custom Product"}
            </div>
            <div className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 rounded-full bg-secondary/10 text-[10px] font-semibold text-secondary">
              <span>Qty: {quote.requested_qty}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "specs",
      header: isAmharic ? "ዝርዝር መስፈርቶች" : "Specifications",
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
                    +{specEntries.length - 3} more
                  </span>
                )}
              </div>
            )}
            {quote.customer_notes && (
              <p className="text-[11px] text-gray-500 italic truncate" title={quote.customer_notes}>
                "{quote.customer_notes}"
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "status",
      header: isAmharic ? "ሁኔታ" : "Status",
      className: "whitespace-nowrap",
      render: (quote) => {
        const cfg = STATUS_CONFIG[quote.status] || STATUS_CONFIG.pending;
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
      header: isAmharic ? "የቀረበ ዋጋ" : "Quoted Offer",
      className: "whitespace-nowrap",
      render: (quote) => {
        if (!quote.quoted_price) {
          return (
            <span className="text-xs text-gray-400 italic">
              {isAmharic ? "ዋጋ አልቀረበም" : "Not quoted yet"}
            </span>
          );
        }
        return (
          <div>
            <div className="font-bold text-secondary text-sm">
              {parseFloat(quote.quoted_price).toLocaleString()} ETB
            </div>
            {quote.quoted_lead_time_days && (
              <div className="text-[10px] text-gray-500 font-medium">
                Lead time: {quote.quoted_lead_time_days} days
              </div>
            )}
          </div>
        );
      },
    },
    {
      key: "actions",
      header: isAmharic ? "እርምጃዎች" : "Actions",
      className: "whitespace-nowrap text-right",
      render: (quote) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            onClick={() => setDetailQuote(quote)}
            title="View Details"
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
                <span>{isAmharic ? "ዋጋ ስጥ" : "Send Quote"}</span>
              </button>
              <button
                type="button"
                disabled={rejectingQuoteId === quote.id}
                onClick={() => handleReject(quote.id)}
                title="Decline Inquiry"
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
              <span>{isAmharic ? "ዋጋ ቀይር" : "Edit Offer"}</span>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-5 p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-secondary tracking-tight">
              {isAmharic ? "የዋጋ ጥያቄዎች እና ፕሮፎርማዎች" : "Price Quotes & Proformas"}
            </h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary/10 text-xs font-bold text-secondary">
              <Sparkles className="h-3 w-3" />
              Made-to-Order
            </span>
          </div>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            {isAmharic
              ? "ለተመረቱ ወይም በደንበኛ ጥያቄ ለሚሰሩ ምርቶች የቀረቡ ጥያቄዎችን ይገምግሙና ፕሮፎርማ ይላኩ።"
              : "Review custom specifications from customers and issue professional proforma quotes."}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => fetchQuotes(currentPage)}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-gray-200 bg-white text-xs font-semibold text-gray-700 hover:bg-gray-50 transition shadow-sm"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${loading ? "animate-spin text-secondary" : ""}`}
            />
            <span>{isAmharic ? "አድስ" : "Refresh"}</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white p-3.5 sm:p-4 rounded-xl border border-gray-200/80 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-gray-400 tracking-wider">
            {isAmharic ? "አጠቃላይ ጥያቄዎች" : "Total Inquiries"}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-secondary">
            {totalCount}
          </p>
        </div>

        <div className="bg-amber-50/70 p-3.5 sm:p-4 rounded-xl border border-amber-200 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-amber-700 tracking-wider">
            {isAmharic ? "ምላሽ የሚሹ (Pending)" : "Pending Action"}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-amber-800">
            {pendingCount}
          </p>
        </div>

        <div className="bg-blue-50/70 p-3.5 sm:p-4 rounded-xl border border-blue-200 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-blue-700 tracking-wider">
            {isAmharic ? "ደንበኛ በመጠባበቅ ላይ" : "Awaiting Customer"}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-blue-800">
            {quotedCount}
          </p>
        </div>

        <div className="bg-emerald-50/70 p-3.5 sm:p-4 rounded-xl border border-emerald-200 shadow-sm">
          <p className="text-[11px] font-semibold uppercase text-emerald-700 tracking-wider">
            {isAmharic ? "ወደ ትዕዛዝ የተቀየሩ" : "Converted Orders"}
          </p>
          <p className="mt-1 text-2xl font-extrabold text-emerald-800">
            {convertedCount}
          </p>
        </div>
      </div>

      {/* Filters & Status Tabs */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm p-3 sm:p-4 space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Status Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0 custom-scrollbar">
            {(
              [
                { id: "all", label: "All", labelAm: "ሁሉም" },
                { id: "pending", label: "Pending", labelAm: "ያልተመለሱ" },
                { id: "quoted", label: "Quoted", labelAm: "ዋጋ የተሰጣቸው" },
                { id: "converted", label: "Converted", labelAm: "የተቀየሩ" },
                { id: "rejected", label: "Declined", labelAm: "ውድቅ የተደረጉ" },
              ] as const
            ).map((tab) => {
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.id as any);
                    setCurrentPage(1);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition ${
                    active
                      ? "bg-secondary text-white shadow-sm"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  {isAmharic ? tab.labelAm : tab.label}
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="w-full sm:w-64">
            <SearchInput
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder={
                isAmharic
                  ? "በደንበኛ ስም፣ ስልክ ወይም ምርት ፈልግ..."
                  : "Search customer, phone, product..."
              }
            />
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="bg-white rounded-xl border border-gray-200/80 shadow-sm overflow-hidden">
        <DataTable
          columns={columns}
          data={quoteList}
          loading={loading}
          emptyMessage={
            isAmharic
              ? "ምንም አይነት የዋጋ ጥያቄ አልተገኘም"
              : "No price quote requests found"
          }
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

      {/* ============================================================ */}
      {/* SUBMIT PROFORMA MODAL */}
      {/* ============================================================ */}
      {selectedQuoteForAction && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && handleCloseSubmitModal()}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Modal Header */}
            <div className="bg-secondary/10 px-5 py-4 border-b border-secondary/15 flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-secondary">
                  {isAmharic ? "የዋጋ ፕሮፎርማ ስጥ" : "Submit Proforma Quote"}
                </h3>
                <p className="text-xs text-gray-500">
                  Inquiry #{selectedQuoteForAction.id} · {selectedQuoteForAction.customer_name}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCloseSubmitModal}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Product & Request Summary */}
              <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 space-y-2">
                <div className="flex items-center gap-3">
                  {selectedQuoteForAction.product_primary_image ? (
                    <img
                      src={selectedQuoteForAction.product_primary_image}
                      alt=""
                      className="h-12 w-12 rounded-lg object-cover border border-gray-200 shrink-0"
                    />
                  ) : (
                    <div className="h-12 w-12 rounded-lg bg-gray-200 flex items-center justify-center shrink-0">
                      <Package className="h-6 w-6 text-gray-400" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-sm text-gray-900 truncate">
                      {selectedQuoteForAction.product_title}
                    </p>
                    <p className="text-xs text-gray-500">
                      Requested Quantity:{" "}
                      <strong className="text-secondary font-bold">
                        {selectedQuoteForAction.requested_qty} units
                      </strong>
                    </p>
                  </div>
                </div>

                {/* Specs overview */}
                {Object.keys(selectedQuoteForAction.specs || {}).length > 0 && (
                  <div className="pt-2 border-t border-gray-200/60 flex flex-wrap gap-1">
                    {Object.entries(selectedQuoteForAction.specs).map(([k, v]) => (
                      <span
                        key={k}
                        className="inline-block px-2 py-0.5 rounded bg-white border border-gray-200 text-[10px] text-gray-700"
                      >
                        <strong>{k}:</strong> {String(v)}
                      </span>
                    ))}
                  </div>
                )}

                {selectedQuoteForAction.customer_notes && (
                  <div className="text-xs text-gray-600 bg-white p-2 rounded border border-gray-200">
                    <span className="font-semibold text-gray-700">Customer Note:</span>{" "}
                    {selectedQuoteForAction.customer_notes}
                  </div>
                )}
              </div>

              {/* Form Inputs */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isAmharic ? "የአንድ እቃ ዋጋ (ETB)" : "Quoted Unit Price (ETB)"}{" "}
                    <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={quotePrice}
                    onChange={(e) => setQuotePrice(e.target.value)}
                    placeholder="e.g. 2500.00"
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-sm font-semibold"
                  />
                  {parseFloat(quotePrice) > 0 && (
                    <div className="mt-1 text-xs text-gray-500 flex justify-between">
                      <span>Total for {selectedQuoteForAction.requested_qty} units:</span>
                      <strong className="text-secondary font-bold">
                        {(
                          parseFloat(quotePrice) * selectedQuoteForAction.requested_qty
                        ).toLocaleString()}{" "}
                        ETB
                      </strong>
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isAmharic ? "የማምረቻ ጊዜ (ቀናት)" : "Lead Time (Days)"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={leadTimeDays}
                      onChange={(e) => setLeadTimeDays(e.target.value)}
                      placeholder="e.g. 5"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-sm"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-gray-700 mb-1">
                      {isAmharic ? "የዋጋ ማቆያ ጊዜ (ሰዓታት)" : "Offer Validity (Hours)"}
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={validityHours}
                      onChange={(e) => setValidityHours(e.target.value)}
                      placeholder="e.g. 72"
                      className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-sm"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">
                    {isAmharic ? "የሻጭ ማስታወሻ / ውሎች" : "Vendor Notes & Crafting Terms"}
                  </label>
                  <textarea
                    rows={3}
                    value={vendorNotes}
                    onChange={(e) => setVendorNotes(e.target.value)}
                    placeholder="e.g. Crafting begins immediately upon payment. 1-year structural guarantee included."
                    className="w-full px-3.5 py-2 rounded-xl border border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none text-xs"
                  />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={handleCloseSubmitModal}
                disabled={submittingQuote}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-600 hover:bg-gray-100 text-xs font-semibold transition"
              >
                {isAmharic ? "ሰርዝ" : "Cancel"}
              </button>
              <button
                type="button"
                onClick={handleSubmitQuote}
                disabled={submittingQuote}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-secondary text-white text-xs font-semibold shadow hover:bg-secondary-light transition active:scale-95 disabled:opacity-60"
              >
                {submittingQuote ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
                <span>{isAmharic ? "ፕሮፎርማ ላክ" : "Send Proforma"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* DETAIL MODAL */}
      {/* ============================================================ */}
      {detailQuote && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/50 backdrop-blur-sm"
          onClick={(e) => e.target === e.currentTarget && setDetailQuote(null)}
        >
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="bg-secondary/10 px-5 py-4 border-b border-secondary/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-secondary" />
                <div>
                  <h3 className="text-base font-bold text-secondary">
                    Quotation Request #{detailQuote.id}
                  </h3>
                  <p className="text-xs text-gray-500">
                    Received on {new Date(detailQuote.created_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setDetailQuote(null)}
                className="p-1 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Body */}
            <div className="p-5 space-y-4 overflow-y-auto custom-scrollbar">
              {/* Status Banner */}
              <div className="flex items-center justify-between p-3 rounded-xl border border-gray-100 bg-gray-50">
                <span className="text-xs font-medium text-gray-500">Status</span>
                <span
                  className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold border ${
                    STATUS_CONFIG[detailQuote.status]?.bg || "bg-gray-100"
                  } ${
                    STATUS_CONFIG[detailQuote.status]?.text || "text-gray-700"
                  } ${
                    STATUS_CONFIG[detailQuote.status]?.border || "border-gray-200"
                  }`}
                >
                  {isAmharic
                    ? STATUS_CONFIG[detailQuote.status]?.labelAm
                    : STATUS_CONFIG[detailQuote.status]?.label}
                </span>
              </div>

              {/* Product Info */}
              <div className="rounded-xl border border-gray-200/80 p-3 flex items-start gap-3">
                {detailQuote.product_primary_image ? (
                  <img
                    src={detailQuote.product_primary_image}
                    alt=""
                    className="h-16 w-16 rounded-xl object-cover border border-gray-100 shrink-0"
                  />
                ) : (
                  <div className="h-16 w-16 rounded-xl bg-gray-100 flex items-center justify-center shrink-0">
                    <Package className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-gray-900 text-sm">
                    {detailQuote.product_title}
                  </h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Requested Quantity:{" "}
                    <strong className="text-secondary font-bold">
                      {detailQuote.requested_qty} units
                    </strong>
                  </p>
                </div>
              </div>

              {/* Customer Contact */}
              <div className="rounded-xl border border-gray-200/80 p-3 space-y-1.5 text-xs">
                <h5 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Customer Contact & Shipping
                </h5>
                <p className="text-gray-900 font-semibold">
                  {detailQuote.customer_name || `User #${detailQuote.customer}`}
                </p>
                {detailQuote.customer_phone && (
                  <p className="text-gray-600 flex items-center gap-1">
                    <Phone className="h-3 w-3 text-gray-400" />
                    {detailQuote.customer_phone}
                  </p>
                )}
                {detailQuote.shipping_address_text && (
                  <p className="text-gray-600 flex items-start gap-1">
                    <MapPin className="h-3 w-3 text-gray-400 shrink-0 mt-0.5" />
                    <span>{detailQuote.shipping_address_text}</span>
                  </p>
                )}
              </div>

              {/* Specifications */}
              <div className="rounded-xl border border-gray-200/80 p-3 space-y-1.5 text-xs">
                <h5 className="font-bold text-gray-700 uppercase tracking-wider text-[10px]">
                  Custom Specifications
                </h5>
                {Object.keys(detailQuote.specs || {}).length > 0 ? (
                  <div className="grid grid-cols-2 gap-2 mt-1">
                    {Object.entries(detailQuote.specs).map(([k, v]) => (
                      <div
                        key={k}
                        className="bg-gray-50 p-2 rounded-lg border border-gray-100"
                      >
                        <span className="text-gray-400 uppercase text-[9px] block">
                          {k}
                        </span>
                        <span className="font-bold text-gray-800 text-xs">
                          {String(v)}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 italic">No custom specs specified</p>
                )}
                {detailQuote.customer_notes && (
                  <div className="mt-2 p-2.5 rounded-lg bg-amber-50/50 border border-amber-200/60 text-xs text-amber-900">
                    <strong>Customer Note:</strong> "{detailQuote.customer_notes}"
                  </div>
                )}
              </div>

              {/* Quoted Information */}
              {detailQuote.quoted_price && (
                <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-2 text-xs">
                  <h5 className="font-bold text-blue-900 uppercase tracking-wider text-[10px]">
                    Proforma Offer Submitted
                  </h5>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Quoted Unit Price:</span>
                    <strong className="text-secondary text-sm font-extrabold">
                      {parseFloat(detailQuote.quoted_price).toLocaleString()} ETB
                    </strong>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Total Proforma Offer:</span>
                    <strong className="text-secondary text-sm font-extrabold">
                      {(
                        parseFloat(detailQuote.quoted_price) *
                        detailQuote.requested_qty
                      ).toLocaleString()}{" "}
                      ETB
                    </strong>
                  </div>
                  {detailQuote.quoted_lead_time_days && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Production Lead Time:</span>
                      <strong className="text-gray-800">
                        {detailQuote.quoted_lead_time_days} business days
                      </strong>
                    </div>
                  )}
                  {detailQuote.valid_until && (
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600">Offer Valid Until:</span>
                      <span className="text-gray-700 font-medium">
                        {new Date(detailQuote.valid_until).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {detailQuote.vendor_notes && (
                    <div className="mt-1 p-2 rounded bg-white border border-blue-100 text-gray-700">
                      <strong>Vendor Terms:</strong> {detailQuote.vendor_notes}
                    </div>
                  )}
                </div>
              )}

              {/* Master Order link if converted */}
              {detailQuote.master_order && (
                <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-3 flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-emerald-900">
                      Converted into Master Order #{detailQuote.master_order}
                    </p>
                    <p className="text-emerald-700 text-[11px] mt-0.5">
                      This quote was accepted by the customer and entered your normal order fulfillment lifecycle.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-5 py-3 border-t border-gray-100 flex items-center justify-end">
              <button
                type="button"
                onClick={() => setDetailQuote(null)}
                className="px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-100 text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
