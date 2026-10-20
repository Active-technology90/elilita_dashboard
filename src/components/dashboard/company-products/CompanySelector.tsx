// src/components/dashboard/CompanySelector.tsx
import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Building2,
  Search,
  X,
  AlertCircle,
  Package,
} from 'lucide-react';
import { useAuth } from '../../../hooks/useAuth';
import type { CompanyListItem } from '../../../types';
import { searchProducts } from '../../../services/api';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------
interface CompanySelectorProps {
  companies: CompanyListItem[];
  isLoading: boolean;
  onSelect: (slug: string, name: string) => void;
  onBack: () => void;
  allowSwitch?: boolean;
  subtitle?: string;
  disableProductSearch?: boolean;
  title?: string;
  searchPlaceholder?: string;
}

// ---------------------------------------------------------------------------
// Sub-components (modernized)
// ---------------------------------------------------------------------------
function AccessDenied() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl shadow-xl border border-gray-100 max-w-lg mx-auto overflow-hidden"
    >
      <Header title="Company Selector" />
      <div className="p-10 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-50 mb-4">
          <AlertCircle className="h-8 w-8 text-red-500" />
        </div>
        <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-1">Access Denied</h3>
        <p className="text-sm text-gray-500">
          Only super administrators can switch companies.
        </p>
      </div>
    </motion.div>
  );
}

function Header({
  title,
  subtitle,
}: {
  title: string;
  subtitle?: string;
  onBack?: () => void;
}) {
  return (
    <div className="flex items-center gap-4 px-6 py-4 border-b border-gray-100 bg-white/80 backdrop-blur-md">
      {/* {onBack && (
        <button
          onClick={onBack}
          className="p-2 -ml-2 rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
          aria-label="Go back"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
      )} */}
      <div>
        <h2 className="text-lg xs:text-xl sm:text-2xl font-bold tracking-tight bg-gradient-to-r from-secondary to-[#8B5CF6] bg-clip-text text-transparent">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs sm:text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>
    </div>
  );
}

function SearchInput({
  value,
  onChange,
  placeholder = "Search by name or type...",
}: {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
}) {
  const [isFocused, setIsFocused] = useState(false);
  return (
    <div className="relative">
      <Search
        className={`absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 transition-colors ${isFocused ? 'text-secondary' : 'text-gray-400'
          }`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        placeholder={placeholder}
        className="w-full pl-10 sm:pl-11 pr-10 py-2.5 sm:py-3 rounded-xl border bg-gray-50/90 backdrop-blur-sm text-sm sm:text-base
          transition-all duration-200 outline-none
          focus:bg-white focus:border-secondary/60 focus:ring-4 focus:ring-secondary/10
          hover:border-gray-300 placeholder-gray-400"
        aria-label="Search companies"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 rounded-full text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" />
        </button>
      )}
      {!value && !isFocused && (
        <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md bg-gray-100 text-[10px] text-gray-500 font-sans border border-gray-200">
          <span className="text-xs"><Search /></span>
        </kbd>
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl border border-gray-100 animate-pulse bg-white/50"
        >
          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gray-100" />
          <div className="w-3/4 h-4 bg-gray-100 rounded-full" />
          <div className="w-1/2 h-3 bg-gray-100 rounded-full" />
        </div>
      ))}
    </div>
  );
}

function EmptyState({
  icon: Icon,
  title,
  message,
}: {
  icon: React.ElementType;
  title: string;
  message: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 text-center">
      <div className="p-4 rounded-2xl bg-gray-50 mb-4 shadow-inner">
        <Icon className="h-10 w-10 text-gray-300" />
      </div>
      <p className="text-gray-700 font-medium text-sm sm:text-base">{title}</p>
      <p className="text-xs sm:text-sm text-gray-500 mt-1">{message}</p>
    </div>
  );
}

