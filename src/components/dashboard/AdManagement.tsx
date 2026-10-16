// src/components/dashboard/ads/AdManagement.tsx
import React, { useState, useEffect, useRef, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Loader2,
  Plus,
  Trash2,
  Pencil,
  X,
  Search,
  LayoutDashboard,
  Activity,
  Image as ImageIcon,
  Globe,
  AlertTriangle,
  Upload,
  ChevronLeft,
  ChevronRight,
  Megaphone,
  MegaphoneOff,
  CircleCheck,
  CircleAlert,
  Info,
  Ruler,
  FileImage,
  HardDrive,
  Sliders,
  CreditCard,
} from "lucide-react";
import { useReadOnly } from "./AdminDashboard";
import { useAuth } from "../../context/authContext";
import {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  getCompanyAds,
  createCompanyAd,
  updateCompanyAd,
  deleteCompanyAd,
  getAdminAdPageSettings,
  updateAdminAdPageSetting,
  initializeAdPayment,
  verifyAdPayment,
} from "../../services/api";
import { useCurrentCompany } from "../../context/CurrentCompanyContext";
import PageHeader from "../ui/PageHeader";

// ----------------------------------------------------------------------
// Centralized image URL resolver
// ----------------------------------------------------------------------
const MEDIA_BASE = "https://backend.elilitapp.com";

function resolveAdImageUrl(path?: string | null): string {
  if (!path) return "";

  const trimmed = String(path).trim();
  if (!trimmed) return "";

  if (
    trimmed.startsWith("http://") ||
    trimmed.startsWith("https://") ||
    trimmed.startsWith("blob:") ||
    trimmed.startsWith("data:")
  ) {
    return trimmed;
  }

  const cleaned = trimmed.replace(/^\/+/, "");

  if (cleaned.startsWith("media/")) {
    return `${MEDIA_BASE}/${cleaned}`;
  }

  return `${MEDIA_BASE}/media/${cleaned}`;
}

// ----------------------------------------------------------------------
// Recommended ad image spec
// ----------------------------------------------------------------------
const AD_IMAGE_SPEC = {
  width: 1200,
  height: 400,
  ratio: "3:1",
  maxSizeMB: 2,
  formats: ["image/jpeg", "image/png", "image/webp"],
  formatLabel: "JPG, PNG, or WebP",
} as const;

// ----------------------------------------------------------------------
// Image dimension checker
// ----------------------------------------------------------------------
const TARGET_ASPECT = AD_IMAGE_SPEC.width / AD_IMAGE_SPEC.height; // 3.0
const ASPECT_TOLERANCE = 0.15; // ±15% → 2.55 : 3.45

interface ImageDimensionCheck {
  ok: boolean;
  width: number;
  height: number;
  aspect: number;
  reason?: string;
  severity: "error" | "warning" | "ok";
}

async function checkImageDimensions(
  file: File,
): Promise<ImageDimensionCheck> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(url);
      const w = img.naturalWidth || img.width;
      const h = img.naturalHeight || img.height;
      const aspect = w / h;
      const diff = Math.abs(aspect - TARGET_ASPECT) / TARGET_ASPECT;

      if (diff <= ASPECT_TOLERANCE) {
        resolve({ ok: true, width: w, height: h, aspect, severity: "ok" });
        return;
      }

      const direction = aspect > TARGET_ASPECT ? "wider" : "taller";
      resolve({
        ok: false,
        width: w,
        height: h,
        aspect,
        severity: "warning",
        reason: `Your image is ${w}×${h} px and looks ${direction} than the recommended ${AD_IMAGE_SPEC.width}×${AD_IMAGE_SPEC.height} px. It will still display, but with empty space around it.`,
      });
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({
        ok: false,
        width: 0,
        height: 0,
        aspect: 0,
        severity: "error",
        reason: "Could not read image dimensions. Please try another file.",
      });
    };

    img.src = url;
  });
}

// ----------------------------------------------------------------------
// Types
// ----------------------------------------------------------------------
interface Ad {
  id: number;
  company: number;
  company_name: string;
  company_slug: string;
  title: string;
  image: string;
  target_link?: string;
  target_pages: string[];
  start_date?: string;
  end_date?: string;
  total_cost?: string | number;
  payment_status?: "pending" | "paid" | "exempt";
  tx_ref?: string;
  is_active: boolean;
}

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

