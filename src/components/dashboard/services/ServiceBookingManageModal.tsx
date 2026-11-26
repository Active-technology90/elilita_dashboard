import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  X,
  User,
  Calendar,
  Clock,
  Briefcase,
  FileText,
  CheckCircle,
  XCircle,
  AlertCircle,
  Loader2,
  PhoneCall,
  Building,
  Copy,
  Tag,
  CreditCard,
  History,
  RefreshCw,
  ShieldCheck,
  Banknote,
  Eye,
  ZoomIn,
  MapPin,
  Home,
  Store,
  Navigation,
  ExternalLink,
  MessageSquare,
  Download,
  Layers,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { ServiceBooking, BookingAction } from "../../../types";
import {
  reviewReceipt,
  confirmCODServiceBookingPayment,
} from "../../../services/api";
import { useToast } from "../../../hooks/useToast";
import { ConfirmationModal } from "../../ui/confimationModal";

// ─── Status Configuration ──────────────────────────────────
const STATUS_CONFIG: Record<
  ServiceBooking["status"],
  { label: string; icon: React.ReactNode; color: string; desc: string }
> = {
  pending: {
    label: "status.pending",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "bg-amber-50 text-amber-700 border-amber-200",
    desc: "status.pendingDescription",
  },
  confirmed: {
    label: "status.confirmed",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "bg-green-50 text-green-700 border-green-200",
    desc: "status.confirmedDescription",
  },
  in_progress: {
    label: "status.inProgress",
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    color: "bg-blue-50 text-blue-700 border-blue-200",
    desc: "status.inProgressDescription",
  },
  completed: {
    label: "status.completed",
    icon: <CheckCircle className="h-5 w-5" />,
    color: "bg-purple-50 text-secondary border-purple-200",
    desc: "status.completedDescription",
  },
  cancelled: {
    label: "status.cancelled",
    icon: <XCircle className="h-5 w-5" />,
    color: "bg-red-50 text-red-700 border-red-200",
    desc: "status.cancelledDescription",
  },
  no_show: {
    label: "status.noShow",
    icon: <AlertCircle className="h-5 w-5" />,
    color: "bg-gray-100 text-gray-600 border-gray-200",
    desc: "status.noShowDescription",
  },
};

const ALLOWED_TRANSITIONS: Record<string, ServiceBooking["status"][]> = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["in_progress", "cancelled", "no_show"],
  in_progress: ["completed", "cancelled", "no_show"],
  completed: [],
  cancelled: [],
  no_show: [],
};

// ─── Animation Variants ────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: { staggerChildren: 0.05 } },
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

// ─── Helpers ───────────────────────────────────────────────
const getInitials = (name?: string) =>
  name
    ?.trim()
    .split(" ")
    .filter(Boolean)
    .map((n) => n[0])
    .join("")
    .toUpperCase() || "?";

const formatCurrency = (value: string | number) => {
  const num = typeof value === "string" ? parseFloat(value) : value;
  return isNaN(num)
    ? ""
    : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });
};