function CompanyGridCard({
  company,
  onSelect,
  imageError,
  onImageError,
}: {
  company: CompanyListItem;
  onSelect: (slug: string, name: string) => void;
  imageError: boolean;
  onImageError: (id: number) => void;
}) {
  const logoUrl = (company as any).logo || (company as any).logo_url;
  const showIcon = !logoUrl || imageError;
  const isActive = (company as any).is_active !== false;

  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => onSelect(company.slug, company.name)}
      className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl
        border border-gray-200 bg-white/80 backdrop-blur-sm text-center
        transition-all duration-300 ease-out
        hover:border-secondary/40 hover:bg-white hover:shadow-lg hover:scale-[1.02]
        focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20
        active:scale-[0.98]"
    >
      {/* Logo / Icon */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center
        border border-gray-200 bg-gray-50 overflow-hidden
        group-hover:border-secondary/40 group-hover:shadow-md transition-all duration-300">
        {showIcon ? (
          <Building2 className="h-6 w-6 sm:h-7 sm:w-7 text-secondary" />
        ) : (
          <img
            src={logoUrl}
            alt={`${company.name} logo`}
            className="w-full h-full object-cover"
            onError={() => onImageError(company.id)}
          />
        )}
      </div>

      {/* Info */}
      <div className="min-w-0 w-full">
        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
          {company.name}
        </p>
        <p className="text-xs text-gray-500 truncate capitalize mt-0.5">
          {company.business_type || 'Company'}
        </p>
        <div className="mt-1 flex items-center justify-center gap-1">
          <span
            className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-[9px] sm:text-[10px] font-semibold ${
              isActive
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-red-50 text-red-700 border-red-200'
            }`}
          >
            {isActive ? 'Active' : 'Inactive'}
          </span>
          {!isActive && (
            <span className="text-[9px] sm:text-[10px] text-gray-500">View only</span>
          )}
        </div>
      </div>
    </motion.button>
  );
}

function ProductCard({
  product,
  onSelect,
}: {
  product: any;
  onSelect: (slug: string, name: string) => void;
}) {
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      onClick={() => {
        if (product.company_slug) {
          onSelect(product.company_slug, product.company_name || product.company);
        }
      }}
      className="group flex flex-col items-center gap-3 p-4 sm:p-5 rounded-2xl
        border border-gray-200 bg-white/80 backdrop-blur-sm text-center
        transition-all duration-300 ease-out
        hover:border-secondary/40 hover:bg-white hover:shadow-lg hover:scale-[1.02]
        focus:outline-none focus-visible:ring-4 focus-visible:ring-secondary/20
        active:scale-[0.98]"
    >
      {/* Product Image */}
      <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center
        border border-gray-200 bg-gray-50 overflow-hidden
        group-hover:border-secondary/40 group-hover:shadow-md transition-all duration-300">
        {product.primary_image ? (
          <img
            src={product.primary_image}
            alt={product.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <Package className="h-6 w-6 sm:h-7 sm:w-7 text-secondary" />
        )}
      </div>

      {/* Product Info */}
      <div className="min-w-0 w-full">
        <p className="font-semibold text-gray-900 truncate text-sm sm:text-base">
          {product.title}
        </p>
        <p className="text-xs text-gray-500 truncate mt-0.5">
          {product.company_name || product.company}
        </p>
        <p className="text-xs sm:text-sm font-bold text-secondary mt-1">
          {Number(product.price).toLocaleString()} ETB
        </p>
      </div>
    </motion.button>
  );
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------
export function CompanySelector({
  companies,
  isLoading,
  onSelect,
  onBack,
  allowSwitch = false,
  subtitle = "Select a company to manage its products",
  disableProductSearch = false,
  title = "Choose Company",
  searchPlaceholder = "Search by name or type...",
}: CompanySelectorProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({});
  const [productResults, setProductResults] = useState<any[]>([]);
  const [searchingProducts, setSearchingProducts] = useState(false);

  const isSuperAdmin = !user?.memberships || user.memberships.length === 0;
  const hasAccess = isSuperAdmin || allowSwitch;
  if (!hasAccess) {
    return <AccessDenied />;
  }

  const filteredCompanies = companies.filter(
    (c) =>
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.business_type?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Search products whenever searchTerm changes (only if product search is enabled)
  useEffect(() => {
    if (disableProductSearch) {
      setProductResults([]);
      setSearchingProducts(false);
      return;
    }

    const fetchProducts = async () => {
      if (!searchTerm.trim()) {
        setProductResults([]);
        return;
      }
      setSearchingProducts(true);
      try {
        const response = await searchProducts({ search: searchTerm });
        setProductResults(response.data.results || []);
      } catch (err) {
        console.error('Failed to search products:', err);
        setProductResults([]);
      } finally {
        setSearchingProducts(false);
      }
    };

    const timer = setTimeout(fetchProducts, 500);
    return () => clearTimeout(timer);
  }, [searchTerm, disableProductSearch]);

  const handleImageError = useCallback((companyId: number) => {
    setImageErrors((prev) => ({ ...prev, [companyId]: true }));
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl  max-w-7xl mx-auto flex flex-col overflow-hidden backdrop-blur-sm"
      style={{ maxHeight: 'calc(100vh - 120px)' }}
    >
      {/* Header – fixed at top */}
      <Header
        title={title}
        subtitle={subtitle}
        onBack={onBack}
      />

      {/* Scrollable content area (search + grid) */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        {/* Sticky search */}
        <div className="sticky top-0 z-10 px-4 sm:px-6 pt-3 pb-2 bg-white/90 backdrop-blur-md">
          <SearchInput
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder={searchPlaceholder}
          />
          <div className="mt-3 border-b border-gray-100" />
        </div>

        {/* Grid / skeleton / empty states */}
        <div className="px-4 sm:px-6 pb-6">
          {/* Loading State */}
          {(isLoading || searchingProducts) && <SkeletonGrid />}

          {/* No Companies Available */}
          {!isLoading && !searchingProducts && companies.length === 0 && (
            <EmptyState
              icon={Building2}
              title="No companies available"
              message="Please contact your administrator"
            />
          )}

          {/* Search Results - Show both Companies and Products */}
          {!isLoading && !searchingProducts && searchTerm && (
            <>
              {/* Companies Section */}
              {filteredCompanies.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-4 mt-2">
                    <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                    <h3 className="text-sm sm:text-base font-semibold text-gray-700">
                      Companies ({filteredCompanies.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 mb-8">
                    <AnimatePresence>
                      {filteredCompanies.map((company) => (
                        <CompanyGridCard
                          key={company.id}
                          company={company}
                          onSelect={onSelect}
                          imageError={!!imageErrors[company.id]}
                          onImageError={handleImageError}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* Products Section - Only show if product search is enabled */}
              {!disableProductSearch && productResults.length > 0 && (
                <>
                  <div className="flex items-center gap-2 mb-4 mt-2">
                    <Package className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                    <h3 className="text-sm sm:text-base font-semibold text-gray-700">
                      Products ({productResults.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                    <AnimatePresence>
                      {productResults.map((product) => (
                        <ProductCard
                          key={product.id}
                          product={product}
                          onSelect={onSelect}
                        />
                      ))}
                    </AnimatePresence>
                  </div>
                </>
              )}

              {/* No Results */}
              {filteredCompanies.length === 0 && productResults.length === 0 && (
                <EmptyState
                  icon={Search}
                  title="No results found"
                  message={`No companies or products match "${searchTerm}"`}
                />
              )}
            </>
          )}

          {/* No Search Term - Show All Companies */}
          {!isLoading && !searchingProducts && !searchTerm && (
            <>
              <div className="flex items-center gap-2 mb-4 mt-2">
                <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-secondary" />
                <h3 className="text-sm sm:text-base font-semibold text-gray-700">
                  All Companies
                </h3>
              </div>
              <div className="grid grid-cols-3 xs:grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
                <AnimatePresence>
                  {companies.map((company) => (
                    <CompanyGridCard
                      key={company.id}
                      company={company}
                      onSelect={onSelect}
                      imageError={!!imageErrors[company.id]}
                      onImageError={handleImageError}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Footer – fixed at bottom */}
      {!isLoading && !searchingProducts && (
        <div className="px-6 py-2 border-t border-gray-100 bg-gray-50/80 backdrop-blur-sm text-center flex-shrink-0">
          <p className="text-xs sm:text-sm text-gray-500">
            {searchTerm ? (
              <>
                Found {filteredCompanies.length + productResults.length}{' '}
                result{(filteredCompanies.length + productResults.length) !== 1 ? 's' : ''}
              </>
            ) : (
              <>
                Showing {companies.length} compan{companies.length !== 1 ? 'ies' : 'y'}
              </>
            )}
          </p>
        </div>
      )}
    </motion.div>
  );
}