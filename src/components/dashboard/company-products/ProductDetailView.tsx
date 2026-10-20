import { useState } from "react";
import {
  ArrowLeft,
  BadgeDollarSign,
  Barcode,
  Boxes,
  Edit,
  Package,
  Star,
  Tag,
  UtensilsCrossed,
  TrendingUp,
  TrendingDown,
  XCircle,
  Sparkles,
} from "lucide-react";
import type { Product } from "./ProductTable";
import MealCategoryIcon from "../../ui/MealCategoryIcon";

interface ProductDetailViewProps {
  product: Product;
  companyName?: string;
  onBack: () => void;
  onEdit?: (product: Product) => void;
}

/* ─────────────────────────────────────────────
   Small reusable pieces
   ───────────────────────────────────────────── */

const InfoTile = ({
  label,
  value,
  icon: Icon,
  accent = "default",
}: {
  label: string;
  value: string | number;
  icon?: React.ElementType;
  accent?: "default" | "primary" | "success" | "warning" | "danger";
}) => {
  const accentMap = {
    default: "bg-white border-gray-100",
    primary: "bg-secondary/[0.04] border-secondary/15",
    success: "bg-emerald-50/70 border-emerald-200",
    warning: "bg-amber-50/70 border-amber-200",
    danger: "bg-red-50/70 border-red-200",
  };

  const iconColorMap = {
    default: "bg-gray-100 text-gray-500",
    primary: "bg-secondary/10 text-secondary",
    success: "bg-emerald-100 text-emerald-600",
    warning: "bg-amber-100 text-amber-600",
    danger: "bg-red-100 text-red-600",
  };

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-3 sm:p-3.5 ${accentMap[accent]} transition-colors`}
    >
      {Icon && (
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${iconColorMap[accent]}`}
        >
          <Icon className="h-4 w-4" />
        </span>
      )}
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-500">
          {label}
        </p>
        <p className="mt-0.5 truncate text-sm font-bold text-gray-900">
          {value}
        </p>
      </div>
    </div>
  );
};

