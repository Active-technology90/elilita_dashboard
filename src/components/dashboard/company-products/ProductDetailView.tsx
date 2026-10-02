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
} from "lucide-react";
import type { Product } from "./ProductTable";
import MealCategoryIcon from "../../ui/MealCategoryIcon";

interface ProductDetailViewProps {
  product: Product;
  companyName?: string;
  onBack: () => void;
  onEdit?: (product: Product) => void;
}

function DetailItem({
  label,
  value,
}: {
  label: string;
  value: string | number;
}) {
  return (
    <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-3 sm:p-4">
      <p className="text-[11px] sm:text-xs font-medium uppercase tracking-wide text-gray-400">
        {label}
      </p>
      <p className="mt-1 break-words text-sm sm:text-base font-semibold text-gray-900">
        {value}
      </p>
    </div>
  );
}

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

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 sm:p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-gray-100 pb-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-lg border border-gray-200 text-gray-600 transition hover:bg-gray-50"
            title="Back to products"
            aria-label="Back to products"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          <div className="min-w-0">
            <p className="text-xs font-medium text-gray-400">
              {companyName ? `${companyName} · Product details` : "Product details"}
            </p>
            <h2 className="truncate text-lg sm:text-2xl font-extrabold tracking-tight text-secondary">
              {product.title}
            </h2>
          </div>
        </div>

        {onEdit && (
          <button
            type="button"
            onClick={() => onEdit(product)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-secondary px-3 py-2 text-xs sm:text-sm font-medium text-white transition hover:bg-secondary/90"
          >
            <Edit className="h-4 w-4" />
            Edit Product
          </button>
        )}
      </div>

      <div className="mt-5 grid gap-5 lg:grid-cols-[280px_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="flex min-h-[240px] items-center justify-center overflow-hidden rounded-2xl border border-gray-100 bg-gray-50 p-4">
            {imageUrl && !imageError ? (
              <img
                src={imageUrl}
                alt={product.title}
                className="max-h-[320px] w-full object-contain"
                onError={() => setImageError(true)}
              />
            ) : (
              <div className="flex flex-col items-center gap-2 text-gray-400">
                <Package className="h-14 w-14" />
                <span className="text-sm">No product image</span>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                product.stock === 0
                  ? "bg-red-100 text-red-700"
                  : product.stock < 10
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-green-100 text-green-700"
              }`}
            >
              {product.stock === 0
                ? "Out of stock"
                : product.stock < 10
                  ? "Low stock"
                  : "In stock"}
            </span>

            <span
              className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                product.is_featured
                  ? "bg-blue-100 text-blue-700"
                  : "bg-gray-100 text-gray-600"
              }`}
            >
              {product.is_featured ? "Featured" : "Not featured"}
            </span>
          </div>
        </div>

        <div className="min-w-0">
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <DetailItem label="SKU" value={product.sku || "—"} />
            <DetailItem
              label="Price"
              value={`${Number(product.price || 0).toLocaleString()} ${currency}`}
            />
            <DetailItem label="Stock" value={`${product.stock} ${product.unit === "pc" ? "pcs" : product.unit}`} />
            <DetailItem
              label="Rating"
              value={reviews > 0 ? `${rating.toFixed(1)} / 5 (${reviews} reviews)` : "No reviews"}
            />
            <DetailItem label="Unit" value={product.unit === "pc" ? "pcs" : product.unit || "—"} />
            <DetailItem label="Featured" value={product.is_featured ? "Yes" : "No"} />
          </div>

          <div className="mt-5 rounded-2xl border border-gray-100 p-4 sm:p-5">
            <div className="flex items-center gap-2 text-secondary">
              <Tag className="h-4 w-4" />
              <h3 className="font-bold">Product information</h3>
            </div>

            <div className="mt-4 space-y-3 text-sm">
              {product.description && (
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-400">Description</p>
                  <p className="mt-1 whitespace-pre-wrap text-gray-700">{product.description}</p>
                </div>
              )}

              <div className="grid gap-3 sm:grid-cols-2">
                {product.category && (
                  <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
                    <Tag className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Category</p>
                      <p className="font-medium text-gray-800">{product.category}</p>
                    </div>
                  </div>
                )}

                {product.brand && (
                  <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
                    <Boxes className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Brand</p>
                      <p className="font-medium text-gray-800">{product.brand}</p>
                    </div>
                  </div>
                )}

                {product.barcode && (
                  <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
                    <Barcode className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Barcode</p>
                      <p className="break-all font-medium text-gray-800">{product.barcode}</p>
                    </div>
                  </div>
                )}

                <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3">
                  <BadgeDollarSign className="mt-0.5 h-4 w-4 text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Currency</p>
                    <p className="font-medium text-gray-800">{currency}</p>
                  </div>
                </div>

                {Array.isArray(product.meal_periods) && product.meal_periods.length > 0 && (
                  <div className="flex items-start gap-2 rounded-xl bg-gray-50 p-3 sm:col-span-2">
                    <UtensilsCrossed className="mt-0.5 h-4 w-4 text-gray-400" />
                    <div>
                      <p className="text-xs text-gray-400">Meal Availability</p>
                      <div className="mt-1.5 flex flex-wrap gap-1.5">
                        {product.meal_periods.map((mp) => (
                          <span
                            key={mp}
                            className="inline-flex items-center gap-1 rounded-md bg-secondary/10 px-2 py-0.5 text-xs font-semibold capitalize text-secondary"
                          >
                            <MealCategoryIcon icon={mp} className="w-3.5 h-3.5 shrink-0" />
                            <span>{mp.replace(/-/g, " ")}</span>
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {!product.description && !product.category && !product.brand && !product.barcode && (
                <p className="text-gray-500">
                  No additional product information is available for this item.
                </p>
              )}
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-xl border border-gray-100 bg-gray-50/70 px-4 py-3">
            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
            <span className="text-sm text-gray-700">
              {reviews > 0
                ? `${rating.toFixed(1)} average rating from ${reviews} review${reviews === 1 ? "" : "s"}.`
                : "This product has no reviews yet."}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
