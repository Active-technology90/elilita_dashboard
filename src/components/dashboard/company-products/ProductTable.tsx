import { useState } from "react";
import { Package, Edit, Trash2, Star, Eye } from "lucide-react";
import { useTranslation } from "react-i18next";
import { DataTable, type Column } from "../../ui/DataTable";
import MealCategoryIcon from "../../ui/MealCategoryIcon";
import { localizeField, translateUnit } from "../../../utils/localized";

export interface Product {
  id: number;
  sku: string;
  title: string;
  title_am?: string;              // ← added
  description?: string;
  description_am?: string;        // ← added
  price: number | null;
  currency?: string;
  stock: number;
  unit: string;
  is_price_on_request?: boolean;
  is_made_to_order?: boolean;
  lead_time_days?: number | null;
  image?: string;
  image_url?: string;
  is_featured?: boolean;
  average_rating?: string | number;
  total_reviews?: number;
  category?: string;
  brand?: string;
  barcode?: string;
  meal_periods?: string[];
  created_at?: string;
  updated_at?: string;
}

interface ProductTableProps {
  products: Product[];
  totalItems: number;
  loading: boolean;
  onView?: (product: Product) => void;
  onEdit?: (product: Product) => void;
  onDelete?: (id: number, title: string) => void;
}