const StatusPill = ({
  tone,
  icon: Icon,
  children,
}: {
  tone: "success" | "warning" | "danger" | "neutral" | "info";
  icon?: React.ElementType;
  children: React.ReactNode;
}) => {
  const toneMap = {
    success: "bg-emerald-50 text-emerald-700 border-emerald-200",
    warning: "bg-amber-50 text-amber-700 border-amber-200",
    danger: "bg-red-50 text-red-700 border-red-200",
    neutral: "bg-gray-100 text-gray-600 border-gray-200",
    info: "bg-secondary/[0.06] text-secondary border-secondary/20",
  };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold ${toneMap[tone]}`}
    >
      {Icon && <Icon className="h-3 w-3" />}
      {children}
    </span>
  );
};

/* ─────────────────────────────────────────────
   Main component
   ───────────────────────────────────────────── */

export function ProductDetailView({
  product,
  companyName,
  onBack,
  onEdit,
}: ProductDetailViewProps) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = product.image || product.image_url;
  const rating = Number(product.average_rating || 0);
  const reviews = product.total_reviews || 0;
  const currency = product.currency || "ETB";

  const stockStatus =
    product.stock === 0
      ? { tone: "danger" as const, icon: XCircle, label: "Out of stock" }
      : product.stock < 10
        ? { tone: "warning" as const, icon: TrendingDown, label: "Low stock" }
        : { tone: "success" as const, icon: TrendingUp, label: "In stock" };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 overflow-hidden">
      {/* ─────────── Header ─────────── */}
      <div className="sticky top-0 z-10 bg-white/95 backdrop-blur-sm border-b border-gray-100">
        <div className="flex items-center justify-between gap-3 px-4 sm:px-6 py-3.5 sm:py-4">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              onClick={onBack}
              aria-label="Back to products"
              title="Back to products"
              className="flex h-9 w-9 sm:h-10 sm:w-10 flex-shrink-0 items-center justify-center rounded-xl border border-gray-200 text-gray-600 transition hover:bg-gray-50 hover:text-gray-900 active:scale-95"
            >
              <ArrowLeft className="h-4 w-4" />
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] font-medium uppercase tracking-wider text-gray-400">
                <span className="truncate">
                  {companyName || "Company"}
                </span>
                <span className="text-gray-300">/</span>
                <span className="truncate">Product</span>
              </div>
              <h2 className="mt-0.5 truncate text-base sm:text-xl font-bold tracking-tight text-secondary">
                {product.title}
              </h2>
            </div>
          </div>

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-secondary px-3 sm:px-4 py-2 text-xs sm:text-sm font-semibold text-white shadow-sm transition hover:bg-secondary/90 hover:shadow-md active:scale-95"
            >
              <Edit className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden xs:inline">Edit</span>
            </button>
          )}
        </div>
      </div>

      {/* ─────────── Body ─────────── */}
      <div className="p-4 sm:p-6">
        <div className="grid gap-5 lg:gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
          {/* ═══ Left column: Image + status ═══ */}
          <div className="space-y-4">
            {/* Image */}
            <div className="relative overflow-hidden rounded-2xl border border-gray-100 bg-gradient-to-br from-gray-50 to-white">
              <div className="flex aspect-square items-center justify-center p-4">
                {imageUrl && !imageError ? (
                  <img
                    src={imageUrl}
                    alt={product.title}
                    className="max-h-full w-full object-contain"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-gray-300">
                    <Package className="h-14 w-14" strokeWidth={1.5} />
                    <span className="text-xs font-medium">No image</span>
                  </div>
                )}
              </div>

              {/* Featured badge on image */}
              {product.is_featured && (
                <div className="absolute top-3 right-3">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/95 backdrop-blur-sm border border-amber-200 px-2.5 py-1 text-[10px] font-bold text-amber-700 shadow-sm">
                    <Sparkles className="h-3 w-3" />
                    FEATURED
                  </span>
                </div>
              )}
            </div>

            {/* Status pills */}
            <div className="flex flex-wrap gap-2">
              <StatusPill tone={stockStatus.tone} icon={stockStatus.icon}>
                {stockStatus.label}
              </StatusPill>

              <StatusPill
                tone={product.is_featured ? "info" : "neutral"}
                icon={product.is_featured ? Star : undefined}
              >
                {product.is_featured ? "Featured" : "Not featured"}
              </StatusPill>
            </div>

            {/* Price block — highlighted */}
            <div className="rounded-2xl border border-secondary/15 bg-gradient-to-br from-secondary/[0.05] to-secondary/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-secondary/60">
                Price
              </p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-secondary">
                {Number(product.price || 0).toLocaleString()}
                <span className="ml-1.5 text-sm font-bold text-secondary/70">
                  {currency}
                </span>
              </p>
              {product.unit && (
                <p className="mt-1 text-[11px] text-secondary/60">
                  per {product.unit === "pc" ? "piece" : product.unit}
                </p>
              )}
            </div>
          </div>

          {/* ═══ Right column: Details ═══ */}
          <div className="min-w-0 space-y-5">
            {/* Quick stats grid */}
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3 lg:grid-cols-3">
              <InfoTile
                label="SKU"
                value={product.sku || "—"}
                icon={Barcode}
                accent="primary"
              />
              <InfoTile
                label="Stock"
                value={`${product.stock} ${product.unit === "pc" ? "pcs" : product.unit || "units"}`}
                icon={Boxes}
                accent={stockStatus.tone === "danger" ? "danger" : stockStatus.tone === "warning" ? "warning" : "success"}
              />
              <InfoTile
                label="Rating"
                value={reviews > 0 ? `${rating.toFixed(1)} ★` : "No reviews"}
                icon={Star}
                accent="default"
              />
              <InfoTile
                label="Currency"
                value={currency}
                icon={BadgeDollarSign}
              />
              <InfoTile
                label="Unit"
                value={product.unit === "pc" ? "pcs" : product.unit || "—"}
                icon={Package}
              />
              <InfoTile
                label="Reviews"
                value={reviews > 0 ? `${reviews} total` : "—"}
                icon={Star}
              />
            </div>

            {/* Product information card */}
            <div className="rounded-2xl border border-gray-100 bg-white p-4 sm:p-5">
              <div className="flex items-center gap-2">
                <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-secondary/10 text-secondary">
                  <Tag className="h-4 w-4" />
                </span>
                <h3 className="text-sm font-bold text-gray-900">
                  Product information
                </h3>
              </div>

              <div className="mt-4 space-y-4 text-sm">
                {product.description && (
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                      Description
                    </p>
                    <p className="mt-1.5 whitespace-pre-wrap leading-relaxed text-gray-700">
                      {product.description}
                    </p>
                  </div>
                )}

                <div className="grid gap-2.5 sm:grid-cols-2">
                  {product.category && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                      <Tag className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Category
                        </p>
                        <p className="mt-0.5 truncate font-semibold text-gray-800">
                          {product.category}
                        </p>
                      </div>
                    </div>
                  )}

                  {product.brand && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                      <Boxes className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Brand
                        </p>
                        <p className="mt-0.5 truncate font-semibold text-gray-800">
                          {product.brand}
                        </p>
                      </div>
                    </div>
                  )}

                  {product.barcode && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3">
                      <Barcode className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                          Barcode
                        </p>
                        <p className="mt-0.5 break-all font-mono text-xs font-semibold text-gray-800">
                          {product.barcode}
                        </p>
                      </div>
                    </div>
                  )}

                  {Array.isArray(product.meal_periods) &&
                    product.meal_periods.length > 0 && (
                      <div className="flex items-start gap-2.5 rounded-xl border border-gray-100 bg-gray-50/60 p-3 sm:col-span-2">
                        <UtensilsCrossed className="mt-0.5 h-4 w-4 shrink-0 text-gray-400" />
                        <div className="min-w-0">
                          <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
                            Meal Availability
                          </p>
                          <div className="mt-2 flex flex-wrap gap-1.5">
                            {product.meal_periods.map((mp) => (
                              <span
                                key={mp}
                                className="inline-flex items-center gap-1.5 rounded-lg border border-secondary/15 bg-secondary/[0.06] px-2 py-1 text-[11px] font-semibold capitalize text-secondary"
                              >
                                <MealCategoryIcon
                                  icon={mp}
                                  className="w-3.5 h-3.5 shrink-0"
                                />
                                <span>{mp.replace(/-/g, " ")}</span>
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                </div>

                {!product.description &&
                  !product.category &&
                  !product.brand &&
                  !product.barcode && (
                    <div className="flex items-center gap-2 rounded-xl border border-dashed border-gray-200 bg-gray-50/50 px-3.5 py-4">
                      <Package className="h-4 w-4 text-gray-400" />
                      <p className="text-sm text-gray-500">
                        No additional product information available.
                      </p>
                    </div>
                  )}
              </div>
            </div>

            {/* Rating callout */}
            <div className="flex items-center gap-3 rounded-2xl border border-amber-100 bg-gradient-to-r from-amber-50/70 to-white p-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-600">
                <Star className="h-5 w-5 fill-amber-400 text-amber-500" />
              </span>
              <div className="min-w-0">
                <p className="text-sm font-bold text-gray-900">
                  {reviews > 0
                    ? `${rating.toFixed(1)} average rating`
                    : "No reviews yet"}
                </p>
                <p className="mt-0.5 text-xs text-gray-500">
                  {reviews > 0
                    ? `Based on ${reviews} customer review${reviews === 1 ? "" : "s"}.`
                    : "Be the first to review this product."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}