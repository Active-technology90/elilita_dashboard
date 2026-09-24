// DeliveryTrackingMap.tsx - Production Dispatch & Live Tracking UI
import {
  useEffect,
  useRef,
  useState,
  useMemo,
  useCallback,
} from "react";
import { createPortal } from "react-dom";
import {
  X, Navigation, Loader2, RefreshCw, MapPin, PanelLeftClose,
  PanelLeftOpen, Maximize2, Users, Search, Check, Package,
  Navigation2, Star, AlertTriangle, Store, ChevronDown,
  Satellite, Map as MapIcon,
} from "lucide-react";
import {
  getAdminVendorOrders,
  getCompanyVendorOrders,
  getAvailableDeliveryDrivers,
} from "../../../services/api";
import { useAuth } from "../../../hooks/useAuth";
import { useCurrentCompany } from "../../../context/CurrentCompanyContext";
import { useReadOnly } from "../AdminDashboard";
import { useQuery } from "@tanstack/react-query";
import type * as Leaflet from "leaflet";
import { db } from "../../../services/firebase";
import { ref, onValue, off } from "firebase/database";
import type { VendorOrder } from "../../../types";
import { useToast } from "../../../hooks/useToast";

// ── Types ──────────────────────────────────────────────────────────
interface Coordinates {
  lat: number;
  lon: number;
}

interface OrderDestination {
  address: string;
  lat: number | null;
  lon: number | null;
  source: "shipping" | "delivery" | "nested" | "geocoded" | "coordinates" | "unknown";
}

interface DispatchOrder {
  id: number;
  status: string;
  fulfillmentType: string;
  customerName: string;
  customerPhone: string;
  address: string;
  customerLat: number | null;
  customerLon: number | null;
  pickupName: string;
  pickupLat: number | null;
  pickupLon: number | null;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  paymentMethod: string;
  paymentStatus: string;
  items: any[];
  canAssign: boolean;
  assignmentBlockedReason?: string;
  companyLat?: number | null;
  companyLon?: number | null;
  companyAddress?: string;
}

interface DeliveryWithLocation extends VendorOrder {
  delivery: NonNullable<VendorOrder["delivery"]> & {
    current_lat?: number;
    current_lng?: number;
    speed?: number;
    heading?: number;
    delivery_person_name: string;
    delivery_person_phone?: string;
    status: string;
    logistics_company_name?: string;
    is_in_house?: boolean;
    customer_address?: string;
    delivery_person_image?: string;
  };
}

interface FirebaseDriverData {
  lat?: number;
  lon?: number;
  speed?: number;
  heading?: number;
  status?: string;
  driver_name?: string;
  driver_phone?: string;
  customer_address?: string;
}

interface AvailableDriver {
  id: number;
  name: string;
  username: string;
  phone?: string | null;
  vehicle_type?: string;
  is_in_house: boolean;
  company_name?: string;
  current_lat?: number | null;
  current_lng?: number | null;
  last_lat?: number | null;
  last_lon?: number | null;
  distance_km?: number | null;
  average_rating?: string | number;
  total_reviews?: number;
  profile_image?: string | null;
  location_source?: "live" | "current" | "last_known" | "api" | "unknown";
  isLive?: boolean;
  distance_to_pickup?: number | null;
  distance_to_customer?: number | null;
  total_route_distance?: number | null;
  pickup_eta_minutes?: number | null;
  total_eta_minutes?: number | null;
  road_distance_to_customer?: number | null;
  road_eta_to_customer?: number | null;
  road_distance_to_pickup?: number | null;
  road_eta_to_pickup?: number | null;
  pickup_to_customer_distance?: number | null;
  pickup_to_customer_eta?: number | null;
  recommendation_rank?: number | null;
  is_nearest?: boolean;
}

interface RouteSummary {
  coordinates: [number, number][];
  distanceKm: number;
  durationMinutes: number;
}

interface DeliveryTrackingMapProps {
  onClose: () => void;
  mode?: "tracking" | "driver_selection";
  selectedOrderId?: number;
  onDriverSelect?: (driverId: number) => Promise<void>;
  onAssignmentComplete?: () => void;
}

type RouteCacheKey = string;
interface RouteCacheEntry {
  coordinates: [number, number][];
  timestamp: number;
  distanceKm: number;
  durationMinutes: number;
}

type SortOption = "recommended" | "nearest_pickup" | "fastest_eta" | "highest_rated";

// ── Helpers ────────────────────────────────────────────────────────
const escapeHtml = (text: string): string =>
  text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const isValidCoordinate = (lat: number | null | undefined, lon: number | null | undefined): boolean => {
  if (lat == null || lon == null) return false;
  const numLat = Number(lat);
  const numLon = Number(lon);
  return (
    Number.isFinite(numLat) && Number.isFinite(numLon) &&
    numLat >= -90 && numLat <= 90 &&
    numLon >= -180 && numLon <= 180
  );
};

const haversine = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
};

const formatDistance = (distance: number | null | undefined): string => {
  if (distance == null) return "Distance unavailable";
  if (distance < 1) return `${(distance * 1000).toFixed(0)} m`;
  return `${distance.toFixed(1)} km`;
};

const formatDuration = (minutes: number | null | undefined): string => {
  if (minutes == null) return "ETA unavailable";
  if (minutes < 1) return "< 1 min";
  if (minutes < 60) return `~${Math.round(minutes)} min`;
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  return `~${hours}h ${mins}m`;
};

const getInitials = (name: string): string => {
  if (!name) return "?";
  return name.split(" ").map(w => w[0]?.toUpperCase() || "").slice(0, 2).join("");
};

const getVehicleIcon = (type?: string): string => {
  switch (type?.toLowerCase()) {
    case "motorcycle": return "🏍️";
    case "car": return "🚗";
    case "bicycle": return "🚲";
    case "van": return "🚐";
    case "foot": return "🚶";
    default: return "🛵";
  }
};

const getVehicleName = (type?: string): string => {
  switch (type?.toLowerCase()) {
    case "motorcycle": return "Motorcycle";
    case "car": return "Car";
    case "bicycle": return "Bicycle";
    case "van": return "Van";
    case "foot": return "On Foot";
    default: return "Vehicle";
  }
};

const DRIVER_COLORS = [
  "#E53935", "#8E24AA", "#3949AB", "#1E88E5", "#00897B",
  "#43A047", "#7CB342", "#FDD835", "#FB8C00", "#F4511E",
  "#6D4C41", "#546E7A", "#D81B60", "#5E35B1", "#039BE5",
  "#00ACC1", "#C0CA33", "#FFB300", "#8D6E63",
];

const getDriverColor = (index: number) => DRIVER_COLORS[index % DRIVER_COLORS.length];

// Smooth Leaflet marker movement so Firebase location updates do not visually jump.
const markerAnimationFrames = new WeakMap<object, number>();
const animateMarkerTo = (
  marker: Leaflet.Marker,
  lat: number,
  lon: number,
  duration = 650,
) => {
  const start = marker.getLatLng();
  if (Math.abs(start.lat - lat) < 0.000001 && Math.abs(start.lng - lon) < 0.000001) return;

  const previousFrame = markerAnimationFrames.get(marker as unknown as object);
  if (previousFrame) cancelAnimationFrame(previousFrame);

  const startedAt = performance.now();
  const tick = (now: number) => {
    const progress = Math.min(1, (now - startedAt) / duration);
    // Ease out keeps frequent GPS updates feeling responsive instead of mechanical.
    const eased = 1 - Math.pow(1 - progress, 3);
    marker.setLatLng([
      start.lat + (lat - start.lat) * eased,
      start.lng + (lon - start.lng) * eased,
    ]);

    if (progress < 1) {
      const frame = requestAnimationFrame(tick);
      markerAnimationFrames.set(marker as unknown as object, frame);
    } else {
      markerAnimationFrames.delete(marker as unknown as object);
    }
  };

  const frame = requestAnimationFrame(tick);
  markerAnimationFrames.set(marker as unknown as object, frame);
};

const formatMapAddress = (value: any): string => {
  if (!value) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value !== "object") return String(value).trim();

  const parts = [
    value.address,
    value.full_address,
    value.text,
    value.street,
    value.street_address,
    value.area,
    value.subcity,
    value.city,
    value.region,
    value.country,
  ]
    .filter((part) => typeof part === "string" && part.trim())
    .map((part) => part.trim());

  return Array.from(new Set(parts)).join(", ");
};

// ── Canonical Order Destination Helper ─────────────────────
const getOrderDestination = (order: any): OrderDestination => {
  if (!order) {
    return { address: "Address not available", lat: null, lon: null, source: "unknown" };
  }

  let lat: number | null = null;
  let lon: number | null = null;
  let source: OrderDestination["source"] = "unknown";

  if (isValidCoordinate(order.shipping_lat, order.shipping_lon)) {
    lat = Number(order.shipping_lat);
    lon = Number(order.shipping_lon);
    source = "shipping";
  }
  else if (order.vendor_orders?.[0] && isValidCoordinate(order.vendor_orders[0].shipping_lat, order.vendor_orders[0].shipping_lon)) {
    lat = Number(order.vendor_orders[0].shipping_lat);
    lon = Number(order.vendor_orders[0].shipping_lon);
    source = "nested";
  }
  else if (isValidCoordinate(order.delivery?.customer_lat, order.delivery?.customer_lon)) {
    lat = Number(order.delivery.customer_lat);
    lon = Number(order.delivery.customer_lon);
    source = "delivery";
  }
  else if (order.vendor_orders?.[0]?.delivery && isValidCoordinate(order.vendor_orders[0].delivery.customer_lat, order.vendor_orders[0].delivery.customer_lon)) {
    lat = Number(order.vendor_orders[0].delivery.customer_lat);
    lon = Number(order.vendor_orders[0].delivery.customer_lon);
    source = "nested";
  }
  else if (isValidCoordinate(order.customer_lat, order.customer_lon)) {
    lat = Number(order.customer_lat);
    lon = Number(order.customer_lon);
    source = "coordinates";
  }

  let address = "";

  const addressCandidates = [
    order.shipping_address_text,
    order.vendor_orders?.[0]?.shipping_address_text,
    order.delivery?.customer_address,
    order.vendor_orders?.[0]?.delivery?.customer_address,
    order.shipping_address_ref,
    order.vendor_orders?.[0]?.shipping_address_ref,
    order.delivery_address,
    order.customer_address,
    order.address,
    order.street_address,
  ];

  for (const candidate of addressCandidates) {
    const formatted = formatMapAddress(candidate);
    if (formatted) {
      address = formatted;
      break;
    }
  }

  if (!address && lat != null && lon != null) {
    address = `${lat.toFixed(6)}, ${lon.toFixed(6)}`;
    source = "coordinates";
  }

  if (!address) {
    address = "Address not available";
  }

  return { address, lat, lon, source };
};

// ── Assignment Eligibility Helper ─────────────────────────────────
const canAssignDriver = (order: any): { canAssign: boolean; reason?: string } => {
  if (!order) return { canAssign: false, reason: "Order not found" };

  const masterStatus = order.status?.toLowerCase();
  const deliveryStatus = order.delivery?.status?.toLowerCase();
  const vendorOrders = order.vendor_orders || [];
  
  const blockedStatuses = ['delivered', 'cancelled', 'rejected', 'refunded', 'completed'];
  if (blockedStatuses.includes(masterStatus)) {
    return { canAssign: false, reason: `Order status is ${masterStatus}. Driver assignment is unavailable.` };
  }
  
  if (deliveryStatus && blockedStatuses.includes(deliveryStatus)) {
    return { canAssign: false, reason: `Delivery status is ${deliveryStatus}. Driver assignment is unavailable.` };
  }

  for (const vo of vendorOrders) {
    const voStatus = vo.status?.toLowerCase();
    const voDeliveryStatus = vo.delivery_status?.toLowerCase() || vo.delivery?.status?.toLowerCase();
    
    if (['cancelled', 'rejected', 'refunded'].includes(voStatus) || 
        (voDeliveryStatus && ['cancelled', 'rejected', 'refunded'].includes(voDeliveryStatus))) {
      return { canAssign: false, reason: "One or more vendor deliveries are cancelled or rejected." };
    }
  }

  return { canAssign: true };
};

// ── Normalize Order Data ──────────────────────────────────
const normalizeOrder = (order: any): DispatchOrder => {
  const destination = getOrderDestination(order);
  const assignmentCheck = canAssignDriver(order);
  
  const vendorOrder = order.vendor_orders?.[0];
  const company = vendorOrder?.company || order.company;
  
  const pickupLat = company?.latitude != null ? Number(company.latitude) : null;
  const pickupLon = company?.longitude != null ? Number(company.longitude) : null;
  
  const items = vendorOrder?.items || order.items || order.order_items || [];
  
  return {
    id: order.id,
    status: order.status || "unknown",
    fulfillmentType: order.fulfillment_type || vendorOrder?.fulfillment_type || "delivery",
    customerName: order.recipient_name || order.customer_name || vendorOrder?.recipient_name || "Recipient",
    customerPhone: order.shipping_phone || order.customer_phone || vendorOrder?.shipping_phone || "",
    address: destination.address,
    customerLat: destination.lat,
    customerLon: destination.lon,
    pickupName: company?.name || "Pickup Location",
    pickupLat: isValidCoordinate(pickupLat, pickupLon) ? pickupLat : null,
    pickupLon: isValidCoordinate(pickupLat, pickupLon) ? pickupLon : null,
    subtotal: Number(order.subtotal || vendorOrder?.subtotal || 0),
    deliveryFee: Number(order.delivery_fee || vendorOrder?.delivery_fee || 0),
    total: Number(order.total_amount || vendorOrder?.amount || 0),
    currency: order.currency || "ETB",
    paymentMethod: order.payment_method || vendorOrder?.payment_method || "",
    paymentStatus: order.payment_status || vendorOrder?.payment_status || "",
    items,
    canAssign: assignmentCheck.canAssign,
    assignmentBlockedReason: assignmentCheck.reason,
    companyLat: pickupLat,
    companyLon: pickupLon,
    companyAddress: formatMapAddress(company?.address || company?.address_am || company?.location || ""),
  };
};

