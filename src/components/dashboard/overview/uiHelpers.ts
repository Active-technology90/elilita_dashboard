import i18n from "../../../i18n";

// src/components/admin/overview/components/uiHelpers.ts
const resolveLanguage = (language?: string): string =>
  language || i18n.resolvedLanguage || i18n.language || "en";
// const CHART_COLORS = ["var(--color-secondary)", "#9B7DD4", "#B794F4", "#D6BCFA", "#E9D8FD"];
export const CHART_COLORS = [
  "#6366F1", // indigo
  "#10B981", // emerald
  "#F59E0B", // amber
  "#EF4444", // red
  "#8B5CF6", // violet
  "#06B6D4", // cyan
  "#EC4899", // pink
];

export const formatCurrency = (
  amount: number,
  language?: string,
): string => {
  const lang = resolveLanguage(language);
  const isAmharic = lang.startsWith("am"); // ✅ "am-ET" also matches now

  const formattedAmount = new Intl.NumberFormat(
    isAmharic ? "am-ET" : "en-US",
    {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    },
  ).format(amount);

  return isAmharic ? `${formattedAmount} ብር` : `ETB ${formattedAmount}`;
};

export const formatDate = (
  dateString: string,
  language?: string,
): string => {
  const lang = resolveLanguage(language);
  const isAmharic = lang.startsWith("am");

  return new Date(dateString).toLocaleDateString(
    isAmharic ? "am-ET" : "en-US",
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    },
  );
};


export const statusClass = (status: string) => {
  const s = status.toLowerCase();
  if (s === "completed" || s === "paid")
    return "bg-emerald-100 text-emerald-800";
  if (s === "pending") return "bg-amber-100 text-amber-800";
  if (s === "cancelled") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-800";
};

export const paymentStatusClass = (ps: string) => {
  const p = ps?.toLowerCase();
  if (p === "paid") return "bg-emerald-100 text-emerald-800";
  if (p === "checkout initiated") return "bg-gray-100 text-gray-700";
  if (p === "verifying receipt") return "bg-orange-100 text-orange-800";
  if (p === "cancelled") return "bg-red-100 text-red-800";
  return "bg-gray-100 text-gray-600";
};

// Get meaningful color for each order status
export const getStatusColor = (statusName: string): string => {
  const s = statusName.toLowerCase();

  if (s.includes("paid") || s.includes("approved") || s.includes("success"))
    return "#10B981"; // green

  if (s.includes("cancell") || s.includes("reject") || s.includes("failed"))
    return "#EF4444"; // red

  if (s.includes("pending") || s.includes("waiting")) return "#F59E0B"; // amber

  if (s.includes("verify") || s.includes("review") || s.includes("check"))
    return "#F97316"; // orange

  if (s.includes("process") || s.includes("shipp") || s.includes("confirm"))
    return "#3B82F6"; // blue

  if (s.includes("out for delivery") || s.includes("on the way"))
    return "#8B5CF6"; // purple

  if (s.includes("delivered") || s.includes("completed")) return "#059669"; // emerald

  // Fallback: generate consistent color from name hash
  let hash = 0;
  for (let i = 0; i < statusName.length; i++) {
    hash = (hash << 5) - hash + statusName.charCodeAt(i);
    hash |= 0;
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 70%, 55%)`;
};