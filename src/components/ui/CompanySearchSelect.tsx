import { useEffect, useMemo, useRef, useState } from "react";
import { Building2, Check, ChevronDown, Search, X } from "lucide-react";

/* ──────────────────────────────────────────────────────────────────
   Types
   ────────────────────────────────────────────────────────────────── */

interface Company {
  id: number;
  name: string;
  slug: string;
}

interface CompanySearchSelectProps {
  companies: Company[];
  value: number | "";
  onChange: (companyId: number | "") => void;
  placeholder?: string;
  emptyMessage?: string;
  className?: string;
  /** Max height of the dropdown (px). Default 260. */
  maxHeight?: number;
  disabled?: boolean;
}

/* ──────────────────────────────────────────────────────────────────
   Component
   ────────────────────────────────────────────────────────────────── */

export default function CompanySearchSelect({
  companies,
  value,
  onChange,
  placeholder = "Select a company",
  emptyMessage = "No companies match your search",
  className = "",
  maxHeight = 260,
  disabled = false,
}: CompanySearchSelectProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const wrapperRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);

  /* ── Selected company ─────────────────────────────────────────── */
  const selected = useMemo(
    () => companies.find((c) => c.id === value) || null,
    [companies, value],
  );

  /* ── Filter by name OR slug ───────────────────────────────────── */
  const filtered = useMemo(() => {
    if (!query.trim()) return companies;
    const q = query.trim().toLowerCase();
    return companies.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.slug.toLowerCase().includes(q),
    );
  }, [companies, query]);

  /* ── Close on outside click ───────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handleClick = (e: MouseEvent) => {
      if (
        wrapperRef.current &&
        !wrapperRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  /* ── Close on Escape ──────────────────────────────────────────── */
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open]);

  /* ── Autofocus search on open, clear query on close ───────────── */
  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => searchRef.current?.focus());
    } else {
      setQuery("");
    }
  }, [open]);

  const handleSelect = (companyId: number) => {
    onChange(companyId);
    setOpen(false);
  };

  return (
    <div ref={wrapperRef} className={`relative w-full ${className}`}>
      {/* TRIGGER */}
      <button
        type="button"
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        className={`
          w-full flex items-center justify-between
          px-2 py-1 sm:px-4 sm:py-2 rounded-lg sm:rounded-xl
          border border-secondary

          bg-gray-50
          hover:bg-white hover:shadow-sm
          focus:outline-none focus:ring-2 focus:ring-secondary/30
          transition-all duration-200
          active:scale-[0.99]
          ${disabled ? "cursor-not-allowed opacity-60" : ""}
        `}
      >
        <div className="flex min-w-0 items-center gap-2 text-sm text-secondary">
          <Building2 className="h-4 w-4 shrink-0 text-violet-500" />
          <span className={`truncate ${selected ? "" : "text-gray-400"}`}>
            {selected ? selected.name : placeholder}
          </span>
        </div>

        <ChevronDown
          className={`h-3 w-3 shrink-0 text-secondary transition-transform duration-200 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute left-0 right-0 top-full z-[130] mt-1
            overflow-hidden rounded-xl border border-secondary
            bg-white shadow-xl
            origin-top
            animate-in slide-in-from-top-2 fade-in duration-200
          "
        >
          {/* SEARCH FIELD */}
          <div className="border-b border-secondary/15 p-2">
            <div className="relative">
              <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-secondary/60" />
              <input
                ref={searchRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search companies..."
                className="
                  h-8 w-full rounded-lg border border-secondary/25
                  bg-white pl-8 pr-7 text-xs text-secondary
                  outline-none transition
                  focus:border-secondary focus:ring-2 focus:ring-secondary/20
                "
              />
              {query && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setQuery("");
                    searchRef.current?.focus();
                  }}
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-secondary/60 hover:bg-secondary/10 hover:text-secondary"
                  aria-label="Clear search"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* OPTIONS */}
          <div
            className="overflow-y-auto py-1"
            style={{ maxHeight: Math.max(80, maxHeight - 52) }}
          >
            {filtered.length === 0 ? (
              <div className="px-4 py-3 text-sm text-gray-400">
                {emptyMessage}
              </div>
            ) : (
              filtered.map((c) => {
                const isSelected = c.id === value;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleSelect(c.id)}
                    className={`
                      w-full flex items-center justify-between gap-2
                      px-3 py-1.5 text-sm text-left
                      transition-all duration-150
                      hover:bg-secondary/10 hover:pl-4
                      ${
                        isSelected
                          ? "bg-secondary/10 text-secondary font-semibold"
                          : "text-secondary"
                      }
                    `}
                  >
                    <span className="flex min-w-0 items-center gap-2">
                      <Building2 className="h-4 w-4 shrink-0 text-violet-500" />
                      <span className="min-w-0 flex flex-col">
                        <span className="truncate">{c.name}</span>
                        <span className="truncate font-mono text-[10px] text-gray-400">
                          {c.slug}
                        </span>
                      </span>
                    </span>
                    {isSelected && (
                      <Check className="h-4 w-4 shrink-0 text-secondary" />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}