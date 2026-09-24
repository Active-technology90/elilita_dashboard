import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { X, Loader2, AlertCircle, AlertTriangle, ChevronRight, ChevronLeft, CheckCircle, Star, MessageSquare } from 'lucide-react';
import { ImageGallery } from './ImageGallery';
import { getCompanyProductDetail, getMySubscription } from '../../../services/api';
import type { ProductImage } from '../../../types';

interface ProductFormData {
  sku: string;
  title: string;
  title_am?: string;
  description?: string;
  description_am?: string;
  currency?: string;
  price: number;
  stock: number;
  unit: string;
  meal_periods?: string[];
  is_featured?: boolean;
  is_active?: boolean;
}

const productSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  title: z.string().min(1, 'Title is required'),
  title_am: z.string().optional(),
  description: z.string().optional(),
  description_am: z.string().optional(),
  currency: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  unit: z.string().min(1, 'Unit is required'),
  meal_periods: z.array(z.string()).optional(),
  is_featured: z.boolean().optional(),
  is_active: z.boolean().optional(),
});

interface ProductModalProps {
  isOpen: boolean;
  editingProduct: {
    id: number;
    sku: string;
    title: string;
    title_am?: string;
    description?: string;
    description_am?: string;
    currency?: string;
    price: number;
    stock: number;
    unit: string;
    meal_periods?: string[];
    is_featured?: boolean;
    is_active?: boolean;
    average_rating?: number;
    review_count?: number;
    total_reviews?: number
  } | null;
  companySlug: string;
  onClose: () => void;
  onSave: (data: ProductFormData, existingProductId?: number) => Promise<any>;
  onProductUpdated?: () => void;
  /** If false, disables SKU, title, unit, and image management */
  canEditBasic?: boolean;
  /** 
   * If false, disables price and stock fields unconditionally. 
   * Use this for admin‑only pricing. For staff that should only 
   * restrict on edit, use `isStaff` instead.
   */
  canEditPricing?: boolean;
  /** 
   * Set to `true` for staff users. When true, price & stock are disabled 
   * ONLY when editing an existing product (i.e., `editingProduct` is not null).
   * In create mode, price & stock remain editable.
   */
  isStaff?: boolean;
  /** Callback to show toast notifications from parent */
  onShowToast?: (type: "success" | "error", message: string) => void;
}