// ─── Sub-components ────────────────────────────────────────
const StatusBadge = ({
  status,
  large = false,
}: {
  status: string;
  large?: boolean;
}) => {
  const { t } = useTranslation("serviceBookingManage");

  const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG] ?? {
    label: status,
    icon: <AlertCircle className="h-5 w-5" />,
    color: "bg-gray-50 text-gray-700 border-gray-200",
    desc: "",
  };

  return (
    <span
      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.color} ${
        large ? "text-sm font-semibold" : "text-xs font-medium"
      }`}
    >
      {config.icon}{" "}
      {config.label.startsWith("status.") ? t(config.label) : config.label}
    </span>
  );
};

const Card = ({
  children,
  title,
  icon: Icon,
  className = "",
}: any) => (
  <motion.div
    variants={itemVariants}
    className={`bg-white/80 backdrop-blur-sm rounded-2xl border border-purple-100/20 p-4 md:p-5 shadow-md hover:shadow-lg transition-shadow duration-300 ${className}`}
  >
    <div className="flex items-center gap-2 mb-3 pb-2 relative">
      <div className="p-1.5 bg-gradient-to-br from-purple-100 to-purple-200 rounded-lg shadow-inner">
        <Icon className="h-4 w-4 text-secondary" />
      </div>
      <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary bg-clip-text text-transparent">
        {title}
      </h4>
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-gradient-to-r from-secondary via-secondary to-transparent rounded-full" />
    </div>
    {children}
  </motion.div>
);

const CopyButton = ({ text }: { text?: string | null }) => {
  const [copied, setCopied] = useState(false);

  if (!text) return null;

  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="text-gray-400 hover:text-secondary transition-colors p-1"
    >
      {copied ? (
        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
    </button>
  );
};

// ─── Booking Timeline Builder ─────────────────────────────
const buildBookingTimeline = (
  booking: ServiceBooking,
  t: (key: string) => string,
) => {
  const events: any[] = [];

  if (booking.created_at) {
    events.push({
      id: "created",
      label: t("timeline.bookingCreated"),
      icon: "📅",
      time: booking.created_at,
      actor: booking.customer_name || t("common.customer"),
      status: "completed",
    });
  }

  if (["confirmed", "in_progress", "completed"].includes(booking.status)) {
    events.push({
      id: "confirmed",
      label: t("status.confirmed"),
      icon: "✅",
      time: booking.updated_at || booking.created_at,
      actor: t("common.admin"),
      status: "completed",
    });
  }

  if (["in_progress", "completed"].includes(booking.status)) {
    events.push({
      id: "in_progress",
      label: t("status.inProgress"),
      icon: "🔧",
      time: booking.updated_at || booking.created_at,
      actor: t("common.staff"),
      status: "completed",
    });
  }

  if (booking.status === "completed") {
    events.push({
      id: "completed",
      label: t("status.completed"),
      icon: "🏁",
      time: booking.updated_at || booking.created_at,
      actor: t("common.system"),
      status: "completed",
    });
  }

  if (booking.payment_method === "cod" && booking.payment_status === "paid") {
    events.push({
      id: "cod_paid",
      label: t("timeline.codPaymentCollected"),
      icon: "💰",
      time: booking.updated_at || booking.created_at,
      actor: t("common.admin"),
      status: "completed",
    });
  }

  if (booking.status === "pending" && events.length === 1) {
    events.push({
      id: "pending",
      label: t("timeline.awaitingConfirmation"),
      icon: "⏳",
      time: booking.created_at,
      actor: t("timeline.waitingForAdmin"),
      status: "pending",
    });
  }

  events.sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime(),
  );

  return events;
};

// ─── Receipt Review Card ───────────────────────────────────
const ReceiptReviewCard = ({
  receipt,
  paymentMethod,
  paymentStatus,
  onUpdate,
  receiptHistory = [],
  onPreviewImage,
  bookingStatus,
  bookingId,
  companySlug,
  onCODComplete,
}: {
  receipt?: any | null;
  paymentMethod: string;
  paymentStatus: string;
  onUpdate: () => Promise<void>;
  receiptHistory?: any[];
  onPreviewImage: (url: string | null) => void;
  bookingStatus: ServiceBooking["status"];
  bookingId: number;
  companySlug: string;
  onCODComplete?: () => Promise<void>;
}) => {
  const { t } = useTranslation("serviceBookingManage");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submittingAction, setSubmittingAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingAction, setPendingAction] = useState<
    "approved" | "rejected" | null
  >(null);
  const [showCODConfirm, setShowCODConfirm] = useState(false);
  const [codConfirming, setCodConfirming] = useState(false);
  const { showToast } = useToast();

  // ─── Chapa ────────────────────────────────────────────
  if (paymentMethod === "chapa") {
    return (
      <Card title={t("payment.information")} icon={CreditCard}>
        <div className="flex flex-col items-center">
          <div className="flex items-center gap-2 bg-white px-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-2 shadow-inner">
              <ShieldCheck className="h-8 w-8 text-indigo-600" />
            </div>
            <p className="text-sm font-semibold text-gray-700">
              {t("payment.verifiedBy")}
            </p>
            <img src="/chapa.png" alt="Chapa" className="h-8 object-contain" />
          </div>
          <p className="text-xs text-gray-500 mt-2">
            {t("payment.automaticallyConfirmedByChapa")}
          </p>
        </div>
      </Card>
    );
  }

  // ─── COD ──────────────────────────────────────────────
  if (paymentMethod === "cod") {
    const isPaid = paymentStatus === "paid";
    const canCollect = bookingStatus === "in_progress";

    return (
      <>
        <Card title={t("payment.cashOnDelivery")} icon={Banknote}>
          <div className="flex flex-col items-center text-center">
            {isPaid ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center mb-2 shadow-inner">
                  <ShieldCheck className="h-6 w-6 text-emerald-600" />
                </div>
                <p className="text-sm font-black text-emerald-700 uppercase tracking-wide">
                  {t("payment.paymentCollected")}
                </p>
              </div>
            ) : (
              <>
                <p className="text-xs text-gray-500 mb-4 max-w-xs leading-relaxed">
                  {canCollect
                    ? t("payment.collectCashNow")
                    : t("payment.collectionAvailableWhenInProgress")}
                </p>
                <button
                  onClick={() => setShowCODConfirm(true)}
                  disabled={!canCollect}
                  className={`w-full py-3 rounded-2xl text-white text-sm font-bold shadow-lg transition-all flex items-center justify-center gap-2 ${
                    canCollect
                      ? "bg-gradient-to-r from-emerald-500 to-emerald-600 hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
                      : "bg-gray-300 cursor-not-allowed shadow-none"
                  }`}
                >
                  {codConfirming ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      {t("common.processing")}
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      {t("payment.confirmPaymentCollected")}
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </Card>

        <ConfirmationModal
          isOpen={showCODConfirm}
          onClose={() => setShowCODConfirm(false)}
          onConfirm={async () => {
            setShowCODConfirm(false);
            setCodConfirming(true);
            try {
              await confirmCODServiceBookingPayment(
                companySlug,
                Number(bookingId),
              );

              showToast("success", t("payment.codPaymentConfirmed"));

              if (onCODComplete) {
                await onCODComplete();
              } else {
                await onUpdate();
              }
            } catch (err: any) {
              showToast(
                "error",
                err.response?.data?.detail || t("payment.codConfirmationFailed"),
              );
            } finally {
              setCodConfirming(false);
            }
          }}
          title={t("payment.confirmCODPayment")}
          description={t("payment.cashCollectionConfirmation")}
          confirmText={
            codConfirming
              ? t("common.processing")
              : t("payment.yesConfirmPayment")
          }
          confirmVariant="primary"
          loading={codConfirming}
          autoClose={false}
        />
      </>
    );
  }

  // ─── Bank Transfer ────────────────────────────────────
  if (!receipt) {
    return (
      <Card title={t("payment.paymentReceipt")} icon={Banknote}>
        <div className="text-center py-6 border-2 border-dashed border-gray-100 rounded-2xl">
          <AlertCircle className="h-6 w-6 text-gray-300 mx-auto mb-2" />
          <p className="text-gray-500 text-sm">
            {t("payment.waitingForReceipt")}
          </p>
        </div>
      </Card>
    );
  }

  const isAlreadyReviewed =
    receipt.status === "approved" || receipt.status === "rejected";
  const canReview = !isAlreadyReviewed;

  const handleActionClick = (action: "approved" | "rejected") => {
    setPendingAction(action);
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    if (!pendingAction || !receipt) return;

    setShowConfirm(false);
    setSubmitting(true);
    setSubmittingAction(pendingAction);

    try {
      await reviewReceipt(receipt.id, {
        status: pendingAction,
        admin_notes: notes || undefined,
      });

      showToast(
        "success",
        t(
          pendingAction === "approved"
            ? "payment.receiptApproved"
            : "payment.receiptRejected",
        ),
      );

      setNotes("");
      setPendingAction(null);
      await onUpdate();
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.detail || t("payment.reviewFailed"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Card title={t("payment.paymentReceipt")} icon={Banknote}>
      <div className="space-y-3">
        {receipt.receipt_image && (
          <div
            onClick={() => onPreviewImage(receipt.receipt_image)}
            className="relative w-full h-28 rounded-xl overflow-hidden border cursor-zoom-in group"
          >
            <img
              src={receipt.receipt_image}
              alt={t("payment.receiptImage")}
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition flex items-center justify-center">
              <Eye className="h-5 w-5 text-white opacity-0 group-hover:opacity-100 transition" />
            </div>
          </div>
        )}

        <div className="bg-gradient-to-r from-purple-50/50 to-indigo-50/50 p-4 rounded-xl border border-purple-100">
          <p className="text-[10px] text-secondary font-bold uppercase tracking-widest mb-1">
            {t("payment.bankDetails")}
          </p>
          <p className="font-semibold text-sm text-gray-900">
            {receipt.bank_name || t("common.notSpecified")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{t("common.status")}:</span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
              paymentStatus === "paid"
                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                : paymentStatus === "payment_failed"
                  ? "bg-red-50 text-red-700 border-red-200"
                  : "bg-amber-50 text-amber-700 border-amber-200"
            }`}
          >
            {paymentStatus === "paid"
              ? t("payment.confirmed")
              : paymentStatus === "payment_failed"
                ? t("payment.paymentFailed")
                : t("payment.pendingVerification")}
          </span>
        </div>

        {canReview && (
          <div className="pt-2 space-y-3">
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("payment.addReviewNotes")}
              rows={2}
              className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-secondary/30 transition resize-none"
            />

            <div className="flex gap-2">
              <button
                onClick={() => handleActionClick("approved")}
                disabled={submitting}
                className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submittingAction === "approved" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("payment.approving")}
                  </>
                ) : (
                  t("common.approve")
                )}
              </button>

              <button
                onClick={() => handleActionClick("rejected")}
                disabled={submitting}
                className="flex-1 bg-gradient-to-r from-rose-500 to-red-600 text-white py-2.5 rounded-xl text-sm font-bold shadow-md hover:from-rose-600 hover:to-red-700 transition disabled:opacity-50"
              >
                {submittingAction === "rejected" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {t("payment.rejecting")}
                  </>
                ) : (
                  t("common.reject")
                )}
              </button>
            </div>
          </div>
        )}

        {receiptHistory.length > 0 && (
          <div className="mt-5 pt-4 border-t border-gray-100">
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-2">
              {t("payment.receiptHistory", {
                count: receiptHistory.length,
              })}
            </p>

            <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
              {receiptHistory.map((h: any) => (
                <div
                  key={h.id}
                  className="p-2.5 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-2"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold text-gray-700">
                        {h.bank_name || t("payment.unknownBank")}
                      </span>

                      <span
                        className={`text-[9px] px-1.5 py-0.2 rounded-full border font-bold uppercase ${
                          h.status === "approved"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-100"
                            : "bg-rose-50 text-rose-700 border-rose-100"
                        }`}
                      >
                        {h.status === "approved"
                          ? t("common.approved")
                          : t("common.rejected")}
                      </span>
                    </div>

                    {h.admin_notes && (
                      <p className="text-[9px] text-rose-600 bg-rose-50/50 px-2 py-0.5 rounded border border-rose-100 mt-1 italic">
                        <span className="text-amber-600 font-semibold">
                          {t("payment.remark")}:
                        </span>{" "}
                        "{h.admin_notes}"
                      </p>
                    )}
                  </div>

                  {h.receipt_image && (
                    <button
                      type="button"
                      onClick={() => onPreviewImage(h.receipt_image)}
                      className="w-10 h-10 rounded-lg overflow-hidden border shrink-0 hover:opacity-80 transition cursor-zoom-in"
                    >
                      <img
                        src={h.receipt_image}
                        alt={t("payment.previousReceipt")}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <ConfirmationModal
        isOpen={showConfirm}
        onClose={() => {
          setShowConfirm(false);
          setPendingAction(null);
        }}
        onConfirm={handleConfirm}
        title={
          pendingAction === "approved"
            ? t("payment.approveBankReceipt")
            : t("payment.rejectBankReceipt")
        }
        description={
          pendingAction === "approved"
            ? t("payment.approveReceiptDescription")
            : t("payment.rejectReceiptDescription")
        }
        confirmText={
          submitting
            ? t("common.processing")
            : pendingAction === "approved"
              ? t("payment.approveReceipt")
              : t("payment.rejectReceipt")
        }
        confirmVariant={pendingAction === "approved" ? "primary" : "danger"}
        loading={submitting}
        autoClose={false}
      >
        {pendingAction === "rejected" && (
          <div className="mt-3">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              {t("payment.rejectionReason")}
            </label>

            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder={t("payment.rejectionNotesPlaceholder")}
              rows={3}
              className="w-full text-xs sm:text-sm border border-gray-200 rounded-xl p-2.5 outline-none focus:ring-2 focus:ring-rose-500/20 focus:border-rose-400 transition resize-none"
            />
          </div>
        )}
      </ConfirmationModal>
    </Card>
  );
};

// ─── Main Component ────────────────────────────────────────
export function ServiceBookingManageModal({
  booking: initialBooking,
  onClose,
  onStatusUpdate,
  companyNotes,
  setCompanyNotes,
  finalPrice,
  setFinalPrice,
  allBookings = [],
  onRefresh,
}: {
  booking: ServiceBooking;
  onClose: () => void;
  onStatusUpdate: (
    booking: ServiceBooking,
    status: ServiceBooking["status"],
  ) => Promise<void>;
  companyNotes?: string;
  setCompanyNotes?: (val: string) => void;
  finalPrice?: string;
  setFinalPrice?: (val: string) => void;
  allBookings?: ServiceBooking[];
  onRefresh?: () => Promise<void>;
}) {
  const { t } = useTranslation("serviceBookingManage");
  const { showToast } = useToast();

  const [actionLoading, setActionLoading] = useState(false);
  const [confirmAction, setConfirmAction] = useState<BookingAction | null>(
    null,
  );
  const [refreshing, setRefreshing] = useState(false);
  const [priceConfirming, setPriceConfirming] = useState(false);
  const modalRef = useRef<HTMLDivElement>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const customer = initialBooking.customer_name || t("common.unknown");
  const customerPhone = initialBooking.customer_phone;
  const company = initialBooking.company;
  const offering = initialBooking.offering;
  const staff = initialBooking.assigned_staff;
  const paymentStatus = initialBooking.payment_status || "pending";
  const paymentMethod = initialBooking.payment_method || "bank_transfer";
  const intakeData = initialBooking.intake_data || {};
  const receipt = initialBooking.receipt;
  const receiptHistory = initialBooking.receipt_history || [];

  const schemaFieldsMap = useMemo(() => {
    const map = new Map<string, any>();
    const schema = (offering as any)?.intake_form_schema;
    if (schema && Array.isArray(schema)) {
      schema.forEach((f: any) => {
        if (f && f.name) {
          map.set(f.name, f);
        }
      });
    }
    return map;
  }, [(offering as any)?.intake_form_schema]);

  const groupedIntakeResponses = useMemo(() => {
    const entries = Object.entries(intakeData);
    if (entries.length === 0) return [];

    const groupMap = new Map<
      string,
      {
        key: string;
        title: string;
        title_am?: string;
        order: number;
        items: Array<{ key: string; value: any; field?: any }>;
      }
    >();

    const defaultKey = "__default__";

    entries.forEach(([key, value], idx) => {
      const field = schemaFieldsMap.get(key);
      const groupTitle = field?.group?.trim() || "";
      const gKey = groupTitle || defaultKey;

      if (!groupMap.has(gKey)) {
        groupMap.set(gKey, {
          key: gKey,
          title: groupTitle,
          title_am: field?.group_am,
          order: typeof field?.group_order === "number" ? field.group_order : idx,
          items: [],
        });
      }

      groupMap.get(gKey)!.items.push({ key, value, field });
    });

    return Array.from(groupMap.values()).sort((a, b) => a.order - b.order);
  }, [intakeData, schemaFieldsMap]);

  const isImageFile = (file: any) => {
    if (!file) return false;
    const mime = typeof file === "object" ? file.type : "";
    const name = typeof file === "object" ? file.name : String(file);
    const url =
      typeof file === "object" ? file.url || file.uri || "" : String(file);
    if (mime && mime.includes("image")) return true;
    return (
      /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(name) ||
      /\.(jpg|jpeg|png|webp|gif|svg)($|\?)/i.test(url)
    );
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes || isNaN(bytes)) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const renderFileItem = (item: any, index: number) => {
    const fileUrl =
      typeof item === "object"
        ? item.url || item.uri
        : typeof item === "string"
        ? item
        : "";
    const fileName =
      typeof item === "object"
        ? item.name || `Attachment ${index + 1}`
        : typeof item === "string"
        ? item.split("/").pop() || item
        : `Attachment ${index + 1}`;
    const fileSize = typeof item === "object" ? item.size : undefined;
    const isImg = isImageFile(item);

    if (isImg && fileUrl) {
      return (
        <div
          key={`${fileName}_${index}`}
          className="flex items-center gap-3 p-2.5 rounded-xl border border-gray-200 bg-white shadow-2xs hover:border-purple-300 transition"
        >
          <div
            onClick={() => setPreviewImage(fileUrl)}
            className="relative group w-14 h-14 rounded-lg overflow-hidden border border-gray-100 bg-gray-50 shrink-0 cursor-zoom-in"
          >
            <img
              src={fileUrl}
              alt={fileName}
              className="w-full h-full object-cover group-hover:scale-105 transition"
            />
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition text-white">
              <ZoomIn className="h-4 w-4" />
            </div>
          </div>

          <div className="flex-1 min-w-0">
            <p
              className="text-xs font-semibold text-gray-800 truncate"
              title={fileName}
            >
              {fileName}
            </p>
            {fileSize && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formatFileSize(fileSize)}
              </p>
            )}
            <div className="flex items-center gap-2 mt-1">
              <button
                type="button"
                onClick={() => setPreviewImage(fileUrl)}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-secondary hover:text-[#5B46A0]"
              >
                <Eye className="h-3 w-3" />
                {t("common.view", { defaultValue: "Preview" })}
              </button>
              <span className="text-gray-300">·</span>
              <a
                href={fileUrl}
                target="_blank"
                rel="noopener noreferrer"
                download={fileName}
                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 hover:text-gray-700"
              >
                <Download className="h-3 w-3" />
                {t("common.download", { defaultValue: "Download" })}
              </a>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        key={`${fileName}_${index}`}
        className="flex items-center justify-between p-2.5 rounded-xl border border-gray-200 bg-white shadow-2xs hover:border-purple-300 transition gap-3"
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-secondary/10 flex items-center justify-center text-secondary shrink-0">
            <FileText className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <p
              className="text-xs font-semibold text-gray-800 truncate"
              title={fileName}
            >
              {fileName}
            </p>
            {fileSize && (
              <p className="text-[11px] text-gray-400 mt-0.5">
                {formatFileSize(fileSize)}
              </p>
            )}
          </div>
        </div>

        {fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            download={fileName}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-200 bg-gray-50 text-xs font-semibold text-secondary hover:bg-purple-50 transition shadow-2xs shrink-0"
          >
            <Download className="h-3.5 w-3.5" />
            <span>{t("common.open", { defaultValue: "Open" })}</span>
          </a>
        ) : (
          <span className="text-xs text-gray-400 italic">No link</span>
        )}
      </div>
    );
  };

  const renderIntakeValue = (value: any, field?: any) => {
    const isFileType =
      field?.type === "file" ||
      (typeof value === "object" &&
        value !== null &&
        !Array.isArray(value) &&
        (value.url || value.uri || value.name)) ||
      (Array.isArray(value) &&
        value.length > 0 &&
        typeof value[0] === "object" &&
        value[0] !== null &&
        (value[0].url || value[0].uri || value[0].name));

    if (isFileType) {
      const filesArray = Array.isArray(value) ? value : [value];
      return (
        <div className="space-y-2 mt-1 w-full">
          {filesArray.map((fileItem, idx) => renderFileItem(fileItem, idx))}
        </div>
      );
    }

    if (Array.isArray(value)) {
      if (value.length === 0)
        return <span className="text-gray-400 italic text-xs">None</span>;
      return (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {value.map((opt, i) => (
            <span
              key={i}
              className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-secondary border border-purple-200/60"
            >
              {String(opt)}
            </span>
          ))}
        </div>
      );
    }

    if (typeof value === "boolean") {
      return value ? (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle className="h-3.5 w-3.5" />
          {t("common.yes", { defaultValue: "Yes" })}
        </span>
      ) : (
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
          <XCircle className="h-3.5 w-3.5" />
          {t("common.no", { defaultValue: "No" })}
        </span>
      );
    }

    if (
      typeof value === "string" &&
      (value.startsWith("http://") || value.startsWith("https://"))
    ) {
      return (
        <a
          href={value}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-xs font-semibold text-secondary hover:underline break-all"
        >
          <span>{value}</span>
          <ExternalLink className="h-3 w-3 shrink-0" />
        </a>
      );
    }

    if (typeof value === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      return (
        <a
          href={`mailto:${value}`}
          className="text-xs font-semibold text-secondary hover:underline"
        >
          {value}
        </a>
      );
    }

    return (
      <span className="font-medium text-gray-800 text-sm whitespace-pre-wrap break-words">
        {String(value ?? "—")}
      </span>
    );
  };

  const isAtHome = initialBooking.location_type === "customer_location";

  const addressText = isAtHome
    ? initialBooking.service_address_text
    : (company as any)?.address;

  const lat = isAtHome
    ? initialBooking.latitude
    : (company as any)?.latitude;

  const lng = isAtHome
    ? initialBooking.longitude
    : (company as any)?.longitude;

  const hasCoordinates =
    lat != null &&
    lng != null &&
    String(lat).trim() !== "" &&
    String(lng).trim() !== "";

  const mapsUrl = useMemo(() => {
    if (hasCoordinates) {
      return `https://www.google.com/maps?q=${lat},${lng}`;
    }

    if (addressText && addressText.trim()) {
      return `https://www.google.com/maps?q=${encodeURIComponent(addressText.trim())}`;
    }

    return null;
  }, [hasCoordinates, lat, lng, addressText]);

  const timeline = buildBookingTimeline(initialBooking, t);

  const allowedActions: BookingAction[] = useMemo(() => {
    const statusToAction: Record<string, BookingAction> = {
      confirmed: "confirm",
      in_progress: "start",
      completed: "complete",
      cancelled: "cancel",
      no_show: "no_show",
    };

    let actions = (ALLOWED_TRANSITIONS[initialBooking.status] || [])
      .map((s) => statusToAction[s])
      .filter(Boolean) as BookingAction[];

    if (
      paymentMethod === "cod" &&
      paymentStatus !== "paid" &&
      initialBooking.status === "in_progress"
    ) {
      actions = actions.filter((a) => a !== "complete");
    }

    return actions;
  }, [initialBooking.status, paymentMethod, paymentStatus]);

  const previousBookings = useMemo(() => {
    if (!allBookings.length || !customerPhone || !company?.id) return [];

    return allBookings
      .filter(
        (b) =>
          b.customer_phone === customerPhone &&
          b.company?.id === company.id &&
          b.id !== initialBooking.id,
      )
      .sort(
        (a, b) =>
          new Date(b.created_at || 0).getTime() -
          new Date(a.created_at || 0).getTime(),
      )
      .slice(0, 10);
  }, [allBookings, customerPhone, company?.id, initialBooking.id]);

  const handleAction = useCallback(
    async (action: BookingAction) => {
      const destructive: BookingAction[] = ["cancel", "no_show"];

      if (destructive.includes(action)) {
        setConfirmAction(action);
        return;
      }

      setActionLoading(true);

      try {
        const statusMap: Record<BookingAction, ServiceBooking["status"]> = {
          confirm: "confirmed",
          start: "in_progress",
          complete: "completed",
          cancel: "cancelled",
          no_show: "no_show",
        };

        await onStatusUpdate(initialBooking, statusMap[action]);
      } finally {
        setActionLoading(false);
      }
    },
    [onStatusUpdate, initialBooking],
  );

  const handleConfirmAction = useCallback(async () => {
    if (!confirmAction) return;

    setActionLoading(true);

    try {
      const statusMap: Record<BookingAction, ServiceBooking["status"]> = {
        confirm: "confirmed",
        start: "in_progress",
        complete: "completed",
        cancel: "cancelled",
        no_show: "no_show",
      };

      await onStatusUpdate(initialBooking, statusMap[confirmAction]);
    } finally {
      setActionLoading(false);
      setConfirmAction(null);
    }
  }, [confirmAction, onStatusUpdate, initialBooking]);

  const handleCODComplete = useCallback(async () => {
    await onStatusUpdate(initialBooking, "completed");
  }, [onStatusUpdate, initialBooking]);

  // ─── Price + Notes Confirm (NEW) ─────────────────────────
  const isInquiryMode = initialBooking.offering?.booking_mode === "inquiry";
  const requiresPrice = isInquiryMode && !!setFinalPrice;
  const canConfirmPrice =
    !requiresPrice || (!!finalPrice && Number(finalPrice) > 0);

  const handlePriceConfirm = useCallback(async () => {
    if (!canConfirmPrice) {
      showToast(
        "error",
        t("price.pleaseEnterValidPrice", {
          defaultValue: "Please enter a valid final price.",
        }),
      );
      return;
    }

    if (actionLoading || priceConfirming) return;

    setPriceConfirming(true);
    try {
      // Same flow as Update Status → Confirm.
      // Parent is expected to persist finalPrice / companyNotes alongside the status change.
      await onStatusUpdate(initialBooking, "confirmed");
    } catch (err: any) {
      showToast(
        "error",
        err?.response?.data?.detail ||
          t("common.somethingWentWrong", {
            defaultValue: "Something went wrong. Please try again.",
          }),
      );
    } finally {
      setPriceConfirming(false);
    }
  }, [
    canConfirmPrice,
    actionLoading,
    priceConfirming,
    onStatusUpdate,
    initialBooking,
    showToast,
    t,
  ]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.addEventListener("keydown", handler);

    return () => document.removeEventListener("keydown", handler);
  }, [onClose]);

  const handleRefresh = async () => {
    setRefreshing(true);

    try {
      if (onRefresh) await onRefresh();
    } finally {
      setRefreshing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 md:p-6">
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-gray-900/60 backdrop-blur-sm"
        onClick={onClose}
      />

      <motion.div
        ref={modalRef}
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="hidden"
        className="relative bg-gradient-to-br from-white via-white to-gray-50/50 w-full max-w-7xl max-h-[92vh] rounded-2xl sm:rounded-[32px] shadow-2xl overflow-hidden flex flex-col border border-white/20"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-secondary/10 backdrop-blur-md border-b border-secondary/15 px-3 sm:px-6 py-3 sm:py-4 sticky top-0 z-20 shadow-sm">
          <div className="flex justify-between items-start gap-2">
            <div className="mt-1.5 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h2 className="text-base sm:text-2xl font-black bg-gradient-to-r from-secondary to-secondary bg-clip-text text-transparent tracking-tight">
                  {t("header.bookingNumber", { id: initialBooking.id })}
                </h2>

                <StatusBadge status={initialBooking.status} large />
              </div>

              <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-[9px] sm:text-xs font-bold">
                <span className="flex items-center gap-1.5 sm:gap-2 bg-secondary/10 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full border border-secondary/20 shadow-sm">
                  <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" />
                  <span className="font-mono text-[10px] sm:text-[12px] font-semibold text-gray-700">
                    {initialBooking.scheduled_date}{" "}
                    <span className="text-secondary mx-0.5">•</span>{" "}
                    {String(initialBooking.scheduled_time).slice(0, 5)}
                  </span>
                </span>

                <span className="flex items-center gap-1 sm:gap-2 bg-gray-100 px-2 sm:px-4 py-1 sm:py-1.5 rounded-full border border-gray-200 shadow-sm">
                  <Clock className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-gray-500" />
                  <span className="font-mono text-[10px] sm:text-[12px] font-semibold text-gray-600">
                    {initialBooking.created_at
                      ? `${new Date(initialBooking.created_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} • ${new Date(initialBooking.created_at).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })}`
                      : "—"}
                  </span>
                </span>

                <span className="flex items-center gap-1 sm:gap-1.5 text-gray-600">
                  <Building className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" />
                  <span className="font-medium text-[10px] sm:text-sm truncate max-w-[120px] sm:max-w-[250px]">
                    {company?.name}
                  </span>
                </span>

                <span
                  className={`flex items-center gap-1.5 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border shadow-sm ${
                    isAtHome
                      ? "bg-amber-50 border-amber-200 text-amber-800"
                      : "bg-emerald-50 border-emerald-200 text-emerald-800"
                  }`}
                >
                  {isAtHome ? (
                    <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-600 shrink-0" />
                  ) : (
                    <Store className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-emerald-600 shrink-0" />
                  )}

                  <span className="font-bold text-[10px] sm:text-[11px] whitespace-nowrap">
                    {isAtHome ? t("location.atHome") : t("location.inShop")}
                  </span>
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              <button
                onClick={handleRefresh}
                disabled={refreshing}
                className="group flex items-center justify-center w-8 h-8 sm:w-auto sm:h-auto sm:px-4 sm:py-2 rounded-xl border border-gray-200 bg-white hover:bg-gray-50 active:scale-95 transition disabled:opacity-60 shadow-sm"
                aria-label={t("common.refresh")}
                title={t("header.refreshBookingData")}
              >
                {refreshing ? (
                  <Loader2 className="h-4 w-4 text-secondary animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4 text-gray-500 group-hover:text-secondary" />
                )}

                <span className="hidden sm:inline text-sm font-medium text-gray-700 ml-1">
                  {t("common.refresh")}
                </span>
              </button>

              <button
                onClick={onClose}
                className="p-2 sm:p-3 rounded-xl bg-white border shadow-sm hover:bg-rose-50 hover:border-rose-200 transition"
                aria-label={t("common.closeModal")}
              >
                <X className="h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              </button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-6 grid grid-cols-1 lg:grid-cols-3 gap-5 sm:gap-6">
          {/* Left Column */}
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card title={t("sections.customer")} icon={User}>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-secondary font-bold border border-purple-100 shadow-inner">
                    {getInitials(customer)}
                  </div>

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {customer}
                    </p>

                    <div className="flex items-center gap-2 mt-1 bg-green-50 text-green-700 px-2 py-1 rounded-lg text-sm">
                      <PhoneCall className="h-3.5 w-3.5 shrink-0" />
                      <span className="truncate">{customerPhone}</span>
                      <CopyButton text={customerPhone} />
                    </div>
                  </div>
                </div>
              </Card>

              <Card title={t("sections.company")} icon={Building}>
                <div className="flex items-center gap-3">
                  {company?.logo && (
                    <img
                      src={company.logo}
                      className="w-10 h-10 rounded-lg object-cover border border-gray-100 shrink-0"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {company?.name}
                    </p>

                    {company?.sub_category_name && (
                      <p className="text-xs text-gray-500 truncate">
                        {company.sub_category_name}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            </div>

            {offering && (
              <Card title={t("sections.service")} icon={Briefcase}>
                <div className="flex gap-4">
                  {offering.primary_image && (
                    <img
                      src={offering.primary_image}
                      className="w-20 h-20 rounded-xl object-cover border shadow-sm shrink-0"
                    />
                  )}

                  <div className="min-w-0">
                    <p className="font-bold text-gray-900 truncate">
                      {offering.title}
                    </p>

                    <p className="text-sm text-gray-500 truncate">
                      {offering.service_category || t("common.uncategorized")}
                    </p>

                    <div className="flex gap-3 mt-2 text-xs">
                      <span className="bg-gray-100 px-2 py-1 rounded-md flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {t("service.durationMinutes", {
                          minutes: offering.duration_minutes,
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            )}

            {/* Service Location Card */}
            <Card
              title={
                isAtHome
                  ? t("location.serviceLocationAtCustomerHome")
                  : t("location.serviceLocationInShop")
              }
              icon={MapPin}
            >
              <div className="space-y-3">
                <div
                  className={`flex items-center justify-between p-3 rounded-xl border ${
                    isAtHome
                      ? "bg-gradient-to-r from-amber-50/80 to-orange-50/80 border-amber-200 text-amber-950"
                      : "bg-gradient-to-r from-emerald-50/80 to-teal-50/80 border-emerald-200 text-emerald-950"
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 ${
                        isAtHome
                          ? "bg-amber-100 text-amber-700"
                          : "bg-emerald-100 text-emerald-700"
                      }`}
                    >
                      {isAtHome ? (
                        <Home className="h-4 w-4" />
                      ) : (
                        <Store className="h-4 w-4" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-wider">
                        {isAtHome
                          ? t("location.customerLocationAtHome")
                          : t("location.inShopProviderStudio")}
                      </p>

                      <p className="text-xs text-gray-600 truncate">
                        {isAtHome
                          ? t("location.specialistTravelsToCustomer")
                          : t("location.customerVisitsCompany")}
                      </p>
                    </div>
                  </div>

                  <span
                    className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-full border shrink-0 ${
                      isAtHome
                        ? "bg-amber-100/80 text-amber-800 border-amber-300"
                        : "bg-emerald-100/80 text-emerald-800 border-emerald-300"
                    }`}
                  >
                    {isAtHome
                      ? t("location.homeDispatch")
                      : t("location.inShopVisit")}
                  </span>
                </div>

                <div className="bg-gray-50/80 rounded-xl p-3.5 border border-gray-100 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 mb-1 text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                        <MapPin className="h-3 w-3 text-secondary" />
                        <span>
                          {isAtHome
                            ? t("location.serviceDeliveryAddress")
                            : t("location.providerStudioAddress")}
                        </span>
                      </div>

                      <p className="text-sm font-semibold text-gray-900 break-words leading-relaxed">
                        {addressText ||
                          (isAtHome
                            ? t("location.noStreetAddress")
                            : t("location.shopAddressNotSpecified"))}
                      </p>
                    </div>

                    {addressText && <CopyButton text={addressText} />}
                  </div>

                  {hasCoordinates && (
                    <div className="flex items-center gap-2 pt-2 border-t border-gray-200/60 text-xs text-gray-600 font-mono">
                      <span className="text-[11px] font-semibold text-gray-400 font-sans">
                        {t("location.gpsCoordinates")}:
                      </span>

                      <span className="bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-700">
                        {lat}, {lng}
                      </span>
                    </div>
                  )}
                </div>

                {initialBooking.customer_notes && (
                  <div className="flex items-start gap-2 bg-purple-50/50 rounded-xl p-3 border border-purple-100">
                    <MessageSquare className="h-4 w-4 text-secondary shrink-0 mt-0.5" />

                    <div className="min-w-0 flex-1">
                      <p className="text-[10px] font-bold text-secondary uppercase tracking-wider">
                        {t("location.customerArrivalNotes")}
                      </p>

                      <p className="text-xs text-gray-700 mt-0.5 italic">
                        "{initialBooking.customer_notes}"
                      </p>
                    </div>
                  </div>
                )}

                {mapsUrl && (
                  <div className="pt-1">
                    <a
                      href={mapsUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-4 py-2 rounded-xl bg-white border border-gray-200 text-gray-700 hover:bg-gray-50 hover:border-secondary/40 hover:text-secondary text-xs font-semibold shadow-sm transition group"
                    >
                      <Navigation className="h-3.5 w-3.5 text-secondary group-hover:scale-110 transition-transform" />

                      <span>
                        {isAtHome
                          ? t("location.openCustomerDestinationInMaps")
                          : t("location.openShopLocationInMaps")}
                      </span>

                      <ExternalLink className="h-3 w-3 text-gray-400 group-hover:text-secondary ml-1" />
                    </a>
                  </div>
                )}
              </div>
            </Card>

            {/* Timeline */}
            {timeline.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary/20 rounded-lg shadow-inner">
                    <History className="h-4 w-4 text-secondary" />
                  </div>

                  <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary bg-clip-text text-transparent">
                    {t("sections.bookingTimeline")}
                  </h4>

                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {t("common.steps", { count: timeline.length })}
                  </span>
                </div>

                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-2 top-2 bottom-2 w-0.5 bg-gray-200" />

                  {timeline.map((entry) => (
                    <div
                      key={entry.id}
                      className="relative flex items-start gap-4"
                    >
                      <div
                        className={`absolute left-[-20px] top-1 w-4 h-4 rounded-full border-2 ${
                          entry.status === "completed"
                            ? "bg-emerald-500 border-emerald-500"
                            : "bg-amber-500 border-amber-500 animate-pulse"
                        }`}
                      />

                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-sm font-bold text-gray-900">
                            {entry.icon} {entry.label}
                          </span>
                        </div>

                        <div className="flex flex-wrap items-center gap-3 mt-0.5">
                          <span className="text-xs text-gray-400 font-mono">
                            {new Date(entry.time).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                              year: "numeric",
                            })}{" "}
                            •{" "}
                            {new Date(entry.time).toLocaleTimeString("en-US", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>

                          {entry.actor && (
                            <span className="text-xs text-gray-500 flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {entry.actor}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Intake Responses */}
            {groupedIntakeResponses.length > 0 && (
              <Card title={t("sections.intakeResponses")} icon={FileText}>
                <div className="space-y-4">
                  {groupedIntakeResponses.map((group) => {
                    const isDefault = !group.title;
                    return (
                      <div
                        key={group.key}
                        className={
                          !isDefault
                            ? "rounded-2xl border border-purple-100 bg-purple-50/20 p-4 space-y-3"
                            : "space-y-3"
                        }
                      >
                        {!isDefault && (
                          <div className="flex items-center gap-2 pb-2 border-b border-purple-100">
                            <Layers className="h-4 w-4 text-secondary" />
                            <h4 className="text-xs font-bold text-gray-900 uppercase tracking-wider">
                              {group.title}
                            </h4>
                            {group.title_am && (
                              <span className="text-xs text-gray-500 font-medium">
                                ({group.title_am})
                              </span>
                            )}
                          </div>
                        )}

                        <div className="divide-y divide-gray-100">
                          {group.items.map(({ key, value, field }) => {
                            const label = field?.label || key.replace(/_/g, " ");
                            const labelAm = field?.label_am;
                            const isComplex =
                              field?.type === "file" ||
                              Array.isArray(value) ||
                              (typeof value === "object" && value !== null) ||
                              (typeof value === "string" && value.length > 40);

                            return (
                              <div
                                key={key}
                                className={`py-2.5 text-sm ${
                                  isComplex
                                    ? "flex flex-col gap-1.5"
                                    : "flex justify-between items-center gap-4"
                                }`}
                              >
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-medium text-gray-600 capitalize">
                                    {label}
                                  </span>
                                  {labelAm && (
                                    <span className="text-[11px] text-gray-400">
                                      ({labelAm})
                                    </span>
                                  )}
                                </div>

                                <div className={isComplex ? "w-full" : "text-right"}>
                                  {renderIntakeValue(value, field)}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Booking History */}
            {previousBookings.length > 0 && (
              <motion.div
                variants={itemVariants}
                className="bg-white rounded-3xl border border-gray-100 p-4 md:p-6 shadow-sm"
              >
                <div className="flex items-center gap-2 mb-4 pb-2 border-b border-gray-100">
                  <div className="p-1.5 bg-gradient-to-br from-secondary/20 to-secondary/20 rounded-lg shadow-inner">
                    <History className="h-4 w-4 text-secondary" />
                  </div>

                  <h4 className="text-sm font-bold bg-gradient-to-r from-secondary to-secondary bg-clip-text text-transparent">
                    {t("sections.customerBookingHistory")}
                  </h4>

                  <span className="ml-auto text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">
                    {t("common.bookings", {
                      count: previousBookings.length,
                    })}
                  </span>
                </div>

                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                  {previousBookings.map((b) => (
                    <div
                      key={b.id}
                      className="flex items-center justify-between p-3 rounded-xl border border-gray-100 hover:bg-gray-50 hover:border-secondary/30 transition cursor-pointer group"
                    >
                      <div className="flex flex-col min-w-0">
                        <span className="text-sm font-bold text-secondary">
                          #{b.id}
                        </span>

                        {b.company?.name && (
                          <span className="text-[10px] text-gray-500 truncate max-w-[120px] sm:max-w-[200px]">
                            {b.company.name}
                          </span>
                        )}

                        <span className="text-[10px] text-gray-400 font-mono">
                          {b.created_at
                            ? new Date(b.created_at).toLocaleDateString(
                                "en-US",
                                {
                                  month: "short",
                                  day: "numeric",
                                  year: "numeric",
                                },
                              )
                            : "—"}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <StatusBadge status={b.status} />

                        <span className="text-xs text-secondary opacity-0 group-hover:opacity-100 transition">
                          {t("common.view")} →
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-5">
            {/* Price Card */}
            <motion.div
              variants={itemVariants}
              className="bg-secondary rounded-[32px] p-5 text-white shadow-2xl shadow-purple-200 relative overflow-hidden group"
            >
              <div className="absolute -right-10 -top-10 w-40 h-40 bg-white/10 rounded-full blur-xl group-hover:scale-110 transition-transform duration-700" />
              <div className="absolute -left-20 -bottom-20 w-60 h-60 bg-white/5 rounded-full blur-2xl" />

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-4">
                  <div className="h-10 w-10 bg-white/10 rounded-xl flex items-center justify-center backdrop-blur-md">
                    <Tag className="h-5 w-5" />
                  </div>

                  <div className="text-right">
                    {initialBooking.offering?.booking_mode === "direct" ? (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                          {t("price.finalPrice")}
                        </p>
                        <h3 className="text-2xl font-black">
                          {formatCurrency(
                            initialBooking.final_price || initialBooking.quoted_price,
                          )}{" "}
                          {initialBooking.currency}
                        </h3>
                      </>
                    ) : (
                      <>
                        <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-60">
                          {t("price.quotedPrice")}
                        </p>
                        <h3 className="text-2xl font-black">
                          {Number(initialBooking.quoted_price || 0) > 0
                            ? `${formatCurrency(initialBooking.quoted_price)} ${initialBooking.currency}`
                            : "Pending Quote"}
                        </h3>
                      </>
                    )}
                  </div>
                </div>

                {initialBooking.offering?.booking_mode !== "direct" && (
                  <div className="space-y-2 pt-3 border-t border-white/10">
                    <div className="flex justify-between text-xs font-bold">
                      <span className="opacity-60">
                        {t("price.finalPrice")}
                      </span>

                      <span>
                        {initialBooking.final_price && Number(initialBooking.final_price) > 0
                          ? `${formatCurrency(initialBooking.final_price)} ${initialBooking.currency}`
                          : "Awaiting Quote"}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Payment & Receipt Review */}
            <ReceiptReviewCard
              receipt={receipt}
              paymentMethod={paymentMethod}
              paymentStatus={paymentStatus}
              onUpdate={async () => {
                if (onRefresh) await onRefresh();
              }}
              receiptHistory={receiptHistory}
              onPreviewImage={setPreviewImage}
              bookingStatus={initialBooking.status}
              bookingId={initialBooking.id}
              companySlug={company?.slug || ""}
              onCODComplete={handleCODComplete}
            />

            {/* Assigned Staff */}
            {staff && (
              <Card title={t("sections.assignedStaff")} icon={User}>
                <div className="flex items-center gap-3">
                  {staff.avatar ? (
                    <img
                      src={staff.avatar}
                      className="w-10 h-10 rounded-full object-cover border border-gray-100 shadow-sm shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 flex items-center justify-center text-secondary font-bold border border-purple-100 shadow-inner shrink-0">
                      {getInitials(staff.name)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="font-semibold text-gray-800 truncate">
                      {staff.name}
                    </p>

                    <p className="text-xs text-gray-500 truncate">
                      {staff.role_title || t("common.staff")}
                    </p>
                  </div>
                </div>
              </Card>
            )}

            {/* Quote / Final Price & Provider Notes — with inline Confirm */}
            {!["completed", "cancelled", "no_show","confirmed"].includes(initialBooking.status) &&
              (setFinalPrice || setCompanyNotes) && (
                <Card
                  title={
                    initialBooking.offering?.booking_mode === "inquiry"
                      ? t("price.setFinalQuoteAndNotes", {
                          defaultValue: "Set Final Quote & Notes",
                        })
                      : t("price.providerNotes", {
                          defaultValue: "Provider Notes",
                        })
                  }
                  icon={Tag}
                >
                  <div className="space-y-3">
                    {initialBooking.offering?.booking_mode === "inquiry" &&
                      setFinalPrice && (
                        <div>
                          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                            {t("price.finalPrice")} (
                            {initialBooking.currency || "ETB"})
                          </label>
                          <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={finalPrice ?? ""}
                            onChange={(e) => setFinalPrice(e.target.value)}
                            placeholder={t("price.enterFinalPrice", {
                              defaultValue: "Enter final quoted price...",
                            })}
                            className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-secondary"
                          />
                          <p className="text-[11px] text-gray-400 mt-1">
                            {t("price.customerWillBeNotifiedOfFinalPrice", {
                              defaultValue:
                                "The customer will be notified of this final price and can pay from their booking details.",
                            })}
                          </p>
                        </div>
                      )}
                    {setCompanyNotes && (
                      <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                          {t("price.notesToCustomer", {
                            defaultValue: "Notes to Customer",
                          })}
                        </label>
                        <textarea
                          rows={2}
                          value={companyNotes ?? ""}
                          onChange={(e) => setCompanyNotes(e.target.value)}
                          placeholder={t("price.notesToCustomerPlaceholder", {
                            defaultValue:
                              "Instructions, breakdown, or quote details...",
                          })}
                          className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-secondary resize-none"
                        />
                      </div>
                    )}

                    {/* ✅ Inline Confirm Final Price & Booking */}
                {initialBooking.status === "pending" && isInquiryMode && (

                      <>
                        <button
                          type="button"
                          onClick={handlePriceConfirm}
                          disabled={
                            priceConfirming || actionLoading || !canConfirmPrice
                          }
                          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-secondary text-white text-sm font-bold shadow-md hover:bg-[#5B46A0] hover:shadow-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          title={
                            requiresPrice && !canConfirmPrice
                              ? t("price.enterPriceToConfirm", {
                                  defaultValue:
                                    "Enter a final price before confirming.",
                                })
                              : undefined
                          }
                        >
                          {priceConfirming ? (
                            <>
                              <Loader2 className="h-4 w-4 animate-spin" />
                              {t("common.processing")}
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4" />
                              {t("price.confirmFinalPriceAndBooking", {
                                defaultValue: "Confirm Final Price",
                              })}
                            </>
                          )}
                        </button>
                        <p className="text-[11px] text-gray-400 text-center">
                          {t("price.confirmSavesAndConfirms", {
                            defaultValue:
                              "Saves the price & notes, then moves this booking to Confirmed.",
                          })}
                        </p>
                      </>
                    )}
                  </div>
                </Card>
              )}

            {/* Status Update */}
            {initialBooking.status !== "pending"  && (
            <Card title={t("sections.updateStatus")} icon={AlertCircle}>
              <div className="flex flex-wrap gap-2">
                {allowedActions.map((action) => (
                  <motion.button
                    key={action}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleAction(action)}
                    disabled={actionLoading}
                    className={`inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-semibold transition disabled:opacity-50 ${
                      ["cancel", "no_show"].includes(action)
                        ? "bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100"
                        : action === "complete"
                          ? "bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100"
                          : "bg-purple-50 text-secondary border border-purple-200 hover:bg-purple-100"
                    }`}
                  >
                    {action === "confirm" && (
                      <CheckCircle className="h-4 w-4" />
                    )}

                    {action === "start" && (
                      <Loader2 className="h-4 w-4" />
                    )}

                    {action === "complete" && (
                      <CheckCircle className="h-4 w-4" />
                    )}

                    {action === "cancel" && (
                      <XCircle className="h-4 w-4" />
                    )}

                    {action === "no_show" && (
                      <AlertCircle className="h-4 w-4" />
                    )}

                    <span className="capitalize whitespace-nowrap">
                      {t(`actions.${action}`)}
                    </span>
                  </motion.button>
                ))}

                {allowedActions.length === 0 && (
                  <p className="text-sm text-gray-400">
                    {t("actions.noActionsAvailable")}
                  </p>
                )}
              </div>

              {actionLoading && (
                <Loader2 className="h-5 w-5 animate-spin mx-auto mt-3 text-secondary" />
              )}
            </Card>
            )}
          </div>
        </div>
      </motion.div>

      {/* Full-screen receipt image viewer */}
      <AnimatePresence>
        {previewImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 flex items-center justify-center p-4"
            onClick={() => setPreviewImage(null)}
          >
            <button
              onClick={() => setPreviewImage(null)}
              className="absolute top-6 right-6 p-3 bg-white/10 rounded-full text-white hover:bg-white/20 hover:scale-110 transition-all duration-300 backdrop-blur-sm z-10"
            >
              <X className="h-6 w-6" />
            </button>

            <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-black/50 backdrop-blur-sm px-4 py-2 rounded-full text-white/70 text-xs font-medium flex items-center gap-2">
              <ZoomIn className="h-3.5 w-3.5" />
              <span>{t("receiptViewer.clickAnywhereToClose")}</span>
            </div>

            <motion.img
              src={previewImage}
              alt={t("payment.receiptImage")}
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="max-w-[90vw] max-h-[90vh] object-contain rounded-2xl shadow-2xl ring-1 ring-white/10"
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm destructive action */}
      <AnimatePresence>
        {confirmAction && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              className="bg-white rounded-3xl shadow-2xl max-w-md w-full p-6"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                </div>

                <h3 className="text-xl font-bold">
                  {confirmAction === "cancel"
                    ? t("confirmation.cancelBooking")
                    : t("confirmation.markAsNoShow")}
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                {t("confirmation.destructiveActionWarning")}
              </p>

              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setConfirmAction(null)}
                  className="px-5 py-2.5 text-sm font-semibold text-gray-700 bg-white border rounded-xl hover:bg-gray-50"
                >
                  {t("confirmation.keepBooking")}
                </button>

                <button
                  onClick={handleConfirmAction}
                  disabled={actionLoading}
                  className="px-5 py-2.5 text-sm font-semibold text-white bg-red-600 rounded-xl hover:bg-red-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {actionLoading ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <XCircle className="h-4 w-4" />
                  )}{" "}
                  {t("confirmation.confirmAction", {
                    action: t(`actions.${confirmAction}`),
                  })}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}