// ----------------------------------------------------------------------
// Toast System (stable callbacks)
// ----------------------------------------------------------------------
const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    visible: false,
  });
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback(
    (type: ToastType, message: string, duration = 3000) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      setToast({ message, type, visible: true });
      timeoutRef.current = setTimeout(() => {
        setToast((prev) => ({ ...prev, visible: false }));
      }, duration);
    },
    [],
  );

  const hideToast = useCallback(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setToast((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, []);

  return { toast, showToast, hideToast };
};

const Toast = ({
  toast,
  onHide,
}: {
  toast: ToastState;
  onHide: () => void;
}) => {
  useEffect(() => {
    if (toast.visible) {
      const timer = setTimeout(() => onHide(), 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.visible, onHide]);

  if (!toast.visible) return null;

  const icons = {
    success: <CircleCheck className="w-5 h-5 text-emerald-500" />,
    error: <CircleAlert className="w-5 h-5 text-red-500" />,
    info: <Info className="w-5 h-5 text-blue-500" />,
  };

  const bgColors = {
    success: "bg-white border-emerald-200",
    error: "bg-white border-red-200",
    info: "bg-white border-blue-200",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 50, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.9 }}
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-xl shadow-xl border ${bgColors[toast.type]} backdrop-blur-sm bg-white/90`}
    >
      {icons[toast.type]}
      <span className="text-sm font-medium text-gray-800">{toast.message}</span>
      <button
        onClick={onHide}
        className="ml-2 text-gray-400 hover:text-gray-600 transition-colors"
      >
        <X className="w-4 h-4" />
      </button>
    </motion.div>
  );
};

// ----------------------------------------------------------------------
// Constants
// ----------------------------------------------------------------------
const ITEMS_PER_PAGE = 6;

// ----------------------------------------------------------------------
// Reusable UI Components
// ----------------------------------------------------------------------
const Button: React.FC<{
  children: React.ReactNode;
  onClick?: () => void;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "outline" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
}> = ({
  children,
  onClick,
  type = "button",
  variant = "primary",
  size = "md",
  isLoading = false,
  className = "",
  disabled = false,
}) => {
  const base =
    "inline-flex items-center justify-center gap-2 font-medium transition-all duration-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed";
  const variants = {
    primary:
      "bg-secondary text-white shadow-md hover:shadow-lg focus:ring-[#674FA3]",
    secondary:
      "bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-500",
    outline:
      "border border-gray-300 bg-transparent text-gray-700 hover:bg-gray-50 focus:ring-gray-500",
    ghost: "text-gray-600 hover:bg-gray-100 focus:ring-gray-500",
    danger: "bg-red-600 text-white hover:bg-red-700 focus:ring-red-500",
  };
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-5 py-2.5 text-base",
  };
  return (
    <button
      type={type}
      onClick={onClick}
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || isLoading}
    >
      {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
};

const Input: React.FC<{
  label?: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  error?: string;
}> = ({
  label,
  type = "text",
  value,
  onChange,
  placeholder,
  required,
  error,
}) => (
  <div className="space-y-1.5">
    {label && (
      <label className="block text-sm font-medium text-gray-700">{label}</label>
    )}
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      required={required}
      className={`w-full px-4 py-2.5 border rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary transition-all ${
        error ? "border-red-300 focus:ring-red-500" : "border-gray-200"
      }`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "active" | "inactive" | "info" | "pending" | "warning";
}> = ({ children, variant = "info" }) => {
  const styles = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-600",
    info: "bg-blue-100 text-blue-700",
    pending: "bg-amber-100 text-amber-800 border border-amber-200",
    warning: "bg-yellow-100 text-yellow-800",
  };
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${styles[variant]}`}
    >
      {children}
    </span>
  );
};

