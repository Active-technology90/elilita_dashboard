import { useState, useEffect, useCallback } from 'react';
import {
  getCompanyProducts,
  createCompanyProduct,
  updateCompanyProduct,
  deleteCompanyProduct
} from '../services/api';
import type { CompanyProductListItem } from '../types';
import { useDebounce } from './useDebounce';

interface UseCompanyProductsOptions {
  companySlug: string | null;
  pageSize?: number;
}

export function useCompanyProducts({
  companySlug,
  pageSize = 10,
}: UseCompanyProductsOptions) {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 400);

  // ✅ NEW: force refetch counter
  const [refetchCounter, setRefetchCounter] = useState(0);

  // Reset page when company changes
  useEffect(() => {
    if (companySlug) {
      setCurrentPage(1);
    }
  }, [companySlug]);

  // Main fetch (including refetchCounter as dependency)
  useEffect(() => {
    if (!companySlug) {
      setProducts([]);
      return;
    }

    let active = true;

    const fetch = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await getCompanyProducts(companySlug, {
          page: currentPage,
          search: debouncedSearch,
          page_size: pageSize,
        });

        if (!active) return;

        const items = res.data.results || [];
        setProducts(
          items.map((item: CompanyProductListItem) => ({
            ...item,
            id: item.id,
            sku: item.sku || '',
            title: item.title,
            title_am: item.title_am || '',
            description: item.description || '',
            description_am: item.description_am || '',
            price: Number(item.price),
            currency: item.currency || 'ETB',
            stock: item.stock,
            unit: item.unit || 'pc',
            image: item.primary_image || (item as any).image || (item as any).image_url,
            is_featured: Boolean(item.is_featured),
            is_active: item.is_active !== undefined ? item.is_active : true,
            meal_periods: Array.isArray(item.meal_periods) ? item.meal_periods : [],
            average_rating: item.average_rating,     
            total_reviews: item.total_reviews,       
          }))
        );

        const count = res.data.count || 0;
        setTotalItems(count);
        setTotalPages(Math.ceil(count / pageSize));
      } catch (e) {
        if (active) setError('Failed to load products');
      } finally {
        if (active) setLoading(false);
      }
    };

    fetch();

    return () => {
      active = false;
    };
  }, [companySlug, currentPage, debouncedSearch, pageSize, refetchCounter]); // ✅ added refetchCounter

  // ✅ Public refetch function
  const refetch = useCallback(() => {
    setRefetchCounter((c) => c + 1);
  }, []);

  // CRUD methods
  const createProduct = async (data: any) => {
    if (!companySlug) throw new Error('No company selected');
    const res = await createCompanyProduct(companySlug, data);
    setCurrentPage(1);
    return res.data;
  };

  const updateProduct = async (id: number, data: any) => {
    if (!companySlug) throw new Error('No company selected');
    const res = await updateCompanyProduct(companySlug, id, data);
    return res.data;
  };

  const deleteProduct = async (id: number) => {
    if (!companySlug) throw new Error('No company selected');
    await deleteCompanyProduct(companySlug, id);
    setCurrentPage((prev) => Math.max(prev, 1));
  };

  return {
    products,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    search,
    setSearch,
    setCurrentPage,
    createProduct,
    updateProduct,
    deleteProduct,
    refetch, // ✅ now exported
  };
}