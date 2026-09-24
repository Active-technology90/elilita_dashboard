import React, { useEffect, useState, useCallback } from "react";
import {
  Sparkles,
  Plus,
  Edit2,
  Trash2,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  X,
  Check,
  AlertCircle,
} from "lucide-react";
import type { ServiceAddon } from "../../../types";
import {
  getManageOfferingAddons,
  createOfferingAddon,
  updateOfferingAddon,
  deleteOfferingAddon,
} from "../../../services/api";
import { normalizeListResponse } from "../../../utils/normalizeListResponse";

interface ServiceAddonManagerProps {
  companySlug: string;
  offeringId: number;
  offeringTitle?: string;
  onShowToast?: (type: "success" | "error", message: string) => void;
}

interface AddonFormState {
  name: string;
  name_am: string;
  price: string;
  duration_minutes: number;
  is_active: boolean;
}

const defaultAddonForm: AddonFormState = {
  name: "",
  name_am: "",
  price: "",
  duration_minutes: 15,
  is_active: true,
};

export const ServiceAddonManager: React.FC<ServiceAddonManagerProps> = ({
  companySlug,
  offeringId,
  offeringTitle,
  onShowToast,
}) => {
  const [addons, setAddons] = useState<ServiceAddon[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AddonFormState>(defaultAddonForm);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formError, setFormError] = useState("");

  const loadAddons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getManageOfferingAddons(companySlug, offeringId);
      setAddons(normalizeListResponse(res.data));
    } catch {
      onShowToast?.("error", "Failed to load service add-ons");
    } finally {
      setLoading(false);
    }
  }, [companySlug, offeringId, onShowToast]);

  useEffect(() => {
    if (companySlug && offeringId) {
      loadAddons();
    }
  }, [companySlug, offeringId, loadAddons]);

  const handleStartAdd = () => {
    setEditingId(null);
    setForm(defaultAddonForm);
    setFormError("");
    setIsAdding(true);
  };

  const handleStartEdit = (addon: ServiceAddon) => {
    setIsAdding(false);
    setEditingId(addon.id);
    setForm({
      name: addon.name,
      name_am: addon.name_am || "",
      price: addon.price || "",
      duration_minutes: addon.duration_minutes || 0,
      is_active: addon.is_active,
    });
    setFormError("");
  };

  const handleCancelForm = () => {
    setIsAdding(false);
    setEditingId(null);
    setForm(defaultAddonForm);
    setFormError("");
  };

  const handleToggleActive = async (addon: ServiceAddon) => {
    try {
      const newStatus = !addon.is_active;
      // Optimistic update
      setAddons((prev) =>
        prev.map((a) => (a.id === addon.id ? { ...a, is_active: newStatus } : a))
      );
      await updateOfferingAddon(companySlug, offeringId, addon.id, {
        is_active: newStatus,
      });
      onShowToast?.("success", `Add-on ${newStatus ? "activated" : "deactivated"}`);
    } catch {
      onShowToast?.("error", "Failed to update add-on status");
      loadAddons();
    }
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      setFormError("Add-on name is required.");
      return;
    }
    const priceNum = Number(form.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError("Price must be a valid non-negative number.");
      return;
    }

    setSaving(true);
    setFormError("");
    try {
      const payload: Partial<ServiceAddon> = {
        name: form.name.trim(),
        name_am: form.name_am.trim() || undefined,
        price: form.price || "0",
        duration_minutes: Number(form.duration_minutes) || 0,
        is_active: form.is_active,
      };

      if (editingId) {
        await updateOfferingAddon(companySlug, offeringId, editingId, payload);
        onShowToast?.("success", "Add-on updated");
      } else {
        await createOfferingAddon(companySlug, offeringId, payload);
        onShowToast?.("success", "Add-on created");
      }
      handleCancelForm();
      await loadAddons();
    } catch (err: any) {
      const msg = err?.response?.data?.detail || "Failed to save add-on";
      setFormError(msg);
      onShowToast?.("error", msg);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (addonId: number) => {
    setDeletingId(addonId);
    try {
      await deleteOfferingAddon(companySlug, offeringId, addonId);
      onShowToast?.("success", "Add-on deleted");
      await loadAddons();
    } catch {
      onShowToast?.("error", "Failed to delete add-on");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-4">
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-gray-100">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-secondary/10 text-secondary">
              <Sparkles className="h-4 w-4" />
            </span>
            <h4 className="text-sm font-bold text-gray-900">
              Optional Add-ons & Upgrades
            </h4>
          </div>
          <p className="text-xs text-gray-500 mt-0.5">
            {offeringTitle
              ? `Manage add-ons for "${offeringTitle}". Customers can select these during booking.`
              : "Allow customers to customize and upgrade their booking with extras."}
          </p>
        </div>

        {!isAdding && !editingId && (
          <button
            type="button"
            onClick={handleStartAdd}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-[#5B46A0] transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Extra</span>
          </button>
        )}
      </div>

      {/* Add / Edit Form */}
      {(isAdding || editingId) && (
        <form
          onSubmit={handleSubmitForm}
          className="rounded-2xl border-2 border-secondary/20 bg-secondary/[0.02] p-4 space-y-4 animate-fadeIn"
        >
          <div className="flex items-center justify-between">
            <h5 className="text-xs font-bold text-secondary uppercase tracking-wider">
              {editingId ? "Edit Add-on" : "New Add-on / Extra"}
            </h5>
            <button
              type="button"
              onClick={handleCancelForm}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100 transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {formError && (
            <div className="flex items-center gap-2 p-2.5 rounded-xl bg-red-50 text-red-700 text-xs border border-red-200">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Beard Grooming & Hot Towel"
                required
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-secondary focus:bg-white bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Name (Amharic)
              </label>
              <input
                type="text"
                value={form.name_am}
                onChange={(e) => setForm((p) => ({ ...p, name_am: e.target.value }))}
                placeholder="ለምሳሌ፡ ፂም ማስተካከል"
                className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-secondary focus:bg-white bg-gray-50"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Price (ETB) <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-gray-500 font-semibold">
                  ETB
                </span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={(e) => setForm((p) => ({ ...p, price: e.target.value }))}
                  placeholder="100.00"
                  required
                  className="w-full border-2 border-gray-200 rounded-xl pl-12 pr-3 py-2 text-sm font-medium focus:outline-none focus:border-secondary focus:bg-white bg-gray-50"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">
                Extra Duration (minutes)
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="5"
                  value={form.duration_minutes}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      duration_minutes: Number(e.target.value) || 0,
                    }))
                  }
                  placeholder="15"
                  className="w-full border-2 border-gray-200 rounded-xl px-3 py-2 text-sm font-medium focus:outline-none focus:border-secondary focus:bg-white bg-gray-50"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400">
                  min
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={form.is_active}
                onChange={(e) =>
                  setForm((p) => ({ ...p, is_active: e.target.checked }))
                }
                className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary"
              />
              <span className="text-xs font-medium text-gray-700">
                Active & Available for Booking
              </span>
            </label>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCancelForm}
                className="px-3 py-1.5 rounded-xl border border-gray-300 text-gray-700 text-xs font-medium hover:bg-gray-100 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-[#5B46A0] disabled:opacity-50 transition shadow-xs"
              >
                {saving ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Check className="h-3.5 w-3.5" />
                )}
                <span>{editingId ? "Save Changes" : "Create Add-on"}</span>
              </button>
            </div>
          </div>
        </form>
      )}

      {/* List / Loading / Empty */}
      {loading ? (
        <div className="py-8 flex flex-col items-center justify-center text-gray-400">
          <Loader2 className="h-6 w-6 animate-spin mb-2 text-secondary" />
          <p className="text-xs">Loading add-ons...</p>
        </div>
      ) : addons.length === 0 ? (
        !isAdding && (
          <div className="py-8 text-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50">
            <Sparkles className="h-8 w-8 text-gray-300 mx-auto mb-2" />
            <p className="text-sm font-semibold text-gray-700">No add-ons yet</p>
            <p className="text-xs text-gray-400 max-w-sm mx-auto mt-1 mb-3">
              Add-ons are optional extras customers can attach to this service (e.g. special oils, extended time, VIP perks).
            </p>
            <button
              type="button"
              onClick={handleStartAdd}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-secondary text-white text-xs font-semibold hover:bg-[#5B46A0] transition shadow-xs"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Add First Add-on</span>
            </button>
          </div>
        )
      ) : (
        <div className="space-y-2">
          {addons.map((addon) => {
            const isDeleting = deletingId === addon.id;
            return (
              <div
                key={addon.id}
                className={`flex flex-col sm:flex-row sm:items-center justify-between p-3 rounded-xl border transition-all ${
                  addon.is_active
                    ? "bg-white border-gray-200 hover:border-secondary/30 shadow-xs"
                    : "bg-gray-50/80 border-gray-200/80 opacity-75"
                }`}
              >
                <div className="flex items-start sm:items-center gap-3 min-w-0">
                  <button
                    type="button"
                    onClick={() => handleToggleActive(addon)}
                    className="mt-0.5 sm:mt-0 p-1 rounded-lg hover:bg-gray-100 transition shrink-0"
                    title={addon.is_active ? "Click to deactivate" : "Click to activate"}
                  >
                    {addon.is_active ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <XCircle className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-gray-900 truncate">
                        {addon.name}
                      </p>
                      {addon.name_am && (
                        <span className="text-xs text-gray-400 truncate hidden md:inline">
                          ({addon.name_am})
                        </span>
                      )}
                      {!addon.is_active && (
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-medium bg-gray-200 text-gray-600">
                          Inactive
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500 mt-0.5">
                      <span className="font-semibold text-secondary">
                        +{Number(addon.price || 0).toLocaleString()} ETB
                      </span>
                      {addon.duration_minutes > 0 && (
                        <span className="inline-flex items-center gap-1 text-gray-500">
                          <Clock className="h-3 w-3 text-gray-400" />
                          +{addon.duration_minutes} min
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 mt-2 sm:mt-0 self-end sm:self-auto">
                  <button
                    type="button"
                    onClick={() => handleStartEdit(addon)}
                    className="p-1.5 text-secondary hover:text-purple-700 rounded-lg hover:bg-purple-50 transition"
                    title="Edit add-on"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDelete(addon.id)}
                    disabled={isDeleting}
                    className="p-1.5 text-red-600 hover:text-red-700 rounded-lg hover:bg-red-50 transition disabled:opacity-50"
                    title="Delete add-on"
                  >
                    {isDeleting ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <Trash2 className="h-3.5 w-3.5" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
