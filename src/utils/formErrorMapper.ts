// src/utils/formErrorMapper.ts

export const FIELD_TO_STEP: Record<string, number> = {
  // ── Step 0: Basic info ──
  name: 0,
  name_am: 0,
  slug: 0,
  category: 0,
  sub_category: 0,
  business_type: 0,
  head_company: 0,
  description: 0,
  description_am: 0,

  // ── Step 1: Location & contact ──
  address: 1,
  address_am: 1,
  contact_phone: 1,
  contact_email: 1,
  latitude: 1,
  longitude: 1,
  minimum_order_total: 1,
  maximum_cod_total: 1,
  delivery_fee_per_km: 1,

  // ── Step 2: Documents / media ──
  tin_number: 2,
  vat_registration_number: 2,
  fan_number: 2,
  chapa_sub_account_id: 2,
  license: 2,
  moa_file: 2,
  logo: 2,
  cover_image: 2,

  // ── Step 3: Summary ──
  terms_agreed: 3,
  terms_signatory_name: 3,
  terms_signatory_role: 3,
};

/**
 * Normalise a DRF / API error payload into a flat { field: message } map.
 * Handles: { field: ["msg"] }, { field: "msg" }, { non_field_errors: [...] },
 * and nested objects (flattens one level).
 */
export function mapBackendErrors(responseData: any): Record<string, string> {
  const out: Record<string, string> = {};
  if (!responseData || typeof responseData !== "object") return out;

  const flatten = (value: any): string => {
    if (Array.isArray(value)) return value.map(String).join(" ");
    if (value && typeof value === "object") {
      // nested like { contact_email: { ... } }
      return Object.values(value).map(flatten).join(" ");
    }
    return value == null ? "" : String(value);
  };

  for (const [key, value] of Object.entries(responseData)) {
    if (key === "non_field_errors" || key === "detail" || key === "message") {
      continue; // handled separately as toast message
    }
    const msg = flatten(value).trim();
    if (msg) out[key] = msg;
  }
  return out;
}

export function summarizeErrors(fieldErrors: Record<string, string>): string {
  const entries = Object.entries(fieldErrors);
  if (entries.length === 0) return "";
  // Show first 2 errors to keep toast short
  return entries
    .slice(0, 2)
    .map(([field, msg]) => `${field}: ${msg}`)
    .join(" • ");
}