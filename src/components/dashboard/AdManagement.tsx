import React, { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useReadOnly } from "./AdminDashboard";
import { useAuth } from "../../context/authContext";
import {
  getAds,
  createAd,
  updateAd,
  deleteAd,
  getMySubscription,
  getCompanyAds,
  createCompanyAd,
  updateCompanyAd,
  deleteCompanyAd,
} from "../../services/api";
import { useCurrentCompany } from "../../context/CurrentCompanyContext";
import PageHeader from "../ui/PageHeader";

// ----------------------------------------------------------------------
// Types – matches the system’s expected ad structure
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
  is_active: boolean;
}

type ToastType = "success" | "error" | "info";

interface ToastState {
  message: string;
  type: ToastType;
  visible: boolean;
}

// ----------------------------------------------------------------------
// Toast System (self-contained)
// ----------------------------------------------------------------------
const useToast = () => {
  const [toast, setToast] = useState<ToastState>({
    message: "",
    type: "info",
    visible: false,
  });
  let timeoutId: ReturnType<typeof setTimeout>;

  const showToast = (type: ToastType, message: string, duration = 3000) => {
    if (timeoutId) clearTimeout(timeoutId);
    setToast({ message, type, visible: true });
    timeoutId = setTimeout(() => {
      setToast((prev) => ({ ...prev, visible: false }));
    }, duration);
  };

  const hideToast = () => {
    if (timeoutId) clearTimeout(timeoutId);
    setToast((prev) => ({ ...prev, visible: false }));
  };

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
// Reusable UI Components (inline, uses dashboard color #6750A4)
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
      "bg-secondary  text-white shadow-md hover:shadow-lg focus:ring-[#674FA3]",
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
      className={`w-full px-4 py-2.5 border rounded-xl bg-white text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary  transition-all ${
        error ? "border-red-300 focus:ring-red-500" : "border-gray-200"
      }`}
    />
    {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
  </div>
);

const Badge: React.FC<{
  children: React.ReactNode;
  variant?: "active" | "inactive" | "info";
}> = ({ children, variant = "info" }) => {
  const styles = {
    active: "bg-emerald-100 text-emerald-700",
    inactive: "bg-gray-100 text-gray-600",
    info: "bg-blue-100 text-blue-700",
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
// Image Uploader with drag & drop and preview
// ----------------------------------------------------------------------
const ImageUploader: React.FC<{
  onFileChange: (file: File | null) => void;
  previewUrl?: string | null;
  existingImage?: string;
}> = ({ onFileChange, previewUrl, existingImage }) => {
  const [preview, setPreview] = useState<string | null>(
    previewUrl ||
      (existingImage
        ? existingImage.startsWith("http") || existingImage.startsWith("blob:")
          ? existingImage
          : existingImage.startsWith("/")
            ? `https://backend.elilitapp.com${existingImage}`
            : `https://backend.elilitapp.com/media/${existingImage}`
        : null),
  );
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (previewUrl) {
      setPreview(previewUrl);
    } else if (existingImage) {
      if (
        existingImage.startsWith("http") ||
        existingImage.startsWith("blob:")
      ) {
        setPreview(existingImage);
      } else if (existingImage.startsWith("/")) {
        setPreview(`https://backend.elilitapp.com${existingImage}`);
      } else {
        setPreview(`https://backend.elilitapp.com/media/${existingImage}`);
      }
    } else {
      setPreview(null);
    }
  }, [previewUrl, existingImage]);

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    onFileChange(file);
    const reader = new FileReader();
    reader.onloadend = () => setPreview(reader.result as string);
    reader.readAsDataURL(file);
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
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Advertisement Image
      </label>
      <div
        onDrop={onDrop}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        className={`relative w-full rounded-xl overflow-hidden transition-all duration-200 ${
          isDragging
            ? "ring-2 ring-secondary  ring-offset-2 bg-[#674FA3]/5"
            : ""
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) handleFile(file);
            // Allow re‑selecting the same file
            e.target.value = "";
          }}
          className="hidden"
        />
        {!preview ? (
          <div
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all hover:bg-gray-50 ${
              isDragging
                ? "border-secondary  bg-[#674FA3]/5"
                : "border-gray-200"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="mx-auto h-10 w-10 text-gray-400" />
            <p className="mt-2 text-sm text-gray-500">
              Drag & drop an image here, or click to browse
            </p>
            <p className="text-xs text-gray-400 mt-1">PNG, JPG up to 10MB</p>
          </div>
        ) : (
          <div className="relative group">
            <img
              src={preview}
              alt="Preview"
              className="w-full h-56 sm:h-64 object-cover rounded-xl shadow-sm"
            />
            <div className="absolute inset-x-0 bottom-0 bg-black/50 p-3 flex items-center justify-center gap-3 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
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
  getImageUrl: (url: string) => string;
  isReadOnly: boolean;
  isSuperAdmin: boolean;
}> = ({ ad, onEdit, onDelete, getImageUrl, isReadOnly, isSuperAdmin }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.2 }}
      className="group bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-xl transition-all duration-300"
    >
      <div className="relative h-52 overflow-hidden">
        <img
          src={getImageUrl(ad.image)}
          alt={ad.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute top-4 right-4">
          <Badge variant={ad.is_active ? "active" : "inactive"}>
            {ad.is_active ? "Active" : "Inactive"}
          </Badge>
        </div>
      </div>
      <div className="p-5">
        <h3 className="font-semibold text-xl text-gray-900 mb-1 truncate">
          {ad.title}
        </h3>
        {isSuperAdmin && (
          <h3 className="font-semibold text-sm text-gray-900 mb-1 truncate">
            {ad?.company_name}
          </h3>
        )}
        {ad.target_link && (
          <a
            href={ad.target_link}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center text-sm text-secondary  hover:underline gap-1 mb-4"
          >
            <Globe className="w-3.5 h-3.5" />{" "}
            {ad.target_link.replace(/^https?:\/\//, "")}
          </a>
        )}
        <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
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
        <div className="h-52 bg-gray-200" />
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
  const baseReadOnly = useReadOnly(); // respects viewer mode from dashboard
  const { user } = useAuth();
  const { toast, showToast, hideToast } = useToast();
  const { company } = useCurrentCompany();
  const [activeSub, setActiveSub] = useState<any>(null);
  const [ads, setAds] = useState<Ad[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Form state
  const [title, setTitle] = useState("");
  const [targetLink, setTargetLink] = useState("");
  const [targetPages, setTargetPages] = useState<string[]>([]);
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

  // ------------------------------------------------------------
  // Role / permission determination
  // ------------------------------------------------------------
  const isSuperAdmin = !user?.memberships?.length; // true if no company memberships

  const companyRole = (() => {
    if (!user || !company?.slug) return "";
    if (isSuperAdmin) return "admin"; // super admin can manage any company
    const membership = user.memberships?.find(
      (m: any) => m.company_slug === company.slug,
    );
    return membership?.role || "";
  })();

  // A user is a true company admin (not super admin) if they have a company slug
  // and are not a super admin. This ensures company‑scoped API endpoints are used.
  const isCompanyAdmin = !isSuperAdmin && Boolean(company?.slug);

  const canManageAds = isSuperAdmin || companyRole === "admin";
  const isReadOnly = baseReadOnly || !canManageAds; // combined read‑only state

  // ------------------------------------------------------------
  // Effects
  // ------------------------------------------------------------
  useEffect(() => {
    fetchAds();
    // Fetch subscription only for non‑super‑admin company users.
    // Super admins do not need a company subscription check.
    if (!isSuperAdmin && company && company.slug) {
      getMySubscription(company.slug)
        .then((res) => setActiveSub(res.data))
        .catch(console.error);
    } else {
      // Default: full placement permissions for super admins / no company context
      setActiveSub({
        plan: {
          can_ad_home_page: true,
          can_ad_companies_list: true,
          can_ad_company_detail: true,
        },
      });
    }
  }, [company?.slug, isSuperAdmin]);

  // ------------------------------------------------------------
  // Data fetching
  // ------------------------------------------------------------
  const fetchAds = async () => {
    try {
      setIsLoading(true);
      let response;
      if (isCompanyAdmin) {
        response = await getCompanyAds(company!.slug);
      } else {
        // Global ads for super admin / no company context
        response = await getAds();
      }
      const adsList = Array.isArray(response.data)
        ? response.data
        : response.data?.results || [];

      console.log("--- Ads Fetched Successfully ---");
      console.table(
        adsList.map((ad: Ad) => ({
          ID: ad.id,
          Title: ad.title,
          "Raw Image Path": ad.image,
          "Resolved Image URL": ad.image
            ? ad.image.startsWith("http") || ad.image.startsWith("blob:")
              ? ad.image
              : ad.image.startsWith("/")
                ? `https://backend.elilitapp.com${ad.image}`
                : `https://backend.elilitapp.com/media/${ad.image}`
            : "",
        })),
      );

      setAds(adsList);
      console.log("adsList", adsList);
    } catch (error) {
      showToast("error", "Failed to load advertisements");
    } finally {
      setIsLoading(false);
    }
  };

  // ------------------------------------------------------------
  // Handlers
  // ------------------------------------------------------------
  const handleDeleteClick = (ad: Ad) => {
    if (isReadOnly) return;
    setAdToDelete(ad);
    setDeleteModalOpen(true);
  };

  const confirmDelete = async () => {
    if (adToDelete && !isReadOnly) {
      try {
        if (isCompanyAdmin) {
          await deleteCompanyAd(company!.slug, adToDelete.id);
        } else {
          await deleteAd(adToDelete.id);
        }
        setAds(ads.filter((ad) => ad.id !== adToDelete.id));
        showToast("success", "Advertisement deleted successfully");
      } catch (error) {
        showToast("error", "Failed to delete Advertisement");
      } finally {
        setDeleteModalOpen(false);
        setAdToDelete(null);
      }
    }
  };

  const openCreateModal = () => {
    if (isReadOnly) return;
    setEditingId(null);
    setTitle("");
    setTargetLink("");
    setTargetPages([]);
    setIsActive(true);
    setImageFile(null);
    setImagePreview(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const openEditModal = (ad: Ad) => {
    if (isReadOnly) return;
    setEditingId(ad.id);
    setTitle(ad.title);
    setTargetLink(ad.target_link || "");
    setTargetPages(ad.target_pages);
    setIsActive(ad.is_active);
    setImageFile(null);
    setImagePreview(null);
    setFormErrors({});
    setModalOpen(true);
  };

  const validateForm = () => {
    const errors: { title?: string; image?: string } = {};
    if (!title.trim()) errors.title = "Advertisement title is required";
    if (!editingId && !imageFile)
      errors.image = "Please select an image for new Advertisement";
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
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

    try {
      if (editingId) {
        if (isCompanyAdmin) {
          await updateCompanyAd(company!.slug, editingId, formData);
        } else {
          await updateAd(editingId, formData);
        }
        showToast("success", "Advertisement updated successfully");
      } else {
        if (isCompanyAdmin) {
          await createCompanyAd(company!.slug, formData);
        } else {
          await createAd(formData);
        }
        showToast("success", "New Advertisement created");
      }
      setModalOpen(false);
      fetchAds();
    } catch (error: any) {
      showToast("error", error.message || "Failed to save Advertisement");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleImageChange = (file: File | null) => {
    setImageFile(file);
    if (file) {
      setImagePreview(URL.createObjectURL(file));
    } else {
      setImagePreview(null);
    }
  };

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

  const getImageUrl = (image: string) => {
    if (!image) return "";
    if (image.startsWith("http") || image.startsWith("blob:")) return image;
    if (image.startsWith("/")) {
      return `https://backend.elilitapp.com${image}`;
    }
    return `https://backend.elilitapp.com/media/${image}`;
  };

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
            !isReadOnly ? (
              <Button
                onClick={openCreateModal}
                size="md"
                className="w-full shadow-sm sm:w-auto"
              >
                <Plus className="h-4 w-4 shrink-0" />
                <span>New Ad</span>
              </Button>
            ) : undefined
          }
        />

        {/* Stats Grid */}
        <div className="mb-4 hidden xs:grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {paginatedAds.map((ad) => (
                <AdCard
                  key={ad.id}
                  ad={ad}
                  onEdit={openEditModal}
                  onDelete={handleDeleteClick}
                  getImageUrl={getImageUrl}
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
          title={editingId ? "Edit Advertisment" : "Create New Advertisment"}
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
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Ad Placements
            </label>
            <div className="space-y-2">
              <label
                className={`flex items-center gap-2 ${
                  !activeSub?.plan?.can_ad_home_page ? "opacity-50" : ""
                }`}
              >
                <input
                  type="checkbox"
                  checked={targetPages.includes("home")}
                  onChange={(e) => {
                    if (e.target.checked)
                      setTargetPages([...targetPages, "home"]);
                    else
                      setTargetPages(targetPages.filter((p) => p !== "home"));
                  }}
                  disabled={!activeSub?.plan?.can_ad_home_page}
                  className="w-4 h-4 text-secondary rounded border-gray-300"
                />
                <span className="text-sm">Home Page</span>
                {!activeSub?.plan?.can_ad_home_page && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">
                    Requires Pro+
                  </span>
                )}
              </label>

              <label
                className={`flex items-center gap-2 ${
                  !activeSub?.plan?.can_ad_companies_list ? "opacity-50" : ""
                }`}
              >
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
                  disabled={!activeSub?.plan?.can_ad_companies_list}
                  className="w-4 h-4 text-secondary rounded border-gray-300"
                />
                <span className="text-sm">Companies List Page</span>
                {!activeSub?.plan?.can_ad_companies_list && (
                  <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full ml-2">
                    Requires Basic+
                  </span>
                )}
              </label>

              <label
                className={`flex items-center gap-2 ${
                  !activeSub?.plan?.can_ad_company_detail ? "opacity-50" : ""
                }`}
              >
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
                  disabled={!activeSub?.plan?.can_ad_company_detail}
                  className="w-4 h-4 text-secondary rounded border-gray-300"
                />
                <span className="text-sm">Company Detail Page</span>
              </label>
            </div>
          </div>
          <ImageUploader
            onFileChange={handleImageChange}
            previewUrl={imagePreview}
            existingImage={
              editingId ? ads.find((a) => a.id === editingId)?.image : undefined
            }
          />
          {formErrors.image && (
            <p className="text-sm text-red-500 -mt-2">{formErrors.image}</p>
          )}
        </FormModal>
      </div>
      <Toast toast={toast} onHide={hideToast} />
    </div>
  );
}
