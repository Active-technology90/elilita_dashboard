// src/components/ui/DragDropImageUpload.tsx

import React, { useCallback, useEffect, useRef, useState } from "react";

import {
  UploadCloud,
  X,

  FileImage,
  Loader2,
} from "lucide-react";
import toast from "react-hot-toast";

interface DragDropImageUploadProps {
  value?: File | null;
  onChange: (file: File | null) => void;
  previewUrl?: string | null;
  label?: string;
  required?: boolean;
  accept?: string;
  maxSizeMB?: number;
  disabled?: boolean;
  helperText?: string;
  error?: string;
  className?: string;
  rounded?: "lg" | "xl" | "2xl";
  size?: "sm" | "md" | "lg";
}

const roundedClasses = {
  lg: "rounded-2xl",
  xl: "rounded-3xl",
  "2xl": "rounded-[32px]",
};


export const DragDropImageUpload: React.FC<DragDropImageUploadProps> = ({
  value,
  onChange,
  previewUrl: externalPreview,
  label = "Upload Image",
  required = false,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  maxSizeMB = 5,
  disabled = false,
  helperText,
  error,
  className = "",
  rounded = "xl",
  size = "md",
}) => {
  const inputRef = useRef<HTMLInputElement>(null);

  const [dragActive, setDragActive] = useState(false);
  const [preview, setPreview] = useState<string | null>(
    externalPreview ?? null,
  );

  const [isDraggingFile, setIsDraggingFile] = useState(false);
  const sizeConfig = {
  sm: {
    drop: "min-h-[140px]",
    icon: "h-12 w-12",
    iconSize: 22,
    padding: "px-4 py-6",
  },
  md: {
    drop: "min-h-[220px]",
    icon: "h-16 w-16",
    iconSize: 28,
    padding: "px-6 py-8",
  },
  lg: {
    drop: "min-h-[180px]",
    icon: "h-20 w-20",
    iconSize: 34,
    padding: "px-6 py-10",
  },
};

  useEffect(() => {
    if (externalPreview) {
      setPreview(externalPreview);
    }
  }, [externalPreview]);

  useEffect(() => {
    if (!value) return;

    const objectUrl = URL.createObjectURL(value);

    setPreview(objectUrl);

    return () => {
      URL.revokeObjectURL(objectUrl);
    };
  }, [value]);

  const validateFile = (file: File) => {
    const acceptedTypes = accept.split(",");

    const validType = acceptedTypes.some((type) => {
      const trimmed = type.trim();

      if (trimmed.endsWith("/*")) {
        const baseType = trimmed.split("/")[0];
        return file.type.startsWith(baseType + "/");
      }

      return file.type === trimmed;
    });

    if (!validType) {
      return `Invalid file type`;
    }

    if (file.size > maxSizeMB * 1024 * 1024) {
      return `File must be smaller than ${maxSizeMB}MB`;
    }

    return null;
  };

  const handleFile = (file: File | null) => {
    if (!file) {
      setPreview(null);
      onChange(null);
      return;
    }

    const validationError = validateFile(file);

    if (validationError) {
      // alert(validationError);
      toast.error(validationError);
      return;
    }

    onChange(file);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      e.stopPropagation();

      setDragActive(false);
      setIsDraggingFile(false);

      if (disabled) return;

      const file = e.dataTransfer.files?.[0];

      if (file) {
        handleFile(file);
      }
    },
    [disabled],
  );

  const clearImage = (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.stopPropagation();

    setPreview(null);
    onChange(null);

    if (inputRef.current) {
      inputRef.current.value = "";
    }
  };

  const acceptedFormats = accept
    .split(",")
    .map((item) => item.split("/")[1]?.toUpperCase())
    .join(", ");

  return (
    <div className={`w-full ${className}`}>
      {/* LABEL */}
      {label && (
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-semibold text-gray-800">
            {label}

            {required && <span className="ml-1 text-red-500">*</span>}
          </label>

          {helperText && (
            <span className="text-xs text-gray-400">{helperText}</span>
          )}
        </div>
      )}

      {/* DROPZONE */}
      <div
        onClick={() => !disabled && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();

          if (disabled) return;

          setDragActive(true);
          setIsDraggingFile(true);
        }}
        onDragLeave={(e) => {
          e.preventDefault();

          setDragActive(false);
          setIsDraggingFile(false);
        }}
        onDrop={handleDrop}
        className={`
          relative overflow-hidden
          transition-all duration-300
          border-2 border-dashed
          ${roundedClasses[rounded]}
          
          ${
            disabled
              ? "bg-gray-100 border-gray-200 cursor-not-allowed opacity-70"
              : dragActive
                ? "border-secondary bg-secondary/5 scale-[1.01] shadow-lg shadow-secondary/10"
                : error
                  ? "border-red-300 bg-red-50/40 hover:border-red-400"
                  : "border-gray-300 bg-gradient-to-b from-gray-50 to-white hover:border-secondary/50 hover:bg-secondary/[0.03]"
          }

        ${sizeConfig[size].drop}

          flex flex-col items-center justify-center
          cursor-pointer
          group
        `}
      >
        {/* INPUT */}
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          disabled={disabled}
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0] || null)}
        />

        {/* PREVIEW */}
        {preview ? (
          <>
            <div className="absolute inset-0">
              <img
                src={preview}
                alt="Preview"
                className="w-full h-full object-contain"
              />

              <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </div>

            {/* TOP ACTIONS */}
            <div className="absolute top-4 right-4 z-20 flex gap-2">
              <button
                type="button"
                onClick={(e) => clearImage(e)}
                className="
                  h-10 w-10 rounded-full
                  bg-red-500/95 hover:bg-red-600
                  backdrop-blur-md
                  text-white
                  flex items-center justify-center
                  shadow-lg
                  transition-all duration-200
                "
              >
                <X size={18} />
              </button>
            </div>

            {/* OVERLAY CONTENT */}
            <div className="absolute bottom-0 inset-x-0 z-10">
              <div className="bg-gradient-to-t from-black/80 via-black/40 to-transparent p-5">
                <div className="flex items-center gap-3">
                  <div className="h-11 w-11 rounded-2xl bg-white/15 backdrop-blur-xl flex items-center justify-center">
                    <FileImage size={22} className="text-white" />
                  </div>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">
                      {value?.name || "Uploaded image"}
                    </p>

                    <p className="text-xs text-white/70">
                      Click to replace image
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className={`relative z-10 flex flex-col items-center justify-center ${sizeConfig[size].padding} text-center`}>
            {/* ICON */}
            <div
              className={`
                ${sizeConfig[size].icon} rounded-[28px]
                flex items-center justify-center
                mb-5
                transition-all duration-300
                ${
                  dragActive
                    ? "bg-secondary text-white scale-110"
                    : "bg-secondary/10 text-secondary"
                }
              `}
            >
              {isDraggingFile ? (
                <Loader2 size={34} className="animate-spin" />
              ) : (
                <UploadCloud size={34} />
              )}
            </div>

            {/* TEXT */}
            <div className="space-y-2">
              <h4 className="text-lg font-bold text-gray-900">
                {dragActive ? "Drop image here" : "Upload your image"}
              </h4>

              <p className="text-sm text-gray-500 max-w-xs leading-relaxed">
                Drag and drop your image here or click to browse from your
                computer
              </p>
            </div>

            {/* FORMATS */}
            <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
              <div className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                {acceptedFormats}
              </div>

              <div className="px-3 py-1.5 rounded-full bg-gray-100 text-xs font-medium text-gray-600">
                Max {maxSizeMB}MB
              </div>
            </div>

            {/* BUTTON */}
            <button
              type="button"
              className="
                mt-6 h-11 px-5 rounded-2xl
                bg-secondary
                hover:bg-[#5B4294]
                text-white font-semibold text-sm
                transition-all duration-200
                shadow-lg shadow-secondary/20
              "
            >
              Choose File
            </button>
          </div>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div className="mt-2 flex items-center gap-2 text-sm text-red-600">
          <div className="h-2 w-2 rounded-full bg-red-500" />
          {error}
        </div>
      )}

      {/* FOOTER */}
      {/* {!error && (
        <div className="mt-3 flex items-center gap-2 text-xs text-gray-400">
          <ImageIcon size={14} />
          Recommended resolution: 1200×800px
        </div>
      )} */}
    </div>
  );
};
