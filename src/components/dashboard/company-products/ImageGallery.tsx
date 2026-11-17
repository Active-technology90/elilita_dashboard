import { useState, useCallback, useRef, useEffect } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  rectSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  Upload,
  Trash2,
  Star,
  Loader2,
  GripVertical,
  Download,
  AlertCircle,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ProductImage } from "../../../types";
import {
  uploadProductImage,
  deleteProductImage,
  updateProductImage,
} from "../../../services/api";

interface ImageGalleryProps {
  images: ProductImage[];
  productId: number;
  companySlug: string;
  onImagesChange: () => void;
  onError?: (message: string) => void;
  readOnly?: boolean;
  onShowToast?: (type: "success" | "error", message: string) => void;
}

function SortableImageItem({
  image,
  isUpdating,
  onSetPrimary,
  onDelete,
  isDeleting,
}: {
  image: ProductImage;
  isUpdating: boolean;
  onSetPrimary: (id: number) => void;
  onDelete: (id: number) => void;
  isDeleting: boolean;
}) {
  const { t } = useTranslation("product");
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group border rounded-xl overflow-hidden bg-gray-50 shadow-sm hover:shadow-lg transition-all duration-300 ${
        image.is_primary ? "ring-2 ring-yellow-400 ring-offset-2" : ""
      }`}
    >
      <div className="aspect-square w-full overflow-hidden">
        <img
          src={image.image}
          alt="Product"
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        />
      </div>

      {/*
        FIX — primary / delete / drag buttons were invisible on touch devices
        because the overlay relied on `group-hover`. On phones there is no
        hover state, so the controls never appeared and users couldn't
        change the primary image.

        Mobile (< sm): overlay always visible so the buttons are tappable.
        Desktop (≥ sm): preserved hover-to-reveal behaviour.
      */}
      <div className="absolute inset-0 bg-black/40 sm:bg-black/50 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-all duration-200 flex flex-col justify-between p-2">
        <div className="flex justify-end">
          <div
            {...attributes}
            {...listeners}
            className="p-1.5 bg-gray-800 text-white rounded-lg cursor-grab active:cursor-grabbing hover:bg-gray-700 transition-colors touch-none"
            title={t("imageGallery.dragToReorder")}
            aria-label={t("imageGallery.dragToReorder")}
          >
            <GripVertical className="h-4 w-4" />
          </div>
        </div>

        <div className="flex items-center justify-between gap-1">
          {!image.is_primary && (
            <button
              type="button"
              onClick={() => onSetPrimary(image.id)}
              disabled={isUpdating}
              className="p-1.5 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 transition-colors disabled:opacity-50"
              title={t("imageGallery.setPrimary")}
              aria-label={t("imageGallery.setPrimary")}
            >
              {isUpdating ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Star className="h-3.5 w-3.5" />
              )}
            </button>
          )}
          {image.is_primary && (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded-lg text-[10px] font-semibold">
              <Star className="h-3 w-3 fill-white" />
              {t("imageGallery.primary")}
            </span>
          )}

          <button
            type="button"
            onClick={() => onDelete(image.id)}
            disabled={isDeleting}
            className="p-1.5 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors disabled:opacity-50"
            title={t("imageGallery.delete")}
            aria-label={t("imageGallery.delete")}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

export function ImageGallery({
  images,
  productId,
  companySlug,
  onImagesChange,
  onError,
  readOnly = false,
  onShowToast,
}: ImageGalleryProps) {
  const { t } = useTranslation("product");
  const [uploading, setUploading] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [updatingId, setUpdatingId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const showError = useCallback(
    (message: string) => {
      setUploadError(message);
      if (onError) onError(message);
      if (onShowToast) onShowToast("error", message);
    },
    [onError, onShowToast],
  );

  const handleUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (let i = 0; i < files.length; i++) {
        const formData = new FormData();
        formData.append("image", files[i]);
        await uploadProductImage(companySlug, productId, formData);
      }
      onImagesChange();
    } catch (err) {
      showError(t("imageGallery.errors.uploadFailed"));
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleDelete = async (imageId: number) => {
    setDeletingId(imageId);
    try {
      await deleteProductImage(companySlug, productId, imageId);
      onImagesChange();
    } catch (err) {
      showError(t("imageGallery.errors.deleteFailed"));
    } finally {
      setDeletingId(null);
    }
  };

  const handleSetPrimary = async (imageId: number) => {
    setUpdatingId(imageId);
    try {
      await updateProductImage(companySlug, productId, imageId, {
        is_primary: true,
      });
      onImagesChange();
    } catch (err) {
      showError(t("imageGallery.errors.updateFailed"));
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = images.findIndex((img) => img.id === active.id);
    const newIndex = images.findIndex((img) => img.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(images, oldIndex, newIndex);

    // Persist new order (kept minimal; adjust to your API as needed)
    try {
      await Promise.all(
        reordered.map((img, idx) =>
          updateProductImage(companySlug, productId, img.id, {
            order: idx,
          }),
        ),
      );
      onImagesChange();
    } catch (err) {
      showError(t("imageGallery.errors.updateFailed"));
    }
  };

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleUpload(e.target.files)}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-secondary text-white text-sm font-semibold hover:bg-secondary/90 transition disabled:opacity-50 shadow-sm"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {uploading ? t("imageGallery.loading") : t("imageGallery.upload")}
          </button>
        </div>
      )}

      {uploadError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-xs sm:text-sm text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
          <p>{uploadError}</p>
        </div>
      )}

      {images.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-10 text-center border-2 border-dashed border-gray-200 rounded-xl bg-gray-50/50">
          <Download className="h-8 w-8 text-gray-300 mb-2" />
          <p className="text-sm text-gray-500">{t("common.states.noData")}</p>
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((img) => img.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {images.map((image) => (
                <SortableImageItem
                  key={image.id}
                  image={image}
                  isUpdating={updatingId === image.id}
                  onSetPrimary={handleSetPrimary}
                  onDelete={handleDelete}
                  isDeleting={deletingId === image.id}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}