// ── UI atoms ───────────────────────────────────────────────────────
// ── Popup generators ───────────────────────────────────────────
const createCompanyPopup = (order: DispatchOrder): string => {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:240px;max-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="background:#E8F5E9;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;">🏢</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#111827;">Company Location</div>
          <div style="font-size:13px;color:#6B7280;">${escapeHtml(order.pickupName)}</div>
        </div>
      </div>
      ${order.companyAddress ? `
        <div style="background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:8px;">
          <div style="font-size:12px;color:#374151;">📍 ${escapeHtml(order.companyAddress)}</div>
        </div>
      ` : ''}
      ${order.companyLat != null && order.companyLon != null ? `
        <div style="font-size:11px;color:#6B7280;font-family:monospace;">
          ${order.companyLat.toFixed(6)}, ${order.companyLon.toFixed(6)}
        </div>
      ` : ''}
    </div>
  `;
};

const createCustomerPopup = (orders: DeliveryWithLocation[]): string => {
  const listItems = orders
    .map(
      (o) =>
        `<li style="margin-bottom:6px;"><b>#${o.id}-${o.master_order_id || "N/A"}</b> – ${escapeHtml(o.recipient_name || o.customer_name || "Recipient")}</li>`,
    )
    .join("");
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:220px;max-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="background:#FEF3C7;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;">📍</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#111827;">Customer Location</div>
          <div style="font-size:13px;color:#6B7280;">${orders.length} order${orders.length > 1 ? "s" : ""}</div>
        </div>
      </div>
      <ul style="background:#F9FAFB;border-radius:12px;padding:12px;list-style:none;margin:0;">${listItems}</ul>
    </div>
  `;
};

const createCustomerPopupForOrder = (order: DispatchOrder): string => {
  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:260px;max-width:320px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        <div style="background:#FEF3C7;border-radius:12px;width:44px;height:44px;display:flex;align-items:center;justify-content:center;font-size:22px;">📍</div>
        <div>
          <div style="font-size:16px;font-weight:700;color:#111827;">Customer Location</div>
          <div style="font-size:13px;color:#6B7280;">${escapeHtml(order.customerName)}</div>
        </div>
      </div>
      <div style="background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:8px;">
        <div style="font-size:12px;color:#374151;margin-bottom:6px;">
          <strong>📍 Address:</strong> ${escapeHtml(order.address)}
        </div>
        ${order.customerPhone ? `
          <div style="font-size:12px;color:#374151;margin-bottom:6px;">
            <strong>📞 Phone:</strong> ${escapeHtml(order.customerPhone)}
          </div>
        ` : ''}
        ${order.customerLat != null && order.customerLon != null ? `
          <div style="font-size:12px;color:#374151;">
            <strong>🌍 Coordinates:</strong> ${order.customerLat.toFixed(6)}, ${order.customerLon.toFixed(6)}
          </div>
        ` : ''}
      </div>
      <div style="font-size:11px;color:#6B7280;font-family:monospace;">
        Order #${order.id}
      </div>
    </div>
  `;
};

const createDriverPopup = (
  driverName: string,
  orders: DeliveryWithLocation[],
  color: string,
  phone?: string,
): string => {
  const safeName = escapeHtml(driverName);
  const safePhone = phone ? escapeHtml(phone) : "";
  const driverLat = orders[0]?.delivery.current_lat;
  const driverLng = orders[0]?.delivery.current_lng;
  const image = orders[0]?.delivery.delivery_person_image;

  const orderList = orders
    .map((o) => {
      const custLat = o.delivery.customer_lat!;
      const custLng = o.delivery.customer_lon!;
      let distStr = "";

      if (driverLat != null && driverLng != null) {
        const km = haversine(driverLat, driverLng, custLat, custLng).toFixed(1);
        distStr = ` (${km} km)`;
      }

      return `<li style="margin-bottom:4px;">
        <b>#${o.id}-${o.master_order_id || "N/A"}</b>
        → ${escapeHtml(o.recipient_name || o.customer_name || "Recipient")}${distStr}
      </li>`;
    })
    .join("");

  const imageHtml = image
    ? `<img
          src="${escapeHtml(image)}"
          alt="${safeName}"
          style="
            width:44px;
            height:44px;
            border-radius:50%;
            object-fit:cover;
            border:2px solid ${color};
          "
       />`
    : `<div
          style="
            background:${color}20;
            border-radius:50%;
            width:44px;
            height:44px;
            display:flex;
            align-items:center;
            justify-content:center;
            font-size:24px;
            border:2px solid ${color};
          "
       >
          🚚
       </div>`;

  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:230px;max-width:300px;">
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:10px;">
        ${imageHtml}
        <div>
          <div style="font-size:16px;font-weight:700;color:#111827;">
            ${safeName}
          </div>
          <div style="font-size:13px;color:${color};display:flex;align-items:center;gap:4px;">
            🟢 Live · ${orders.length} order${orders.length > 1 ? "s" : ""}
          </div>
        </div>
      </div>

      <ul style="background:#F9FAFB;border-radius:12px;padding:12px;list-style:none;margin-bottom:12px;">
        ${orderList}
      </ul>

      ${
        safePhone
          ? `<a
                href="tel:${safePhone}"
                style="
                  display:block;
                  background:${color};
                  color:white;
                  text-align:center;
                  padding:10px;
                  border-radius:10px;
                  text-decoration:none;
                  font-weight:600;
                "
              >
                📞 Call ${safeName}
              </a>`
          : ""
      }
    </div>
  `;
};

const createDriverPopupForSelection = (
  driver: AvailableDriver,
  order: DispatchOrder,
  color: string,
  isNearest: boolean = false
): string => {
  const safeName = escapeHtml(driver.name);
  const hasLocation = driver.current_lat != null && driver.current_lng != null;
  const locationLabel = driver.isLive
    ? "🟢 Realtime GPS"
    : driver.location_source === "last_known"
      ? "🕒 Last known location"
      : "📡 Available location";

  return `
    <div style="font-family:Inter,system-ui,sans-serif;min-width:280px;max-width:340px;">
      ${isNearest ? `
        <div style="background:#F5F3FF;border:1px solid #DDD6FE;border-radius:10px;padding:8px 10px;margin-bottom:10px;display:flex;align-items:center;justify-content:space-between;gap:8px;">
          <span style="font-size:12px;font-weight:800;color:#6750A4;">★ RECOMMENDED DRIVER</span>
          <span style="font-size:10px;font-weight:700;color:#6D28D9;">Best pickup ETA</span>
        </div>
      ` : ""}
      <div style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
        ${driver.profile_image ? `
          <img src="${escapeHtml(driver.profile_image)}" style="width:46px;height:46px;border-radius:13px;object-fit:cover;border:2px solid ${isNearest ? "#6750A4" : color};" />
        ` : `
          <div style="background:#F5F3FF;color:#6750A4;border-radius:13px;width:46px;height:46px;display:flex;align-items:center;justify-content:center;font-size:22px;border:1px solid #DDD6FE;">🚚</div>
        `}
        <div style="min-width:0;">
          <div style="font-size:15px;font-weight:800;color:#111827;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${safeName}</div>
          <div style="font-size:11px;color:#6B7280;margin-top:2px;">
            ${locationLabel} · ${getVehicleName(driver.vehicle_type)}
            ${driver.is_at_vendor ? ` · <span style="color:#B45309;font-weight:700;">🏬 At Store (${driver.active_orders_count || 1} orders - Batchable)</span>` : ""}
            ${driver.is_en_route ? ` · <span style="color:#4338CA;font-weight:700;">🚗 En Route (${driver.active_orders_count} active)</span>` : ""}
            ${!driver.is_at_vendor && !driver.is_en_route && (driver.active_orders_count === 0 || !driver.active_orders_count) ? ` · <span style="color:#15803D;font-weight:700;">🟢 Available</span>` : ""}
          </div>
        </div>
      </div>

      ${hasLocation ? `
        <div style="background:#F9FAFB;border:1px solid #F3F4F6;border-radius:12px;padding:11px;margin-bottom:10px;">
          <div style="font-size:10px;font-weight:800;color:#9CA3AF;text-transform:uppercase;letter-spacing:.08em;margin-bottom:8px;">Dispatch route</div>
          <div style="display:flex;align-items:center;gap:7px;font-size:11px;color:#374151;margin-bottom:7px;">
            <span style="width:20px;height:20px;border-radius:7px;background:${isNearest ? "#6750A4" : color};color:white;display:flex;align-items:center;justify-content:center;font-size:10px;">1</span>
            <span style="flex:1;">Driver → Pickup</span>
            <strong>${formatDistance(driver.road_distance_to_pickup ?? driver.distance_to_pickup)}</strong>
            <span style="color:#9CA3AF;">${driver.road_eta_to_pickup != null ? formatDuration(driver.road_eta_to_pickup) : ""}</span>
          </div>
          <div style="display:flex;align-items:center;gap:7px;font-size:11px;color:#374151;margin-bottom:7px;">
            <span style="width:20px;height:20px;border-radius:7px;background:#6750A4;color:white;display:flex;align-items:center;justify-content:center;font-size:10px;">2</span>
            <span style="flex:1;">Pickup → Customer</span>
            <strong>${formatDistance(driver.pickup_to_customer_distance)}</strong>
            <span style="color:#9CA3AF;">${driver.pickup_to_customer_eta != null ? formatDuration(driver.pickup_to_customer_eta) : ""}</span>
          </div>
          <div style="border-top:1px solid #E5E7EB;padding-top:8px;display:flex;justify-content:space-between;font-size:12px;color:#111827;">
            <span style="font-weight:700;">Total trip</span>
            <strong style="color:#6750A4;">${formatDistance(driver.total_route_distance)} · ${formatDuration(driver.total_eta_minutes)}</strong>
          </div>
        </div>
      ` : `
        <div style="background:#F9FAFB;border-radius:12px;padding:12px;margin-bottom:8px;text-align:center;">
          <span style="font-size:12px;color:#6B7280;">Location unavailable</span>
        </div>
      `}

      <div style="background:#F5F3FF;border-radius:10px;padding:9px 10px;margin-bottom:10px;font-size:11px;color:#5B4A85;">
        <div style="font-weight:800;margin-bottom:3px;">Delivery destination</div>
        <div>${escapeHtml(order.address)}</div>
      </div>

      ${driver.phone ? `
        <a href="tel:${escapeHtml(driver.phone)}" style="
          display:block;background:#6750A4;color:white;text-align:center;
          padding:10px;border-radius:10px;text-decoration:none;font-weight:700;font-size:12px;
        ">
          Call ${safeName}
        </a>
      ` : ""}
    </div>
  `;
};

// ── Marker icon helpers ────────────────────────────────────────────
const makeCompanyIcon = (): Leaflet.DivIcon => {
  const L = (window as any).L;
  return L.divIcon({
    className: "dispatch-marker dispatch-marker--pickup",
    html: `
      <div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:15px;background:#6750A4;box-shadow:0 8px 24px rgba(103,80,164,.28);border:3px solid white;"></div>
        <span style="position:relative;font-size:20px;line-height:1;">🏪</span>
        <span style="position:absolute;right:-3px;bottom:-3px;width:12px;height:12px;border-radius:999px;background:#22C55E;border:2px solid white;box-shadow:0 2px 8px rgba(34,197,94,.35);"></span>
      </div>
      <div style="position:absolute;left:50%;top:52px;transform:translateX(-50%);white-space:nowrap;background:white;color:#4B5563;border:1px solid #E5E7EB;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:700;box-shadow:0 4px 12px rgba(15,23,42,.10);">Pickup</div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
};

const makeCustomerIcon = (orders: DeliveryWithLocation[]): Leaflet.DivIcon => {
  const L = (window as any).L;
  const customerName = orders[0]?.recipient_name || orders[0]?.customer_name || "Recipient";

  return L.divIcon({
    className: "dispatch-marker dispatch-marker--recipient",
    html: `
      <div style="position:relative;width:44px;height:44px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:14px;background:white;border:2px solid #F59E0B;box-shadow:0 8px 22px rgba(15,23,42,.16);"></div>
        <span style="position:relative;font-size:19px;line-height:1;">📍</span>
        ${orders.length > 1 ? `<span style="position:absolute;top:-7px;right:-7px;min-width:20px;height:20px;padding:0 5px;border-radius:999px;background:#F59E0B;color:white;border:2px solid white;display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;box-sizing:border-box;">${orders.length}</span>` : ""}
      </div>
      <div style="position:absolute;left:50%;top:50px;transform:translateX(-50%);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:white;color:#4B5563;border:1px solid #E5E7EB;padding:4px 8px;border-radius:999px;font-size:10px;font-weight:700;box-shadow:0 4px 12px rgba(15,23,42,.10);">${escapeHtml(customerName)}</div>
    `,
    iconSize: [44, 44],
    iconAnchor: [22, 22],
  });
};

const makeDeliveryLocationIcon = (customerName: string): Leaflet.DivIcon => {
  const L = (window as any).L;
  return L.divIcon({
    className: "dispatch-marker dispatch-marker--delivery",
    html: `
      <div style="position:relative;width:46px;height:46px;display:flex;align-items:center;justify-content:center;">
        <div style="position:absolute;inset:0;border-radius:15px;background:white;border:3px solid #6750A4;box-shadow:0 9px 24px rgba(103,80,164,.22);"></div>
        <span style="position:relative;font-size:20px;line-height:1;">📦</span>
      </div>
      <div style="position:absolute;left:50%;top:52px;transform:translateX(-50%);max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;background:#6750A4;color:white;padding:4px 9px;border-radius:999px;font-size:10px;font-weight:800;box-shadow:0 4px 12px rgba(103,80,164,.22);">${escapeHtml(customerName)}</div>
    `,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
  });
};

const makeDriverIcon = (
  driverName: string,
  count: number,
  color: string,
  isInHouse?: boolean,
  isNearest?: boolean,
  isLive = true,
): Leaflet.DivIcon => {
  const L = (window as any).L;
  const typeLabel = isInHouse ? "In-House" : "3PL";
  const safeName = escapeHtml(driverName);
  const statusLabel = isLive ? "Live" : "View only";
  const statusColor = isLive ? "#22C55E" : "#9CA3AF";

  return L.divIcon({
    className: "dispatch-driver-marker",
    html: `
      <div style="position:relative;display:flex;align-items:center;gap:9px;background:white;border:1px solid ${isNearest ? "#C4B5FD" : "#E5E7EB"};border-left:4px solid ${isNearest ? "#6750A4" : color};border-radius:16px;padding:6px 10px 6px 6px;box-shadow:0 10px 28px rgba(15,23,42,.16);white-space:nowrap;font-family:Inter,system-ui,sans-serif;cursor:pointer;min-width:150px;">
        <div style="position:relative;width:38px;height:38px;border-radius:12px;background:#F5F3FF;color:#6750A4;display:flex;align-items:center;justify-content:center;font-size:18px;border:1px solid #EDE9FE;flex:none;">
          🚚
          <span style="position:absolute;right:-2px;bottom:-2px;width:10px;height:10px;border-radius:999px;background:${statusColor};border:2px solid white;"></span>
        </div>
        <div style="min-width:0;display:flex;flex-direction:column;gap:2px;">
          <div style="display:flex;align-items:center;gap:5px;">
            <span style="max-width:116px;overflow:hidden;text-overflow:ellipsis;font-size:12px;font-weight:800;color:#1F2937;">${safeName}</span>
            ${isNearest ? `<span style="background:#F5F3FF;color:#6750A4;border:1px solid #DDD6FE;border-radius:999px;padding:2px 5px;font-size:8px;font-weight:800;">BEST</span>` : ""}
          </div>
          <span style="font-size:9px;font-weight:700;color:${isLive ? "#6B7280" : "#9CA3AF"};">${statusLabel} · ${typeLabel}${count > 1 ? ` · ${count} stops` : ""}</span>
        </div>
        ${count > 1 ? `<span style="position:absolute;top:-7px;right:-7px;min-width:20px;height:20px;padding:0 5px;background:#6750A4;color:white;border:2px solid white;border-radius:999px;display:flex;align-items:center;justify-content:center;font-size:9px;font-weight:800;box-sizing:border-box;">${count}</span>` : ""}
      </div>
    `,
    iconSize: [170, 52],
    iconAnchor: [22, 26],
  });
};