// ----------------------------------------------------------------------
// Stat Card
// ----------------------------------------------------------------------
const StatCard: React.FC<{
  title: string;
  value: number;
  icon: React.ElementType;
  color: string;
}> = ({ title, value, icon: Icon, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-all hover:-translate-y-0.5"
  >
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-bold text-gray-900 mt-1">{value}</p>
      </div>
      <div className={`p-3 rounded-xl bg-gradient-to-br ${color} shadow-sm`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
    </div>
  </motion.div>
);

// ----------------------------------------------------------------------
// Image Spec Info Panel
// ----------------------------------------------------------------------
const ImageSpecInfo: React.FC = () => (
  <div className="rounded-xl border border-secondary/15 bg-secondary/[0.03] p-4">
    <div className="flex items-start gap-3">
      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-secondary/10">
        <ImageIcon className="h-4 w-4 text-secondary" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-gray-900">
          Recommended image specifications
        </p>
        <p className="mt-0.5 text-xs text-gray-500">
          Following these ensures your ad looks clear and sharp on all screens.
        </p>

        <div className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-3">
          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-gray-100">
            <Ruler className="h-3.5 w-3.5 shrink-0 text-secondary" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Dimensions
              </p>
              <p className="text-xs font-semibold text-gray-800">
                {AD_IMAGE_SPEC.width} × {AD_IMAGE_SPEC.height} px
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-gray-100">
            <FileImage className="h-3.5 w-3.5 shrink-0 text-secondary" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Ratio & Format
              </p>
              <p className="text-xs font-semibold text-gray-800">
                {AD_IMAGE_SPEC.ratio} · {AD_IMAGE_SPEC.formatLabel}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 border border-gray-100">
            <HardDrive className="h-3.5 w-3.5 shrink-0 text-secondary" />
            <div className="min-w-0">
              <p className="text-[10px] font-medium uppercase tracking-wide text-gray-400">
                Max File Size
              </p>
              <p className="text-xs font-semibold text-gray-800">
                {AD_IMAGE_SPEC.maxSizeMB} MB
              </p>
            </div>
          </div>
        </div>

        <p className="mt-3 flex items-start gap-1.5 text-[11px] text-gray-500">
          <Info className="mt-0.5 h-3 w-3 shrink-0" />
          <span>
            Keep text and logos in the <strong>center area</strong> of the image
            for best results on all screen sizes.
          </span>
        </p>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Image Uploader — with dimension validation & feedback
// ----------------------------------------------------------------------
const ImageUploader: React.FC<{
  onFileChange: (file: File | null) => void;
  previewUrl?: string | null;
  existingImage?: string;
  error?: string;
}> = ({ onFileChange, previewUrl, existingImage, error }) => {
  const [preview, setPreview] = useState<string | null>(
    previewUrl || resolveAdImageUrl(existingImage) || null,
  );
  const [isDragging, setIsDragging] = useState(false);
  const [fileError, setFileError] = useState<string | null>(null);
  const [imageFailed, setImageFailed] = useState(false);
  const [dimCheck, setDimCheck] = useState<ImageDimensionCheck | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setImageFailed(false);
    if (previewUrl) {
      setPreview(previewUrl);
      setDimCheck(null);
      setPendingFile(null);
    } else {
      const resolved = resolveAdImageUrl(existingImage);
      setPreview(resolved || null);
      setDimCheck(null);
      setPendingFile(null);
    }
  }, [previewUrl, existingImage]);

  const validateFile = (file: File): string | null => {
    if (!AD_IMAGE_SPEC.formats.includes(file.type as any)) {
      return `Unsupported format. Please upload ${AD_IMAGE_SPEC.formatLabel}.`;
    }
    if (file.size > AD_IMAGE_SPEC.maxSizeMB * 1024 * 1024) {
      return `File is too large. Maximum size is ${AD_IMAGE_SPEC.maxSizeMB} MB.`;
    }
    return null;
  };

  const handleFile = async (file: File) => {
    const err = validateFile(file);
    if (err) {
      setFileError(err);
      setDimCheck(null);
      setPendingFile(null);
      return;
    }
    setFileError(null);
    setImageFailed(false);

    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);

    const check = await checkImageDimensions(file);
    setDimCheck(check);

    if (check.severity === "error") {
      // Don't send broken files to the parent
      setFileError(check.reason || "Invalid image file.");
      setPendingFile(null);
      return;
    }

    // Accept the file (even if the ratio is a warning — user can still save)
    setPendingFile(file);
    onFileChange(file);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const clearImage = () => {
    onFileChange(null);
    setPreview(null);
    setFileError(null);
    setImageFailed(false);
    setDimCheck(null);
    setPendingFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-sm font-medium text-gray-700">
          Advertisement Image <span className="text-red-500">*</span>
        </label>
        <p className="mt-0.5 text-xs text-gray-500">
          Recommended: {AD_IMAGE_SPEC.width} × {AD_IMAGE_SPEC.height} px (
          {AD_IMAGE_SPEC.ratio}) · {AD_IMAGE_SPEC.formatLabel} · Max{" "}
          {AD_IMAGE_SPEC.maxSizeMB} MB
        </p>
      </div>

      <ImageSpecInfo />

      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative w-full rounded-xl overflow-hidden transition-all duration-200 ${
          isDragging ? "ring-2 ring-secondary ring-offset-2 bg-[#674FA3]/5" : ""
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept={AD_IMAGE_SPEC.formats.join(",")}
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            e.target.value = "";
          }}
          className="hidden"
        />
        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-gray-50 ${
              isDragging
                ? "border-secondary bg-[#674FA3]/5"
                : "border-gray-200"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm font-medium text-gray-700">
              Drag & drop an image here, or click to browse
            </p>
            <p className="mt-1 text-xs text-gray-400">
              {AD_IMAGE_SPEC.formatLabel} · up to {AD_IMAGE_SPEC.maxSizeMB} MB
            </p>

            <div className="mx-auto mt-4 flex max-w-xs items-center justify-center">
              <div
                className="w-full rounded-lg border border-dashed border-secondary/30 bg-secondary/[0.03]"
                style={{ aspectRatio: "3 / 1" }}
              >
                <div className="flex h-full items-center justify-center">
                  <span className="text-[10px] font-medium text-secondary/60">
                    Preview area · {AD_IMAGE_SPEC.ratio}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="relative group">
            <div
              className="w-full overflow-hidden rounded-xl border border-gray-200 bg-gray-50 flex items-center justify-center"
              style={{ aspectRatio: "3 / 1" }}
            >
              {imageFailed ? (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-1 text-xs text-gray-500">
                    Image failed to load. Please re-upload.
                  </p>
                </div>
              ) : (
                <img
                  src={preview}
                  alt="Preview"
                  onError={() => setImageFailed(true)}
                  className="h-full w-full object-contain"
                />
              )}
            </div>

            <div className="absolute inset-x-0 bottom-0 rounded-b-xl bg-black/55 p-3 flex items-center justify-center gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="bg-white px-4 py-2 rounded-xl text-sm font-medium text-gray-800 hover:bg-gray-100"
              >
                <Upload className="w-4 h-4 inline mr-1" />
                Change Image
              </button>
              <button
                type="button"
                onClick={clearImage}
                className="bg-white px-4 py-2 rounded-xl text-sm font-medium text-red-600 hover:bg-gray-100"
              >
                <Trash2 className="w-4 h-4 inline mr-1" />
                Remove
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Dimension feedback */}
      {dimCheck && preview && pendingFile && (
        <div
          className={`flex items-start gap-2.5 rounded-xl border px-3.5 py-3 ${
            dimCheck.severity === "ok"
              ? "border-emerald-200 bg-emerald-50"
              : "border-amber-200 bg-amber-50"
          }`}
        >
          {dimCheck.severity === "ok" ? (
            <CircleCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
          ) : (
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
          )}

          <div className="min-w-0 flex-1">
            {dimCheck.severity === "ok" ? (
              <>
                <p className="text-xs font-semibold text-emerald-900">
                  Perfect size · {dimCheck.width} × {dimCheck.height} px
                </p>
                <p className="mt-0.5 text-[11px] text-emerald-700">
                  Matches the recommended {AD_IMAGE_SPEC.ratio} aspect ratio.
                  Displays edge-to-edge on all screens.
                </p>
              </>
            ) : (
              <>
                <p className="text-xs font-semibold text-amber-900">
                  Size mismatch · {dimCheck.width} × {dimCheck.height} px
                  {dimCheck.aspect > 0 && (
                    <span className="ml-1.5 font-normal text-amber-700">
                      (aspect {dimCheck.aspect.toFixed(2)}:1)
                    </span>
                  )}
                </p>
                <p className="mt-0.5 text-[11px] leading-5 text-amber-800">
                  {dimCheck.reason}
                </p>
                <p className="mt-1.5 text-[11px] font-medium text-amber-900">
                  💡 Resize your image to{" "}
                  <span className="font-bold">
                    {AD_IMAGE_SPEC.width} × {AD_IMAGE_SPEC.height} px
                  </span>{" "}
                  for the best result.
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Large-file hint */}
      {pendingFile && pendingFile.size > 1.5 * 1024 * 1024 && (
        <div className="flex items-start gap-2 rounded-xl border border-blue-200 bg-blue-50 px-3.5 py-3">
          <Info className="mt-0.5 h-4 w-4 shrink-0 text-blue-600" />
          <div className="min-w-0">
            <p className="text-xs font-semibold text-blue-900">
              Large file ({(pendingFile.size / 1024 / 1024).toFixed(2)} MB)
            </p>
            <p className="mt-0.5 text-[11px] text-blue-700">
              For faster uploads, consider compressing your image at{" "}
              <a
                href="https://tinypng.com"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium underline hover:no-underline"
              >
                tinypng.com
              </a>
              . Target under 500 KB for the best experience.
            </p>
          </div>
        </div>
      )}

      {(fileError || error) && (
        <p className="text-xs text-red-500">{fileError || error}</p>
      )}
    </div>
  );
};

// ----------------------------------------------------------------------
// Ad Card Component
// ----------------------------------------------------------------------
const AdCard: React.FC<{
  ad: Ad;
  onEdit: (ad: Ad) => void;
  onDelete: (ad: Ad) => void;
  onPay?: (ad: Ad) => void;
  isPaying?: boolean;
  isReadOnly: boolean;
  isSuperAdmin: boolean;
}> = ({ ad, onEdit, onDelete, onPay, isPaying, isReadOnly, isSuperAdmin }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = resolveAdImageUrl(ad.image);

  useEffect(() => {
    setImageFailed(false);
  }, [ad.image]);

  const paymentVariant =
    ad.payment_status === "paid"
      ? "active"
      : ad.payment_status === "pending"
      ? "pending"
      : "info";

  const paymentLabel =
    ad.payment_status === "paid"
      ? "Paid"
      : ad.payment_status === "pending"
      ? "Unpaid"
      : "Exempt";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div
        className="relative w-full overflow-hidden bg-gray-100 flex items-center justify-center"
        style={{ aspectRatio: "3 / 1" }}
      >
        {imageUrl && !imageFailed ? (
          <img
            src={imageUrl}
            alt={ad.title}
            onError={() => setImageFailed(true)}
            className="h-full w-full object-contain transition-transform duration-500"
          />
        ) : (
          <div className="text-center">
            <ImageIcon className="mx-auto h-8 w-8 text-gray-400" />
            <p className="mt-1 text-xs text-gray-400">
              {imageFailed ? "Image failed to load" : "No image"}
            </p>
          </div>
        )}
        <div className="absolute top-3 right-3 flex items-center gap-1.5">
          {ad.payment_status && (
            <Badge variant={paymentVariant}>
              {paymentLabel}
            </Badge>
          )}
          <Badge variant={ad.is_active ? "active" : "inactive"}>
            {ad.is_active ? "Live" : "Inactive"}
          </Badge>
        </div>
      </div>

      <div className="p-5">
        <h3 className="font-semibold text-lg text-gray-900 mb-1 truncate">
          {ad.title}
        </h3>
        {isSuperAdmin && (
          <p className="text-xs font-medium text-gray-500 mb-1 truncate">
            {ad?.company_name}
          </p>
        )}

        {/* Target Pages Pills */}
        {ad.target_pages && ad.target_pages.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-2">
            {ad.target_pages.map((p) => (
              <span
                key={p}
                className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary/[0.06] text-secondary capitalize"
              >
                {p.replace("_", " ")}
              </span>
            ))}
          </div>
        )}

        {ad.target_link && (
          <a
            href={ad.target_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-secondary hover:underline gap-1 mb-3"
          >
            <Globe className="w-3.5 h-3.5" />{" "}
            {ad.target_link.replace(/^https?:\/\//, "")}
          </a>
        )}

        {/* Unpaid Banner with Pay Now Button */}
        {ad.payment_status === "pending" && (
          <div className="mb-3 p-3 rounded-xl bg-amber-50/80 border border-amber-200 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-bold text-amber-950">
                Fee: ETB {Number(ad.total_cost || 0).toFixed(2)}
              </p>
              <p className="text-[10px] text-amber-700">Payment required to display live</p>
            </div>
            {!isReadOnly && onPay && (
              <Button
                size="sm"
                className="bg-[#F4C44E] text-[#4E3900] hover:bg-[#F0BC37] border border-[#E7C86E] shadow-sm text-xs font-bold"
                isLoading={isPaying}
                onClick={() => onPay(ad)}
              >
                <CreditCard className="w-3.5 h-3.5 mr-1" /> Pay Now
              </Button>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(ad)}
            disabled={isReadOnly}
          >
            <Pencil className="w-4 h-4 mr-1" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(ad)}
            className="text-red-600 hover:bg-red-50"
            disabled={isReadOnly}
          >
            <Trash2 className="w-4 h-4 mr-1" /> Delete
          </Button>
        </div>
      </div>
    </motion.div>
  );
};

// ----------------------------------------------------------------------
// Delete Confirmation Modal
// ----------------------------------------------------------------------
const DeleteModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
}> = ({ isOpen, onClose, onConfirm, title }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 p-6"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-lg font-semibold">Delete Advertisement</h3>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
          <p className="text-gray-600">
            Are you sure you want to delete{" "}
            <span className="font-semibold">"{title}"</span>? This action cannot
            be undone.
          </p>
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button variant="danger" onClick={onConfirm}>
              Delete
            </Button>
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ----------------------------------------------------------------------
// Create/Edit Modal
// ----------------------------------------------------------------------
const FormModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (e: React.FormEvent) => Promise<void>;
  title: string;
  children: React.ReactNode;
  isSubmitting: boolean;
}> = ({ isOpen, onClose, onSubmit, title, children, isSubmitting }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          onClick={onClose}
        />
        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 20 }}
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl z-50"
        >
          <form onSubmit={onSubmit}>
            <div className="sticky top-0 bg-white/95 backdrop-blur-sm border-b border-gray-100 px-6 py-4 flex justify-between items-center z-10">
              <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              <button
                type="button"
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-6">{children}</div>
            <div className="sticky bottom-0 bg-white border-t border-gray-100 px-6 py-4 flex justify-end gap-3">
              <Button variant="outline" type="button" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" isLoading={isSubmitting}>
                Save
              </Button>
            </div>
          </form>
        </motion.div>
      </>
    )}
  </AnimatePresence>
);

// ----------------------------------------------------------------------
// Search & Filter Bar
// ----------------------------------------------------------------------
const SearchFilterBar: React.FC<{
  searchQuery: string;
  onSearchChange: (query: string) => void;
  filterStatus: "all" | "active" | "inactive";
  onFilterChange: (status: "all" | "active" | "inactive") => void;
}> = ({ searchQuery, onSearchChange, filterStatus, onFilterChange }) => (
  <div className="sticky -top-6 z-[2] -mt-6 w-full bg-white pt-6">
    <div className="w-full rounded-xl border border-secondary/10 bg-white p-2.5 shadow-[0_1px_3px_rgba(0,0,0,0.035)]">
      <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-secondary/40" />
          <input
            type="text"
            placeholder="Search Ads by title..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-10 w-full rounded-xl border border-secondary/15 bg-white pl-10 pr-4 text-sm text-secondary outline-none placeholder:text-secondary/35 focus:border-secondary/35 focus:ring-2 focus:ring-secondary/10"
          />
        </div>

        <div className="flex shrink-0 gap-2">
          {(["all", "active", "inactive"] as const).map((status) => (
            <motion.button
              key={status}
              type="button"
              whileTap={{ scale: 0.97 }}
              onClick={() => onFilterChange(status)}
              className={`h-10 rounded-xl border px-4 text-xs font-semibold capitalize transition ${
                filterStatus === status
                  ? "border-secondary bg-secondary text-white"
                  : "border-secondary/15 bg-white text-secondary hover:bg-secondary/[0.05]"
              }`}
            >
              {status === "all"
                ? "All"
                : status === "active"
                  ? "Active"
                  : "Inactive"}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// ----------------------------------------------------------------------
// Pagination
// ----------------------------------------------------------------------
const Pagination: React.FC<{
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}> = ({ currentPage, totalPages, onPageChange }) => {
  if (totalPages <= 1) return null;
  return (
    <div className="flex justify-center items-center gap-3 mt-10">
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
      >
        <ChevronLeft className="w-4 h-4" /> Previous
      </Button>
      <span className="text-sm text-gray-500">
        Page {currentPage} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
      >
        Next <ChevronRight className="w-4 h-4" />
      </Button>
    </div>
  );
};

// ----------------------------------------------------------------------
// Empty State
// ----------------------------------------------------------------------
const EmptyState: React.FC<{
  onCreateNew: () => void;
  isReadOnly: boolean;
}> = ({ onCreateNew, isReadOnly }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    className="text-center py-20 bg-white rounded-2xl border border-dashed border-gray-200"
  >
    <MegaphoneOff className="mx-auto h-14 w-14 text-gray-300" />
    <h3 className="mt-4 text-base font-semibold text-gray-900">
      No advertisements yet
    </h3>
    <p className="mt-1 text-sm text-gray-500">
      Launch your first Advertisement to reach more customers.
    </p>
    {!isReadOnly && (
      <div className="mt-6">
        <Button onClick={onCreateNew}>
          <Plus className="w-4 h-4 mr-2" /> Create Advertisement
        </Button>
      </div>
    )}
  </motion.div>
);

// ----------------------------------------------------------------------
// Loading Skeleton
// ----------------------------------------------------------------------
const LoadingSkeleton: React.FC = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {[...Array(6)].map((_, i) => (
      <div
        key={i}
        className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden animate-pulse"
      >
        <div className="w-full bg-gray-200" style={{ aspectRatio: "3 / 1" }} />
        <div className="p-5 space-y-3">
          <div className="h-6 bg-gray-200 rounded w-3/4" />
          <div className="h-4 bg-gray-200 rounded w-1/2" />
          <div className="flex justify-end gap-2 pt-4">
            <div className="h-8 w-16 bg-gray-200 rounded-lg" />
            <div className="h-8 w-16 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

// ----------------------------------------------------------------------
// MAIN COMPONENT
// ----------------------------------------------------------------------
export default function AdManagement() {
  const baseReadOnly = useReadOnly();
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const { company } = useCurrentCompany();
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [targetPages, setTargetPages] = useState<string[]>([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    title?: string;
    image?: string;
  }>({});
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  // UI state
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<
    "all" | "active" | "inactive"
  >("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [adToDelete, setAdToDelete] = useState<Ad | null>(null);

  // Ad Slot Limits state (SuperAdmin)
  const [slotsModalOpen, setSlotsModalOpen] = useState(false);
  const [pageSettings, setPageSettings] = useState<any[]>([]);
  const [savingSlotId, setSavingSlotId] = useState<number | null>(null);
  const [isPayingAdId, setIsPayingAdId] = useState<number | null>(null);

  // ------------------------------------------------------------
  // Role / permission determination
  // ------------------------------------------------------------
  const isSuperAdmin = !user?.memberships?.length;

  const fetchPageSettings = useCallback(async () => {
    try {
      const res = await getAdminAdPageSettings();
      setPageSettings(res.data?.results || res.data || []);
    } catch (err) {
      console.error("Failed to load ad page settings", err);
    }
  }, []);

  useEffect(() => {
    fetchPageSettings();
  }, [fetchPageSettings]);

  const handleUpdateSlotSetting = async (
    settingId: number,
    max_slots: number,
    price: number,
  ) => {
    setSavingSlotId(settingId);
    try {
      await updateAdminAdPageSetting(settingId, { max_slots, price });
      showToast("success", "Slot & pricing settings updated successfully");
      await fetchPageSettings();
    } catch (err: any) {
      showToast("error", "Failed to update page settings");
    } finally {
      setSavingSlotId(null);
    }
  };

  const fixedPlacementPrice = useMemo(() => {
    if (!targetPages || targetPages.length === 0 || !pageSettings.length) return 0;
    return targetPages.reduce((sum, page) => {
      const setting = pageSettings.find((s) => s.page_name === page);
      return sum + (Number(setting?.price) || 0);
    }, 0);
  }, [targetPages, pageSettings]);

  const companyRole = (() => {
    if (!user || !company?.slug) return "";
    if (isSuperAdmin) return "admin";
    const membership = user.memberships?.find(
      (m: any) => m.company_slug === company.slug,
    );
    return membership?.role || "";
  })();

  const isCompanyAdmin = !isSuperAdmin && Boolean(company?.slug);

  const canManageAds = isSuperAdmin || companyRole === "owner";
  const isReadOnly = baseReadOnly || !canManageAds;

  // Extract primitive for stable deps
  const companySlug = company?.slug ?? null;

  // ------------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------------
  const fetchAds = useCallback(async () => {
    try {
      setIsLoading(true);
      let response;
      if (isCompanyAdmin && companySlug) {
        response = await getCompanyAds(companySlug);
      } else {
        response = await getAds();
      }
      const adsList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      if (import.meta.env.DEV) {
        adsList.forEach((ad: Ad) => {
          console.log(
            `[AdManagement] ad #${ad.id} "${ad.title}" raw:`,
            ad.image,
            "→ resolved:",
            resolveAdImageUrl(ad.image),
          );
        });
      }

      setAds(adsList);
    } catch (error) {
      showToast("error", "Failed to load advertisements");
    } finally {
      setIsLoading(false);
    }
  }, [isCompanyAdmin, companySlug, showToast]);

  // ------------------------------------------------------------
  // Effects
  // ------------------------------------------------------------
  useEffect(() => {
    fetchAds();
  }, [fetchAds]);

  const handlePayAd = async (ad: Ad) => {
    setIsPayingAdId(ad.id);
    try {
      const returnUrl = window.location.origin + window.location.pathname;
      const res = await initializeAdPayment(ad.id, returnUrl);
      if (res.data?.checkout_url) {
        window.location.href = res.data.checkout_url;
      } else if (res.data?.status === "paid") {
        showToast("success", "Advertisement activated at zero fee!");
        await fetchAds();
      }
    } catch (err: any) {
      showToast(
        "error",
        err.response?.data?.error || "Failed to initialize payment.",
      );
    } finally {
      setIsPayingAdId(null);
    }
  };

  // Check for returning payment from Chapa (ad_tx_ref in query params)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const adTxRef = params.get("ad_tx_ref");
    if (adTxRef) {
      verifyAdPayment(adTxRef)
        .then((res) => {
          showToast(
            "success",
            res.data?.message || "Payment verified! Your ad is now active.",
          );
          params.delete("ad_tx_ref");
          const newUrl =
            window.location.pathname +
            (params.toString() ? `?${params.toString()}` : "");
          window.history.replaceState({}, document.title, newUrl);
          fetchAds();
        })
        .catch((err) => {
          showToast(
            "error",
            err.response?.data?.error || "Payment verification failed.",
          );
        });
    }
  }, [fetchAds, showToast]);

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  const handleDeleteClick = useCallback(
    (ad: Ad) => {
      if (isReadOnly) return;
      setAdToDelete(ad);
      setDeleteModalOpen(true);
    },
    [isReadOnly],
  );

  const confirmDelete = useCallback(async () => {
    if (adToDelete && !isReadOnly) {
      try {
        if (isCompanyAdmin && companySlug) {
          await deleteCompanyAd(companySlug, adToDelete.id);
        } else {
          await deleteAd(adToDelete.id);
        }
        setAds((prev) => prev.filter((ad) => ad.id !== adToDelete.id));
        showToast("success", "Advertisement deleted successfully");
      } catch (error) {
        showToast("error", "Failed to delete Advertisement");
      } finally {
        setDeleteModalOpen(false);
        setAdToDelete(null);
      }
    }
  }, [adToDelete, isReadOnly, isCompanyAdmin, companySlug, showToast]);

  const openCreateModal = useCallback(() => {
    if (isReadOnly) return;
    setEditingId(null);
    setTitle("");
    setTargetLink("");
    setTargetPages([]);
    const today = new Date().toISOString().slice(0, 10);
    const inAWeek = new Date(Date.now() + 7 * 86400000).toISOString().slice(0, 10);
    setStartDate(today);
    setEndDate(inAWeek);
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setFormErrors({});
    setModalOpen(true);
  }, [isReadOnly]);

  const openEditModal = useCallback(
    (ad: Ad) => {
      if (isReadOnly) return;
      setEditingId(ad.id);
      setTitle(ad.title);
      setTargetLink(ad.target_link || "");
      setTargetPages(ad.target_pages);
      setStartDate(ad.start_date ? ad.start_date.slice(0, 10) : "");
      setEndDate(ad.end_date ? ad.end_date.slice(0, 10) : "");
      setIsActive(ad.is_active);
      setImageFile(null);
      setImagePreview(null);
      setFormErrors({});
      setModalOpen(true);
    },
    [isReadOnly],
  );

  const validateForm = useCallback(() => {
    const errors: { title?: string; image?: string } = {};
    if (!title.trim()) errors.title = "Advertisement title is required";
    if (!editingId && !imageFile)
      errors.image = "Please select an image for new Advertisement";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [title, editingId, imageFile]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (isReadOnly) return;
      if (!validateForm()) return;
      setIsSubmitting(true);
      const formData = new FormData();
      formData.append("title", title);
      formData.append("is_active", String(isActive));
      if (imageFile) formData.append("image", imageFile);
      formData.append("target_pages", JSON.stringify(targetPages));
      formData.append("target_link", targetLink || "");
      if (startDate) formData.append("start_date", startDate);
      if (endDate) formData.append("end_date", endDate);

      try {
        if (editingId) {
          if (isCompanyAdmin && companySlug) {
            await updateCompanyAd(companySlug, editingId, formData);
          } else {
            await updateAd(editingId, formData);
          }
          showToast("success", "Advertisement updated successfully");
        } else {
          if (isCompanyAdmin && companySlug) {
            await createCompanyAd(companySlug, formData);
          } else {
            await createAd(formData);
          }
          showToast("success", "New Advertisement created");
        }
        setModalOpen(false);
        fetchAds();
      } catch (error: any) {
        const isTimeout =
          error?.code === "ECONNABORTED" ||
          /timeout/i.test(error?.message || "");
        showToast(
          "error",
          isTimeout
            ? "Upload timed out. Please check your connection and try again."
            : error?.message || "Failed to save Advertisement",
        );
      } finally {
        setIsSubmitting(false);
      }
    },
    [
      isReadOnly,
      validateForm,
      title,
      isActive,
      imageFile,
      targetPages,
      targetLink,
      startDate,
      endDate,
      editingId,
      isCompanyAdmin,
      companySlug,
      showToast,
      fetchAds,
    ],
  );

  const handleImageChange = useCallback((file: File | null) => {
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  }, []);

  // ------------------------------------------------------------
  // Filtering & Pagination
  // ------------------------------------------------------------
  const filteredAds = ads.filter((ad) => {
    const matchesSearch = ad.title
      .toLowerCase()
      .includes(searchQuery.toLowerCase());
    const matchesStatus =
      filterStatus === "all"
        ? true
        : filterStatus === "active"
          ? ad.is_active
          : !ad.is_active;
    return matchesSearch && matchesStatus;
  });
  const totalPages = Math.ceil(filteredAds.length / ITEMS_PER_PAGE);
  const paginatedAds = filteredAds.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  const totalCount = ads.length;
  const activeCount = ads.filter((ad) => ad.is_active).length;

  // ------------------------------------------------------------
  // Render
  // ------------------------------------------------------------
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-200/80 p-4 sm:p-6 lg:p-8">
      <div className="w-full">
        <PageHeader
          title={isCompanyAdmin ? "My Company Ads" : "Advertisements"}
          description={
            isCompanyAdmin
              ? "Manage advertisements and placements for your company."
              : "Manage advertisement placements across the platform."
          }
          icon={Megaphone}
          loading={isLoading && ads.length === 0}
          badge={
            isReadOnly ? (
              <span className="inline-flex items-center rounded-full border border-gray-200 bg-gray-100 px-2.5 py-1 text-[10px] font-semibold text-gray-600 sm:text-xs">
                View Only
              </span>
            ) : undefined
          }
          actions={
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <Button
                  onClick={() => setSlotsModalOpen(true)}
                  size="md"
                  variant="outline"
                  className="w-full shadow-sm sm:w-auto"
                >
                  <Sliders className="h-4 w-4 shrink-0" />
                  <span>Slot Limits & Pricing</span>
                </Button>
              )}
              {!isReadOnly && (
                <Button
                  onClick={openCreateModal}
                  size="md"
                  className="w-full shadow-sm sm:w-auto"
                >
                  <Plus className="h-4 w-4 shrink-0" />
                  <span>New Ad</span>
                </Button>
              )}
            </div>
          }
          actionMobile={
            <div className="flex items-center gap-2">
              {isSuperAdmin && (
                <Button
                  onClick={() => setSlotsModalOpen(true)}
                  size="md"
                  variant="outline"
                  className="w-full shadow-sm sm:w-auto"
                >
                  <Sliders className="h-3 w-3 shrink-0" />
                  <span>Pricing & Slots</span>
                </Button>
              )}
              {!isReadOnly && (
                <Button
                  onClick={openCreateModal}
                  size="md"
                  className="w-full shadow-sm sm:w-auto"
                >
                  <Plus className="h-3 w-3 shrink-0" />
                  <span>New</span>
                </Button>
              )}
            </div>
          }
        />

        {/* Stats Grid */}
        <div className="mb-6 hidden xs:grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            title="Total Ads"
            value={totalCount}
            icon={LayoutDashboard}
            color="from-blue-500 to-blue-600"
          />
          <StatCard
            title="Active Ads"
            value={activeCount}
            icon={Activity}
            color="from-emerald-500 to-emerald-600"
          />
          <StatCard
            title="Inactive Ads"
            value={totalCount - activeCount}
            icon={ImageIcon}
            color="from-gray-500 to-gray-600"
          />
        </div>

        {/* Search & Filter */}
        <SearchFilterBar
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          filterStatus={filterStatus}
          onFilterChange={setFilterStatus}
        />

        {/* Content Area */}
        {isLoading ? (
          <LoadingSkeleton />
        ) : paginatedAds.length === 0 ? (
          <EmptyState onCreateNew={openCreateModal} isReadOnly={isReadOnly} />
        ) : (
          <>
            <div className="mt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  onEdit={openEditModal}
                  onDelete={handleDeleteClick}
                  onPay={handlePayAd}
                  isPaying={isPayingAdId === ad.id}
                  isReadOnly={isReadOnly}
                  isSuperAdmin={isSuperAdmin}
                />
              ))}
            </div>
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              onPageChange={setCurrentPage}
            />
          </>
        )}

        {/* Modals */}
        <DeleteModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title={adToDelete?.title || ""}
        />

        <FormModal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleSubmit}
          title={editingId ? "Edit Advertisement" : "Create New Advertisement"}
          isSubmitting={isSubmitting}
        >
          <Input
            label="Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Summer Sale 2025"
            required
            error={formErrors.title}
          />
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="w-4 h-4 text-secondary rounded border-gray-300 focus:ring-[#674FA3]"
              />
              <label
                htmlFor="isActive"
                className="text-sm font-medium text-gray-700"
              >
                Active (visible to users)
              </label>
            </div>
          </div>
          <Input
            label="Target Link (optional)"
            type="url"
            value={targetLink}
            onChange={(e) => setTargetLink(e.target.value)}
            placeholder="https://example.com/offer"
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Campaign Start Date
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Campaign End Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-secondary focus:ring-1 focus:ring-secondary outline-none"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Ad Placements
            </label>
            <p className="text-xs text-gray-500">
              Placements rotate fairly across page slots configured by Superadmin.
            </p>
            <div className="space-y-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetPages.includes("home")}
                  onChange={(e) => {
                    if (e.target.checked)
                      setTargetPages([...targetPages, "home"]);
                    else
                      setTargetPages(targetPages.filter((p) => p !== "home"));
                  }}
                  className="w-4 h-4 text-secondary rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-800">Home Page</span>
                <span className="text-[11px] text-gray-500">
                  (Main banner carousel)
                </span>
                {(() => {
                  const s = pageSettings.find((p) => p.page_name === "home");
                  return s ? (
                    <span className="text-[10px] font-bold text-secondary bg-secondary/[0.08] px-2 py-0.5 rounded-full ml-auto">
                      ETB {Number(s.price || 0).toFixed(0)}
                    </span>
                  ) : null;
                })()}
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetPages.includes("companies_list")}
                  onChange={(e) => {
                    if (e.target.checked)
                      setTargetPages([...targetPages, "companies_list"]);
                    else
                      setTargetPages(
                        targetPages.filter((p) => p !== "companies_list"),
                      );
                  }}
                  className="w-4 h-4 text-secondary rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-800">Companies List Page</span>
                <span className="text-[11px] text-gray-500">
                  (Directory banner)
                </span>
                {(() => {
                  const s = pageSettings.find((p) => p.page_name === "companies_list");
                  return s ? (
                    <span className="text-[10px] font-bold text-secondary bg-secondary/[0.08] px-2 py-0.5 rounded-full ml-auto">
                      ETB {Number(s.price || 0).toFixed(0)}
                    </span>
                  ) : null;
                })()}
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={targetPages.includes("company_detail")}
                  onChange={(e) => {
                    if (e.target.checked)
                      setTargetPages([...targetPages, "company_detail"]);
                    else
                      setTargetPages(
                        targetPages.filter((p) => p !== "company_detail"),
                      );
                  }}
                  className="w-4 h-4 text-secondary rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-800">Company Detail Page</span>
                <span className="text-[11px] text-gray-500">
                  (Storefront banner)
                </span>
                {(() => {
                  const s = pageSettings.find((p) => p.page_name === "company_detail");
                  return s ? (
                    <span className="text-[10px] font-bold text-secondary bg-secondary/[0.08] px-2 py-0.5 rounded-full ml-auto">
                      ETB {Number(s.price || 0).toFixed(0)}
                    </span>
                  ) : null;
                })()}
              </label>
            </div>

            {/* Fixed Pricing Summary */}
            {targetPages.length > 0 && (
              <div className="p-4 bg-secondary/[0.04] rounded-xl border border-secondary/15 space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-secondary">
                  <span>Selected Placements ({targetPages.length})</span>
                  <span>ETB {fixedPlacementPrice.toFixed(2)}</span>
                </div>
                <div className="pt-2 border-t border-secondary/10 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-gray-900">Fixed Placement Fee</p>
                    <p className="text-[11px] text-gray-500">
                      {isSuperAdmin
                        ? "Platform ads created by SuperAdmin are exempt from fees"
                        : "Fixed one-time placement fee per advertisement via Chapa"}
                    </p>
                  </div>
                  <span className="text-lg font-black text-secondary">
                    ETB {fixedPlacementPrice.toFixed(2)}
                  </span>
                </div>
              </div>
            )}
          </div>

          <ImageUploader
            onFileChange={handleImageChange}
            previewUrl={imagePreview}
            existingImage={
              editingId ? ads.find((a) => a.id === editingId)?.image : undefined
            }
            error={formErrors.image}
          />
        </FormModal>

        {/* Superadmin Ad Page Slot Limits Modal */}
        <AnimatePresence>
          {slotsModalOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
                onClick={() => setSlotsModalOpen(false)}
              />
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-white rounded-2xl shadow-2xl z-50 p-6"
              >
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      <Sliders className="h-5 w-5 text-secondary" />
                      Page Ad Slot Limits & Pricing
                    </h2>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Configure maximum active ads displayed per page and the fixed placement fee in ETB per ad.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setSlotsModalOpen(false)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4 space-y-4">
                  {pageSettings.length === 0 ? (
                    <div className="text-center py-6 text-sm text-gray-500">
                      No placement settings found. Ensure database settings are initialized.
                    </div>
                  ) : (
                    pageSettings.map((setting) => (
                      <div
                        key={setting.id}
                        className="p-3.5 rounded-xl border border-gray-100 bg-gray-50/70 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                      >
                        <div>
                          <p className="text-sm font-semibold text-gray-800">
                            {setting.page_name_display || setting.page_name}
                          </p>
                          <p className="text-xs text-gray-500 font-mono mt-0.5">
                            Key: {setting.page_name}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <div className="flex items-center gap-1">
                            <label className="text-xs font-medium text-gray-600">
                              Slots:
                            </label>
                            <input
                              type="number"
                              min="1"
                              max="50"
                              defaultValue={setting.max_slots}
                              id={`slot-input-${setting.id}`}
                              className="w-14 px-2 py-1 text-center text-xs font-bold border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary"
                            />
                          </div>
                          <div className="flex items-center gap-1">
                            <label className="text-xs font-medium text-gray-600">
                              Price (ETB):
                            </label>
                            <input
                              type="number"
                              min="0"
                              step="1"
                              defaultValue={Number(setting.price || 0)}
                              id={`price-input-${setting.id}`}
                              className="w-20 px-2 py-1 text-center text-xs font-bold border border-gray-300 rounded-lg bg-white text-gray-800 focus:outline-none focus:ring-2 focus:ring-secondary"
                            />
                          </div>
                          <Button
                            size="sm"
                            isLoading={savingSlotId === setting.id}
                            onClick={() => {
                              const slotEl = document.getElementById(
                                `slot-input-${setting.id}`
                              ) as HTMLInputElement;
                              const priceEl = document.getElementById(
                                `price-input-${setting.id}`
                              ) as HTMLInputElement;
                              if (slotEl && priceEl) {
                                const slotsVal = parseInt(slotEl.value, 10);
                                const priceVal = parseFloat(priceEl.value);
                                if (!isNaN(slotsVal) && slotsVal >= 1 && !isNaN(priceVal) && priceVal >= 0) {
                                  handleUpdateSlotSetting(setting.id, slotsVal, priceVal);
                                }
                              }
                            }}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <div className="mt-6 flex justify-end">
                  <Button variant="outline" onClick={() => setSlotsModalOpen(false)}>
                    Close
                  </Button>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
      <Toast toast={toast} onHide={hideToast} />
    </div>
  );
}