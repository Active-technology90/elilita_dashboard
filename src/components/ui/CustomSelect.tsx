import React, { useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";

export interface SelectOption {
  label: string;
  value: string;
  icon?: React.ReactNode;
}

interface CustomSelectProps {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  placeholder?: string;
  className?: string;
  maxHeight?: number; // ✅ NEW
  ariaLabel?: string;
}

export const CustomSelect: React.FC<CustomSelectProps> = ({
  value,
  onChange,
  options,
  placeholder = "Select...",
  className = "",
  maxHeight = 260,
  ariaLabel,
}) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value);
    // Log when selected changes (for debugging)
  useEffect(() => {
    if (selected) {
      console.log('CustomSelect - Displaying:', selected.label);
    }
  }, [selected, value]);

  // ✅ close on outside click (optimized)
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // optional: ESC close (PRO UX)
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };

    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <div ref={ref} className={`relative w-full ${className}`}>
      
      {/* TRIGGER */}
      <button
        key={value}
        type="button"
        aria-label={ariaLabel}
        onClick={() => setOpen((p) => !p)}
        className="
          w-full flex items-center justify-between
          px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl
          border border-secondary

          bg-gray-50
          hover:bg-white hover:border-secondary hover:shadow-sm
          focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:border-secondary
          transition-all duration-200
          active:scale-[0.99]
        "
      >
        <div className="flex items-center gap-2 text-sm text-secondary truncate">
          {selected?.icon}
          <span key={value} className="truncate">
            {(() => {
              const displayText = selected?.label || placeholder;
              console.log("🔵 CustomSelect rendering - value:", value, "displayText:", displayText);
              return displayText;
            })()}
          </span>
        </div>

        <ChevronDown
          className={`h-3 w-3 text-secondary transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute z-50 mt-1 w-full
            bg-white
            border border-secondary
            rounded-xl
            shadow-xl
            overflow-hidden
            origin-top
            animate-in slide-in-from-top-2 fade-in duration-200
          "
        >
          {/* SCROLL CONTAINER (LIMIT HEIGHT) */}
          <div
            className="overflow-y-auto py-1"
            style={{ maxHeight }}
          >
            {options.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">
                No options found
              </div>
            ) : (
              options.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    onChange(opt.value);
                    setOpen(false);
                  }}
                  className={`
                    w-full flex items-center gap-2
                    px-3 py-1.5 text-sm
                    transition-all duration-150
                    hover:bg-secondary/10 hover:pl-4
                    text-left
                    ${
                      value === opt.value
                        ? "bg-secondary/10 text-secondary font-semibold"
                        : "text-secondary"
                    }
                  `}
                >
                  {opt.icon}
                  <span className="truncate">{opt.label}</span>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
};