function StockBadge({ stock, isMadeToOrder }: { stock: number; isMadeToOrder?: boolean }) {
  if (isMadeToOrder) {
    return (
      <span className="inline-flex rounded-full border border-purple-200 bg-purple-50 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
        Made to Order
      </span>
    );
  }
  let color = "bg-green-100 text-green-800";
  if (stock === 0) color = "bg-red-100 text-red-800";
  else if (stock < 10) color = "bg-yellow-100 text-yellow-800";

  return (
    <span
      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${color}`}
    >
      {stock}
    </span>
  );
}

function RatingDisplay({
  rating,
  reviews,
}: {
  rating: number;
  reviews: number;
}) {
  const { t } = useTranslation("product");
  const safeRating = Number(rating || 0);

  if (!reviews) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500 sm:text-xs">
        {t("productTable.noReviews")}
      </span>
    );
  }

  return (
    <>
      <div className="flex items-center gap-1 sm:hidden">
        <Star className="h-3.5 w-3.5 fill-yellow-400 text-yellow-400" />
        <span className="text-xs font-medium text-gray-700">
          {safeRating.toFixed(1)}
        </span>
      </div>

      <div className="hidden items-center gap-1 sm:flex">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`h-3.5 w-3.5 ${
              star <= Math.round(safeRating)
                ? "fill-yellow-400 text-yellow-400"
                : "text-gray-300"
            }`}
          />
        ))}
        <span className="ml-1 text-xs text-gray-600">
          {safeRating.toFixed(1)}
        </span>
        <span className="text-xs text-gray-400">({reviews})</span>
      </div>
    </>
  );
}

function ProductImage({ src, alt }: { src?: string; alt: string }) {
  const [error, setError] = useState(false);

  if (!src || error) {
    return (
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gray-100 sm:h-10 sm:w-10">
        <Package className="h-3.5 w-3.5 text-gray-400 sm:h-5 sm:w-5" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="h-7 w-7 rounded-lg border border-gray-200 object-cover sm:h-10 sm:w-10"
      onError={() => setError(true)}
    />
  );
}

export function ProductTable({
  products,
  totalItems,
  loading,
  onView,
  onEdit,
  onDelete,
}: ProductTableProps) {
  const { t, i18n } = useTranslation("product");

  const columns: Column<Product>[] = [
    {
      key: "image",
      header: t("productTable.columns.image"),
      className: "whitespace-nowrap",
      render: (product) => (
        <ProductImage
          src={product.image || product.image_url}
          alt={localizeField(product.title, product.title_am, i18n.language)}
        />
      ),
    },
    {
      key: "sku",
      header: t("productTable.columns.sku"),
      className: "whitespace-nowrap font-mono text-[11px] sm:text-sm",
    },
    {
      key: "title",
      header: t("productTable.columns.title"),
      className: "max-w-[200px] font-medium text-gray-900",
      render: (product) => {
        const displayTitle = localizeField(
          product.title,
          product.title_am,
          i18n.language,
        );
        return (
          <div className="max-w-[200px]">
            <span
              className="block truncate font-medium text-gray-900"
              title={displayTitle}
            >
              {displayTitle}
            </span>
            {Array.isArray(product.meal_periods) &&
              product.meal_periods.length > 0 && (
                <div className="mt-1 flex flex-wrap gap-1">
                  {product.meal_periods.map((mp) => (
                    <span
                      key={mp}
                      className="inline-flex items-center gap-1 rounded bg-secondary/10 px-1.5 py-0.5 text-[9px] font-medium text-secondary capitalize"
                    >
                      <MealCategoryIcon
                        icon={mp}
                        className="w-2.5 h-2.5 shrink-0"
                      />
                      <span>{mp.replace(/-/g, " ")}</span>
                    </span>
                  ))}
                </div>
              )}
          </div>
        );
      },
    },
    {
      key: "price",
      header: t("productTable.columns.price"),
      className: "whitespace-nowrap text-right",
      render: (product) => {
        if (product.is_price_on_request) {
          return (
            <div className="flex items-center justify-end">
              <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                Price on Request
              </span>
            </div>
          );
        }
        const currency = product.currency || "ETB";
        const numericPrice = typeof product.price === "number" ? product.price : parseFloat(String(product.price || 0));
        return (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[11px] font-medium text-gray-900 sm:text-sm">
              {numericPrice.toLocaleString()}
            </span>
            <span
              className={`inline-flex items-center rounded px-1.5 py-0.5 text-[9px] font-semibold sm:text-[10px] ${
                currency === "ETB"
                  ? "bg-green-100 text-green-700"
                  : currency === "USD"
                    ? "bg-blue-100 text-blue-700"
                    : currency === "EUR"
                      ? "bg-orange-100 text-orange-700"
                      : "bg-gray-100 text-gray-600"
              }`}
            >
              {currency}
            </span>
          </div>
        );
      },
    },
    {
      key: "rating",
      header: t("productTable.columns.rating"),
      className: "whitespace-nowrap",
      render: (product) => (
        <RatingDisplay
          rating={Number(product.average_rating || 0)}
          reviews={product.total_reviews || 0}
        />
      ),
    },
    {
      key: "stock",
      header: t("productTable.columns.stock"),
      className: "whitespace-nowrap",
      render: (product) => (
        <StockBadge
          stock={product.stock}
          isMadeToOrder={product.is_made_to_order}
        />
      ),
    },
    {
      key: "unit",
      header: t("productTable.columns.unit"),
      className: "whitespace-nowrap",
      // ← translated unit code (ቁራጭ / ኪግ / ግራም / ሊትር / ሜትር …)
      render: (product) => translateUnit(product.unit, t),
    },
    {
      key: "is_featured",
      header: t("productTable.columns.featured"),
      className: "whitespace-nowrap",
      render: (product) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            product.is_featured
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {product.is_featured
            ? t("productTable.featuredYes")
            : t("productTable.featuredNo")}
        </span>
      ),
    },
  ];

  if (onView || onEdit || onDelete) {
    columns.push({
      key: "actions",
      header: t("productTable.columns.actions"),
      className: "whitespace-nowrap text-right",
      render: (product) => {
        const displayTitle = localizeField(
          product.title,
          product.title_am,
          i18n.language,
        );
        return (
          <div className="flex items-center justify-end gap-1.5 sm:gap-2">
            {onView && (
              <button
                type="button"
                onClick={() => onView(product)}
                className="rounded-md p-1 transition-colors hover:bg-blue-50"
                title={t("productTable.tooltips.view")}
                aria-label={`${t("common.aria.viewDetails")} ${displayTitle}`}
              >
                <Eye className="h-3.5 w-3.5 text-blue-600 sm:h-4 sm:w-4" />
              </button>
            )}

            {onEdit && (
              <button
                type="button"
                onClick={() => onEdit(product)}
                className="rounded-md p-1 transition-colors hover:bg-secondary/10"
                title={t("productTable.tooltips.edit")}
                aria-label={`${t("common.aria.editItem")} ${displayTitle}`}
              >
                <Edit className="h-3.5 w-3.5 text-secondary sm:h-4 sm:w-4" />
              </button>
            )}

            {onDelete && (
              <button
                type="button"
                onClick={() => onDelete(product.id, displayTitle)}
                className="rounded-md p-1 transition-colors hover:bg-red-50"
                title={t("productTable.tooltips.delete")}
                aria-label={`${t("common.aria.deleteItem")} ${displayTitle}`}
              >
                <Trash2 className="h-3.5 w-3.5 text-red-600 sm:h-4 sm:w-4" />
              </button>
            )}
          </div>
        );
      },
    });
  }

  return (
    <div className="space-y-2">
      {!loading && products.length > 0 && (
        <div className="hidden text-sm text-gray-500 sm:block">
          {t("productTable.showing", {
            count: products.length,
            total: totalItems,
          })}
        </div>
      )}

      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        loadingRows={5}
        emptyMessage={t("productTable.empty")}
        stickyColumns={3}
      />
    </div>
  );
}