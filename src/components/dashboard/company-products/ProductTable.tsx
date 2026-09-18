import { useState } from "react";
import { Package, Edit, Trash2, Star, Eye } from "lucide-react";
import { DataTable, type Column } from "../../ui/DataTable";

export interface Product {
  id: number;
  sku: string;
  title: string;
  price: number;
  currency?: string;
  stock: number;
  unit: string;
  image?: string;
  image_url?: string;
  is_featured?: boolean;
  average_rating?: string | number;
  total_reviews?: number;
  description?: string;
  category?: string;
  brand?: string;
  barcode?: string;
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

function StockBadge({ stock }: { stock: number }) {
  let color = "bg-green-100 text-green-800";

  if (stock === 0) {
    color = "bg-red-100 text-red-800";
  } else if (stock < 10) {
    color = "bg-yellow-100 text-yellow-800";
  }

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
  const safeRating = Number(rating || 0);

  if (!reviews) {
    return (
      <span className="inline-flex items-center rounded-full bg-gray-100 px-2 py-1 text-[10px] text-gray-500 sm:text-xs">
        No reviews
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
  const columns: Column<Product>[] = [
    {
      key: "image",
      header: "Image",
      className: "whitespace-nowrap",
      render: (product) => (
        <ProductImage
          src={product.image || product.image_url}
          alt={product.title}
        />
      ),
    },
    {
      key: "sku",
      header: "SKU",
      className: "whitespace-nowrap font-mono text-[11px] sm:text-sm",
    },
    {
      key: "title",
      header: "Title",
      className: "max-w-[180px] font-medium text-gray-900",
      render: (product) => (
        <span className="block max-w-[180px] truncate" title={product.title}>
          {product.title}
        </span>
      ),
    },
    {
      key: "price",
      header: "Price",
      className: "whitespace-nowrap text-right",
      render: (product) => {
        const currency = product.currency || "ETB";

        return (
          <div className="flex items-center justify-end gap-1.5">
            <span className="text-[11px] font-medium text-gray-900 sm:text-sm">
              {product.price.toLocaleString()}
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
      header: "Rating",
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
      header: "Stock",
      className: "whitespace-nowrap",
      render: (product) => <StockBadge stock={product.stock} />,
    },
    {
      key: "unit",
      header: "Unit",
      className: "whitespace-nowrap",
      render: (product) => (product.unit === "pc" ? "pcs" : product.unit),
    },
    {
      key: "is_featured",
      header: "Featured",
      className: "whitespace-nowrap",
      render: (product) => (
        <span
          className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
            product.is_featured
              ? "bg-blue-100 text-blue-800"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {product.is_featured ? "Yes" : "No"}
        </span>
      ),
    },
  ];

  if (onView || onEdit || onDelete) {
    columns.push({
      key: "actions",
      header: "Actions",
      className: "whitespace-nowrap text-right",
      render: (product) => (
        <div className="flex items-center justify-end gap-1.5 sm:gap-2">
          {onView && (
            <button
              type="button"
              onClick={() => onView(product)}
              className="rounded-md p-1 transition-colors hover:bg-blue-50"
              title="View details"
              aria-label={`View details for ${product.title}`}
            >
              <Eye className="h-3.5 w-3.5 text-blue-600 sm:h-4 sm:w-4" />
            </button>
          )}

          {onEdit && (
            <button
              type="button"
              onClick={() => onEdit(product)}
              className="rounded-md p-1 transition-colors hover:bg-secondary/10"
              title="Edit product"
              aria-label={`Edit ${product.title}`}
            >
              <Edit className="h-3.5 w-3.5 text-secondary sm:h-4 sm:w-4" />
            </button>
          )}

          {onDelete && (
            <button
              type="button"
              onClick={() => onDelete(product.id, product.title)}
              className="rounded-md p-1 transition-colors hover:bg-red-50"
              title="Delete product"
              aria-label={`Delete ${product.title}`}
            >
              <Trash2 className="h-3.5 w-3.5 text-red-600 sm:h-4 sm:w-4" />
            </button>
          )}
        </div>
      ),
    });
  }

  return (
    <div className="space-y-2">
      {!loading && products.length > 0 && (
        <div className="hidden text-sm text-gray-500 sm:block">
          Showing {products.length} of {totalItems} products
        </div>
      )}

      <DataTable
        data={products}
        columns={columns}
        loading={loading}
        loadingRows={5}
        emptyMessage="No products found"
        stickyColumns={3}
      />
    </div>
  );
}
