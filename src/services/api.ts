import axios from "axios";
import type {
  Category,
  SubCategory,
  Company,
  CompanyListItem,
  HeadCompany,
  CompanyProduct,
  CompanyProductListItem,
  GlobalProduct,
  Cart,
  CartItem,
  MasterOrder,
  ShippingAddress,
  CheckoutRequest,
  CheckoutResponse,
  PaginatedResponse,
  User,
  ProductImage,
  VendorOrder,
  Delivery,
  AvailableDriver,
  AnalyticsOverviewResponse,

  UsersResponse,
  UserRole,
  ServiceOffering,
  ServiceOfferingImage,
  PortfolioItem,
  PortfolioImage,
  AvailabilitySlot,
  ServiceStaff,
  ServiceBooking,
  ServiceSubscription,
  ServiceSubscriptionInvoice,
  ServiceSessionLog,
  StaffScheduleResponse,
  IntakeFormField,
} from "../types";

const API_URL = import.meta.env.VITE_API_URL || "";
// const API_URL = "http://localhost:8000/api/v1/";
// const API_URL = "https://backend.elilitapp.com/api/v1/";


const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { "Content-Type": "application/json" },
});


// Flag to prevent multiple simultaneous token refresh calls 
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: unknown) => void;
}> = [];

const processQueue = (error: Error | null, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

// Request interceptor: attach token
// Request interceptor: attach token & fix FormData Content-Type
api.interceptors.request.use(async (config) => {
  const token = localStorage.getItem("access");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Let the browser set the correct multipart boundary for FormData
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});
// Response interceptor: handle 401 and refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If not 401 or already retried → reject
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      // Queue this request while refresh is in progress
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      })
        .then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return api(originalRequest);
        })
        .catch((err) => Promise.reject(err));
    }

    originalRequest._retry = true;
    isRefreshing = true;

    const refreshToken = localStorage.getItem("refresh");
    if (!refreshToken) {
      // No refresh token → force logout
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      window.location.href = "/signin";
      return Promise.reject(new Error("SESSION_EXPIRED"));
    }

    try {
      const { data } = await axios.post(`${API_URL}/auth/jwt/refresh/`, {
        refresh: refreshToken,
      });
      if (data.access) {
        localStorage.setItem("access", data.access);
        processQueue(null, data.access);
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return api(originalRequest);
      } else {
        throw new Error("No access token in refresh response");
      }
    } catch (refreshError) {
      // Refresh failed → clear tokens and redirect to login
      localStorage.removeItem("access");
      localStorage.removeItem("refresh");
      processQueue(refreshError as Error, null);
      window.location.href = "/signin";
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// ========== AUTHENTICATION ==========
export const login = async (username: string, password: string) =>
  api.post("/auth/jwt/create/", { username, password });

export const getAllUsers = async (
  page: number = 1,
  pageSize: number = 10,
  search: string = "",
  role: string = "all"
): Promise<UsersResponse> => {
  const response = await api.get<UsersResponse>("users/admin/all-users/", {
    params: {
      page,
      page_size: pageSize,   // 👈 important for backend pagination
      search: search || undefined, // send only if exists
      role: role !== "all" ? role : undefined, // backend filter
    },
  });

  return response.data;
};
// ========== ADMIN USER MANAGEMENT ==========
export const updateUser = async (userId: number, data: Partial<User>) => {
  return api.patch<User>(`/users/admin/users/${userId}/`, data);
};

export const deleteUser = async (userId: number) => {
  return api.delete(`/users/admin/users/${userId}/`);
};
export const registerUser = async (data: {
  email: string;
  username: string;
  password: string;
  phone_number?: string;
  first_name?: string;
  last_name?: string;
}) => api.post("/auth/users/", data);

export const refreshToken = async (refresh: string) =>
  api.post("/auth/jwt/refresh/", { refresh });

export const getMe = async () => api.get<User>("/auth/users/me/");

export const updateProfile = async (data: FormData | Partial<User>) => {
  const isFormData = data instanceof FormData;
  return api.patch<User>("/auth/users/me/", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const changePassword = async (data: {
  current_password: string;
  new_password: string;
}) => api.post("/auth/users/set_password/", data);

export const resetPassword = async (email: string) =>
  api.post("/auth/users/reset_password/", { email });

export const resetPasswordConfirm = async (data: {
  uid: string;
  token: string;
  new_password: string;
}) => api.post("/auth/users/reset_password_confirm/", data);


export const onboardCompanyStaff = (
  companySlug: string,
  payload: {
    first_name: string;
    last_name: string;
    username: string;
    email: string;
    phone_number: string;
    password: string;

    role: "admin" | "staff" | "viewer" | "delivery";
  },
) => {
  return api.post(
    `/companies/${companySlug}/staff/onboard/`,
    payload,
  );
};

// ========== CATEGORIES ==========
export const getCategories = async () => api.get<Category[]>("/categories/");
export const getCategoryDetail = async (slug: string) =>
  api.get<Category>(`/categories/${slug}/`);

export const createCategory = async (data: FormData | Record<string, any>) => {
  const isFormData = data instanceof FormData;
  return api.post("/categories/", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const updateCategory = async (
  slug: string,
  data: FormData | Partial<Category>
) => {
  const isFormData = data instanceof FormData;
  return api.patch(`/categories/${slug}/`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const deleteCategory = async (slug: string) =>
  api.delete(`/categories/${slug}/`);

// ========== SUBCATEGORIES ==========
export const getSubCategories = async (categorySlug?: string) => {
  const params = categorySlug ? { category: categorySlug } : {};
  return api.get<SubCategory[]>("/subcategories/", { params });
};

export const getSubCategoryDetail = async (slug: string) =>
  api.get<SubCategory>(`/subcategories/${slug}/`);

export const createSubCategory = async (data: FormData | any) => {
  const isFormData = data instanceof FormData;
  return api.post("/subcategories/", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const updateSubCategory = async (slug: string, data: FormData | any) => {
  const isFormData = data instanceof FormData;
  return api.patch(`/subcategories/${slug}/`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const deleteSubCategory = async (slug: string) =>
  api.delete(`/subcategories/${slug}/`);

// ========== COMPANIES ==========
export const getCompanies = async (params?: {
  category?: string;
  sub_category?: string;
  business_type?: string;
  featured?: string;
  search?: string;
  page?: number;
  page_size?: number;
  ordering?: string;
}) => api.get<PaginatedResponse<CompanyListItem>>("/companies/", { params });

// ========== MEMBERSHIP MANAGEMENT ==========
// Get all companies for assignment (reuse existing getCompanies)
export const getAvailableCompanies = async () => {
  const pageSize = 100;
  let page = 1;
  let companies: any[] = [];
  let hasNext = true;

  while (hasNext) {
    const response = await getCompanies({
      page,
      page_size: pageSize,
    });

    const data = response.data;

    companies.push(...(data.results || []));

    // Django REST Framework pagination
    hasNext = !!data.next;
    page++;
  }

  return companies.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
  }));
};

// Update user's role in a specific company
// Add user to a company (placeholder)
export const addUserToCompany = async (userId: number, companySlug: string, role: UserRole) => {
  // TODO: replace with real POST /users/admin/companies/${companySlug}/staff/
  console.log("Add user to company", { userId, companySlug, role });
  return new Promise((resolve) => setTimeout(resolve, 500));
};

// Update user's role in a specific company
export const updateUserCompanyRole = async (companySlug: string, userId: number, role: UserRole) => {
  console.log({ companySlug, userId, role });
  return api.put(`/users/admin/companies/${companySlug}/staff/${userId}/profile/`, { role });
};

// Remove user from a company
export const removeUserFromCompany = async (companySlug: string, userId: number) => {
  return api.delete(`/users/admin/companies/${companySlug}/staff/${userId}/profile/`);
};
export const getCompanyDetail = async (slug: string) =>
  api.get<Company>(`/companies/${slug}/`);

export const getFeaturedCompanies = async () =>
  api.get<PaginatedResponse<CompanyListItem>>("/companies/", {
    params: { featured: "true" },
  });

export const createCompany = async (data: FormData | Record<string, any>) => {
  const isFormData = data instanceof FormData;
  return api.post<Company>("/companies/", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const updateCompany = async (
  slug: string,
  data: FormData | Partial<Company>
) => {
  const isFormData = data instanceof FormData;
  return api.patch<Company>(`/companies/${slug}/`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const updateCompanyMinimumOrderTotal = async (
  slug: string,
  minimum_order_total: string | number
) => api.patch<Company>(`/companies/${slug}/minimum-order-total/`, { minimum_order_total });

export const deleteCompany = async (slug: string) =>
  api.delete(`/companies/${slug}/`);

// ========== HEAD COMPANIES (umbrella grouping) ==========
export const getHeadCompanies = async () =>
  api.get<HeadCompany[] | PaginatedResponse<HeadCompany>>("/headcompanies/");

export const getHeadCompanyDetail = async (slug: string) =>
  api.get<HeadCompany>(`/headcompanies/${slug}/`);

export const createHeadCompany = async (data: FormData | Record<string, any>) => {
  const isFormData = data instanceof FormData;
  return api.post<HeadCompany>("/headcompanies/", data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const updateHeadCompany = async (
  slug: string,
  data: FormData | Partial<HeadCompany>
) => {
  const isFormData = data instanceof FormData;
  return api.patch<HeadCompany>(`/headcompanies/${slug}/`, data, {
    headers: isFormData ? { "Content-Type": "multipart/form-data" } : undefined,
  });
};

export const deleteHeadCompany = async (slug: string) =>
  api.delete(`/headcompanies/${slug}/`);

export const getCompanyStaff = async (companySlug: string) =>
  api.get(`/companies/${companySlug}/staff/`);

// ========== PRODUCTS (Catalog) ==========
export const getGlobalProducts = async (params?: {
  search?: string;
  page?: number;
}) => api.get<PaginatedResponse<GlobalProduct>>("/catalog/global/", { params });

export const getGlobalProductDetail = async (id: number) =>
  api.get<GlobalProduct>(`/catalog/global/${id}/`);

export const getGlobalProductOffers = async (id: number) =>
  api.get<PaginatedResponse<CompanyProductListItem>>(
    `/catalog/global/${id}/offers/`
  );

export const getCompanyProducts = async (
  companySlug: string,
  params?: {
    search?: string;
    ordering?: string;
    page?: number;
    page_size?: number;
  }
) =>
  api.get<PaginatedResponse<CompanyProductListItem>>(
    `/catalog/company/${companySlug}/`,
    { params }
  );

export const getCompanyProductDetail = async (
  companySlug: string,
  productId: number
) => api.get<CompanyProduct>(`/catalog/company/${companySlug}/${productId}/`);

export const searchProducts = async (params?: {
  search?: string;
  category?: string;
  sub_category?: string;
  price_min?: string;
  price_max?: string;
  ordering?: string;
  page?: number;
}) =>
  api.get<PaginatedResponse<CompanyProductListItem>>("/catalog/search/", {
    params,
  });

// Company Product Management
export const createCompanyProduct = async (
  companySlug: string,
  data: {
    sku: string;
    title: string;
    title_am?: string;
    price: string | number;
    stock: number;
    unit: string;
  }
) => api.post<CompanyProduct>(`/catalog/company/${companySlug}/`, data);

export const updateCompanyProduct = async (
  companySlug: string,
  productId: number,
  data: Partial<{
    sku: string;
    title: string;
    title_am: string;
    price: string | number;
    stock: number;
    unit: string;
  }>
) =>
  api.patch<CompanyProduct>(`/catalog/company/${companySlug}/${productId}/`, data);

export const deleteCompanyProduct = async (
  companySlug: string,
  productId: number
) => api.delete(`/catalog/company/${companySlug}/${productId}/`);

// Product Images
export const uploadProductImage = async (
  companySlug: string,
  productId: number,
  file: File,
  isPrimary: boolean = false
) => {
  const formData = new FormData();
  formData.append("image", file);
  if (isPrimary) formData.append("is_primary", "true");
  return api.post<ProductImage>(
    `/catalog/company/${companySlug}/${productId}/images/`,
    formData,
    {
      headers: { "Content-Type": "multipart/form-data" },
    }
  );
};

export const deleteProductImage = async (
  companySlug: string,
  productId: number,
  imageId: number
) =>
  api.delete(
    `/catalog/company/${companySlug}/${productId}/images/${imageId}/`
  );

export const updateProductImage = async (
  companySlug: string,
  productId: number,
  imageId: number,
  data: Partial<{ order: number; is_primary: boolean }>
) =>
  api.patch<ProductImage>(
    `/catalog/company/${companySlug}/${productId}/images/${imageId}/`,
    data
  );

export const reorderProductImages = async (
  companySlug: string,
  productId: number,
  imageIds: number[]
) =>
  api.patch(`/catalog/company/${companySlug}/${productId}/images/reorder/`, {
    image_ids: imageIds,
  });

// ========== CART ==========
export const getCart = async () => api.get<Cart>("/cart/");
export const addCartItem = async (companyProductId: number, qty: number = 1) =>
  api.post<CartItem>("/cart/items/", {
    company_product: companyProductId,
    qty,
  });
export const updateCartItem = async (itemId: number, qty: number) =>
  api.patch<CartItem>(`/cart/items/${itemId}/`, { qty });
export const removeCartItem = async (itemId: number) =>
  api.delete(`/cart/items/${itemId}/`);
export const getCurrentCart = async () => api.get<Cart>("/cart/");

// ========== ORDERS & CHECKOUT ==========
export const checkout = async (data: CheckoutRequest) =>
  api.post<CheckoutResponse>("/orders/checkout/", data);
export const getMyOrders = async () =>
  api.get<PaginatedResponse<MasterOrder>>("/orders/my/");
export const getMyOrder = async () =>
  api.get<PaginatedResponse<MasterOrder>>("/orders/");
export const getOrderDetail = async (id: number) =>
  api.get<MasterOrder>(`/orders/${id}/`);

// ========== SHIPPING ADDRESSES ==========
export const getShippingAddresses = async () =>
  api.get<ShippingAddress[]>("/orders/shipping-addresses/");
export const addShippingAddress = async (
  data: Omit<ShippingAddress, "id" | "created_at" | "is_default">
) => api.post<ShippingAddress>("/orders/shipping-addresses/", data);
export const updateShippingAddress = async (
  id: number,
  data: Partial<ShippingAddress>
) => api.patch<ShippingAddress>(`/orders/shipping-addresses/${id}/`, data);
export const deleteShippingAddress = async (id: number) =>
  api.delete(`/orders/shipping-addresses/${id}/`);

// ========== PAYMENTS ==========

export const getPayouts = async (
  companySlug: string,
  params?: { page?: number; page_size?: number; status?: string }
) => api.get(`/payments/payouts/${companySlug}/`, { params });

export const getAdminPayouts = async (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) => api.get('/payments/admin/payouts/', { params });

// services/api.ts (bank‑related functions only)

// ── Public bank info ──
export const getBankInfo = async () => api.get("/payments/bank-info/");

// ── Company Bank Accounts ──
export const getCompanyBankAccounts = async (companySlug: string) =>
  api.get(`/payments/company/${companySlug}/bank-accounts/`);

export const deleteCompanyBankAccount = async (
  companySlug: string,
  id: number
) => api.delete(`/payments/company/${companySlug}/bank-accounts/${id}/`);

// Updated – accepts FormData as well as plain objects
export const createCompanyBankAccount = async (
  companySlug: string,
  data: FormData | Record<string, unknown>
) => {
  console.log("Creating company bank account with FormData", data);
  if (data instanceof FormData) {
    console.log("Creating company bank account with FormData", data);
    return api.post(`/payments/company/${companySlug}/bank-accounts/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post(`/payments/company/${companySlug}/bank-accounts/`, data);
};


// Updated – accepts FormData as well as plain objects
export const updateCompanyBankAccount = async (companySlug: string, id: number, data: FormData | Record<string, unknown>) => {
  if (data instanceof FormData) {
    return api.put(`/payments/company/${companySlug}/bank-accounts/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.patch(`/payments/company/${companySlug}/bank-accounts/${id}/`, data);
};

// ── Admin Bank Accounts ──
export const getAdminBankAccounts = async (params?: { company?: string }) =>
  api.get("/payments/admin/bank-accounts/", { params });

export const deleteAdminBankAccount = async (id: number) =>
  api.delete(`/payments/admin/bank-accounts/${id}/`);

// Updated – accepts FormData as well as plain objects
export const createAdminBankAccount = async (data: FormData | Record<string, unknown>) => {
  if (data instanceof FormData) {
    return api.post("/payments/admin/bank-accounts/", data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.post("/payments/admin/bank-accounts/", data);
};

// Updated – accepts FormData as well as plain objects
export const updateAdminBankAccount = async (id: number, data: FormData | Record<string, unknown>) => {
  if (data instanceof FormData) {
    return api.put(`/payments/admin/bank-accounts/${id}/`, data, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  }
  return api.patch(`/payments/admin/bank-accounts/${id}/`, data);
};

export const uploadPaymentReceipt = async (
  orderId: number,
  file: File | Blob,
  bankId?: string,
  bankName?: string,
  amount?: string
) => {
  const formData = new FormData();
  formData.append("receipt_image", file);
  if (bankId) formData.append("bank_id", bankId);
  if (bankName) formData.append("bank_name", bankName);
  if (amount) formData.append("amount", amount);
  return api.post(`/orders/${orderId}/upload-receipt/`, formData, {
    headers: {
      "Content-Type": "multipart/form-data",
      Accept: "application/json",
    },
  });
};

// ========== ADMIN ORDERS ==========
export const getAdminMasterOrders = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  status?: string;
  ordering?: string;
  signal?: AbortSignal;
}) => {
  const { signal, ...queryParameters } = params || {};
  return api.get<PaginatedResponse<MasterOrder>>("/orders/admin/master-orders", {
    params: queryParameters,
    signal,
  });
};

// ========== ADMIN VENDOR ORDERS ==========
export const getAdminVendorOrders = async (params?: {
  page?: number;
  page_size?: number;
  search?: string;
  company?: string;
  status?: string;
  delivery_status?: string;
  payment_method?: string;
  master_order?: number;
  ordering?: string;
  signal?: AbortSignal;
}) => {
  const { signal, ...queryParameters } = params || {};
  return api.get<PaginatedResponse<VendorOrder>>("orders/admin/vendor-orders/", {
    params: queryParameters,
    signal,
  });
};

// ========== COMPANY VENDOR ORDERS ==========
export const getCompanyVendorOrders = async (
  companySlug: string,
  params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
    delivery_status?: string;
    payment_method?: string;
    master_order?: number;
    ordering?: string;
    signal?: AbortSignal;
  }
) => {
  const { signal, ...queryParameters } = params || {};
  return api.get<PaginatedResponse<VendorOrder>>(`/orders/company/${companySlug}/`, {
    params: queryParameters,
    signal,
  });
};
export const getAdminAnalyticsOverview = async (params?: {
  period?: "week" | "month" | "year";
  company_slug?: string;
}) => api.get<AnalyticsOverviewResponse>("/orders/admin/analytics/overview/", { params });
// ========== DELIVERIES ==========
export const assignDelivery = async (data: { vendor_order: number; delivery_person: number }) =>
  api.post("/deliveries/", data);

export const updateDeliveryPerson = async (
  deliveryId: string,
  deliveryPersonId: number
) =>
  api.patch(`/deliveries/${deliveryId}/`, {
    delivery_person: deliveryPersonId,
  });
export const getDeliveries = async (params?: {
  vendor_order?: number;
  delivery_person?: number;
  status?: string;
}) => api.get<PaginatedResponse<Delivery>>("/deliveries/", { params });

export const getAvailableDeliveryDrivers = async (
  companySlug: string,
  paramsOrInHouse?:
    | {
        vendor_order_id?: number;
        driver_type?: "in_house" | "3pl" | "all" | string;
        vehicle_type?: string;
      }
    | boolean
) => {
  let queryParams: Record<string, any> = { company_slug: companySlug };
  if (typeof paramsOrInHouse === "boolean") {
    queryParams.driver_type = paramsOrInHouse ? "in_house" : "3pl";
  } else if (paramsOrInHouse && typeof paramsOrInHouse === "object") {
    Object.assign(queryParams, paramsOrInHouse);
  }
  return api.get<AvailableDriver[]>("/deliveries/available-drivers/", {
    params: queryParams,
  });
};


// ========== USER SEARCH (for company admin) ==========
export const searchUsers = async (query: string) =>
  api.get<PaginatedResponse<User>>("/users/search/", { params: { q: query } });


// NEW: Get company staff filtered by role (e.g., delivery)
export const getCompanyStaffByRole = async (companySlug: string, role: string) =>
  api.get(`/companies/${companySlug}/staff/`, { params: { role } });
// ========== RECEIPTS ==========

// Get company receipts
export const getCompanyReceipts = async (companySlug: string, params?: {
  page?: number;
  page_size?: number;
}) =>
  api.get(`/payments/company/${companySlug}/receipts/`, { params });
// Review / approve / reject receipt

export const reviewReceipt = async (
  receiptId: number,
  data: {
    status: "approved" | "rejected" | "pending";
    admin_notes?: string;
  }
) =>
  api.patch(`/payments/receipts/${receiptId}/review/`, data);

// ========== COMPANY ADS ==========

// Get all ads for a company
export const getCompanyAds = async (
  companySlug: string,
  params?: {
    search?: string;
    is_active?: boolean;
  }
) => {
  return api.get(`/ads/company/${companySlug}/`, {
    params,
  });
};

// Create an ad for a company
export const createCompanyAd = async (
  companySlug: string,
  data: FormData
) => {
  return api.post(
    `/ads/company/${companySlug}/`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// Update company ad
export const updateCompanyAd = async (
  companySlug: string,
  adId: number,
  data: FormData
) => {
  return api.patch(
    `/ads/company/${companySlug}/${adId}/`,
    data,
    {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    }
  );
};

// Delete company ad
export const deleteCompanyAd = async (
  companySlug: string,
  adId: number
) => {
  return api.delete(
    `/ads/company/${companySlug}/${adId}/`
  );
};
// ========== ADS MANAGEMENT (SuperAdmin only) ==========
export const getAds = async (params?: {
  search?: string;
  is_active?: boolean;
}) => api.get("/ads/admin/", { params });

export const createAd = async (data: FormData) => {
  return api.post("/ads/admin/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const updateAd = async (id: number, data: FormData) => {
  return api.patch(`/ads/admin/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });
};

export const deleteAd = async (id: number) => api.delete(`/ads/admin/${id}/`);

export const prepareVendorOrder = async (companySlug: string, orderId: number) =>
  api.post(`/orders/company/${companySlug}/${orderId}/prepare/`);

export const confirmCODPayment = async (companySlug: string, orderId: number) =>
  api.post(`/orders/company/${companySlug}/${orderId}/confirm-cod/`);
// ========== SERVICE BOOKINGS ==========services/manage/<slug:slug>/bookings/<int:pk>/confirm-cod/
export const confirmCODServiceBookingPayment = async (companySlug: string, bookingId: number) =>
  api.post(`/services/manage/${companySlug}/bookings/${bookingId}/confirm-cod/`);

// ========== NOTIFICATIONS (FCM) ==========
export const registerDevice = (
  fcm_token: string,
  platform: "android" | "ios" | "web",
  app: "admin" | "customer" | "delivery"
) => api.post("/notifications/devices/", { fcm_token, platform, app });

export const unregisterDevice = (fcm_token: string) =>
  api.delete("/notifications/devices/", { data: { fcm_token } });

export const getNotifications = () => api.get("/notifications/");

export const getUnreadCount = () =>
  api.get<{ unread: number }>("/notifications/unread-count/");

export const markNotificationsRead = (ids?: number[]) =>
  api.post("/notifications/mark-read/", ids ? { ids } : {});

// DEV-ONLY: queue a test push to the current user and drain it immediately.
export const sendTestNotification = (app: "admin" | "customer" | "delivery" = "admin") =>
  api.post("/notifications/test-send/", { app });

// ========== SUBSCRIPTIONS ==========
export const getSubscriptionPlans = () => api.get("/subscriptions/plans/");
export const getMySubscription = (companySlug?: string) =>
  api.get("/subscriptions/my-subscription/", { params: companySlug ? { company: companySlug } : {} });

export const initializeSubscriptionPayment = (companySlug: string, planId: number) =>
  api.post("/subscriptions/initialize/", {
    company_slug: companySlug,
    plan_id: planId,
    return_url: window.location.href // Redirect back to the exact current billing page
  });

export const verifySubscriptionPayment = (txRef: string) =>
  api.get("/subscriptions/webhook/chapa/", { params: { tx_ref: txRef } });

export const getAdminSubscriptionPlans = () => api.get("/subscriptions/admin/plans/");
export const createAdminSubscriptionPlan = (data: any) => api.post("/subscriptions/admin/plans/", data);
export const updateAdminSubscriptionPlan = (id: number, data: any) => api.patch(`/subscriptions/admin/plans/${id}/`, data);
export const deleteAdminSubscriptionPlan = (id: number) => api.delete(`/subscriptions/admin/plans/${id}/`);

export const getAdminCompanySubscriptions = () => api.get("/subscriptions/admin/company-subscriptions/");

// ========== MARKETING PERFORMANCE ==========
export const getMarketingPerformance = () =>
  api.get("/users/marketing/performance/");

export const getAdminMarketingAgents = () =>
  api.get("/users/marketing/admin/agents/");

export const getAdminMarketingAgentPerformance = (agentId: number) =>
  api.get(`/users/marketing/admin/agents/${agentId}/performance/`);

// ========== SERVICE PROVIDER MANAGEMENT ==========

export const getManageServiceOfferings = (companySlug: string) =>
  api.get<ServiceOffering[]>(`/services/manage/${companySlug}/offerings/`);

export const createServiceOffering = (
  companySlug: string,
  data: Partial<ServiceOffering>,
) => api.post<ServiceOffering>(`/services/manage/${companySlug}/offerings/`, data);

export const updateServiceOffering = (
  companySlug: string,
  id: number,
  data: Partial<ServiceOffering>,
) => api.patch<ServiceOffering>(`/services/manage/${companySlug}/offerings/${id}/`, data);

export const deleteServiceOffering = (companySlug: string, id: number) =>
  api.delete(`/services/manage/${companySlug}/offerings/${id}/`);


export const getServiceOfferingDetail = (companySlug: string, id: number) =>
  api.get<ServiceOffering>(`/services/manage/${companySlug}/offerings/${id}/`);

export const getServiceOfferingImages = (companySlug: string, offeringId: number) =>
  api.get<ServiceOfferingImage[]>(
    `/services/manage/${companySlug}/offerings/${offeringId}/images/`,
  );

export const uploadServiceOfferingImage = (
  companySlug: string,
  offeringId: number,
  file: File,
  isPrimary: boolean = false,
) => {
  const formData = new FormData();
  formData.append("image", file);
  if (isPrimary) formData.append("is_primary", "true");
  return api.post<ServiceOfferingImage>(
    `/services/manage/${companySlug}/offerings/${offeringId}/images/`,
    formData,
    { headers: { "Content-Type": "multipart/form-data" } },
  );
};

export const updateServiceOfferingImage = (
  companySlug: string,
  offeringId: number,
  imageId: number,
  data: Partial<{ order: number; is_primary: boolean; alt_text: string }>,
) =>
  api.patch<ServiceOfferingImage>(
    `/services/manage/${companySlug}/offerings/${offeringId}/images/${imageId}/`,
    data,
  );

export const uploadServiceOfferingImageFormData = (
  companySlug: string,
  offeringId: number,
  data: FormData,
) =>
  api.post<ServiceOfferingImage>(
    `/services/manage/${companySlug}/offerings/${offeringId}/images/`,
    data,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

export const deleteServiceOfferingImage = (
  companySlug: string,
  offeringId: number,
  imageId: number,
) =>
  api.delete(
    `/services/manage/${companySlug}/offerings/${offeringId}/images/${imageId}/`,
  );

export const getManagePortfolio = (companySlug: string) =>
  api.get<PortfolioItem[]>(`/services/manage/${companySlug}/portfolio/`);

export const createPortfolioItem = (
  companySlug: string,
  data: Partial<PortfolioItem>,
) => api.post<PortfolioItem>(`/services/manage/${companySlug}/portfolio/`, data);

export const updatePortfolioItem = (
  companySlug: string,
  id: number,
  data: Partial<PortfolioItem>,
) => api.patch<PortfolioItem>(`/services/manage/${companySlug}/portfolio/${id}/`, data);

export const deletePortfolioItem = (companySlug: string, id: number) =>
  api.delete(`/services/manage/${companySlug}/portfolio/${id}/`);

export const uploadPortfolioImage = (
  companySlug: string,
  portfolioId: number,
  data: FormData,
) =>
  api.post<PortfolioImage>(
    `/services/manage/${companySlug}/portfolio/${portfolioId}/images/`,
    data,
    { headers: { "Content-Type": "multipart/form-data" } },
  );

export const deletePortfolioImage = (
  companySlug: string,
  portfolioId: number,
  imageId: number,
) =>
  api.delete(
    `/services/manage/${companySlug}/portfolio/${portfolioId}/images/${imageId}/`,
  );

export const getManageAvailability = (companySlug: string) =>
  api.get<AvailabilitySlot[]>(`/services/manage/${companySlug}/availability/`);

export const createAvailabilitySlot = (
  companySlug: string,
  data: Partial<AvailabilitySlot>,
) => api.post<AvailabilitySlot>(`/services/manage/${companySlug}/availability/`, data);

export const updateAvailabilitySlot = (
  companySlug: string,
  id: number,
  data: Partial<AvailabilitySlot>,
) => api.patch<AvailabilitySlot>(`/services/manage/${companySlug}/availability/${id}/`, data);

export const deleteAvailabilitySlot = (companySlug: string, id: number) =>
  api.delete(`/services/manage/${companySlug}/availability/${id}/`);

export const getManageBlackouts = (companySlug: string) =>
  api.get(`/services/manage/${companySlug}/blackouts/`);

export const createBlackoutDate = (companySlug: string, data: any) =>
  api.post(`/services/manage/${companySlug}/blackouts/`, data);

export const deleteBlackoutDate = (companySlug: string, id: number) =>
  api.delete(`/services/manage/${companySlug}/blackouts/${id}/`);
export const updateBlackoutDate = (companySlug: string, id: number, data: any) =>
  api.patch(`/services/manage/${companySlug}/blackouts/${id}/`, data);

export const getManageStaff = (companySlug: string) =>
  api.get<ServiceStaff[]>(`/services/manage/${companySlug}/staff/`);

export const createStaff = (companySlug: string, data: any) =>
  api.post<ServiceStaff>(`/services/manage/${companySlug}/staff/`, data,);

export const deleteStaff = (companySlug: string, id: number) =>
  api.delete(`/services/manage/${companySlug}/staff/${id}/`);

export const updateStaff = (companySlug: string, id: number, data: any) =>
  api.patch<ServiceStaff>(`/services/manage/${companySlug}/staff/${id}/`, data);

export const getManageStaffSchedule = (
  companySlug: string,
  staffId: number,
  params?: { date?: string }
) =>
  api.get<StaffScheduleResponse>(`/services/manage/${companySlug}/staff/${staffId}/schedule/`, { params });

export const getManageServiceBookings = (
  companySlug: string,
  params?: { status?: string; date?: string },
) =>
  api.get<ServiceBooking[]>(`/services/manage/${companySlug}/bookings/`, { params });

export const getServiceBookingDetail = (_companySlugOrId: string | number, maybeId?: number) => {
  const bookingId = maybeId !== undefined ? maybeId : _companySlugOrId;
  return api.get<ServiceBooking>(`/services/bookings/${bookingId}/`);
};
export const updateServiceBookingStatus = (
  companySlug: string,
  bookingId: number,
  data: {
    status: ServiceBooking["status"];
    company_notes?: string;
    final_price?: string | number;
  },
) =>
  api.patch<ServiceBooking>(
    `/services/manage/${companySlug}/bookings/${bookingId}/status/`,
    data,
  );

export const confirmServiceBookingCOD = (companySlug: string, bookingId: number) =>
  api.post<ServiceBooking>(`/services/manage/${companySlug}/bookings/${bookingId}/confirm-cod/`);

// ── Subscriptions & Contracts Management ──

export const getManageServiceSubscriptions = (
  companySlug: string,
  params?: { status?: string },
) =>
  api.get<ServiceSubscription[]>(`/services/manage/${companySlug}/subscriptions/`, { params });

export const updateManageSubscriptionStatus = (
  companySlug: string,
  subscriptionId: number,
  data: {
    status: ServiceSubscription["status"];
    admin_notes?: string;
  },
) =>
  api.patch<ServiceSubscription>(
    `/services/manage/${companySlug}/subscriptions/${subscriptionId}/status/`,
    data,
  );

export const generateSubscriptionInvoice = (
  companySlug: string,
  subscriptionId: number,
  payment_method: string = "chapa",
) =>
  api.post<ServiceSubscriptionInvoice>(
    `/services/manage/${companySlug}/subscriptions/${subscriptionId}/generate-invoice/`,
    { payment_method },
  );

export const getSubscriptionSessionLogs = (
  companySlug: string,
  subscriptionId: number,
) =>
  api.get<ServiceSessionLog[]>(
    `/services/manage/${companySlug}/subscriptions/${subscriptionId}/sessions/`,
  );

export const createSubscriptionSessionLog = (
  companySlug: string,
  subscriptionId: number,
  data: {
    scheduled_date: string;
    scheduled_time?: string;
    tutor_or_staff?: number | null;
    status: ServiceSessionLog["status"];
    session_notes?: string;
  },
) =>
  api.post<ServiceSessionLog>(
    `/services/manage/${companySlug}/subscriptions/${subscriptionId}/sessions/`,
    data,
  );

export type { IntakeFormField };

export default api;