// src/types/index.ts

// ─────────────────────────────────────────────────────────────
// User & Membership (matching backend serializer)
// ─────────────────────────────────────────────────────────────
export type UserRole = "owner" | "admin" | "staff" | "viewer" | "delivery";

export interface Membership {
  company_id: number;
  company_name: string;
  company_slug: string;
  role: UserRole;
  is_active: boolean;
}

export interface User {
  id: number;
  email: string;
  username: string;
  phone_number: string | null;
  profile_image: string | null;
  first_name: string;
  last_name: string;
  memberships: Membership[];
  is_active?: boolean;
  role?: string;
  permissions?: string[];
  is_marketing?: boolean;
  daily_target?: number;
  weekly_target?: number;
}

export interface UsersResponse {
  count: number;
  next: string | null;
  previous: string | null;
  results: User[];
}

// ─────────────────────────────────────────────────────────────
// Categories & SubCategories
// ─────────────────────────────────────────────────────────────
export interface Category {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  code?: string;
  description?: string;
  description_am?: string;
  icon?: string | null;
  order?: number;
  is_active?: boolean;
  company_count?: number;
  rowNumber: number;
  subcategories?: SubCategory[];
}

export interface SubCategory {
  id: number;
  category: number;
  name: string;
  name_am?: string;
  slug: string;
  item_code?: string;
  description?: string;
  icon?: string | null;
  order?: number;
  is_active?: boolean;
  company_count?: number;
}

// ─────────────────────────────────────────────────────────────
// Head Companies (umbrella grouping)
// ─────────────────────────────────────────────────────────────
export interface HeadCompany {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
  cover_image?: string | null;
  is_active: boolean;
  branch_count?: number;
  created_at?: string;
}

export interface HeadCompanyMini {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
}

// ─────────────────────────────────────────────────────────────
// Companies
// ─────────────────────────────────────────────────────────────
export interface Company {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
  cover_image?: string | null;
  head_company?: number | null;
  head_company_detail?: HeadCompanyMini | null;
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  business_type: string;
  description?: string;
  description_am?: string;
  contact_phone?: string;
  contact_email?: string;
  address?: string;
  address_am?: string;
  is_active: boolean;
  is_featured: boolean;
  supports_table_service: boolean;
  show_order_queue?: boolean;
  created_at?: string;
  chapa_sub_account_id?: string;
  minimum_order_total?: string;
  maximum_cod_total?: string;
  latitude?: string;
  longitude?: string;
  delivery_fee_per_km?: string;
  theme_primary?: string;
  theme_dark?: string;
  theme_light?: string;
  tin_number?: string;
  vat_registration_number?: string;
  tax_type?: string;
  license?: string | null;
  registered_by?: number;
  registered_by_username?: string;
}
// ─── types/validation.ts ───────────────────────────────
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface CompanyListItem {
  id: number;
  name: string;
  name_am?: string;
  slug: string;
  logo?: string | null;
  cover_image?: string | null;
  head_company?: number | null;
  head_company_detail?: HeadCompanyMini | null;
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  business_type: string;
  address?: string;
  address_am?: string;
  minimum_order_total?: string;
  maximum_cod_total?: string;
  latitude?: string;
  longitude?: string;
  delivery_fee_per_km?: string;
  theme_primary?: string;
  theme_dark?: string;
  theme_light?: string;
  is_active: boolean;
  is_featured: boolean;
  supports_table_service: boolean;
  show_order_queue?: boolean;
  description?: string;
  contact_phone: string;
  contact_email: string;
  tin_number?: string;
  vat_registration_number?: string;
  tax_type?: string;
  license?: string | null;
  registered_by?: number;
  registered_by_username?: string;
  chapa_sub_account_id?:number;
}

// ─────────────────────────────────────────────────────────────
// Products
// ─────────────────────────────────────────────────────────────
export interface ProductImage {
  id: number;
  image: string;
  alt_text?: string;
  order?: number;
  is_primary?: boolean;
  created_at?: string;
}