export function ProductModal({
  isOpen,
  editingProduct,
  companySlug,
  onClose,
  onSave,
  onProductUpdated,
  canEditBasic = true,
  canEditPricing = true,
  isStaff = false,
  onShowToast,
}: ProductModalProps) {
  const [step, setStep] = useState<'details' | 'gallery'>('details');
  const [selectedMealPeriods, setSelectedMealPeriods] = useState<string[]>([]);
  const [images, setImages] = useState<ProductImage[]>([]);
  const [loadingImages, setLoadingImages] = useState(false);
  const [savedProductId, setSavedProductId] = useState<number | null>(null);
  const [activeSub, setActiveSub] = useState<any>(null);

  useEffect(() => {
    if (isOpen && companySlug) {
      getMySubscription(companySlug).then(res => setActiveSub(res.data)).catch(console.error);
    }
  }, [isOpen, companySlug]);

  const maxFeatured = activeSub?.allowed_max_featured_products || 0;
  const currentFeatured = activeSub?.current_featured_products || 0;
  const canFeatureMore = maxFeatured === -1 || currentFeatured < maxFeatured;

  const maxProducts = activeSub?.allowed_max_products ?? 15;
  const currentProducts = activeSub?.current_products || 0;
  const canAddMoreActive = maxProducts === -1 || currentProducts < maxProducts;
  const isProductLimitReached = !editingProduct && !canAddMoreActive;


  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      sku: '',
      title: '',
      title_am: '',
      description: '',
      description_am: '',
      currency: 'ETB',
      price: 0,
      stock: 0,
      unit: 'pcs',
      is_featured: false,
      is_active: true,
    },
  });

  // Reset form and step 
  useEffect(() => {
    if (editingProduct) {
      // Edit mode: populate form with product data
      reset({
        sku: editingProduct.sku,
        title: editingProduct.title,
        title_am: editingProduct.title_am || '',
        description: editingProduct.description || '',
        description_am: editingProduct.description_am || '',
        currency: editingProduct.currency || 'ETB',
        price: editingProduct.price,
        stock: editingProduct.stock,
        unit: editingProduct.unit,
        meal_periods: editingProduct.meal_periods || [],
        is_featured: editingProduct.is_featured || false,
        is_active: editingProduct.is_active !== undefined ? editingProduct.is_active : true,
      });
      setSelectedMealPeriods(editingProduct.meal_periods || []);
      setSavedProductId(editingProduct.id);
      setStep('details');
    } else {
      // Add mode: ALWAYS reset when modal is open and we are NOT in "back from gallery" state
      if (isOpen) {
        // Reset savedProductId FIRST before any checks
        setSavedProductId(null);
        setSelectedMealPeriods([]);

        // If we are in details step with a savedProductId that we just cleared, reset the form
        reset({
          sku: '',
          title: '',
          title_am: '',
          description: '',
          description_am: '',
          currency: 'ETB',
          price: 0,
          stock: 0,
          unit: 'pcs',
          meal_periods: [],
          is_featured: false,
          is_active: true,
        });
        setStep('details');
      }
    }
  }, [editingProduct, reset, isOpen]);

  // Fetch images when on gallery step
  useEffect(() => {
    if (step === 'gallery' && savedProductId && companySlug && isOpen) {
      setLoadingImages(true);
      getCompanyProductDetail(companySlug, savedProductId)
        .then((res) => setImages(res.data.images || []))
        .catch((err) => console.error('Failed to load images:', err))
        .finally(() => setLoadingImages(false));
    } else {
      setImages([]);
    }
  }, [step, savedProductId, companySlug, isOpen]);

  // ESC to close
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  // Prevent body scroll
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  // Reset modal state when closing and reopening for a new product
  useEffect(() => {
    if (!isOpen) {
      // When modal closes, reset all state for next time
      setStep('details');
      setSavedProductId(null);
      if (!editingProduct) {
        reset({ sku: '', title: '', price: 0, stock: 0, unit: 'pcs', is_featured: false });
      }
    }
  }, [isOpen, editingProduct, reset]);

  const handleBackToDetails = () => {
    // When going back from gallery to details for a newly created product,
    // we need to treat it as an editing product to prevent duplicate creation
    if (step === 'gallery' && savedProductId && !editingProduct) {
      // The product was created but we're going back to edit details
      // We'll keep the savedProductId and let the form handle updates
      setStep('details');
    } else {
      setStep('details');
    }
  };

  const onSubmitDetails = async (data: ProductFormData) => {
    // Allow submission only if basic editing is allowed (creates/updates product)
    if (!canEditBasic) return;
    try {
      let productId = savedProductId;
      const payload = {
        ...data,
        meal_periods: selectedMealPeriods,
      };

      // If we have a savedProductId (product was created before), update it instead of creating new
      if (savedProductId && !editingProduct) {
        // This is a product that was created but we're going back to edit details
        // We need to update the existing product - pass the savedProductId to onSave
        await onSave(payload, savedProductId);
        productId = savedProductId;
      } else {
        // New product creation
        const saved = await onSave(payload);
        productId = saved?.id || editingProduct?.id;
      }

      if (!productId) throw new Error('No product ID returned');
      setSavedProductId(productId);
      setStep('gallery');
    } catch (err) {
      console.error(err);
    }
  };

  if (!isOpen) return null;

  const stepProgress = step === 'details' ? 50 : 100;
  const isReadOnlyBasic = !canEditBasic;

  // PRICE & STOCK DISABLE LOGIC:
  // 1. If canEditPricing === false → always disabled (admin override)
  // 2. Else if isStaff === true and editingProduct exists → disabled (staff edit mode)
  // 3. Otherwise → enabled
  const isPricingDisabled = !canEditPricing || (isStaff && !!editingProduct);

  // For UI label clarity
  const isEditMode = !!editingProduct;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 md:p-6 bg-black/50 backdrop-blur-sm transition-all duration-200"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-white rounded-xl sm:rounded-2xl shadow-3xl w-full max-w-[95%] sm:max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="sticky top-0 z-10 bg-secondary/20 backdrop-blur-sm border-b border-secondary/20 px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base sm:text-xl font-bold bg-gradient-to-r from-secondary to-secondary-light bg-clip-text text-transparent break-words">
                {editingProduct ? 'Product Details' : 'New Product'}
                {isReadOnlyBasic && <span className="ml-2 text-[10px] sm:text-sm font-normal text-amber-600">(View only)</span>}
                {!isReadOnlyBasic && isPricingDisabled && isEditMode && (
                  <span className="ml-2 text-[10px] sm:text-sm font-normal text-blue-600">(Price/Stock read only)</span>
                )}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-0.5">
                {step === 'details'
                  ? (isReadOnlyBasic ? 'Product information' : 'Enter product details')
                  : 'Manage product images'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 sm:p-2 rounded-full text-gray-400 hover:text-secondary hover:bg-secondary/10 transition flex-shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4 sm:h-5 sm:w-5" />
            </button>
          </div>

          {/* Progress Stepper – hide if completely read-only */}
          {!isReadOnlyBasic && (
            <div className="mt-3 sm:mt-4">
              <div className="flex items-center gap-1 sm:gap-2 mb-2">
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-medium ${step === 'details' ? 'bg-secondary text-white' : 'bg-secondary/10 text-secondary'
                    }`}>
                    {step === 'details' ? '1' : <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </div>
                  <span className={`text-[10px] sm:text-sm font-medium ${step === 'details' ? 'text-secondary' : 'text-gray-500'}`}>
                    Details
                  </span>
                </div>
                <div className="flex-1 h-0.5 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-secondary transition-all duration-300 ease-out"
                    style={{ width: `${stepProgress}%` }}
                  />
                </div>
                <div className="flex items-center gap-1 sm:gap-2">
                  <div className={`flex items-center justify-center w-5 h-5 sm:w-6 sm:h-6 rounded-full text-[10px] sm:text-xs font-medium ${step === 'gallery' ? 'bg-secondary text-white' : 'bg-gray-100 text-gray-400'
                    }`}>
                    {step === 'gallery' ? '2' : <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />}
                  </div>
                  <span className={`text-[10px] sm:text-sm font-medium ${step === 'gallery' ? 'text-secondary' : 'text-gray-400'}`}>
                    Images
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          <div className="transition-all duration-300 ease-out">
            {step === 'details' ? (
              <form id="product-details-form" onSubmit={handleSubmit(onSubmitDetails)} className="space-y-4 sm:space-y-5">
                {isProductLimitReached && (
                  <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs sm:text-sm text-amber-800 flex items-start gap-2.5 shadow-sm">
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <span className="font-semibold text-amber-900">Public Product Quota Reached:</span> You have used <strong>{currentProducts}/{maxProducts}</strong> active products allowed by your subscription plan. You can still save this product as an inactive draft, or upgrade your plan in <strong>Billing & Subscriptions</strong> to publish more.
                    </div>
                  </div>
                )}

                {/* SKU – disabled when editing or basic read-only */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    SKU <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('sku')}
                    disabled={isSubmitting || !!editingProduct || isReadOnlyBasic}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${errors.sku
                      ? 'border-red-500 focus:ring-red-100'
                      : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                      } transition-all outline-none ${(!!editingProduct || isReadOnlyBasic) ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                    placeholder="e.g., FLR-001"
                  />
                  {errors.sku && (
                    <p className="text-red-500 text-xs sm:text-sm mt-1 flex items-center gap-1">
                      <AlertCircle className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      {errors.sku.message}
                    </p>
                  )}
                </div>

                {/* Title */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('title')}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${errors.title
                      ? 'border-red-500 focus:ring-red-100'
                      : 'border-gray-200 focus:border-secondary focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                      } transition-all outline-none ${isReadOnlyBasic ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    placeholder="Product name"
                    disabled={isSubmitting || isReadOnlyBasic}
                  />
                  {errors.title && (
                    <p className="text-red-500 text-sm mt-1">{errors.title.message}</p>
                  )}
                </div>
                {/* Title (Amharic) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Title (Amharic)
                  </label>
                  <input
                    {...register('title_am')}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${errors.title_am
                      ? 'border-red-500 focus:ring-red-100'
                      : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                      } transition-all outline-none ${isReadOnlyBasic ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    placeholder="Product name in Amharic"
                    disabled={isSubmitting || isReadOnlyBasic}
                  />
                </div>

                {/* Description (English) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    {...register('description')}
                    rows={3}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${errors.description
                      ? 'border-red-500 focus:ring-red-100'
                      : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                      } transition-all outline-none ${isReadOnlyBasic ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    placeholder="Product description in English"
                    disabled={isSubmitting || isReadOnlyBasic}
                  />
                </div>

                {/* Description (Amharic) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description (Amharic)
                  </label>
                  <textarea
                    {...register('description_am')}
                    rows={3}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${errors.description_am
                      ? 'border-red-500 focus:ring-red-100'
                      : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                      } transition-all outline-none ${isReadOnlyBasic ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''}`}
                    placeholder="Product description in Amharic"
                    disabled={isSubmitting || isReadOnlyBasic}
                  />
                </div>

                {/* Currency */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Currency
                  </label>
                  <select
                    {...register('currency')}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-200 bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none ${isReadOnlyBasic ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                    disabled={isSubmitting || isReadOnlyBasic}
                  >
                    <option value="ETB">ETB (Ethiopian Birr)</option>
                    <option value="USD">USD (US Dollar)</option>
                    <option value="EUR">EUR (Euro)</option>
                  </select>
                </div>

                {/* Active Status */}
                <div className="flex items-center pt-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    {...register('is_active')}
                    disabled={isSubmitting || isReadOnlyBasic}
                    className="w-4 h-4 text-secondary bg-gray-100 border-gray-300 rounded focus:ring-secondary focus:ring-2 disabled:opacity-50"
                  />
                  <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-700">
                    Active (visible to customers)
                  </label>
                </div>

                {/* Price & Stock */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Price (ETB) <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      {...register('price', { valueAsNumber: true })}
                      className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${errors.price
                        ? 'border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                        } transition-all outline-none ${isPricingDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                        }`}
                      placeholder="0.00"
                      disabled={isSubmitting || isPricingDisabled}
                    />
                    {errors.price && (
                      <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Stock <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="number"
                      {...register('stock', { valueAsNumber: true })}
                      className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border ${errors.stock
                        ? 'border-red-500 focus:ring-red-100'
                        : 'border-gray-200 focus:border-secondary focus:ring-2 focus:ring-secondary/20'
                        } transition-all outline-none ${isPricingDisabled ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                        }`}
                      placeholder="0"
                      disabled={isSubmitting || isPricingDisabled}
                    />
                    {errors.stock && (
                      <p className="text-red-500 text-sm mt-1">{errors.stock.message}</p>
                    )}
                  </div>
                </div>

                {/* Unit */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Unit <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('unit')}
                    className={`w-full px-3 sm:px-4 py-1.5 sm:py-2 text-sm sm:text-base rounded-lg border border-gray-200 bg-white focus:border-secondary focus:ring-2 focus:ring-secondary/20 transition-all outline-none ${isReadOnlyBasic ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : ''
                      }`}
                    disabled={isSubmitting || isReadOnlyBasic}
                  >
                    <option value="pcs">Pieces (pcs)</option>
                    <option value="kg">Kilogram (kg)</option>
                    <option value="g">Gram (g)</option>
                    <option value="l">Liter (l)</option>
                    <option value="m">Meter (m)</option>
                  </select>
                </div>

                {/* Meal Periods Availability (Breakfast, Lunch, Dinner) */}
                <div className="pt-2 border-t border-gray-100">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Meal Period Availability
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Select when this item is available. (If none selected, it appears across all periods).
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {[
                      { id: "breakfast", label: "Breakfast", icon: "☕" },
                      { id: "lunch", label: "Lunch", icon: "☀️" },
                      { id: "dinner", label: "Dinner", icon: "🌙" },
                    ].map((period) => {
                      const isSelected = selectedMealPeriods.includes(period.id);
                      return (
                        <button
                          key={period.id}
                          type="button"
                          disabled={isSubmitting || isReadOnlyBasic}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedMealPeriods(selectedMealPeriods.filter((p) => p !== period.id));
                            } else {
                              setSelectedMealPeriods([...selectedMealPeriods, period.id]);
                            }
                          }}
                          className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                            isSelected
                              ? "bg-secondary text-white border-secondary shadow-sm"
                              : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                          } ${isReadOnlyBasic ? "opacity-60 cursor-not-allowed" : ""}`}
                        >
                          <span>{period.icon}</span>
                          <span>{period.label}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Active / Public Status */}
                <div className="flex flex-col pt-2 border-t border-gray-100">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_active"
                      {...register('is_active')}
                      disabled={isSubmitting || isReadOnlyBasic || (!canAddMoreActive && !editingProduct?.is_active)}
                      className="w-4 h-4 text-secondary bg-gray-100 border-gray-300 rounded focus:ring-secondary focus:ring-2 disabled:opacity-50"
                    />
                    <label htmlFor="is_active" className="ml-2 text-sm font-medium text-gray-900 disabled:opacity-50 flex items-center gap-2">
                      Active (Publicly listed in catalog)
                      {!canAddMoreActive && !editingProduct?.is_active && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Quota Reached ({currentProducts}/{maxProducts})</span>
                      )}
                    </label>
                  </div>
                  {activeSub && (
                    <p className="text-xs text-gray-500 mt-1">
                      Active public products: {currentProducts} / {maxProducts === -1 ? 'Unlimited' : maxProducts} used
                    </p>
                  )}
                </div>

                {/* Featured */}
                <div className="flex flex-col pt-1">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="is_featured"
                      {...register('is_featured')}
                      disabled={isSubmitting || isReadOnlyBasic || (!canFeatureMore && !editingProduct?.is_featured)}
                      className="w-4 h-4 text-secondary bg-gray-100 border-gray-300 rounded focus:ring-secondary focus:ring-2 disabled:opacity-50"
                    />
                    <label htmlFor="is_featured" className="ml-2 text-sm font-medium text-gray-900 disabled:opacity-50 flex items-center gap-2">
                      Featured Product
                      {!canFeatureMore && !editingProduct?.is_featured && (
                        <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Limit Reached ({currentFeatured}/{maxFeatured})</span>
                      )}
                    </label>
                  </div>
                  {activeSub && (
                    <p className="text-xs text-gray-500 mt-1">
                      Featured products: {currentFeatured} / {maxFeatured === -1 ? 'Unlimited' : maxFeatured} used
                    </p>
                  )}
                </div>
                {/* ── VIEW-ONLY STATS ── */}
                {editingProduct && (
                  <div className="mt-6 pt-6 border-t border-gray-200/80">
                    {/* Section Header – with Product Name (more visible) */}
                    <div className="flex items-start gap-2 mb-4">
                      <div className="h-6 w-1 rounded-full bg-gradient-to-b from-secondary to-secondary/40 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        {/* Row 1 – Title + Product Name */}
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-bold text-secondary uppercase tracking-[0.15em]">
                            Product Statistics
                          </p>
                          <span className="flex items-center gap-1.5 text-xs font-semibold text-gray-700 truncate max-w-[140px] sm:max-w-[220px]">
                            <span className="w-1.5 h-1.5 rounded-full bg-secondary/60 flex-shrink-0" />
                            {editingProduct?.title || 'Product'}
                          </span>
                        </div>
                        {/* Accent line – clean and fixed position */}
                        <div className="h-px bg-gradient-to-r from-gray-200/60 via-gray-200/30 to-transparent mt-2" />
                      </div>
                    </div>

                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* ─── SALES COUNT – COMMENTED OUT (backend missing field) ─── */}
                      {/*
      <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 hover:shadow-lg hover:border-secondary/20 transition-all duration-300">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs font-medium text-secondary-light uppercase tracking-wider">Sales Count</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">
              {editingProduct.sales_count ?? 0}
            </p>
          </div>
          <div className="h-10 w-10 rounded-xl bg-secondary/10 flex items-center justify-center">
            <ShoppingBag className="h-5 w-5 text-secondary" />
          </div>
        </div>
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-secondary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
      </div>
      */}

                      {/* Average Rating Card – Modern Animated */}
                      <div className="group relative bg-gradient-to-br from-white to-yellow-50/20 rounded-2xl p-5 shadow-sm border border-gray-100/80 hover:shadow-lg hover:shadow-yellow-100/50 hover:border-yellow-400/40 transition-all duration-500 overflow-hidden">
                        {/* Background glow – subtle, animated on hover */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-200/10 rounded-full blur-2xl group-hover:bg-yellow-200/20 transition-all duration-700 pointer-events-none" />
                        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-yellow-300/5 rounded-full blur-2xl group-hover:bg-yellow-300/15 transition-all duration-700 pointer-events-none" />

                        <div className="flex items-start justify-between relative z-10">
                          <div>
                            <p className="text-xs font-medium text-secondary-light uppercase tracking-wider flex items-center gap-1.5">
                              <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                              Average Rating
                            </p>
                            <div className="mt-1.5 flex items-center gap-0.5">
                              {editingProduct.average_rating ? (
                                <>
                                  {/* Stars with staggered entrance animation */}
                                  {[...Array(5)].map((_, i) => {
                                    const rating = Number(editingProduct.average_rating);
                                    const starValue = i + 1;
                                    let fillPercentage = 0;
                                    if (rating >= starValue) {
                                      fillPercentage = 100;
                                    } else if (rating > i) {
                                      fillPercentage = (rating - i) * 100;
                                    }
                                    return (
                                      <div
                                        key={i}
                                        className="relative inline-block h-5 w-5 flex-shrink-0 transition-all duration-300 hover:scale-110 hover:drop-shadow-[0_0_6px_rgba(250,204,21,0.6)]"
                                        style={{ animationDelay: `${i * 50}ms` }}
                                      >
                                        {/* Empty star behind */}
                                        <Star className="absolute inset-0 h-5 w-5 text-gray-300 transition-colors group-hover:text-gray-400" />
                                        {/* Filled star overlay with clip */}
                                        <div
                                          className="absolute inset-0 overflow-hidden transition-all duration-500 ease-out"
                                          style={{ width: `${fillPercentage}%` }}
                                        >
                                          <Star className="h-5 w-5 fill-yellow-400 text-yellow-400 transition-transform duration-300 group-hover:scale-105" />
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Rating Number – with gradient and animation */}
                                  <span className="text-2xl font-extrabold bg-gradient-to-r from-yellow-400 to-yellow-300 bg-clip-text text-transparent ml-1.5 transition-all duration-300 hover:scale-105 hover:drop-shadow-[0_0_8px_rgba(250,204,21,0.2)] inline-block">
                                    {Number(editingProduct.average_rating).toFixed(1)}
                                  </span>
                                </>
                              ) : (
                                <span className="text-2xl font-bold text-gray-400">N/A</span>
                              )}
                            </div>
                          </div>

                          {/* Animated icon */}
                          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-yellow-400/20 to-yellow-500/20 flex items-center justify-center transition-all duration-300 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-yellow-200/40 relative">
                            <div className="absolute inset-0 rounded-xl bg-yellow-400/0 group-hover:bg-yellow-400/10 transition-all duration-300" />
                            <Star className="h-5 w-5 text-yellow-500 fill-yellow-400 transition-all duration-300 group-hover:rotate-12 group-hover:scale-110" />
                          </div>
                        </div>

                        {/* Bottom accent bar – animated on hover */}
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-yellow-400/0 via-yellow-400/40 to-yellow-400/0 opacity-0 group-hover:opacity-100 transition-all duration-500 scale-x-0 group-hover:scale-x-100 origin-left" />
                      </div>

                      {/* Total Reviews Card */}
                      <div className="group relative bg-white rounded-2xl p-5 shadow-sm border border-gray-100/80 hover:shadow-lg hover:border-indigo-300/30 transition-all duration-300">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs font-medium text-secondary-light uppercase tracking-wider">Total Reviews</p>
                            <p className="text-2xl font-bold text-gray-900 mt-1">
                              {editingProduct.total_reviews ?? 0}
                            </p>
                          </div>
                          <div className="h-10 w-10 rounded-xl bg-indigo-50 flex items-center justify-center">
                            <MessageSquare className="h-5 w-5 text-indigo-500" />
                          </div>
                        </div>
                        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-50/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                )}
              </form>
            ) : (
              <div className="space-y-5">
                {loadingImages ? (
                  <div className="flex flex-col items-center justify-center py-8 sm:py-12">
                    <Loader2 className="h-6 w-6 sm:h-8 sm:w-8 animate-spin text-secondary" />
                    <p className="text-xs sm:text-sm text-gray-500 mt-2 sm:mt-3">Loading images...</p>
                  </div>
                ) : (
                  <ImageGallery
                    images={images}
                    productId={savedProductId!}
                    companySlug={companySlug}
                    onImagesChange={async () => {
                      if (savedProductId && companySlug) {
                        try {
                          const res = await getCompanyProductDetail(companySlug, savedProductId);
                          setImages(res.data.images || []);
                          if (onProductUpdated) onProductUpdated();
                        } catch (err) {
                          console.error('Failed to refresh images:', err);
                        }
                      }
                    }}
                    readOnly={isReadOnlyBasic}
                    onError={(message) => {
                      // Show toast notification for image errors
                      if (onShowToast) {
                        onShowToast('error', message);
                      }
                      console.error('Image error:', message);
                    }}
                    onShowToast={onShowToast}
                  />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white border-t border-gray-100 px-4 sm:px-6 py-3 sm:py-5">
          {step === 'details' ? (
            isReadOnlyBasic ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-gray-200 text-gray-700 font-medium hover:bg-gray-300 transition text-sm sm:text-base"
                >
                  Close
                </button>
              </div>
            ) : (
              <div className="flex flex-row justify-end gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="product-details-form"
                  disabled={isSubmitting}
                  className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-secondary text-white font-medium hover:bg-[#5a448c] transition flex items-center justify-center gap-2 shadow-sm disabled:opacity-50 text-sm sm:text-base"
                >
                  {isSubmitting && <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />}
                  Continue to Images <ChevronRight className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </button>
              </div>
            )
          ) : (
            <div className="flex flex-row justify-between gap-3 sm:gap-4">
              <button
                type="button"
                onClick={handleBackToDetails}
                className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition flex items-center justify-center gap-2 text-sm sm:text-base"
                disabled={isReadOnlyBasic}
              >
                <ChevronLeft className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> Back to Details
              </button>
              <button
                type="button"
                onClick={onClose}
                className="px-4 sm:px-6 py-1.5 sm:py-2.5 rounded-lg sm:rounded-xl bg-secondary text-white font-medium hover:bg-secondary-dark transition shadow-sm text-sm sm:text-base"
              >
                Done
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}