// ── Main Component ────────────────────────────────────────────────
export default function DeliveryTrackingMap({
  onClose,
  mode = "tracking",
  selectedOrderId,
  onDriverSelect,
  onAssignmentComplete,
}: DeliveryTrackingMapProps) {
  const { user } = useAuth();
  const { company } = useCurrentCompany();
  const readOnly = useReadOnly();
  const { showToast } = useToast();

  const isSuperAdmin = !user?.memberships?.length;
  const shouldFetchAll = isSuperAdmin || readOnly;
  const companySlug = company?.slug ?? null;

  const effectiveSlug = useMemo(() => {
    if (shouldFetchAll) return null;
    if (user?.memberships?.length) {
      return (companySlug || user.memberships[0]?.company_slug) ?? null;
    }
    return null;
  }, [shouldFetchAll, companySlug, user]);

  // UI state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const toggleSidebar = useCallback(() => setIsSidebarOpen(p => !p), []);
  const [activeOrderId, setActiveOrderId] = useState<number | null>(selectedOrderId || null);
  const [followDriver, setFollowDriver] = useState<boolean>(false);
  const [driverFilter, setDriverFilter] = useState<"all" | "in_house" | "third_party">("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOption, setSortOption] = useState<SortOption>("recommended");
  const [pendingDriverId, setPendingDriverId] = useState<number | null>(null);
  const [selectedDriverId, setSelectedDriverId] = useState<number | null>(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [showConfirmPanel, setShowConfirmPanel] = useState(false);
  const [showCompanyMarker, setShowCompanyMarker] = useState(true);
  const [showCustomerMarker, setShowCustomerMarker] = useState(true);
  const [showDeliveryMarker, setShowDeliveryMarker] = useState(true);
  const [isOrderRouteExpanded, setIsOrderRouteExpanded] = useState(false);
  const [isDriverToolsExpanded, setIsDriverToolsExpanded] = useState(false);
  const [mapStyle, setMapStyle] = useState<"street" | "satellite">("street");

  // Data state
  const [firebaseData, setFirebaseData] = useState<Record<number, FirebaseDriverData>>({});
  const [driverLocations, setDriverLocations] = useState<Record<number, {
    latitude: number; longitude: number; heading?: number; is_online?: boolean; updated_at?: number;
  }>>({});
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [realtimeUpdatedAt, setRealtimeUpdatedAt] = useState<Date | null>(null);
  const [activeRealtimeSubscriptions, setActiveRealtimeSubscriptions] = useState(0);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [availableDrivers, setAvailableDrivers] = useState<AvailableDriver[]>([]);
  const [loadingDrivers, setLoadingDrivers] = useState(false);
  const [routeDataByDriver, setRouteDataByDriver] = useState<Record<number, RouteSummary | null>>({});
  const [pickupCustomerRoute, setPickupCustomerRoute] = useState<RouteSummary | null>(null);

  // Refs
  const mapRef = useRef<Leaflet.Map | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const driverMarkers = useRef<Map<string, Leaflet.Marker>>(new Map());
  const customerMarkers = useRef<Map<string, Leaflet.Marker>>(new Map());
  const pickupMarkerRef = useRef<Leaflet.Marker | null>(null);
  const companyMarkerRef = useRef<Leaflet.Marker | null>(null);
  const deliveryMarkerRef = useRef<Leaflet.Marker | null>(null);
  const routeLines = useRef<Map<string, Leaflet.Polyline>>(new Map());
  const clusterGroup = useRef<Leaflet.LayerGroup | null>(null);
  const subscribedIds = useRef<Set<string>>(new Set());
  const initialFitDone = useRef(false);
  const tileLayerRef = useRef<Leaflet.TileLayer | null>(null);
  
  // OSRM routing refs
  const routeCache = useRef<Map<RouteCacheKey, RouteCacheEntry>>(new Map());
  const pendingRequests = useRef<Map<RouteCacheKey, Promise<RouteSummary | null>>>(new Map());
  const debounceTimers = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const driverRoutePositionKeys = useRef<Map<number, string>>(new Map());

  // React Query
  const queryKey = useMemo(
    () => ["delivery-tracking-orders", shouldFetchAll ? "all" : effectiveSlug],
    [shouldFetchAll, effectiveSlug]
  );

  const {
    data: allOrders = [],
    isLoading,
    isFetching,
    error: queryError,
    refetch,
    dataUpdatedAt,
  } = useQuery<VendorOrder[]>({
    queryKey,
    queryFn: async () => {
      if (!shouldFetchAll && !effectiveSlug) return [];
      let page = 1;
      let hasNext = true;
      const fetched: VendorOrder[] = [];
      while (hasNext) {
        const params = { page, page_size: 500, ordering: "-created_at" };
        const response = shouldFetchAll
          ? await getAdminVendorOrders(params)
          : await getCompanyVendorOrders(effectiveSlug!, params);
        fetched.push(...(response.data.results ?? []));
        hasNext = response.data.next !== null;
        page++;
      }
      return fetched;
    },
    staleTime: 30 * 1000,
    gcTime: 30 * 60 * 1000,
    // Firebase is the primary real-time channel; polling is a resilient fallback for
    // newly assigned/completed deliveries and backend-only status changes.
    refetchInterval: mode === "tracking" ? 30 * 1000 : 60 * 1000,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: true,
    retry: 2,
    enabled: shouldFetchAll || !!effectiveSlug,
  });

  useEffect(() => {
    if (dataUpdatedAt) setLastUpdated(new Date(dataUpdatedAt));
  }, [dataUpdatedAt]);

  const loading = isLoading;
  const error = queryError
    ? ((queryError as any)?.response?.data?.detail ?? queryError.message ?? "Failed to load")
    : null;

  // Merge API + Firebase data
  const combinedOrders: DeliveryWithLocation[] = useMemo(() => {
    return allOrders.map((order) => {
      const fb = firebaseData[order.id];
      const destination = getOrderDestination(order);
      const vendorOrder = order.vendor_orders?.[0];
      const deliveryData = vendorOrder?.delivery || order.delivery;
      
      return {
        ...order,
        delivery: {
          ...deliveryData,
          current_lat: fb?.lat ?? deliveryData?.current_lat ?? undefined,
          current_lng: fb?.lon ?? deliveryData?.current_lng ?? undefined,
          speed: fb?.speed,
          heading: fb?.heading,
          delivery_person_name: fb?.driver_name ?? deliveryData?.delivery_person_name ?? "Unassigned",
          delivery_person_phone: fb?.driver_phone ?? deliveryData?.delivery_person_phone ?? "",
          status: fb?.status ?? deliveryData?.status ?? order.delivery_status ?? vendorOrder?.delivery_status ?? "pending",
          logistics_company_name: deliveryData?.logistics_company_name,
          is_in_house: !deliveryData?.logistics_company_name || 
                       deliveryData?.logistics_company_name === "" ||
                       deliveryData?.logistics_company_name === vendorOrder?.company?.name,
          customer_address: destination.address,
          customer_lat: destination.lat ?? deliveryData?.customer_lat ?? order.shipping_lat,
          customer_lon: destination.lon ?? deliveryData?.customer_lon ?? order.shipping_lon,
          delivery_person_image: deliveryData?.delivery_person_image,
        },
      } as DeliveryWithLocation;
    });
  }, [allOrders, firebaseData]);

  // Normalize selected order
  const normalizedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    const order = combinedOrders.find(o => o.id === selectedOrderId) || allOrders.find(o => o.id === selectedOrderId);
    if (order) {
      return normalizeOrder(order);
    }
    return null;
  }, [combinedOrders, allOrders, selectedOrderId]);

  const selectedOrder = useMemo(() => {
    if (!selectedOrderId) return null;
    return combinedOrders.find(o => o.id === selectedOrderId);
  }, [combinedOrders, selectedOrderId]);

  // Live deliveries filter
  const liveDeliveries = useMemo(() => {
    let filtered = combinedOrders.filter(order => {
      const dest = getOrderDestination(order);
      return order.delivery?.status === "out_for_delivery" &&
             dest.lat != null && dest.lon != null &&
             order.delivery.delivery_person_name !== "Unassigned";
    });

    if (mode === "driver_selection" && selectedOrderId) {
      filtered = filtered.filter(o => o.id === selectedOrderId);
    }

    if (driverFilter === "in_house") {
      filtered = filtered.filter(order => order.delivery.is_in_house === true);
    } else if (driverFilter === "third_party") {
      filtered = filtered.filter(order => order.delivery.is_in_house === false);
    }

    return filtered;
  }, [combinedOrders, driverFilter, mode, selectedOrderId]);

  // Fetch available drivers for selection mode
  useEffect(() => {
    if (mode === "driver_selection" && normalizedOrder && normalizedOrder.canAssign) {
      const fetchDrivers = async () => {
        setLoadingDrivers(true);
        try {
          const companySlug = selectedOrder?.vendor_orders?.[0]?.company?.slug || 
                             selectedOrder?.company?.slug;
          if (!companySlug) {
            showToast("error", "Company information not found");
            setLoadingDrivers(false);
            return;
          }
          
          const res = await getAvailableDeliveryDrivers(companySlug, {
            vendor_order_id: selectedOrderId,
          });
          setAvailableDrivers(res.data || []);
        } catch (err) {
          console.error("Failed to fetch available drivers", err);
          showToast("error", "Failed to load available drivers");
        } finally {
          setLoadingDrivers(false);
        }
      };
      fetchDrivers();
    }
  }, [mode, normalizedOrder?.id, selectedOrderId, selectedOrder?.company?.slug, selectedOrder?.vendor_orders, showToast]);

  // Firebase subscriptions for drivers
  useEffect(() => {
    if (mode !== "driver_selection" || !availableDrivers.length) return;
    const cleanups: Array<() => void> = [];

    availableDrivers.forEach((driver) => {
      const driverRef = ref(db, `drivers/${driver.id}`);
      const callback = (snapshot: any) => {
        const data = snapshot.val();
        if (data && data.latitude != null && data.longitude != null) {
          setDriverLocations(prev => ({
            ...prev,
            [driver.id]: data,
          }));
          setRealtimeUpdatedAt(new Date());
        }
      };
      onValue(driverRef, callback);
      cleanups.push(() => off(driverRef, "value", callback));
    });

    return () => {
      cleanups.forEach(c => c());
    };
  }, [mode, availableDrivers]);

  // Get driver live location
  const getDriverLiveLocation = useCallback((driverId: number): Coordinates | null => {
    const directLoc = driverLocations[driverId];
    if (directLoc && isValidCoordinate(directLoc.latitude, directLoc.longitude)) {
      return { lat: Number(directLoc.latitude), lon: Number(directLoc.longitude) };
    }
    return null;
  }, [driverLocations]);

  // OSRM route fetcher
  const fetchOSRMRoute = useCallback(async (
    from: Coordinates,
    to: Coordinates
  ): Promise<RouteSummary | null> => {
    const cacheKey: RouteCacheKey = `${from.lat.toFixed(5)},${from.lon.toFixed(5)}_${to.lat.toFixed(5)},${to.lon.toFixed(5)}`;
    const CACHE_TTL = 5 * 60 * 1000;

    const cached = routeCache.current.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return {
        coordinates: cached.coordinates,
        distanceKm: cached.distanceKm,
        durationMinutes: cached.durationMinutes,
      };
    }

    const existing = pendingRequests.current.get(cacheKey);
    if (existing) return existing;

    const url = `https://router.project-osrm.org/route/v1/driving/${from.lon},${from.lat};${to.lon},${to.lat}?overview=full&geometries=geojson&steps=true`;

    const requestPromise = fetch(url)
      .then(res => res.json())
      .then(data => {
        if (data.code !== "Ok" || !data.routes?.length) return null;
        const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
          (c: [number, number]) => [c[1], c[0]]
        );
        const distanceKm = data.routes[0].distance / 1000;
        const durationMinutes = data.routes[0].duration / 60;
        routeCache.current.set(cacheKey, {
          coordinates: coords,
          timestamp: Date.now(),
          distanceKm,
          durationMinutes,
        });
        return { coordinates: coords, distanceKm, durationMinutes };
      })
      .catch(() => null)
      .finally(() => {
        pendingRequests.current.delete(cacheKey);
      });

    pendingRequests.current.set(cacheKey, requestPromise);
    return requestPromise;
  }, []);

  // Enhanced drivers with dispatch-route calculations.
  // The assignment route is always Driver -> Company/Pickup -> Customer.
  const enhancedDrivers = useMemo(() => {
    if (!normalizedOrder) return [];

    const pickup: Coordinates | null =
      normalizedOrder.pickupLat != null && normalizedOrder.pickupLon != null
        ? { lat: normalizedOrder.pickupLat, lon: normalizedOrder.pickupLon }
        : null;
    const customer: Coordinates | null =
      normalizedOrder.customerLat != null && normalizedOrder.customerLon != null
        ? { lat: normalizedOrder.customerLat, lon: normalizedOrder.customerLon }
        : null;

    const fallbackPickupToCustomer =
      pickup && customer
        ? haversine(pickup.lat, pickup.lon, customer.lat, customer.lon)
        : null;

    const mapped = availableDrivers.map((d: any) => {
      let driverLoc: Coordinates | null = null;
      let locationSource: AvailableDriver["location_source"] = "unknown";
      let isLive = false;

      const liveLoc = getDriverLiveLocation(d.id);
      if (liveLoc) {
        driverLoc = liveLoc;
        locationSource = "live";
        isLive = true;
      } else if (isValidCoordinate(d.current_lat, d.current_lng)) {
        driverLoc = { lat: Number(d.current_lat), lon: Number(d.current_lng) };
        locationSource = "current";
      } else if (isValidCoordinate(d.last_lat, d.last_lon)) {
        driverLoc = { lat: Number(d.last_lat), lon: Number(d.last_lon) };
        locationSource = "last_known";
      }

      const distanceToPickup =
        driverLoc && pickup
          ? haversine(driverLoc.lat, driverLoc.lon, pickup.lat, pickup.lon)
          : null;
      const distanceToCustomer =
        driverLoc && customer
          ? haversine(driverLoc.lat, driverLoc.lon, customer.lat, customer.lon)
          : null;

      const driverToPickupRoute = routeDataByDriver[d.id] || null;
      const pickupToCustomerDistance =
        pickupCustomerRoute?.distanceKm ?? fallbackPickupToCustomer;
      const pickupToCustomerEta = pickupCustomerRoute?.durationMinutes ?? null;

      const roadDistanceToPickup =
        driverToPickupRoute?.distanceKm ?? distanceToPickup;
      const roadEtaToPickup = driverToPickupRoute?.durationMinutes ?? null;

      const totalDistance =
        roadDistanceToPickup != null && pickupToCustomerDistance != null
          ? roadDistanceToPickup + pickupToCustomerDistance
          : null;
      const totalEta =
        roadEtaToPickup != null && pickupToCustomerEta != null
          ? roadEtaToPickup + pickupToCustomerEta
          : null;

      return {
        ...d,
        current_lat: driverLoc?.lat ?? null,
        current_lng: driverLoc?.lon ?? null,
        location_source: locationSource,
        isLive,
        distance_to_pickup: distanceToPickup,
        distance_to_customer: distanceToCustomer,
        road_distance_to_pickup: roadDistanceToPickup,
        road_eta_to_pickup: roadEtaToPickup,
        pickup_to_customer_distance: pickupToCustomerDistance,
        pickup_to_customer_eta: pickupToCustomerEta,
        total_route_distance: totalDistance,
        total_eta_minutes: totalEta,
        road_distance_to_customer: totalDistance,
        road_eta_to_customer: totalEta,
        is_nearest: false,
        recommendation_rank: null,
      } as AvailableDriver;
    });

    // Only drivers with a realtime GPS feed are assignable/recommendable.
    // Drivers with last-known/API coordinates remain visible for dispatcher context.
    const rankable = mapped
      .filter((d) => d.isLive === true && d.current_lat != null && d.current_lng != null)
      .sort((a, b) => {
        const etaA = a.road_eta_to_pickup ?? Number.POSITIVE_INFINITY;
        const etaB = b.road_eta_to_pickup ?? Number.POSITIVE_INFINITY;
        if (etaA !== etaB) return etaA - etaB;

        const distA = a.road_distance_to_pickup ?? a.distance_to_pickup ?? Number.POSITIVE_INFINITY;
        const distB = b.road_distance_to_pickup ?? b.distance_to_pickup ?? Number.POSITIVE_INFINITY;
        if (distA !== distB) return distA - distB;

        return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
      });

    rankable.forEach((driver, index) => {
      driver.recommendation_rank = index + 1;
      driver.is_nearest = index === 0;
    });

    mapped.sort((a, b) => {
      switch (sortOption) {
        case "nearest_pickup":
          return (
            (a.road_distance_to_pickup ?? a.distance_to_pickup ?? 999999) -
            (b.road_distance_to_pickup ?? b.distance_to_pickup ?? 999999)
          );
        case "highest_rated":
          return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
        case "fastest_eta":
          return (
            (a.total_eta_minutes ?? a.road_eta_to_pickup ?? 999999) -
            (b.total_eta_minutes ?? b.road_eta_to_pickup ?? 999999)
          );
        case "recommended":
        default:
          if ((a.recommendation_rank ?? 999999) !== (b.recommendation_rank ?? 999999)) {
            return (a.recommendation_rank ?? 999999) - (b.recommendation_rank ?? 999999);
          }
          return (Number(b.average_rating) || 0) - (Number(a.average_rating) || 0);
      }
    });

    return mapped;
  }, [
    availableDrivers,
    normalizedOrder,
    getDriverLiveLocation,
    sortOption,
    routeDataByDriver,
    pickupCustomerRoute,
  ]);

  // Shared second leg: Company/Pickup -> Customer. It is the same for every driver.
  useEffect(() => {
    if (mode !== "driver_selection" || !normalizedOrder) {
      setPickupCustomerRoute(null);
      return;
    }

    if (
      normalizedOrder.pickupLat == null ||
      normalizedOrder.pickupLon == null ||
      normalizedOrder.customerLat == null ||
      normalizedOrder.customerLon == null
    ) {
      setPickupCustomerRoute(null);
      return;
    }

    let cancelled = false;
    const pickup: Coordinates = {
      lat: normalizedOrder.pickupLat,
      lon: normalizedOrder.pickupLon,
    };
    const customer: Coordinates = {
      lat: normalizedOrder.customerLat,
      lon: normalizedOrder.customerLon,
    };

    fetchOSRMRoute(pickup, customer).then((route) => {
      if (!cancelled) setPickupCustomerRoute(route);
    });

    return () => {
      cancelled = true;
    };
  }, [
    mode,
    normalizedOrder?.id,
    normalizedOrder?.pickupLat,
    normalizedOrder?.pickupLon,
    normalizedOrder?.customerLat,
    normalizedOrder?.customerLon,
    fetchOSRMRoute,
  ]);

  // First leg for every candidate: live Driver -> Company/Pickup.
  useEffect(() => {
    if (mode !== "driver_selection" || !normalizedOrder || !enhancedDrivers.length) return;
    if (normalizedOrder.pickupLat == null || normalizedOrder.pickupLon == null) return;

    const pickup: Coordinates = {
      lat: normalizedOrder.pickupLat,
      lon: normalizedOrder.pickupLon,
    };

    enhancedDrivers.forEach((driver: AvailableDriver) => {
      if (
        driver.current_lat == null ||
        driver.current_lng == null ||
        !isValidCoordinate(driver.current_lat, driver.current_lng)
      ) {
        return;
      }

      const from: Coordinates = {
        lat: driver.current_lat,
        lon: driver.current_lng,
      };
      const debounceKey = `driver_pickup_route_${driver.id}`;
      const positionKey = `${from.lat.toFixed(4)},${from.lon.toFixed(4)}_${pickup.lat.toFixed(4)},${pickup.lon.toFixed(4)}`;

      // Do not continuously request the same road route just because route state
      // itself caused a render. A new request is needed only after meaningful GPS movement.
      if (driverRoutePositionKeys.current.get(driver.id) === positionKey) return;
      driverRoutePositionKeys.current.set(driver.id, positionKey);

      // If a newer GPS point arrives while a route request is waiting, replace
      // the pending timer so OSRM receives the newest known driver position.
      const existingTimer = debounceTimers.current.get(debounceKey);
      if (existingTimer) clearTimeout(existingTimer);

      debounceTimers.current.set(
        debounceKey,
        setTimeout(async () => {
          const routeSummary = await fetchOSRMRoute(from, pickup);
          if (!routeSummary) {
            driverRoutePositionKeys.current.delete(driver.id);
          }
          setRouteDataByDriver((prev) => ({
            ...prev,
            [driver.id]: routeSummary,
          }));
          debounceTimers.current.delete(debounceKey);
        }, 550),
      );
    });
  }, [
    mode,
    normalizedOrder?.id,
    normalizedOrder?.pickupLat,
    normalizedOrder?.pickupLon,
    enhancedDrivers,
    fetchOSRMRoute,
  ]);

  // Filter available drivers
  const filteredAvailableDrivers = useMemo(() => {
    let filtered = [...enhancedDrivers];
    
    if (driverFilter === "in_house") {
      filtered = filtered.filter(d => d.is_in_house === true);
    } else if (driverFilter === "third_party") {
      filtered = filtered.filter(d => d.is_in_house === false);
    }
    
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(d =>
        d.name?.toLowerCase().includes(search) ||
        d.phone?.toLowerCase().includes(search) ||
        d.username?.toLowerCase().includes(search) ||
        d.company_name?.toLowerCase().includes(search) ||
        d.vehicle_type?.toLowerCase().includes(search)
      );
    }
    
    return filtered;
  }, [enhancedDrivers, driverFilter, searchTerm]);

  // Groupings for tracking mode
  const customerGroups = useMemo(() => {
    const map = new Map<string, DeliveryWithLocation[]>();
    liveDeliveries.forEach(order => {
      const dest = getOrderDestination(order);
      if (dest.lat != null && dest.lon != null) {
        const key = `${dest.lat},${dest.lon}`;
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(order);
      }
    });
    return map;
  }, [liveDeliveries]);

  const driverGroups = useMemo(() => {
    const map = new Map<string, DeliveryWithLocation[]>();
    liveDeliveries.forEach(order => {
      const driver = order.delivery.delivery_person_name;
      if (!map.has(driver)) map.set(driver, []);
      map.get(driver)!.push(order);
    });
    return map;
  }, [liveDeliveries]);

  const driverColorMap = useMemo(() => {
    const drivers = (Array.from(driverGroups.keys()) as string[]).sort();
    const colorMap = new Map<string, string>();
    drivers.forEach((driver, idx) => colorMap.set(driver, getDriverColor(idx)));
    return colorMap;
  }, [driverGroups]);

  // Stats
  const stats = useMemo(() => {
    const today = new Date().toDateString();
    const deliveriesToday = liveDeliveries.filter(
      o => new Date(o.created_at).toDateString() === today
    ).length;
    return {
      liveVehicles: driverGroups.size,
      deliveriesToday,
      onTimeDelivery: 100,
      inHouseCount: liveDeliveries.filter(o => o.delivery.is_in_house).length,
      thirdPartyCount: liveDeliveries.filter(o => !o.delivery.is_in_house).length,
    };
  }, [liveDeliveries, driverGroups]);

  // Load Leaflet
  useEffect(() => {
    if ((window as any).L && (window as any).L.markerClusterGroup) {
      setLeafletLoaded(true);
      return;
    }

    const addCSS = (href: string, id: string) => {
      if (!document.getElementById(id)) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = href;
        link.id = id;
        document.head.appendChild(link);
      }
    };

    addCSS("https://unpkg.com/leaflet@1.9.4/dist/leaflet.css", "leaflet-css-dt");
    addCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.css", "mc-css-dt");
    addCSS("https://unpkg.com/leaflet.markercluster@1.5.3/dist/MarkerCluster.Default.css", "mc-default-css-dt");

    if (!document.getElementById("delivery-map-production-ui")) {
      const style = document.createElement("style");
      style.id = "delivery-map-production-ui";
      style.textContent = `
        .dispatch-marker, .dispatch-driver-marker { background: transparent !important; border: 0 !important; }
        .leaflet-popup-content-wrapper { border-radius: 16px; box-shadow: 0 18px 48px rgba(15,23,42,.18); border: 1px solid rgba(229,231,235,.9); }
        .leaflet-popup-content { margin: 14px 16px; }
        .leaflet-popup-tip { box-shadow: 2px 2px 4px rgba(15,23,42,.08); }
        .leaflet-control-zoom { border: 1px solid #E5E7EB !important; border-radius: 14px !important; overflow: hidden; box-shadow: 0 8px 24px rgba(15,23,42,.12); }
        .leaflet-control-zoom a { color: #6750A4 !important; border-color: #F3F4F6 !important; width: 34px !important; height: 34px !important; line-height: 34px !important; font-weight: 700 !important; }
        .leaflet-control-zoom a:hover { background: #F5F3FF !important; }
        .leaflet-control-attribution { background: rgba(255,255,255,.88) !important; border-radius: 8px 0 0 0; font-size: 9px !important; }
        .marker-cluster-small div, .marker-cluster-medium div, .marker-cluster-large div { background: #6750A4 !important; color: white !important; }
        .marker-cluster-small, .marker-cluster-medium, .marker-cluster-large { background: rgba(103,80,164,.22) !important; }
      `;
      document.head.appendChild(style);
    }

    const script = document.createElement("script");
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
    script.onload = () => {
      const mcScript = document.createElement("script");
      mcScript.src = "https://unpkg.com/leaflet.markercluster@1.5.3/dist/leaflet.markercluster.js";
      mcScript.onload = () => setLeafletLoaded(true);
      document.head.appendChild(mcScript);
    };
    document.head.appendChild(script);
  }, []);

  // Realtime delivery subscriptions. Subscribe from API tracking ids rather than the
  // already-filtered live list so a Firebase status/location change can bring an order
  // into or out of the live view immediately.
  const realtimeTrackingTargets = useMemo(() => {
    const targets = new Map<string, number[]>();
    const finalStatuses = new Set([
      "delivered", "cancelled", "rejected", "refunded", "completed",
    ]);

    allOrders.forEach((order: any) => {
      const vendorOrder = order.vendor_orders?.[0];
      const deliveryData = vendorOrder?.delivery || order.delivery;
      const trackingId = deliveryData?.tracking_id;
      const status = (
        deliveryData?.status || order.delivery_status || vendorOrder?.delivery_status || order.status || ""
      ).toLowerCase();

      if (!trackingId || finalStatuses.has(status)) return;
      const key = String(trackingId);
      const ids = targets.get(key) || [];
      ids.push(order.id);
      targets.set(key, ids);
    });

    return targets;
  }, [allOrders]);

  useEffect(() => {
    const currentTrackingIds = new Set(realtimeTrackingTargets.keys());

    subscribedIds.current.forEach(id => {
      if (!currentTrackingIds.has(id)) {
        off(ref(db, `deliveries/${id}`));
        subscribedIds.current.delete(id);
      }
    });

    currentTrackingIds.forEach(id => {
      if (subscribedIds.current.has(id)) return;

      const trackingRef = ref(db, `deliveries/${id}`);
      onValue(
        trackingRef,
        snapshot => {
          const val = snapshot.val();
          if (!val) return;

          const orderIds = realtimeTrackingTargets.get(id) || [];
          if (!orderIds.length) return;

          setFirebaseData(prev => {
            const next = { ...prev };
            orderIds.forEach(orderId => {
              next[orderId] = {
                ...next[orderId],
                lat: val.latitude ?? val.lat ?? next[orderId]?.lat,
                lon: val.longitude ?? val.lon ?? next[orderId]?.lon,
                speed: val.speed ?? next[orderId]?.speed,
                heading: val.heading ?? next[orderId]?.heading,
                status: val.status ?? next[orderId]?.status,
                driver_name: val.driver_name ?? next[orderId]?.driver_name,
                driver_phone: val.driver_phone ?? next[orderId]?.driver_phone,
                customer_address: val.customer_address ?? next[orderId]?.customer_address,
              };
            });
            return next;
          });
          setRealtimeUpdatedAt(new Date());
        },
        () => {
          // API polling remains active as a fallback if Firebase is temporarily unavailable.
          setActiveRealtimeSubscriptions(subscribedIds.current.size);
        },
      );
      subscribedIds.current.add(id);
    });

    setActiveRealtimeSubscriptions(subscribedIds.current.size);
  }, [realtimeTrackingTargets]);

  // Firebase cleanup
  useEffect(() => {
    return () => {
      subscribedIds.current.forEach(id => off(ref(db, `deliveries/${id}`)));
      subscribedIds.current.clear();
    };
  }, []);

  // Map initialization
  useEffect(() => {
    if (!leafletLoaded) return;
    const L = (window as any).L;
    if (!L || !L.markerClusterGroup || mapRef.current) return;

    const container = containerRef.current;
    if (!container) return;

    const map = L.map(container, {
      zoomControl: false,
      keyboard: true,
      keyboardPanDelta: 80,
      zoomAnimation: true,
      fadeAnimation: true,
      markerZoomAnimation: true,
      preferCanvas: true,
    }).setView([9.03, 38.74], 12);
    mapRef.current = map;

    L.control.zoom({ position: "bottomright" }).addTo(map);
    
    // Add default street layer
    tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { 
      attribution: "© OpenStreetMap contributors", 
      maxZoom: 19,
    }).addTo(map);

    const cluster = L.markerClusterGroup({ 
      maxClusterRadius: 60, 
      spiderfyOnMaxZoom: true, 
      showCoverageOnHover: false, 
    }); 
    map.addLayer(cluster); 
    clusterGroup.current = cluster; 
 
    return () => { 
      map.remove(); 
      mapRef.current = null; 
      clusterGroup.current = null; 
      tileLayerRef.current = null;
    }; 
  }, [leafletLoaded]);

  // Handle map style changes
  useEffect(() => {
    if (!mapRef.current || !tileLayerRef.current || !leafletLoaded) return;
    const L = (window as any).L;
    
    // Remove current tile layer
    if (tileLayerRef.current) {
      mapRef.current.removeLayer(tileLayerRef.current);
    }
    
    // Add new tile layer based on selected style
    if (mapStyle === "satellite") {
      tileLayerRef.current = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", {
        attribution: "© Esri, Maxar, Earthstar Geographics, and the GIS User Community",
        maxZoom: 19,
      }).addTo(mapRef.current);
    } else {
      tileLayerRef.current = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(mapRef.current);
    }
  }, [mapStyle, leafletLoaded]);

  // Reset fit flag when new deliveries appear after being empty 
  useEffect(() => { 
    if (liveDeliveries.length > 0) { 
      initialFitDone.current = false; 
    } 
  }, [liveDeliveries.length]); 
 
  // Update markers and routes
  useEffect(() => { 
    const L = (window as any).L; 
    if (!mapRef.current || !clusterGroup.current || !L) return; 
 
    const cluster = clusterGroup.current; 
    const currentCustomerKeys = new Set<string>(); 
    const currentDriverKeys = new Set<string>(); 
 
    // Customer markers are a tracking-layer toggle. Driver selection uses the
    // dedicated destination marker instead of duplicating the recipient point.
    if (mode === "tracking" && showCustomerMarker) {
      customerGroups.forEach((orders, key) => { 
        const [latStr, lngStr] = key.split(","); 
        const lat = parseFloat(latStr); 
        const lng = parseFloat(lngStr); 
        
        if (!isValidCoordinate(lat, lng)) {
          console.warn(`Invalid customer coordinates: ${lat}, ${lng}`);
          return;
        }
        
        currentCustomerKeys.add(key); 
   
        let marker = customerMarkers.current.get(key); 
        if (!marker) { 
          const icon = makeCustomerIcon(orders); 
          const newMarker = L.marker([lat, lng], { icon }).bindPopup( 
            createCustomerPopup(orders), 
            { maxWidth: 320 } 
          ); 
          newMarker.on("click", () => setActiveOrderId(orders[0].id)); 
          cluster.addLayer(newMarker); 
          customerMarkers.current.set(key, newMarker); 
        } else { 
          marker.setLatLng([lat, lng]); 
          marker.setIcon(makeCustomerIcon(orders)); 
          marker.setPopupContent(createCustomerPopup(orders)); 
        } 
      });
    }

    // Remove stale customer markers 
    customerMarkers.current.forEach((marker, key) => { 
      if (!currentCustomerKeys.has(key)) { 
        cluster.removeLayer(marker); 
        customerMarkers.current.delete(key); 
      } 
    }); 
 
    // Driver selection mode 
    if (mode === "driver_selection" && normalizedOrder) { 
      const pickup = normalizedOrder.pickupLat != null && normalizedOrder.pickupLon != null 
        ? { lat: normalizedOrder.pickupLat, lon: normalizedOrder.pickupLon } 
        : null; 
      const customer = normalizedOrder.customerLat != null && normalizedOrder.customerLon != null 
        ? { lat: normalizedOrder.customerLat, lon: normalizedOrder.customerLon } 
        : null; 
 
      // Keep selection markers alive between Firebase updates so locations can move
      // smoothly instead of being removed/recreated on every GPS tick.
      driverMarkers.current.forEach((marker, key) => {
        if (!key.startsWith("selection_")) {
          cluster.removeLayer(marker);
          driverMarkers.current.delete(key);
        }
      });
      routeLines.current.forEach((line, key) => {
        if (!key.startsWith("selection_route_")) {
          line.remove();
          routeLines.current.delete(key);
        }
      });

      // Add company marker (pickup location)
      if (pickup && showCompanyMarker) {
        if (!companyMarkerRef.current) {
          companyMarkerRef.current = L.marker([pickup.lat, pickup.lon], { icon: makeCompanyIcon() })
            .bindPopup(createCompanyPopup(normalizedOrder), { maxWidth: 320 })
            .addTo(mapRef.current);
        } else {
          companyMarkerRef.current.setLatLng([pickup.lat, pickup.lon]);
          companyMarkerRef.current.setIcon(makeCompanyIcon());
          companyMarkerRef.current.setPopupContent(createCompanyPopup(normalizedOrder));
        }
      } else if (companyMarkerRef.current) {
        companyMarkerRef.current.remove();
        companyMarkerRef.current = null;
      }

      // Add delivery/customer marker with full address.
      if (customer && showDeliveryMarker) {
        if (!deliveryMarkerRef.current) {
          deliveryMarkerRef.current = L.marker([customer.lat, customer.lon], {
            icon: makeDeliveryLocationIcon(normalizedOrder.customerName),
          })
            .bindPopup(createCustomerPopupForOrder(normalizedOrder), { maxWidth: 340 })
            .addTo(mapRef.current);
        } else {
          deliveryMarkerRef.current.setLatLng([customer.lat, customer.lon]);
          deliveryMarkerRef.current.setIcon(makeDeliveryLocationIcon(normalizedOrder.customerName));
          deliveryMarkerRef.current.setPopupContent(createCustomerPopupForOrder(normalizedOrder));
        }
      } else if (deliveryMarkerRef.current) {
        deliveryMarkerRef.current.remove();
        deliveryMarkerRef.current = null;
      }

      const visibleSelectionKeys = new Set<string>();
      const visibleSelectionRouteKeys = new Set<string>();

      filteredAvailableDrivers.forEach((driver, index) => {
        const color = getDriverColor(index);
        const isNearest = driver.is_nearest === true;
        const markerKey = `selection_${driver.id}`;
        visibleSelectionKeys.add(markerKey);

        if (
          driver.current_lat != null &&
          driver.current_lng != null &&
          isValidCoordinate(driver.current_lat, driver.current_lng)
        ) {
          const existingMarker = driverMarkers.current.get(markerKey);
          const icon = makeDriverIcon(driver.name, 1, color, driver.is_in_house, isNearest, driver.isLive === true);
          const popup = createDriverPopupForSelection(driver, normalizedOrder, color, isNearest);
          let marker: Leaflet.Marker;

          if (!existingMarker) {
            const newMarker: Leaflet.Marker = L.marker([driver.current_lat, driver.current_lng], {
              icon,
              riseOnHover: true,
              riseOffset: 500,
            }).bindPopup(popup, { maxWidth: 340 });
            cluster.addLayer(newMarker);
            driverMarkers.current.set(markerKey, newMarker);
            marker = newMarker;
          } else {
            animateMarkerTo(existingMarker, driver.current_lat, driver.current_lng);
            existingMarker.setIcon(icon);
            existingMarker.setPopupContent(popup);
            marker = existingMarker;
          }

          // Non-live drivers stay visible on the map but cannot start assignment.
          marker.off("click");
          if (driver.isLive === true && normalizedOrder.canAssign) {
            marker.on("click", () => handleDriverMarkerClick(driver.id));
          }

          // Route leg 1: Driver -> Company/Pickup.
          const lineKey = `selection_route_${driver.id}`;
          visibleSelectionRouteKeys.add(lineKey);
          const line = routeLines.current.get(lineKey);

          if (pickup) {
            const routeData = routeDataByDriver[driver.id];
            if (routeData?.coordinates?.length) {
              if (!line) {
                const newLine = L.polyline(routeData.coordinates, {
                  color: isNearest ? "#6750A4" : color,
                  weight: isNearest ? 5 : 2.5,
                  opacity: isNearest ? 0.95 : 0.38,
                  lineCap: "round",
                  lineJoin: "round",
                }).addTo(mapRef.current!);
                routeLines.current.set(lineKey, newLine);
              } else {
                line.setLatLngs(routeData.coordinates);
                line.setStyle({
                  color: isNearest ? "#6750A4" : color,
                  weight: isNearest ? 5 : 2.5,
                  opacity: isNearest ? 0.95 : 0.38,
                  dashArray: undefined,
                });
              }
            } else {
              const points: [number, number][] = [
                [driver.current_lat, driver.current_lng],
                [pickup.lat, pickup.lon],
              ];
              if (!line) {
                const newLine = L.polyline(points, {
                  color: isNearest ? "#6750A4" : color,
                  weight: isNearest ? 4 : 2,
                  opacity: isNearest ? 0.8 : 0.3,
                  dashArray: "7 7",
                }).addTo(mapRef.current!);
                routeLines.current.set(lineKey, newLine);
              } else {
                line.setLatLngs(points);
                line.setStyle({
                  color: isNearest ? "#6750A4" : color,
                  weight: isNearest ? 4 : 2,
                  opacity: isNearest ? 0.8 : 0.3,
                  dashArray: "7 7",
                });
              }
            }
          } else if (line) {
            line.remove();
            routeLines.current.delete(lineKey);
          }
        }
      });

      // Route leg 2: Company/Pickup -> Customer.
      const pickupCustomerLineKey = "selection_route_pickup_customer";
      if (pickup && customer) {
        visibleSelectionRouteKeys.add(pickupCustomerLineKey);
        const existingSharedLine = routeLines.current.get(pickupCustomerLineKey);
        const sharedPoints =
          pickupCustomerRoute?.coordinates?.length
            ? pickupCustomerRoute.coordinates
            : ([
                [pickup.lat, pickup.lon],
                [customer.lat, customer.lon],
              ] as [number, number][]);

        if (!existingSharedLine) {
          const sharedLine = L.polyline(sharedPoints, {
            color: "#6750A4",
            weight: 5,
            opacity: 0.9,
            dashArray: pickupCustomerRoute?.coordinates?.length ? undefined : "8 7",
            lineCap: "round",
            lineJoin: "round",
          }).addTo(mapRef.current!);
          routeLines.current.set(pickupCustomerLineKey, sharedLine);
        } else {
          existingSharedLine.setLatLngs(sharedPoints);
          existingSharedLine.setStyle({
            color: "#6750A4",
            weight: 5,
            opacity: 0.9,
            dashArray: pickupCustomerRoute?.coordinates?.length ? undefined : "8 7",
          });
        }
      }

      driverMarkers.current.forEach((marker, key) => {
        if (key.startsWith("selection_") && !visibleSelectionKeys.has(key)) {
          cluster.removeLayer(marker);
          driverMarkers.current.delete(key);
        }
      });
      routeLines.current.forEach((line, key) => {
        if (key.startsWith("selection_route_") && !visibleSelectionRouteKeys.has(key)) {
          line.remove();
          routeLines.current.delete(key);
        }
      });

      // Fit bounds if needed 
      if (!initialFitDone.current && (pickup || customer)) { 
        setTimeout(() => { 
          const bounds = L.latLngBounds([]); 
          if (pickup && showCompanyMarker) bounds.extend([pickup.lat, pickup.lon]); 
          if (customer && showDeliveryMarker) bounds.extend([customer.lat, customer.lon]); 
          driverMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
          if (bounds.isValid() && mapRef.current) { 
            mapRef.current.fitBounds(bounds, { padding: [50, 50], maxZoom: 15, animate: false }); 
          } 
          initialFitDone.current = true; 
        }, 500); 
      } 
    } else { 
      // Tracking mode. Remove selection-only layers when switching modes, while
      // preserving live tracking markers between Firebase position updates.
      driverMarkers.current.forEach((marker, key) => {
        if (key.startsWith("selection_")) {
          cluster.removeLayer(marker);
          driverMarkers.current.delete(key);
        }
      });
      routeLines.current.forEach((line, key) => {
        if (key.startsWith("selection_route_")) {
          line.remove();
          routeLines.current.delete(key);
        }
      });

      driverGroups.forEach((orders, driverName) => { 
        currentDriverKeys.add(driverName); 
        const color = driverColorMap.get(driverName)!; 
        const isInHouse = orders[0]?.delivery.is_in_house; 
        const firstWithCoords = orders.find( 
          o => o.delivery.current_lat != null && o.delivery.current_lng != null 
        ); 
        const driverLat = firstWithCoords?.delivery.current_lat; 
        const driverLng = firstWithCoords?.delivery.current_lng; 
 
        if (driverLat != null && driverLng != null && isValidCoordinate(driverLat, driverLng)) { 
          const existingMarker = driverMarkers.current.get(driverName); 
          if (!existingMarker) { 
            const icon = makeDriverIcon(driverName, orders.length, color, isInHouse); 
            const newMarker: Leaflet.Marker = L.marker([driverLat, driverLng], { icon }).bindPopup( 
              createDriverPopup(driverName, orders, color, orders[0]?.delivery.delivery_person_phone), 
              { maxWidth: 320 } 
            ); 
            newMarker.on("click", () => setActiveOrderId(orders[0].id)); 
            cluster.addLayer(newMarker); 
            driverMarkers.current.set(driverName, newMarker); 
          } else { 
            animateMarkerTo(existingMarker, driverLat, driverLng); 
            existingMarker.setIcon(makeDriverIcon(driverName, orders.length, color, isInHouse)); 
            existingMarker.setPopupContent( 
              createDriverPopup(driverName, orders, color, orders[0]?.delivery.delivery_person_phone) 
            ); 
          } 
 
          // Route lines (debounced OSRM) 
          orders.forEach((order) => { 
            const dest = getOrderDestination(order);
            if (dest.lat == null || dest.lon == null) return;
            
            const custLat = dest.lat; 
            const custLng = dest.lon; 
            const orderId = order.id; 
 
            const debounceKey = `route_${orderId}`; 
            // Do not keep resetting the timer on every GPS tick. This guarantees
            // route geometry refreshes during continuous movement.
            if (debounceTimers.current.has(debounceKey)) return;
 
            debounceTimers.current.set( 
              debounceKey, 
              setTimeout(async () => { 
                const routeSummary = await fetchOSRMRoute( 
                  { lat: driverLat, lon: driverLng }, 
                  { lat: custLat, lon: custLng } 
                ); 
                let line = routeLines.current.get(`${orderId}`); 
 
                if (routeSummary && routeSummary.coordinates.length > 0) { 
                  if (!line) { 
                    const newLine = L.polyline(routeSummary.coordinates, { 
                      color, 
                      weight: 3, 
                      opacity: 0.8, 
                    }); 
                    newLine.addTo(mapRef.current!); 
                    routeLines.current.set(`${orderId}`, newLine); 
                  } else { 
                    line.setLatLngs(routeSummary.coordinates); 
                    line.setStyle({ color, weight: 3, opacity: 0.8, dashArray: undefined }); 
                  } 
                } else { 
                  if (!line) { 
                    const newLine = L.polyline( 
                      [ 
                        [driverLat, driverLng], 
                        [custLat, custLng], 
                      ], 
                      { color, weight: 2, opacity: 0.7, dashArray: "8 6" } 
                    ); 
                    newLine.addTo(mapRef.current!); 
                    routeLines.current.set(`${orderId}`, newLine); 
                  } else { 
                    line.setLatLngs([ 
                      [driverLat, driverLng], 
                      [custLat, custLng], 
                    ]); 
                    line.setStyle({ color, weight: 2, opacity: 0.7, dashArray: "8 6" }); 
                  } 
                } 
                debounceTimers.current.delete(debounceKey); 
              }, 1400) 
            ); 
          }); 
        } else { 
          const existingMarker = driverMarkers.current.get(driverName); 
          if (existingMarker) { 
            cluster.removeLayer(existingMarker); 
            driverMarkers.current.delete(driverName); 
            orders.forEach((order) => { 
              const line = routeLines.current.get(`${order.id}`); 
              if (line) { 
                line.remove(); 
                routeLines.current.delete(`${order.id}`); 
              } 
            }); 
          } 
        } 
      }); 
 
      // Remove stale driver markers & lines 
      driverMarkers.current.forEach((marker, driverName) => { 
        if (!currentDriverKeys.has(driverName)) { 
          cluster.removeLayer(marker); 
          driverMarkers.current.delete(driverName); 
          const orders = driverGroups.get(driverName); 
          if (orders) { 
            orders.forEach((order) => { 
              const line = routeLines.current.get(`${order.id}`); 
              if (line) { 
                line.remove(); 
                routeLines.current.delete(`${order.id}`); 
              } 
            }); 
          } 
        } 
      }); 
    } 
 
    // Fit bounds on first load 
    if (!initialFitDone.current) { 
      setTimeout(() => { 
        const bounds = L.latLngBounds([]); 
        customerMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
        driverMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
        if (companyMarkerRef.current) bounds.extend(companyMarkerRef.current.getLatLng()); 
        if (deliveryMarkerRef.current) bounds.extend(deliveryMarkerRef.current.getLatLng()); 
        if (pickupMarkerRef.current) bounds.extend(pickupMarkerRef.current.getLatLng()); 
        if (bounds.isValid() && mapRef.current) { 
          mapRef.current.fitBounds(bounds, { 
            padding: [60, 60], 
            maxZoom: 15, 
            animate: false, 
          }); 
        } 
        initialFitDone.current = true; 
      }, 500); 
    } 
 
    // Auto-follow 
    if (followDriver && activeOrderId) { 
      const order = liveDeliveries.find(o => o.id === activeOrderId); 
      if (order?.delivery.current_lat && order.delivery.current_lng) { 
        mapRef.current?.panTo( 
          [order.delivery.current_lat, order.delivery.current_lng], 
          { animate: true } 
        ); 
      } 
    } 
  }, [ 
    customerGroups, driverGroups, driverColorMap, liveDeliveries, 
    followDriver, activeOrderId, mode, normalizedOrder, 
    filteredAvailableDrivers, pendingDriverId, selectedDriverId, 
    fetchOSRMRoute, routeDataByDriver, pickupCustomerRoute, showCompanyMarker, showDeliveryMarker, showCustomerMarker, 
  ]); 
 
  // Fly to active order on click 
  useEffect(() => { 
    if (!activeOrderId || !mapRef.current) return; 
    const order = liveDeliveries.find(o => o.id === activeOrderId); 
    if (!order) return;
    
    const dest = getOrderDestination(order);
    const targetLat = order.delivery.current_lat ?? dest.lat; 
    const targetLng = order.delivery.current_lng ?? dest.lon; 
    if (targetLat && targetLng && isValidCoordinate(targetLat, targetLng)) { 
      mapRef.current.flyTo([targetLat, targetLng], 15, { 
        animate: true, 
        duration: 1.2, 
      }); 
    } 
  }, [activeOrderId, liveDeliveries]); 
 
  // Resize map on sidebar toggle 
  useEffect(() => { 
    if (mapRef.current) { 
      setTimeout(() => mapRef.current?.invalidateSize(), 350); 
    } 
  }, [isSidebarOpen]); 
 
  // Fit all markers 
  const fitAllMarkers = useCallback(() => { 
    if (!mapRef.current) return; 
    const L = (window as any).L; 
    const bounds = L.latLngBounds([]); 
    customerMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
    driverMarkers.current.forEach(m => bounds.extend(m.getLatLng())); 
    if (companyMarkerRef.current) bounds.extend(companyMarkerRef.current.getLatLng()); 
    if (deliveryMarkerRef.current) bounds.extend(deliveryMarkerRef.current.getLatLng()); 
    if (pickupMarkerRef.current) bounds.extend(pickupMarkerRef.current.getLatLng()); 
    if (bounds.isValid()) { 
      mapRef.current.fitBounds(bounds, { padding: [60, 60], maxZoom: 15, animate: true }); 
    } 
  }, []); 
 
  const toggleFollow = useCallback(() => { 
    setFollowDriver(prev => !prev); 
  }, []); 
 
  // Handle driver selection 
  const handleDriverMarkerClick = (driverId: number) => { 
    const driver = enhancedDrivers.find(d => d.id === driverId); 
    if (!driver?.isLive) {
      showToast("error", "This driver is not currently live. Please select a live driver.");
      return;
    }
    
    setPendingDriverId(driverId); 
    setShowConfirmPanel(true); 
     
    if (driver && mapRef.current && driver.current_lat != null && driver.current_lng != null) { 
      mapRef.current.flyTo([driver.current_lat, driver.current_lng], 15, { 
        animate: true, 
        duration: 1, 
      }); 
    } 
  }; 
 
  // Confirm assignment 
  const handleConfirmAssignment = async () => { 
    if (!pendingDriverId || !onDriverSelect || !normalizedOrder) return; 
     
    if (!normalizedOrder.canAssign) { 
      showToast("error", normalizedOrder.assignmentBlockedReason || "Unable to assign driver"); 
      return; 
    } 
     
    const driver = enhancedDrivers.find(d => d.id === pendingDriverId); 
    if (!driver) { 
      showToast("error", "Selected driver not found. Please refresh drivers."); 
      return; 
    } 
     
    if (!driver.isLive) {
      showToast("error", "This driver is not currently live. Please select a live driver.");
      return;
    }
     
    setIsAssigning(true); 
    try { 
      await onDriverSelect(pendingDriverId); 
      setSelectedDriverId(pendingDriverId); 
      setShowConfirmPanel(false); 
      setPendingDriverId(null); 
      showToast("success", "Driver assigned successfully"); 
       
      if (onAssignmentComplete) { 
        onAssignmentComplete(); 
      } 
       
      setTimeout(() => { 
        onClose(); 
      }, 1500); 
    } catch (err) { 
      showToast("error", "Failed to assign driver. They may no longer be available."); 
    } finally { 
      setIsAssigning(false); 
    } 
  }; 
 
  const handleCancelSelection = () => { 
    setPendingDriverId(null); 
    setShowConfirmPanel(false); 
  }; 
 
  // Keyboard handler 
  useEffect(() => { 
    const handler = (e: KeyboardEvent) => { 
      if (e.key === "Escape") { 
        if (showConfirmPanel) { 
          handleCancelSelection(); 
        } else if (isSidebarOpen && window.innerWidth < 1024) { 
          toggleSidebar(); 
        } else { 
          onClose(); 
        } 
      } 
    }; 
    window.addEventListener("keydown", handler); 
    return () => window.removeEventListener("keydown", handler); 
  }, [isSidebarOpen, toggleSidebar, onClose, showConfirmPanel]); 
 
  // Cleanup 
  useEffect(() => { 
    return () => { 
      debounceTimers.current.forEach(timer => clearTimeout(timer)); 
      debounceTimers.current.clear(); 
      pendingRequests.current.clear(); 
      routeCache.current.clear(); 
      if (companyMarkerRef.current) { 
        companyMarkerRef.current.remove(); 
        companyMarkerRef.current = null; 
      } 
      if (deliveryMarkerRef.current) { 
        deliveryMarkerRef.current.remove(); 
        deliveryMarkerRef.current = null; 
      } 
      if (tileLayerRef.current) {
        tileLayerRef.current = null;
      }
    }; 
  }, []); 
 
  // Render driver selection sidebar
  const renderDriverSelectionSidebar = () => {
    if (!normalizedOrder) return null;

    const bestDriver =
      filteredAvailableDrivers.find((driver) => driver.is_nearest && driver.isLive === true) ||
      filteredAvailableDrivers.find(
        (driver) => driver.isLive === true && driver.current_lat != null && driver.current_lng != null,
      ) ||
      null;
    const liveDriverCount = filteredAvailableDrivers.filter(
      (driver) => driver.isLive === true && driver.current_lat != null && driver.current_lng != null,
    ).length;
    const viewOnlyDriverCount = filteredAvailableDrivers.length - liveDriverCount;

    const compactDistance = (value: number | null | undefined) =>
      value == null ? "—" : formatDistance(value);
    const compactDuration = (value: number | null | undefined) =>
      value == null ? "—" : formatDuration(value);

    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#6750A4] text-white">
        {/* Compact dispatch header */}
        <div className="shrink-0 border-b border-white/10 px-3 py-3 lg:px-3.5">
          <div className="flex items-center gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <p className="truncate text-[9px] font-extrabold uppercase tracking-[0.16em] text-white/55">
                  Dispatch assignment
                </p>
                <span
                  className={`rounded-full px-1.5 py-0.5 text-[8px] font-extrabold ${
                    normalizedOrder.canAssign ? "bg-white/15 text-white" : "bg-rose-500/25 text-rose-100"
                  }`}
                >
                  {normalizedOrder.canAssign ? "READY" : "BLOCKED"}
                </span>
              </div>
              <div className="mt-0.5 flex min-w-0 items-center gap-2">
                <h3 className="truncate text-sm font-bold text-white">Order #{normalizedOrder.id}</h3>
                <span className="truncate text-[10px] text-white/65">· {normalizedOrder.customerName}</span>
              </div>
            </div>

            <div className="flex shrink-0 items-center gap-1">
              <div className="hidden items-center gap-1.5 rounded-full border border-white/15 bg-white/10 px-2 py-1 text-[9px] font-semibold text-white/85 sm:flex">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </div>
              <button
                type="button"
                onClick={toggleSidebar}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/10 text-white/80 transition hover:bg-white/20 hover:text-white"
                aria-label="Collapse driver assignment sidebar"
                title="Collapse sidebar"
              >
                <PanelLeftClose className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Route accordion - intentionally dense to preserve vertical space */}
          <div className="mt-2 overflow-hidden rounded-xl border border-white/15 bg-black/10">
            <button
              type="button"
              onClick={() => setIsOrderRouteExpanded((expanded) => !expanded)}
              className="flex w-full items-center gap-2 px-2.5 py-2 text-left transition hover:bg-white/[0.05]"
              aria-expanded={isOrderRouteExpanded}
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white/80">
                <Package className="h-3.5 w-3.5" />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex min-w-0 items-center gap-1.5">
                  <p className="shrink-0 text-[8px] font-extrabold uppercase tracking-[0.11em] text-white/45">Order route</p>
                  {bestDriver && (
                    <span className="truncate rounded-full bg-emerald-400/15 px-1.5 py-0.5 text-[8px] font-bold text-emerald-100">
                      {bestDriver.name}
                    </span>
                  )}
                </div>
                <p className="mt-0.5 truncate text-[10px] font-semibold text-white/90">Driver → Company → Customer</p>
              </div>
              <ChevronDown
                className={`h-3.5 w-3.5 shrink-0 text-white/55 transition-transform ${isOrderRouteExpanded ? "rotate-180" : ""}`}
              />
            </button>

            <div className="grid grid-cols-3 border-t border-white/10">
              <div className="min-w-0 px-2 py-1.5">
                <p className="truncate text-[7px] font-bold uppercase tracking-wide text-white/40">To pickup</p>
                <p className="mt-0.5 truncate text-[9px] font-bold text-white">
                  {bestDriver ? compactDistance(bestDriver.road_distance_to_pickup ?? bestDriver.distance_to_pickup) : "—"}
                </p>
              </div>
              <div className="min-w-0 border-x border-white/10 px-2 py-1.5">
                <p className="truncate text-[7px] font-bold uppercase tracking-wide text-white/40">Pickup → customer</p>
                <p className="mt-0.5 truncate text-[9px] font-bold text-white">
                  {bestDriver ? compactDistance(bestDriver.pickup_to_customer_distance) : "—"}
                </p>
              </div>
              <div className="min-w-0 px-2 py-1.5">
                <p className="truncate text-[7px] font-bold uppercase tracking-wide text-white/40">Total ETA</p>
                <p className="mt-0.5 truncate text-[9px] font-bold text-white">
                  {bestDriver ? compactDuration(bestDriver.total_eta_minutes) : "—"}
                </p>
              </div>
            </div>

            {isOrderRouteExpanded && (
              <div className="border-t border-white/10 px-2.5 py-2.5">
                <div className="relative space-y-2">
                  <div className="absolute bottom-2 left-[8px] top-2 w-px bg-white/15" />
                  {[
                    {
                      step: "1",
                      label: "Driver",
                      title: bestDriver ? bestDriver.name : "Choose a live driver",
                      detail: bestDriver?.isLive ? "Realtime GPS" : "Live GPS required",
                    },
                    {
                      step: "2",
                      label: "Company / pickup",
                      title: normalizedOrder.pickupName,
                      detail: normalizedOrder.companyAddress || "Pickup address unavailable",
                    },
                    {
                      step: "3",
                      label: "Customer / delivery",
                      title: normalizedOrder.customerName,
                      detail: normalizedOrder.address || "Delivery address unavailable",
                    },
                  ].map((step) => (
                    <div key={step.step} className="relative flex min-w-0 items-start gap-2">
                      <span className="mt-0.5 flex h-[17px] w-[17px] shrink-0 items-center justify-center rounded-md border border-white/15 bg-white/10 text-[7px] font-extrabold text-white">
                        {step.step}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="shrink-0 text-[7px] font-bold uppercase tracking-wide text-white/40">{step.label}</p>
                          <p className="truncate text-[9px] font-semibold text-white/90">{step.title}</p>
                        </div>
                        <p className="mt-0.5 truncate text-[8px] text-white/45" title={step.detail}>{step.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {!normalizedOrder.canAssign && (
            <div className="mt-2 flex items-start gap-1.5 rounded-lg border border-rose-300/20 bg-rose-500/15 px-2.5 py-2 text-[9px] text-rose-100">
              <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
              <span className="line-clamp-2">{normalizedOrder.assignmentBlockedReason}</span>
            </div>
          )}
        </div>

        {/* Compact driver controls */}
        <div className="shrink-0 border-b border-white/10 px-3 py-2.5">
          <button
            type="button"
            onClick={() => setIsDriverToolsExpanded((expanded) => !expanded)}
            className="flex w-full items-center justify-between gap-2 rounded-lg border border-white/15 bg-white/10 px-2.5 py-2 text-left transition hover:bg-white/15"
            aria-expanded={isDriverToolsExpanded}
          >
            <div className="flex min-w-0 items-center gap-2">
              <Search className="h-3.5 w-3.5 shrink-0 text-white/65" />
              <span className="text-[10px] font-bold text-white">Find & filter drivers</span>
              <span className="truncate text-[8px] text-white/50">
                {filteredAvailableDrivers.length} total · {liveDriverCount} live · {viewOnlyDriverCount} view only
              </span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-white/55 transition-transform ${isDriverToolsExpanded ? "rotate-180" : ""}`} />
          </button>

          {isDriverToolsExpanded && (
            <div className="mt-2 space-y-2">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-white/45" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search driver, phone, vehicle..."
                  className="w-full rounded-lg border border-white/15 bg-white/10 py-2 pl-8 pr-2.5 text-[11px] text-white outline-none transition placeholder:text-white/40 focus:border-white/35 focus:bg-white/15 focus:ring-2 focus:ring-white/10"
                />
              </div>

              <div className="grid grid-cols-3 gap-1 rounded-lg bg-black/10 p-1">
                {[
                  { value: "all", label: "All" },
                  { value: "in_house", label: "In-House" },
                  { value: "third_party", label: "3PL" },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setDriverFilter(option.value as typeof driverFilter)}
                    className={`rounded-md px-2 py-1.5 text-[9px] font-bold transition ${
                      driverFilter === option.value
                        ? "bg-white text-[#6750A4] shadow-sm"
                        : "text-white/65 hover:bg-white/10 hover:text-white"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2">
                <span className="shrink-0 text-[8px] font-bold uppercase tracking-wide text-white/40">Rank</span>
                <select
                  value={sortOption}
                  onChange={(e) => setSortOption(e.target.value as SortOption)}
                  className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#6750A4] px-2 py-1.5 text-[9px] font-semibold text-white outline-none focus:border-white/35"
                >
                  <option value="recommended">Recommended</option>
                  <option value="nearest_pickup">Nearest pickup</option>
                  <option value="fastest_eta">Fastest total ETA</option>
                  <option value="highest_rated">Highest rated</option>
                </select>
                <span className="flex shrink-0 items-center gap-1 text-[8px] font-semibold text-emerald-200">
                  <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live assignable
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Driver list - remains purple to make the sidebar one visual surface */}
        <div className="min-h-0 flex-1 space-y-1.5 overflow-y-auto bg-[#6750A4] px-2.5 py-2.5 [scrollbar-color:rgba(255,255,255,.28)_transparent] [scrollbar-width:thin]">
          {loadingDrivers && (
            <div className="flex items-center justify-center rounded-xl border border-white/15 bg-white/10 py-8">
              <Loader2 className="h-4 w-4 animate-spin text-white" />
              <span className="ml-2 text-[10px] text-white/65">Comparing drivers...</span>
            </div>
          )}

          {!loadingDrivers && filteredAvailableDrivers.length === 0 && (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/10 px-4 py-7 text-center">
              <Users className="mx-auto mb-2 h-6 w-6 text-white/35" />
              <p className="text-[11px] font-bold text-white">No available drivers</p>
              <p className="mt-1 text-[9px] leading-4 text-white/50">
                {normalizedOrder.canAssign ? "No drivers match the current filter." : "Assignment is blocked for this order."}
              </p>
            </div>
          )}

          {filteredAvailableDrivers.map((driver, index) => {
            const isPending = pendingDriverId === driver.id;
            const isSelected = selectedDriverId === driver.id;
            const isBest = driver.is_nearest === true;
            const hasLocation = driver.current_lat != null && driver.current_lng != null;
            const canSelect = driver.isLive === true && hasLocation && normalizedOrder.canAssign;
            const pickupDistance = driver.road_distance_to_pickup ?? driver.distance_to_pickup;

            return (
              <div
                key={driver.id}
                onClick={() => canSelect && handleDriverMarkerClick(driver.id)}
                className={`group rounded-xl border px-2.5 py-2.5 transition ${
                  canSelect ? "cursor-pointer hover:bg-white/15" : "cursor-not-allowed"
                } ${
                  isPending
                    ? "border-white/65 bg-white/20 ring-1 ring-white/25"
                    : isSelected
                      ? "border-emerald-300/70 bg-emerald-300/10"
                      : isBest
                        ? "border-white/45 bg-white/15"
                        : canSelect
                          ? "border-white/15 bg-white/10"
                          : "border-white/10 bg-black/10 opacity-70"
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="relative shrink-0">
                    {driver.profile_image ? (
                      <img
                        src={driver.profile_image}
                        alt={driver.name}
                        className="h-9 w-9 rounded-lg border border-white/20 object-cover"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.12] text-[11px] font-extrabold text-white">
                        {getInitials(driver.name)}
                      </div>
                    )}
                    <span
                      className={`absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-[#6750A4] ${
                        driver.isLive ? "bg-emerald-400" : hasLocation ? "bg-amber-300" : "bg-white/35"
                      }`}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex min-w-0 items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex min-w-0 items-center gap-1.5">
                          <p className="truncate text-[11px] font-extrabold text-white">{driver.name}</p>
                          {driver.recommendation_rank != null && driver.recommendation_rank <= 3 && (
                            <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-extrabold ${
                              isBest ? "bg-white text-[#6750A4]" : "bg-white/15 text-white/70"
                            }`}>
                              {isBest ? "BEST" : `#${driver.recommendation_rank}`}
                            </span>
                          )}
                        </div>
                        <div className="mt-0.5 flex min-w-0 items-center gap-1 text-[8px] text-white/55">
                          <span className="truncate">{getVehicleIcon(driver.vehicle_type)} {getVehicleName(driver.vehicle_type)}</span>
                          <span>·</span>
                          <span className="truncate">{driver.is_in_house ? "In-House" : driver.company_name || "3PL"}</span>
                          {driver.average_rating && (
                            <>
                              <span>·</span>
                              <span className="flex shrink-0 items-center gap-0.5 text-amber-200"><Star className="h-2.5 w-2.5" />{driver.average_rating}</span>
                            </>
                          )}
                        </div>
                      </div>

                      <span className={`shrink-0 rounded-full px-1.5 py-0.5 text-[7px] font-extrabold ${
                        driver.isLive
                          ? "bg-emerald-300/20 text-emerald-100"
                          : hasLocation
                            ? "bg-amber-200/15 text-amber-100"
                            : "bg-white/10 text-white/45"
                      }`}>
                        {driver.isLive ? "LIVE" : hasLocation ? "VIEW" : "OFFLINE"}
                      </span>
                    </div>

                    {/* Dense route metrics: one line instead of three cards */}
                    <div className="mt-2 flex min-w-0 items-center gap-1.5 rounded-lg bg-black/10 px-2 py-1.5 text-[8px]">
                      <span className="shrink-0 text-white/40">Pickup</span>
                      <strong className="truncate text-white/90">{compactDistance(pickupDistance)}</strong>
                      <span className="text-white/25">•</span>
                      <span className="shrink-0 text-white/40">ETA</span>
                      <strong className="truncate text-white/90">{compactDuration(driver.road_eta_to_pickup)}</strong>
                      <span className="text-white/25">•</span>
                      <span className="shrink-0 text-white/40">Trip</span>
                      <strong className="truncate text-white/90">{compactDistance(driver.total_route_distance)}</strong>
                    </div>

                    <div className="mt-2 flex min-w-0 items-center justify-between gap-2">
                      <p className="truncate text-[8px] text-white/40">
                        {driver.phone || driver.username || `Driver #${index + 1}`}
                        {!driver.isLive ? " · realtime GPS required" : ""}
                      </p>

                      {isSelected ? (
                        <span className="flex shrink-0 items-center gap-1 text-[8px] font-extrabold text-emerald-200">
                          <Check className="h-3 w-3" /> Assigned
                        </span>
                      ) : isPending ? (
                        <span className="shrink-0 text-[8px] font-extrabold text-white">Confirm</span>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (canSelect) handleDriverMarkerClick(driver.id);
                          }}
                          disabled={!canSelect}
                          title={!driver.isLive ? "Realtime GPS is required before this driver can be assigned" : undefined}
                          className="shrink-0 rounded-md bg-white px-2.5 py-1 text-[8px] font-extrabold text-[#6750A4] transition hover:bg-white/90 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
                        >
                          {canSelect ? (isBest ? "Assign best" : "Select") : "View only"}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderCollapsedSidebarRail = () => (
    <div className="hidden min-h-0 flex-1 flex-col items-center bg-[#6750A4] py-3 lg:flex">
      <button
        type="button"
        onClick={toggleSidebar}
        className="flex h-9 w-9 items-center justify-center rounded-xl border border-white/15 bg-white/10 text-white transition hover:bg-white/20"
        aria-label="Expand sidebar"
        title="Expand sidebar"
      >
        <PanelLeftOpen className="h-4 w-4" />
      </button>
      <div className="mt-4 h-px w-7 bg-white/15" />
      <div className="mt-4 flex h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-white/85" title="Dispatch assignment">
        <Navigation2 className="h-4 w-4" />
      </div>
      {mode === "driver_selection" && (
        <>
          <div className="mt-3 flex h-9 w-9 flex-col items-center justify-center rounded-xl bg-white/10 text-white" title={`${availableDrivers.length} available drivers`}>
            <Users className="h-3.5 w-3.5" />
            <span className="mt-0.5 text-[7px] font-extrabold">{availableDrivers.length}</span>
          </div>
          <div className="mt-3 flex h-9 w-9 flex-col items-center justify-center rounded-xl bg-emerald-300/15 text-emerald-100" title="Realtime connection">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="mt-1 text-[6px] font-bold uppercase">Live</span>
          </div>
        </>
      )}
    </div>
  );

  // Render tracking sidebar
  const renderTrackingSidebar = () => {
    return (
      <div className="flex min-h-0 flex-1 flex-col bg-[#6750A4]">
        <div className="shrink-0 border-b border-white/10 px-4 pb-4 pt-5 lg:px-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-white/55">Dispatch center</p>
              <h3 className="mt-1 text-base font-bold text-white">Live delivery personnel</h3>
              <p className="mt-1 text-[11px] text-white/65">
                {driverGroups.size} driver{driverGroups.size === 1 ? "" : "s"} · {liveDeliveries.length} active deliver{liveDeliveries.length === 1 ? "y" : "ies"}
              </p>
            </div>
            <div className="rounded-xl border border-white/15 bg-white/10 px-2.5 py-2 text-right">
              <div className="flex items-center justify-end gap-1.5 text-[10px] font-semibold text-white/90">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Realtime
              </div>
              <p className="mt-0.5 text-[9px] text-white/50">
                {activeRealtimeSubscriptions} channel{activeRealtimeSubscriptions === 1 ? "" : "s"}
              </p>
            </div>
          </div>
        </div>

        <div className="shrink-0 border-b border-white/10 px-4 py-3">
          <div className="grid grid-cols-3 gap-1 rounded-xl bg-black/10 p-1">
            {[
              { value: "all", label: "All" },
              { value: "in_house", label: "In-House" },
              { value: "third_party", label: "3PL" },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => setDriverFilter(option.value as typeof driverFilter)}
                className={`rounded-lg px-2 py-2 text-[11px] font-semibold transition ${
                  driverFilter === option.value
                    ? "bg-white text-secondary shadow-sm"
                    : "text-white/65 hover:bg-white/10 hover:text-white"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 space-y-2.5 overflow-y-auto p-3 lg:p-4">
          {loading && !driverGroups.size && (
            <div className="flex items-center justify-center rounded-xl border border-white/15 bg-white/10 py-10">
              <Loader2 className="h-5 w-5 animate-spin text-white" />
              <span className="ml-3 text-sm text-white/70">Loading live drivers...</span>
            </div>
          )}

          {!loading && !driverGroups.size && (
            <div className="rounded-xl border border-dashed border-white/20 bg-white/10 px-5 py-10 text-center">
              <Navigation className="mx-auto mb-3 h-8 w-8 text-white/30" />
              <p className="text-sm font-semibold text-white">No active deliveries</p>
              <p className="mt-1 text-xs leading-5 text-white/55">
                Drivers will appear here when a delivery moves into live tracking.
              </p>
            </div>
          )}

          {Array.from(driverGroups.entries()).map(([driverName, orders]) => {
            const isActive = orders.some((o) => o.id === activeOrderId);
            const color = driverColorMap.get(driverName) || "#6750A4";
            const count = orders.length;
            const speed = orders[0]?.delivery.speed;
            const isInHouse = orders[0]?.delivery.is_in_house;
            const driverLat = orders[0]?.delivery.current_lat;
            const driverLng = orders[0]?.delivery.current_lng;
            const activeOrder = orders.find((o) => o.id === activeOrderId) || orders[0];
            const activeDestination = getOrderDestination(activeOrder);

            let distanceDisplay: string | null = null;
            if (driverLat != null && driverLng != null) {
              const distances = orders
                .map((o) => {
                  const dest = getOrderDestination(o);
                  if (dest.lat == null || dest.lon == null) return null;
                  return haversine(driverLat, driverLng, dest.lat, dest.lon);
                })
                .filter((value): value is number => value != null);

              if (distances.length) {
                const min = Math.min(...distances).toFixed(1);
                const max = Math.max(...distances).toFixed(1);
                distanceDisplay = min === max ? `${min} km` : `${min}–${max} km`;
              }
            }

            return (
              <button
                key={driverName}
                type="button"
                onClick={() => setActiveOrderId(orders[0].id)}
                className={`w-full rounded-2xl border p-3.5 text-left transition-all ${
                  isActive
                    ? "border-white/60 bg-white shadow-lg"
                    : "border-white/15 bg-white/10 hover:border-white/25 hover:bg-white/15"
                }`}
                aria-label={`Driver ${driverName}, ${count} orders`}
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div
                      className={`flex h-11 w-11 items-center justify-center rounded-xl text-sm font-bold ${
                        isActive ? "text-white" : "bg-white/15 text-white"
                      }`}
                      style={isActive ? { backgroundColor: color } : undefined}
                    >
                      {getInitials(driverName)}
                    </div>
                    <span className={`absolute -bottom-1 -right-1 h-3 w-3 rounded-full border-2 ${isActive ? "border-white" : "border-[#6750A4]"} bg-emerald-400 animate-pulse`} />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className={`truncate text-sm font-bold ${isActive ? "text-gray-900" : "text-white"}`}>
                          {driverName}
                        </p>
                        <div className={`mt-1 flex flex-wrap items-center gap-1.5 text-[10px] ${isActive ? "text-gray-500" : "text-white/60"}`}>
                          <span className={`rounded-full px-1.5 py-0.5 font-semibold ${
                            isActive
                              ? isInHouse
                                ? "bg-emerald-50 text-emerald-700"
                                : "bg-blue-50 text-blue-700"
                              : "bg-white/10 text-white/80"
                          }`}>
                            {isInHouse ? "In-House" : "3PL"}
                          </span>
                          <span>•</span>
                          <span>{count} destination{count === 1 ? "" : "s"}</span>
                        </div>
                      </div>
                      <span className={`flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-bold ${
                        isActive ? "bg-emerald-50 text-emerald-700" : "bg-emerald-400/15 text-emerald-200"
                      }`}>
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> LIVE
                      </span>
                    </div>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      {[
                        ["Speed", speed != null ? `${Math.round(Number(speed))} km/h` : "—"],
                        ["Range", distanceDisplay || "—"],
                        ["Stops", String(count)],
                      ].map(([label, value]) => (
                        <div
                          key={label}
                          className={`rounded-lg px-2.5 py-2 ${isActive ? "bg-gray-50" : "bg-black/10"}`}
                        >
                          <p className={`text-[9px] uppercase tracking-wide ${isActive ? "text-gray-400" : "text-white/40"}`}>
                            {label}
                          </p>
                          <p className={`mt-0.5 truncate text-[11px] font-bold ${isActive ? "text-gray-700" : "text-white/85"}`}>
                            {value}
                          </p>
                        </div>
                      ))}
                    </div>

                    {isActive && (
                      <div className="mt-3 rounded-lg bg-secondary/5 px-2.5 py-2">
                        <p className="text-[9px] font-bold uppercase tracking-wide text-secondary/60">Current delivery</p>
                        <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-700">
                          #{activeOrder.id} · {activeOrder.recipient_name || activeOrder.customer_name || "Recipient"}
                        </p>
                        <p className="mt-0.5 line-clamp-2 text-[10px] leading-4 text-gray-500">
                          {activeDestination.address}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  // Render
  const latestSyncAt = realtimeUpdatedAt || lastUpdated;
  const realtimeHealthy =
    (mode === "driver_selection" && availableDrivers.length > 0) ||
    activeRealtimeSubscriptions > 0 ||
    realtimeUpdatedAt !== null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex flex-col overflow-hidden bg-gray-100">
      {/* Production dispatch header */}
      <header className="z-30 flex shrink-0 items-center justify-between gap-3 border-b border-gray-200 bg-white px-3 py-2.5 shadow-sm sm:px-5 lg:px-6">
        <div className="flex min-w-0 items-center gap-3">
          <button
            onClick={toggleSidebar}
            className="hidden h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary lg:flex"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>

          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-secondary text-white shadow-sm shadow-secondary/20">
            <Navigation2 className="h-5 w-5" />
          </div>

          <div className="min-w-0">
            <div className="flex min-w-0 items-center gap-2">
              <h2 className="truncate text-sm font-bold tracking-tight text-gray-900 sm:text-base lg:text-lg">
                {mode === "driver_selection" ? "Driver Assignment Map" : "Live Delivery Map"}
              </h2>
              <span className={`hidden items-center gap-1.5 rounded-full px-2 py-1 text-[9px] font-bold sm:flex ${
                realtimeHealthy ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
              }`}>
                <span className={`h-1.5 w-1.5 rounded-full ${realtimeHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
                {realtimeHealthy ? "REALTIME" : "API SYNC"}
              </span>
            </div>
            <p className="mt-0.5 truncate text-[10px] text-gray-500 sm:text-xs">
              {mode === "driver_selection" && normalizedOrder
                ? `Order #${normalizedOrder.id} · ${normalizedOrder.customerName}`
                : `${stats.liveVehicles} vehicle${stats.liveVehicles === 1 ? "" : "s"} currently live`}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-1.5">
          <div className="mr-1 hidden text-right xl:block">
            <p className="text-[9px] font-semibold uppercase tracking-wide text-gray-400">Last sync</p>
            <p className="text-[11px] font-semibold text-gray-600">
              {latestSyncAt ? latestSyncAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }) : "Waiting..."}
            </p>
          </div>

          <button
            onClick={() => refetch()}
            disabled={isFetching}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-secondary/30 hover:bg-secondary/5 hover:text-secondary disabled:opacity-50"
            aria-label="Refresh delivery data"
            title="Refresh delivery data"
          >
            <RefreshCw className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`} />
          </button>

          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl border border-gray-200 bg-white text-gray-500 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            aria-label="Close map"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </header>

      <div className="relative flex min-h-0 flex-1 overflow-hidden">
        {/* Mobile sidebar backdrop */}
        <div
          className={`fixed inset-0 z-30 bg-gray-950/35 backdrop-blur-[1px] transition-opacity lg:hidden ${
            isSidebarOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
          }`}
          onClick={toggleSidebar}
        />

        {/* Mobile sidebar */}
        <aside
          className={`fixed bottom-0 left-0 top-0 z-40 flex w-[86%] max-w-[350px] transform flex-col overflow-hidden border-r border-[#6750A4] bg-[#6750A4] shadow-2xl transition-transform duration-300 lg:hidden ${
            isSidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          {mode === "driver_selection" ? renderDriverSelectionSidebar() : renderTrackingSidebar()}
        </aside>

        {/* Desktop sidebar */}
        <aside
          className={`hidden shrink-0 flex-col overflow-hidden border-r border-[#6750A4] bg-[#6750A4] transition-[width] duration-300 lg:flex ${
            isSidebarOpen
              ? mode === "driver_selection"
                ? "w-[330px] xl:w-[350px]"
                : "w-[360px] xl:w-[380px]"
              : "w-[58px]"
          }`}
        >
          {isSidebarOpen
            ? mode === "driver_selection"
              ? renderDriverSelectionSidebar()
              : renderTrackingSidebar()
            : renderCollapsedSidebarRail()}
        </aside>

        {/* Map workspace */}
        <main className="relative min-h-[420px] min-w-0 flex-1 bg-gray-100">
          <div ref={containerRef} className="absolute inset-0 z-0 h-full w-full" />

          {/* Map context / legend */}
          {!loading && !error && (
            <div className="pointer-events-none absolute left-3 top-3 z-20 hidden sm:block lg:left-4 lg:top-4">
              <div className="rounded-2xl border border-white/70 bg-white/95 px-3.5 py-3 shadow-lg shadow-gray-900/10 backdrop-blur-md">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-secondary/10 text-secondary">
                    <MapIcon className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-gray-800">Dispatch map</p>
                    <p className="text-[9px] text-gray-400">
                      {mode === "driver_selection" ? "Live driver availability" : "Realtime fleet positions"}
                    </p>
                  </div>
                </div>
                <div className="mt-2.5 flex items-center gap-3 border-t border-gray-100 pt-2 text-[9px] font-semibold text-gray-500">
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm bg-secondary" /> Pickup</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-sm border-2 border-amber-400 bg-white" /> Recipient</span>
                  <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-emerald-500" /> Live driver</span>
                </div>
              </div>
            </div>
          )}

          {mode === "driver_selection" && normalizedOrder && (
            <div className="pointer-events-none absolute bottom-4 left-4 z-20 hidden max-w-[520px] lg:block">
              <div className="rounded-2xl border border-white/70 bg-white/95 p-3.5 shadow-xl shadow-gray-900/10 backdrop-blur-md">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-secondary text-white">
                    <Navigation2 className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-gray-400">Assignment route</p>
                    <p className="text-xs font-bold text-gray-900">Driver → {normalizedOrder.pickupName} → {normalizedOrder.customerName}</p>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-[1fr_auto_1fr] items-start gap-2 border-t border-gray-100 pt-3">
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-secondary">Pickup</p>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-700">{normalizedOrder.pickupName}</p>
                    <p className="mt-0.5 line-clamp-2 text-[9px] leading-4 text-gray-400">{normalizedOrder.companyAddress || "Address unavailable"}</p>
                  </div>
                  <div className="mt-4 h-px w-8 bg-secondary/30" />
                  <div className="min-w-0">
                    <p className="text-[9px] font-bold uppercase tracking-wide text-secondary">Customer</p>
                    <p className="mt-0.5 truncate text-[11px] font-semibold text-gray-700">{normalizedOrder.customerName}</p>
                    <p className="mt-0.5 line-clamp-2 text-[9px] leading-4 text-gray-400">{normalizedOrder.address}</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Production map control rail */}
          <div className="absolute right-3 top-3 z-20 flex flex-col gap-2 lg:right-4 lg:top-4">
            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-1.5 shadow-lg shadow-gray-900/10 backdrop-blur-md">
              <button
                onClick={() => setMapStyle("street")}
                className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  mapStyle === "street" ? "bg-secondary text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
                aria-label="Street map"
                title="Street map"
              >
                <MapIcon className="h-4 w-4" />
              </button>
              <button
                onClick={() => setMapStyle("satellite")}
                className={`mt-1 flex h-9 w-9 items-center justify-center rounded-xl transition ${
                  mapStyle === "satellite" ? "bg-secondary text-white" : "text-gray-500 hover:bg-gray-100 hover:text-gray-800"
                }`}
                aria-label="Satellite map"
                title="Satellite map"
              >
                <Satellite className="h-4 w-4" />
              </button>
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-1.5 shadow-lg shadow-gray-900/10 backdrop-blur-md">
              {mode === "driver_selection" ? (
                <>
                  <button
                    onClick={() => setShowCompanyMarker(prev => !prev)}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      showCompanyMarker ? "bg-secondary/10 text-secondary" : "text-gray-400 hover:bg-gray-100"
                    }`}
                    aria-label="Toggle pickup marker"
                    title="Pickup marker"
                  >
                    <Store className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => setShowDeliveryMarker(prev => !prev)}
                    className={`mt-1 flex h-9 w-9 items-center justify-center rounded-xl transition ${
                      showDeliveryMarker ? "bg-secondary/10 text-secondary" : "text-gray-400 hover:bg-gray-100"
                    }`}
                    aria-label="Toggle destination marker"
                    title="Destination marker"
                  >
                    <MapPin className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setShowCustomerMarker(prev => !prev)}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    showCustomerMarker ? "bg-secondary/10 text-secondary" : "text-gray-400 hover:bg-gray-100"
                  }`}
                  aria-label="Toggle recipient markers"
                  title="Recipient markers"
                >
                  <MapPin className="h-4 w-4" />
                </button>
              )}
            </div>

            <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white/95 p-1.5 shadow-lg shadow-gray-900/10 backdrop-blur-md">
              <button
                onClick={fitAllMarkers}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-gray-500 transition hover:bg-secondary/5 hover:text-secondary"
                aria-label="Fit all markers"
                title="Fit all markers"
              >
                <Maximize2 className="h-4 w-4" />
              </button>
              {mode === "tracking" && (
                <button
                  onClick={toggleFollow}
                  className={`mt-1 flex h-9 w-9 items-center justify-center rounded-xl transition ${
                    followDriver ? "bg-secondary text-white" : "text-gray-500 hover:bg-secondary/5 hover:text-secondary"
                  }`}
                  aria-label="Follow selected driver"
                  title={followDriver ? "Stop following driver" : "Follow selected driver"}
                >
                  <Navigation className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Live sync chip */}
          <div className="absolute bottom-3 left-3 z-20 sm:bottom-4 sm:left-4">
            <div className="flex items-center gap-2 rounded-full border border-gray-200 bg-white/95 px-3 py-2 shadow-lg shadow-gray-900/10 backdrop-blur-md">
              <span className={`h-2 w-2 rounded-full ${realtimeHealthy ? "bg-emerald-500 animate-pulse" : "bg-amber-500"}`} />
              <span className="text-[10px] font-bold text-gray-700">
                {realtimeHealthy ? "Live updates on" : "Realtime reconnecting"}
              </span>
              {latestSyncAt && (
                <span className="hidden text-[9px] text-gray-400 sm:inline">· {latestSyncAt.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span>
              )}
            </div>
          </div>

          {/* Loading state */}
          {loading && !lastUpdated && !driverGroups.size && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/80 backdrop-blur-sm">
              <div className="rounded-2xl border border-gray-200 bg-white px-6 py-5 text-center shadow-xl">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-secondary/10">
                  <Loader2 className="h-5 w-5 animate-spin text-secondary" />
                </div>
                <p className="mt-3 text-sm font-semibold text-gray-800">
                  {mode === "driver_selection" ? "Loading delivery map" : "Connecting to live deliveries"}
                </p>
                <p className="mt-1 text-xs text-gray-400">Preparing map, drivers and route data...</p>
              </div>
            </div>
          )}

          {/* Error state */}
          {error && !loading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/90 p-4 backdrop-blur-sm">
              <div className="w-full max-w-sm rounded-2xl border border-red-100 bg-white p-6 text-center shadow-xl">
                <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-xl bg-red-50 text-red-500">
                  <AlertTriangle className="h-5 w-5" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-gray-900">Unable to load delivery map</h3>
                <p className="mt-1 text-xs leading-5 text-gray-500">{error}</p>
                <button
                  onClick={() => refetch()}
                  className="mt-4 rounded-xl bg-secondary px-5 py-2.5 text-xs font-bold text-white transition hover:opacity-90"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {!loading && !error && mode === "driver_selection" && normalizedOrder && !normalizedOrder.canAssign && (
            <div className="absolute left-1/2 top-4 z-20 w-[calc(100%-7rem)] max-w-xl -translate-x-1/2 rounded-xl border border-red-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur-md">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-red-500" />
                <div>
                  <p className="text-xs font-bold text-red-700">Driver assignment unavailable</p>
                  <p className="mt-0.5 text-[10px] text-red-600">{normalizedOrder.assignmentBlockedReason}</p>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && mode === "tracking" && !driverGroups.size && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-white/75 p-6 backdrop-blur-sm">
              <div className="max-w-sm rounded-2xl border border-gray-200 bg-white px-7 py-8 text-center shadow-xl">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
                  <Navigation className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">No active deliveries</h3>
                <p className="mt-1.5 text-xs leading-5 text-gray-500">Live vehicles will appear automatically when a delivery moves out for delivery.</p>
              </div>
            </div>
          )}

          {/* Assignment confirmation */}
          {showConfirmPanel && pendingDriverId && normalizedOrder && (
            <div className="absolute bottom-16 left-1/2 z-30 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 sm:bottom-5">
              {(() => {
                const driver = enhancedDrivers.find(d => d.id === pendingDriverId);
                if (!driver) return null;
                const isNearest = driver.is_nearest === true;

                return (
                  <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl shadow-gray-900/15">
                    <div className="h-1 bg-secondary" />
                    <div className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-secondary/10 text-sm font-bold text-secondary">
                          {driver.profile_image ? (
                            <img src={driver.profile_image} alt={driver.name} className="h-11 w-11 rounded-xl object-cover" />
                          ) : (
                            getInitials(driver.name)
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="truncate text-sm font-bold text-gray-900">{driver.name}</p>
                            {isNearest && <span className="rounded-full bg-secondary/10 px-1.5 py-0.5 text-[8px] font-extrabold text-secondary">BEST MATCH</span>}
                          </div>
                          <p className="mt-0.5 text-[10px] text-gray-500">{getVehicleName(driver.vehicle_type)} · {driver.is_in_house ? "In-House" : driver.company_name || "3PL"}</p>
                        </div>
                        <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-1 text-[9px] font-bold text-emerald-700">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" /> LIVE
                        </span>
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-2 rounded-xl bg-gray-50 p-3">
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-gray-400">Destination</p>
                          <p className="mt-0.5 line-clamp-2 text-[11px] font-semibold text-gray-700">{normalizedOrder.address}</p>
                        </div>
                        <div>
                          <p className="text-[9px] uppercase tracking-wide text-gray-400">Route</p>
                          <p className="mt-0.5 text-[11px] font-semibold text-gray-700">
                            {driver.road_distance_to_customer != null
                              ? `${formatDistance(driver.road_distance_to_customer)} · ${formatDuration(driver.road_eta_to_customer)}`
                              : driver.distance_to_customer != null
                                ? formatDistance(driver.distance_to_customer)
                                : "Calculating..."}
                          </p>
                        </div>
                      </div>

                      <div className="mt-4 flex gap-2">
                        <button
                          onClick={handleCancelSelection}
                          className="rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-xs font-bold text-gray-600 transition hover:bg-gray-50"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={handleConfirmAssignment}
                          disabled={isAssigning || !normalizedOrder.canAssign || !driver.isLive}
                          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-secondary px-4 py-2.5 text-xs font-bold text-white transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-45"
                        >
                          {isAssigning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                          {isAssigning ? "Assigning..." : "Assign driver"}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
          )}

          {/* Compact live stats */}
          {mode === "tracking" && !loading && !error && driverGroups.size > 0 && (
            <div className="absolute bottom-3 right-16 z-20 hidden gap-2 md:flex sm:bottom-4 lg:right-20">
              <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md">
                <p className="text-[9px] uppercase tracking-wide text-gray-400">Live vehicles</p>
                <p className="mt-0.5 text-sm font-extrabold text-gray-800">{stats.liveVehicles}</p>
              </div>
              <div className="rounded-xl border border-gray-200 bg-white/95 px-3 py-2 shadow-lg backdrop-blur-md">
                <p className="text-[9px] uppercase tracking-wide text-gray-400">Deliveries today</p>
                <p className="mt-0.5 text-sm font-extrabold text-gray-800">{stats.deliveriesToday}</p>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Mobile sidebar toggle */}
      <button
        onClick={toggleSidebar}
        className="fixed bottom-4 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary text-white shadow-xl shadow-secondary/25 lg:hidden"
        aria-label={isSidebarOpen ? "Close sidebar" : "Open sidebar"}
      >
        {isSidebarOpen ? <PanelLeftClose className="h-5 w-5" /> : <PanelLeftOpen className="h-5 w-5" />}
      </button>
    </div>,
    document.body
  );
}