export interface GlobalProduct {
  id: number;
  name: string;
  name_am?: string;
  description?: string;
  description_am?: string;
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  seller_count: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyProduct {
  id: number;
  company: CompanyListItem;
  global_product?: number | null;
  sku?: string;
  title: string;
  title_am?: string;
  description?: string;
  description_am?: string;
  price: string;
  compare_at_price?: string | null;
  currency: string;
  stock: number;
  unit?: string;
  attributes?: Record<string, any>;
  meal_periods?: string[];
  is_active: boolean;
  is_featured: boolean;
  images: ProductImage[];
  primary_image?: ProductImage | null;
  sales_count?: number;
  average_rating?: string | null;
  total_reviews?: number;
  created_at: string;
  updated_at: string;
}

export interface CompanyProductListItem {
  id: number;
  company: number;
  company_name: string;
  company_slug: string;
  global_product?: number | null;
  sku?: string;
  title: string;
  title_am?: string;
  price: string;
  compare_at_price?: string | null;
  currency: string;
  stock: number;
  unit?: string;
  meal_periods?: string[];
  is_active: boolean;
  is_featured: boolean;
  primary_image?: string | null;
  sales_count?: number;
  average_rating?: string | null;
  total_reviews?: number;
}

export interface CartItem {
  id: number;
  company_product: number;
  product_title: string;
  product_price: string;
  company_name: string;
  company_slug: string;
  qty: number;
  unit_price: string;
  line_total: string;
}

export interface Cart {
  id: number;
  items: CartItem[];
  total: string;
  subtotal?: string;
  tax_total?: string;
  total_amount?: string;
  item_count: number;
  vendor_count: number;
  updated_at: string;
}

export interface LocalCartItem {
  id: string | number;
  company_product_id: number;
  title: string;
  price: number;
  image?: string;
  company_name: string;
  company_slug: string;
  qty: number;
  stock?: number;
  line_total?: number;
}

export interface OrderItem {
  id: number;
  title: string;
  sku?: string;
  unit_price: string;
  qty: number;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  line_total: string;
  company_name?: string;
  product_reference?: number;
  product_image?: string;
}

export interface TaxInvoice {
  invoice_number: string;
  issued_at: string;
  company_name: string;
  company_tin?: string;
  company_vat_number?: string;
  tax_type?: string;
  customer_name?: string;
  subtotal: string;
  tax_rate: string;
  tax_amount: string;
  total: string;
  currency: string;
  pdf_url?: string;
}

export interface AvailableDriver {
  id: number;
  name: string;
  username: string;
  phone?: string | null;
  profile_image?: string | null;
  average_rating: string | number;
  total_reviews: number;
  vehicle_type: string;
  company_id: number;
  company_name: string;
  company_slug: string;
  is_in_house: boolean;
  distance_km?: number | null;
  last_lat?: number | null;
  last_lon?: number | null;
  active_orders_count?: number;
  driver_state?: "idle" | "at_company" | "en_route" | "assigned" | string;
  is_at_vendor?: boolean;
  is_en_route?: boolean;
  can_batch?: boolean;
}

export interface DeliveryDispatchAttempt {
  id: number;
  driver: number;
  driver_name?: string;
  driver_phone?: string | null;
  driver_image?: string | null;
  logistics_company?: number | null;
  logistics_company_name?: string | null;
  status: "assigned" | "accepted" | "declined" | "expired" | "reassigned" | string;
  decline_reason?: string;
  assigned_at: string;
  expires_at?: string | null;
  responded_at?: string | null;
}

export interface Delivery {
  id: number;
  vendor_order: number;
  delivery_person?: number;
  delivery_date?: string;
  delivery_time?: string;
  delivery_person_id?: number;
  delivery_person_phone?: string;
  delivery_person_name?: string;
  delivery_person_rating?: string;
  delivery_person_total_reviews?: number;
  logistics_company?: number | null;
  logistics_company_name?: string | null;
  is_3pl?: boolean;
  status?: string;
  decline_reason?: string;
  attempts?: DeliveryDispatchAttempt[];
  tracking_id?: string;
  delivery_person_image?: string;
  customer_lat?: number;
  customer_lon?: number;
  current_lat?: number;
  current_lng?: number;
  last_lat?: number;
  last_lon?: number;
}


export interface VendorOrder {
  id: number;
  company: CompanyListItem;
  payment_method: "chapa" | "bank_transfer" | string;
  receipt: {
    id: number;
    status: string;
    receipt_image: string;
    bank_name: string;
    amount: string;
    uploaded_at: string;
  } | null;
  subtotal: string;
  tax_amount: string;
  amount: string;
  recipient_image: string;
  delivery_fee: string;
  status: string;
  delivery_status?: string;
  delivery_notes?: string;
  created_at: string;
  items: OrderItem[];
  tax_invoice?: TaxInvoice;
  payment_status?: string;
  recipient_name?: string;
  shipping_phone?: string;
  shipping_address_text?: string;
  delivery?: Delivery;
  master_order_id?: number;
  fulfillment_type?: string;
  onspot_order_mode?: "already_here" | "order_ahead" | string;
  estimated_arrival_time?: string | null;
  table_number?: string | null;
  queue_info?: {
    is_enabled: boolean;
    queue_position: number;
    orders_ahead: number;
    total_active: number;
  } | null;
  shipping_lon?: string;
  shipping_lat?: string;
  customer_name?: string;
  vendor_orders?: VendorOrder[];
}

export interface MasterOrder {
  id: number;
  user: number;
  status: string;
  fulfillment_type: string;
  onspot_order_mode?: "already_here" | "order_ahead" | string;
  estimated_arrival_time?: string | null;
  table_number?: string | null;
  queue_info?: {
    is_enabled: boolean;
    queue_position: number;
    orders_ahead: number;
    total_active: number;
  } | null;
  payment_method: string;
  subtotal: string;
  tax_total: string;
  total_amount: string;
  currency: string;
  recipient_name: string;
  shipping_phone: string;
  shipping_address_text: string;
  created_at: string;
  updated_at: string;
  vendor_orders: VendorOrder[];
  vendor_count: number;
  payment_status: string;
  delivery_fee: string;
}

export interface ShippingAddress {
  id: number;
  recipient_name: string;
  phone_number: string;
  city?: string;
  sub_city?: string;
  woreda?: string;
  house_number?: string;
  latitude?: number;
  longitude?: number;
  is_default: boolean;
  created_at?: string;
}

export interface CheckoutRequest {
  cart_id: number;
  payment_method: "chapa" | "bank_transfer" | "cod";
  fulfillment_type: "delivery" | "pickup";
  shipping_address_id: number;
  recipient_name?: string;
  recipient_phone?: string;
  shipping_address_text?: string;
}

export interface CheckoutResponse {
  master_order_id: number;
  payment_url: string;
  payment_mode: string;
}

// ─────────────────────────────────────────────────────────────
// Service Bookings (deduplicated)
// ─────────────────────────────────────────────────────────────
export interface ServiceBooking {
  id: number;
  customer?: number;
  customer_name?: string;
  customer_phone?: string;
  company?: CompanyListItem | Company;
  company_slug?: string;
  offering?: ServiceOffering | {
    id: number;
    title: string;
    duration_minutes?: number;
    primary_image?: string;
    service_category?: string;
  };
  assigned_staff?: ServiceStaff | null;
  selected_addons?: ServiceAddon[];
  location_type?: "provider_location" | "customer_location";
  service_address_text?: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  scheduled_date: string;
  scheduled_time: string;
  estimated_duration?: number;
  quoted_price: string;
  final_price?: string | null;
  currency: string;
  payable_amount?: string;
  payment_status?: string;
  payment_method?: string;
  checkout_url?: string | null;
  intake_data?: Record<string, any>;
  customer_notes?: string;
  status: "pending" | "confirmed" | "in_progress" | "completed" | "cancelled" | "no_show";
  company_notes?: string;
  master_order?: number | null;
  created_at?: string;
  updated_at?: string;
  receipt?: any; 
  receipt_history?: any[]; 
}

export interface FullServiceBooking {
  booking: BookingDetail;
  customer: CustomerDetail;
  company: CompanyDetail;
  service: ServiceDetail;
  staff: StaffDetail | null;
  payment: PaymentDetail | null;
  timeline: TimelineEntry[];
  attachments: Attachment[];
  intake_answers: IntakeAnswer[];
  allowed_actions: BookingAction[];
  notifications: NotificationSummary;
  audit: AuditTrail;
}

export interface BookingDetail {
  id: number;
  reference: string;
  source: "app" | "web" | "admin" | "widget";
  type: "standard" | "recurring" | "course" | "workshop";
  status: string;
  scheduled_date: string;
  scheduled_time: string;
  timezone: string;
  created_at: string;
  updated_at: string;
  confirmed_at: string | null;
  cancelled_at: string | null;
  completed_at: string | null;
  reminder_status: "none" | "sent" | "failed";
  customer_notes: string;
  company_notes: string;
  internal_notes: string;
}

export interface CustomerDetail {
  id: number;
  full_name: string;
  email: string;
  phone: string;
  avatar: string | null;
  address: string;
  gender: "Male" | "Female" | "Other" | null;
  date_of_birth: string | null;
  age: number | null;
  loyalty_status: string;
  total_bookings: number;
  total_spent: string;
  last_booking: string | null;
  notes: string;
}

export interface CompanyDetail {
  id: number;
  name: string;
  logo: string | null;
  branch: string;
  address: string;
  phone: string;
  email: string;
}

export interface ServiceDetail {
  id: number;
  title: string;
  description: string;
  category: string;
  duration_minutes: number;
  preparation_time_minutes: number;
  cleanup_time_minutes: number;
  primary_image: string | null;
  tags: string[];
}

export interface StaffDetail {
  id: number;
  full_name: string;
  avatar: string | null;
  phone: string;
  specialization: string;
}

export interface PaymentDetail {
  status: "pending" | "paid" | "partially_paid" | "refunded" | "failed";
  method: string;
  reference: string;
  transaction_id: string | null;
  date: string | null;
  refund_status: "none" | "partial" | "full";
  refund_amount: string;
}

export interface TimelineEntry {
  status: string;
  created_at: string;
  updated_by: string | null;
  note: string | null;
}

export interface Attachment {
  id: number;
  file_url: string;
  file_name: string;
  type: "image" | "document";
  uploaded_at: string;
}

export interface IntakeAnswer {
  question: string;
  answer: string;
  file_url: string | null;
  signature_url: string | null;
}

export interface NotificationSummary {
  reminder_sent: boolean;
  sms_sent: boolean;
  email_sent: boolean;
  push_sent: boolean;
}

export interface AuditTrail {
  created_by: string | null;
  updated_by: string | null;
  last_updated_by: string | null;
}

export type BookingAction = "confirm" | "start" | "complete" | "cancel" | "no_show";

// ─────────────────────────────────────────────────────────────
// Service Provider Management
// ─────────────────────────────────────────────────────────────
export interface IntakeFormField {
  name: string;
  type:
    | "text"
    | "textarea"
    | "email"
    | "phone"
    | "number"
    | "date"
    | "time"
    | "datetime"
    | "select"
    | "multiselect"
    | "radio"
    | "checkbox"
    | "file"
    | "url";
  label: string;
  label_am?: string;
  required?: boolean;
  options?: string[];
  placeholder?: string;
}

export interface ServiceOfferingImage {
  id: number;
  image: string;
  alt_text?: string;
  order?: number;
  is_primary?: boolean;
}

export interface ServiceOffering {
  id: number;
  company?: number;
  company_name?: string;
  company_slug?: string;
  title: string;
  title_am?: string;
  description?: string;
  description_am?: string;
  slug: string;
  pricing_type: "fixed" | "starting_at" | "hourly" | "custom";
  price?: string | null;
  currency: string;
  service_type?: "one_off" | "recurring";
  billing_cycle?: "weekly" | "monthly" | "quarterly" | "yearly";
  duration_minutes?: number | null;
  booking_mode: "direct" | "inquiry" | "contact";
  payment_policy: "upfront" | "deposit" | "post_service";
  deposit_percentage?: string;
  service_category?: string;
  tags?: string[];
  intake_form_schema?: IntakeFormField[];
  is_active: boolean;
  is_featured: boolean;
  order?: number;
  average_rating?: string | number;
  total_reviews?: number;
  total_bookings?: number;
  images?: ServiceOfferingImage[];
  primary_image?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface PortfolioImage {
  id: number;
  image: string;
  caption?: string;
  is_before: boolean;
  order: number;
}

export interface PortfolioItem {
  id: number;
  title: string;
  title_am?: string;
  description?: string;
  description_am?: string;
  service_offering?: number | null;
  is_active: boolean;
  order?: number;
  images: PortfolioImage[];
  created_at: string;
}

export interface AvailabilitySlot {
  id: number;
  day_of_week: number;
  day_name?: string;
  start_time: string;
  end_time: string;
  max_bookings: number;
  is_active: boolean;
}

export interface ServiceStaff {
  id: number;
  company: number;
  name: string;
  name_am?: string;
  avatar?: string | null;
  role_title?: string;
  assigned_service_ids?: number[];
  is_online?: boolean;
  is_active: boolean;
  working_days?: number[];
  start_time?: string;
  end_time?: string;
  average_rating?: number | string;
  review_count?: number;
  order?: number;
}

export interface ServiceAddon {
  id: number;
  service_offering: number;
  name: string;
  name_am?: string;
  price: string;
  duration_minutes: number;
  is_active: boolean;
}

// ── Subscriptions & Recurring Contracts ──

export interface ServiceSubscriptionInvoice {
  id: number;
  subscription: number;
  master_order?: number | null;
  billing_period_start: string;
  billing_period_end: string;
  due_date: string;
  paid_at?: string | null;
  amount: string;
  currency: string;
  status: "pending" | "paid" | "overdue" | "cancelled";
  payment_method?: string;
  checkout_url?: string | null;
  receipt?: any;
  created_at: string;
}

export interface ServiceSessionLog {
  id: number;
  subscription: number;
  scheduled_date: string;
  scheduled_time?: string | null;
  tutor_or_staff?: number | null;
  tutor_or_staff_name?: string;
  status: "scheduled" | "attended" | "missed" | "cancelled_by_student" | "cancelled_by_tutor" | "rescheduled";
  session_notes?: string;
  created_at: string;
}

export interface ServiceSubscription {
  id: number;
  customer: number;
  customer_name?: string;
  customer_phone?: string;
  company?: CompanyListItem;
  offering?: ServiceOffering;
  assigned_staff?: ServiceStaff | null;
  status: "active" | "paused" | "completed" | "cancelled";
  billing_cycle: "weekly" | "monthly" | "quarterly" | "yearly";
  cycle_amount: string;
  currency: string;
  start_date: string;
  end_date?: string | null;
  next_billing_date?: string | null;
  last_billing_date?: string | null;
  intake_data?: Record<string, unknown>;
  customer_notes?: string;
  admin_notes?: string;
  invoices?: ServiceSubscriptionInvoice[];
  latest_invoice?: ServiceSubscriptionInvoice | null;
  session_logs?: ServiceSessionLog[];
  created_at: string;
  updated_at: string;
}

// ── Bank Management ──

export interface BankInfo {
  id: number;
  bank_id?: string;
  bank_name: string;
  account_number: string;
  account_name: string;
  logo?: string | null;
  company?: number | null;
  company_name?: string;
  company_slug?: string;
  order?: number;
  is_active?: boolean;
  branch_name?: string;
  swift_code?: string;
  currency?: string;
  account_type?: "operating" | "savings" | "escrow";
  is_default?: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface BankAccount extends BankInfo {
  company_id?: number;
  is_verified?: boolean;
  verified_at?: string | null;
  created_by?: string;
  created_by_name?: string;
}

// ── Specialist Schedule & Tracking ──

export interface StaffScheduleAppointment {
  booking_id: number;
  customer_name: string;
  customer_phone: string;
  service_title: string;
  scheduled_time: string;
  duration_minutes: number;
  quoted_price: string;
  currency: string;
  status: string;
  payment_status?: string;
}

export interface StaffScheduleResponse {
  staff: {
    id: number;
    name: string;
    role_title?: string;
    is_online?: boolean;
    working_days?: number[];
    start_time?: string;
    end_time?: string;
  };
  date: string;
  weekday: number;
  is_working_day: boolean;
  booked_appointments: StaffScheduleAppointment[];
  vacant_slots: string[];
}

// ─────────────────────────────────────────────────────────────
// Analytics
// ─────────────────────────────────────────────────────────────
export interface AnalyticsCompanyOption {
  id: number;
  name: string;
  slug: string;
}

export interface AnalyticsSummary {
  company_total_count: number;
  company_active_count: number;
  products: number;
  users: number;
  orders: number;
  payments_total: number;
  avg_order_value: number;
  success_rate: number;
  active_categories: number;
}

export interface AnalyticsRevenuePoint {
  label: string;
  revenue: number;
  prevRevenue: number;
  date?: string;
  period?: string;
}

export interface AnalyticsCategoryTrendPoint {
  month: string;
  [key: string]: string | number;
}

export interface AnalyticsRecentOrder {
  id: string;
  customer: string;
  amount: number;
  status: string;
  paymentStatus: string;
  date: string;
  vendors: number;
}

export interface AnalyticsOverviewResponse {
  scope: "platform" | "company";
  selected_company: AnalyticsCompanyOption | null;
  available_companies: AnalyticsCompanyOption[];
  summary: AnalyticsSummary;
  revenue_series: AnalyticsRevenuePoint[];
  order_status: { name: string; value: number }[];
  top_products: { name: string; sales: number; company_name: string }[];
  product_sales_trend: AnalyticsCategoryTrendPoint[];
  recent_orders: AnalyticsRecentOrder[];
}

// ─────────────────────────────────────────────────────────────
// General & Deprecated (retained for backward compatibility)
// ─────────────────────────────────────────────────────────────
export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface PaginatedResponse<T> {
  count: number;
  next: string | null;
  previous: string | null;
  results: T[];
}

export interface Product {
  id: number;
  company: number;
  title: string;
  price: string;
  stock: number;
  primary_image?: string | null;
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
}

export interface Service {
  id: number;
  name: string;
  name_am: string;
  slug: string;
  address: string;
  business_type: "service";
  category: number;
  category_name: string;
  sub_category: number;
  sub_category_name: string;
  logo: string | null;
  cover_image: string | null;
  is_active: boolean;
  is_featured: boolean;
}