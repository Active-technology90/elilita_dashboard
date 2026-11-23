
import { useState, useCallback, useEffect, memo, useRef, useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  GripVertical,
  AlignLeft,
  AlignJustify,
  ChevronDown,
  Hash,
  Calendar,
  CheckSquare,
  Copy,
  Trash2,
  Plus,
  ClipboardList,
  ChevronUp,
  Mail,
  Phone,
  Clock,
  CalendarClock,
  List,
  CircleDot,
  Upload,
  Eye,
  X,
  Layers,
  FolderPlus,
} from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  KeyboardSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { AnimatePresence, motion } from "framer-motion";
import { createPortal } from "react-dom";
import type { IntakeFormField } from "../../../types";

/* -------------------------------------------------------------------------- */
/*  Extended types to support field-specific configuration                   */
/* -------------------------------------------------------------------------- */

interface ExtendedIntakeFormField extends IntakeFormField {
  rows?: number;
  min?: number;
  max?: number;
  step?: number;
  min_date?: string;
  max_date?: string;
  accept?: string;
  max_size?: number;
  max_files?: number;
  description?: string;
}

type FieldWithId = ExtendedIntakeFormField & { _id: string };

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const FIELD_ICONS: Record<IntakeFormField["type"], React.ReactNode> = {
  text: <AlignLeft className="h-3.5 w-3.5" />,
  textarea: <AlignJustify className="h-3.5 w-3.5" />,
  email: <Mail className="h-3.5 w-3.5" />,
  phone: <Phone className="h-3.5 w-3.5" />,
  number: <Hash className="h-3.5 w-3.5" />,
  date: <Calendar className="h-3.5 w-3.5" />,
  time: <Clock className="h-3.5 w-3.5" />,
  datetime: <CalendarClock className="h-3.5 w-3.5" />,
  select: <ChevronDown className="h-3.5 w-3.5" />,
  multiselect: <List className="h-3.5 w-3.5" />,
  radio: <CircleDot className="h-3.5 w-3.5" />,
  checkbox: <CheckSquare className="h-3.5 w-3.5" />,
  file: <Upload className="h-3.5 w-3.5" />,
  url: <AlignLeft className="h-3.5 w-3.5" />,
};

const FIELD_TYPE_KEYS: Record<IntakeFormField["type"], string> = {
  text: "fieldTypes.text",
  textarea: "fieldTypes.textarea",
  email: "fieldTypes.email",
  phone: "fieldTypes.phone",
  number: "fieldTypes.number",
  date: "fieldTypes.date",
  time: "fieldTypes.time",
  datetime: "fieldTypes.datetime",
  select: "fieldTypes.select",
  multiselect: "fieldTypes.multiselect",
  radio: "fieldTypes.radio",
  checkbox: "fieldTypes.checkbox",
  file: "fieldTypes.file",
  url: "fieldTypes.url",
};

const FIELD_TYPES: IntakeFormField["type"][] = [
  "text",
  "textarea",
  "email",
  "phone",
  "number",
  "date",
  "time",
  "datetime",
  "select",
  "multiselect",
  "radio",
  "checkbox",
  "file",
  "url",
];

function generateId() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

function generateFieldName(
  label: string,
  existingNames: Set<string>,
  currentName?: string,
): string {
  let base = label
    .trim()
    .toLowerCase()
    .replace(/['’]/g, "_")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .replace(/_+/g, "_");

  if (!base || /^\d/.test(base)) {
    base = "field";
  }

  // If the current name already matches the base or starts with base_, keep it if unique
  if (currentName && (currentName === base || currentName.startsWith(`${base}_`))) {
    if (!existingNames.has(currentName)) {
      return currentName;
    }
  }

  let candidate = base;
  let counter = 1;

  while (existingNames.has(candidate)) {
    candidate = `${base}_${counter}`;
    counter++;
  }

  return candidate;
}

/* -------------------------------------------------------------------------- */
/*  IME-Safe Form Input (prevents Amharic/phonetic character duplication)     */
/* -------------------------------------------------------------------------- */

interface FormInputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "onChange" | "value"> {
  value?: string;
  onChange: (value: string) => void;
}

const FormInput = memo(function FormInput({
  value = "",
  onChange,
  className = "",
  ...props
}: FormInputProps) {
  const [localValue, setLocalValue] = useState(value);
  const isComposingRef = useRef(false);

  useEffect(() => {
    if (!isComposingRef.current) {
      setLocalValue(value || "");
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextVal = e.target.value;
    setLocalValue(nextVal);
    if (!isComposingRef.current) {
      onChange(nextVal);
    }
  };

  const handleCompositionStart = () => {
    isComposingRef.current = true;
  };

  const handleCompositionEnd = (e: React.CompositionEvent<HTMLInputElement>) => {
    isComposingRef.current = false;
    const finalVal = (e.target as HTMLInputElement).value;
    setLocalValue(finalVal);
    onChange(finalVal);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    if (localValue !== value) {
      onChange(localValue);
    }
    props.onBlur?.(e);
  };

  return (
    <input
      {...props}
      value={localValue}
      onChange={handleChange}
      onCompositionStart={handleCompositionStart}
      onCompositionEnd={handleCompositionEnd}
      onBlur={handleBlur}
      className={className}
    />
  );
});

/* -------------------------------------------------------------------------- */
/*  Options Editor                                                            */
/* -------------------------------------------------------------------------- */

function OptionsEditor({
  options,
  onChange,
}: {
  options?: string[];
  onChange: (options: string[]) => void;
}) {
  const { t } = useTranslation("intakeForm");

  const safeOptions = options ?? [];
  const [newOption, setNewOption] = useState("");

  const addOption = () => {
    const trimmed = newOption.trim();

    if (!trimmed || safeOptions.includes(trimmed)) return;

    onChange([...safeOptions, trimmed]);
    setNewOption("");
  };

  const removeOption = (index: number) => {
    onChange(safeOptions.filter((_, i) => i !== index));
  };

  const updateOption = (index: number, value: string) => {
    const updated = [...safeOptions];
    updated[index] = value;
    onChange(updated);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs font-medium text-gray-600">
        {t("intakeForm.options")}
      </label>

      <ul className="space-y-1">
        {safeOptions.map((opt, idx) => (
          <li key={idx} className="flex items-center gap-1">
            <FormInput
              type="text"
              value={opt}
              onChange={(val) => updateOption(idx, val)}
              className="flex-1 h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
            />

            <button
              type="button"
              onClick={() => removeOption(idx)}
              className="p-1 text-gray-400 hover:text-red-500"
              aria-label={t("intakeForm.removeOption")}
            >
              <X className="h-4 w-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className="flex gap-2">
        <FormInput
          type="text"
          value={newOption}
          onChange={(val) => setNewOption(val)}
          onKeyDown={(e) =>
            e.key === "Enter" && (e.preventDefault(), addOption())
          }
          placeholder={t("intakeForm.newOption")}
          className="flex-1 h-10 rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm focus:border-secondary focus:ring-2 focus:ring-secondary/20 outline-none"
        />

        <button
          type="button"
          onClick={addOption}
          className="px-3 py-1 rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm"
        >
          {t("intakeForm.add")}
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field Type Select (portal-based)                                          */
/* -------------------------------------------------------------------------- */

function FieldTypeSelect({
  value,
  onChange,
}: {
  value: IntakeFormField["type"];
  onChange: (type: IntakeFormField["type"]) => void;
}) {
  const { t } = useTranslation("intakeForm");

  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [dropdownStyle, setDropdownStyle] =
    useState<React.CSSProperties>({});

  const updatePosition = () => {
    if (triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();

      setDropdownStyle({
        position: "fixed",
        left: rect.left,
        top: rect.bottom + 4,
        width: rect.width,
        zIndex: 99999,
      });
    }
  };

  useEffect(() => {
    if (open) {
      updatePosition();

      window.addEventListener("scroll", updatePosition, true);
      window.addEventListener("resize", updatePosition);
    }

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;

    const handleClick = (e: MouseEvent) => {
      if (
        triggerRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) {
        return;
      }

      setOpen(false);
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 h-10 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700 hover:bg-white transition w-full focus:outline-none focus:ring-2 focus:ring-secondary/20"
      >
        <span className="text-gray-500">{FIELD_ICONS[value]}</span>

        <span className="flex-1 text-left">
          {t(`intakeForm.${FIELD_TYPE_KEYS[value]}`)}
        </span>

        <ChevronDown className="h-3.5 w-3.5 text-gray-400" />
      </button>

      {open &&
        createPortal(
          <div
            ref={dropdownRef}
            style={dropdownStyle}
            className="bg-white border border-gray-200 rounded-xl shadow-xl py-1 overflow-y-auto max-h-56"
          >
            {FIELD_TYPES.map((type) => (
              <button
                key={type}
                type="button"
                onClick={() => {
                  onChange(type);
                  setOpen(false);
                }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-sm hover:bg-gray-50 ${
                  value === type
                    ? "bg-secondary/5 text-secondary"
                    : "text-gray-700"
                }`}
              >
                <span className="text-gray-500">
                  {FIELD_ICONS[type]}
                </span>

                {t(`intakeForm.${FIELD_TYPE_KEYS[type]}`)}
              </button>
            ))}
          </div>,
          document.body,
        )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Delete Popover                                                            */
/* -------------------------------------------------------------------------- */

function DeletePopover({
  onDelete,
  fieldLabel,
}: {
  onDelete: () => void;
  fieldLabel: string;
}) {
  const { t } = useTranslation("intakeForm");

  const [show, setShow] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const cancelRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (show) cancelRef.current?.focus();
  }, [show]);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setShow(false);
      }
    };

    document.addEventListener("mousedown", handleClick);

    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setShow(true)}
        title={t("intakeForm.deleteField")}
        className="p-1 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
      >
        <Trash2 className="h-4 w-4" />
      </button>

      {show && (
        <div
          className="absolute right-0 top-full mt-1 bg-white border border-gray-200 rounded-xl shadow-xl p-3 z-30 w-56"
          role="dialog"
          aria-label={t("intakeForm.deleteField")}
        >
          <p className="text-sm text-gray-700 mb-2">
            {t("intakeForm.deleteConfirmation", { label: fieldLabel })}
            <br />
            {t("intakeForm.deleteWarning")}
          </p>

          <div className="flex gap-2 justify-end">
            <button
              ref={cancelRef}
              type="button"
              onClick={() => setShow(false)}
              className="px-3 py-1 text-xs rounded-lg border border-gray-200 text-gray-600 hover:bg-gray-50"
            >
              {t("intakeForm.cancel")}
            </button>

            <button
              type="button"
              onClick={() => {
                onDelete();
                setShow(false);
              }}
              className="px-3 py-1 text-xs rounded-lg bg-red-600 text-white hover:bg-red-700"
            >
              {t("intakeForm.delete")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Field Card                                                                */
/* -------------------------------------------------------------------------- */

const FieldCard = memo(function FieldCard({
  field,
  updateField,
  removeField,
  duplicateField,
  existingGroups = [],
}: {
  field: FieldWithId;
  updateField: (patch: Partial<ExtendedIntakeFormField>) => void;
  removeField: () => void;
  duplicateField: () => void;
  existingGroups?: { name: string; name_am?: string }[];
}) {
  const { t } = useTranslation("intakeForm");

  const [collapsed, setCollapsed] = useState(false);

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: field._id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const hasOptions = ["select", "multiselect", "radio"].includes(field.type);

  return (
    <motion.li
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      ref={setNodeRef}
      style={style}
      className={`rounded-xl border bg-white shadow-sm transition ${
        isDragging
          ? "border-secondary shadow-lg ring-2 ring-secondary/10 z-50"
          : "border-gray-200 hover:shadow-md"
      }`}
    >
      <div className="flex items-center px-4 py-3 gap-2">
        <button
          type="button"
          className="cursor-grab touch-none text-gray-400 hover:text-gray-600 active:cursor-grabbing shrink-0"
          {...attributes}
          {...listeners}
          aria-label={t("intakeForm.dragToReorder")}
        >
          <GripVertical className="h-4 w-4" />
        </button>

        <span className="text-gray-500 shrink-0">
          {FIELD_ICONS[field.type]}
        </span>

        <span className="text-sm font-medium text-gray-900 truncate flex-1 min-w-0">
          {field.label || t("intakeForm.untitled")}
        </span>

        <span className="inline-flex items-center px-1.5 py-0.5 rounded-md bg-gray-100 text-xs text-gray-600 shrink-0">
          {t(`intakeForm.${FIELD_TYPE_KEYS[field.type]}`)}
        </span>

        {field.required && (
          <span
            className="w-1.5 h-1.5 rounded-full bg-secondary shrink-0"
            title={t("intakeForm.required")}
          />
        )}

        <button
          type="button"
          onClick={duplicateField}
          title={t("intakeForm.duplicate")}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
        >
          <Copy className="h-3.5 w-3.5" />
        </button>

        <DeletePopover
          onDelete={removeField}
          fieldLabel={field.label || t("intakeForm.untitled")}
        />

        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="p-1 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition shrink-0"
          aria-label={
            collapsed
              ? t("intakeForm.expandField")
              : t("intakeForm.collapseField")
          }
        >
          {collapsed ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronUp className="h-4 w-4" />
          )}
        </button>
      </div>

      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="overflow-hidden"
          >
            <div className="px-4 pb-4 space-y-3 border-t border-gray-100 pt-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("intakeForm.label")}{" "}
                    <span className="text-red-500">*</span>
                  </label>

                  <FormInput
                    type="text"
                    value={field.label}
                    onChange={(val) => updateField({ label: val })}
                    placeholder={t("intakeForm.customerNameExample")}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("intakeForm.labelAm")}
                  </label>

                  <FormInput
                    type="text"
                    value={field.label_am || ""}
                    onChange={(val) => updateField({ label_am: val })}
                    placeholder={t("intakeForm.labelAmExample")}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 outline-none"
                  />
                </div>
              </div>

              <div
                className={`grid grid-cols-1 ${
                  existingGroups.length > 0 ? "sm:grid-cols-3" : "sm:grid-cols-2"
                } gap-3 items-end`}
              >
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("intakeForm.fieldType")}
                  </label>

                  <FieldTypeSelect
                    value={field.type}
                    onChange={(type) => updateField({ type })}
                  />
                </div>

                {existingGroups.length > 0 && (
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      {t("intakeForm.group")}
                    </label>

                    <select
                      value={field.group || ""}
                      onChange={(e) => {
                        const val = e.target.value;
                        const match = existingGroups.find((g) => g.name === val);
                        updateField({
                          group: val || undefined,
                          group_am: match?.name_am || undefined,
                        });
                      }}
                      className="h-10 w-full text-sm rounded-lg border border-gray-200 bg-gray-50 px-3 text-gray-700 outline-none focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 cursor-pointer"
                    >
                      <option value="">{t("intakeForm.noGroup")}</option>
                      {existingGroups.map((g) => (
                        <option key={g.name} value={g.name}>
                          {g.name} {g.name_am ? `(${g.name_am})` : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="flex items-center pb-2.5">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={field.required}
                      onChange={(e) =>
                        updateField({ required: e.target.checked })
                      }
                      className="h-4 w-4 rounded border-gray-300 text-secondary focus:ring-secondary cursor-pointer"
                    />

                    <span className="text-xs font-medium text-gray-700">
                      {t("intakeForm.required")}
                    </span>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("intakeForm.placeholder")}
                  </label>

                  <FormInput
                    type="text"
                    value={field.placeholder || ""}
                    onChange={(val) => updateField({ placeholder: val })}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {t("intakeForm.placeholderAm")}
                  </label>

                  <FormInput
                    type="text"
                    value={field.placeholder_am || ""}
                    onChange={(val) => updateField({ placeholder_am: val })}
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-600 mb-1">
                  {t("intakeForm.description")}
                </label>

                <FormInput
                  type="text"
                  value={field.description || ""}
                  onChange={(val) => updateField({ description: val })}
                  placeholder={t("intakeForm.descriptionPlaceholder")}
                  className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm placeholder:text-gray-400 focus:border-secondary focus:bg-white focus:ring-2 focus:ring-secondary/20 outline-none"
                />
              </div>

              {/* Type-specific configurations */}

              {field.type === "number" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      {t("intakeForm.min")}
                    </label>
                    <input
                      type="number"
                      value={field.min ?? ""}
                      onChange={(e) =>
                        updateField({
                          min: e.target.value !== "" ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g. 0"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      {t("intakeForm.max")}
                    </label>
                    <input
                      type="number"
                      value={field.max ?? ""}
                      onChange={(e) =>
                        updateField({
                          max: e.target.value !== "" ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g. 100"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      {t("intakeForm.step")}
                    </label>
                    <input
                      type="number"
                      value={field.step ?? ""}
                      onChange={(e) =>
                        updateField({
                          step: e.target.value !== "" ? Number(e.target.value) : undefined,
                        })
                      }
                      placeholder="e.g. 1"
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                    />
                  </div>
                </div>
              )}

              {field.type === "textarea" && (
                <div className="w-full sm:w-1/3">
                  <label className="text-xs font-medium text-gray-600">
                    {t("intakeForm.rows")}
                  </label>
                  <input
                    type="number"
                    min={2}
                    max={10}
                    value={field.rows ?? 3}
                    onChange={(e) =>
                      updateField({
                        rows: e.target.value !== "" ? Number(e.target.value) : 3,
                      })
                    }
                    className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                  />
                </div>
              )}

              {field.type === "file" && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      {t("intakeForm.acceptedTypes")}
                    </label>

                    <FormInput
                      type="text"
                      value={field.accept ?? ""}
                      onChange={(val) =>
                        updateField({ accept: val })
                      }
                      placeholder={t("intakeForm.acceptedTypesExample")}
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                    />
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      <button
                        type="button"
                        onClick={() =>
                          updateField({ accept: ".pdf,.jpg,.jpeg,.png" })
                        }
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-secondary transition"
                      >
                        PDF & Images
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateField({ accept: ".pdf,.doc,.docx" })
                        }
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-secondary transition"
                      >
                        Documents
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          updateField({ accept: ".jpg,.jpeg,.png,.webp" })
                        }
                        className="text-[10px] px-1.5 py-0.5 rounded bg-gray-100 hover:bg-purple-100 text-gray-700 hover:text-secondary transition"
                      >
                        Images Only
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      {t("intakeForm.maxSize")}
                    </label>

                    <input
                      type="number"
                      min={0}
                      value={field.max_size ?? ""}
                      onChange={(e) =>
                        updateField({
                          max_size: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-gray-600">
                      {t("intakeForm.maxFiles")}
                    </label>

                    <input
                      type="number"
                      min={1}
                      value={field.max_files ?? ""}
                      onChange={(e) =>
                        updateField({
                          max_files: e.target.value
                            ? Number(e.target.value)
                            : undefined,
                        })
                      }
                      className="h-10 w-full rounded-lg border border-gray-200 bg-gray-50 px-3 text-sm"
                    />
                  </div>
                </div>
              )}

              {hasOptions && (
                <OptionsEditor
                  options={field.options}
                  onChange={(options) => updateField({ options })}
                />
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.li>
  );
});

/* -------------------------------------------------------------------------- */
/*  Main Builder                                                              */
/* -------------------------------------------------------------------------- */

export function IntakeFormBuilder({
  fields,
  onChange,
}: {
  fields: IntakeFormField[];
  onChange: (fields: IntakeFormField[]) => void;
}) {
  const { t } = useTranslation("intakeForm");

  const [preview, setPreview] = useState(false);

  const isInternalUpdateRef = useRef(false);

  // Transform incoming plain fields into the extended internal representation
  const createFieldWithId = (field: IntakeFormField): FieldWithId => ({
    ...field,
    _id: generateId(),
  });

  const [fieldsWithId, setFieldsWithId] = useState<FieldWithId[]>(() =>
    fields.map(createFieldWithId),
  );

  useEffect(() => {
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      return;
    }
    setFieldsWithId((current) =>
      fields.map((field, index) => {
        const existing =
          current.find((c) => c.name === field.name) ?? current[index];
        return {
          ...field,
          _id: existing?._id ?? generateId(),
        };
      }),
    );
  }, [fields]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;

      if (!over || active.id === over.id) return;

      setFieldsWithId((current) => {
        const oldIdx = current.findIndex((f) => f._id === active.id);
        const newIdx = current.findIndex((f) => f._id === over.id);

        if (oldIdx === -1 || newIdx === -1) return current;

        const reordered = [...current];
        const [moved] = reordered.splice(oldIdx, 1);
        reordered.splice(newIdx, 0, moved);

        isInternalUpdateRef.current = true;
        onChange(
          reordered.map(({ _id, ...rest }) => rest as IntakeFormField),
        );
        return reordered;
      });
    },
    [onChange],
  );

  const addField = useCallback(
    (groupName?: string, groupNameAm?: string) => {
      setFieldsWithId((current) => {
        const existingNames = new Set(current.map((f) => f.name));
        const newField: FieldWithId = {
          name: "",
          type: "text",
          label: "New Field",
          label_am: "",
          required: false,
          placeholder: "",
          placeholder_am: "",
          description: "",
          options: undefined,
          group: groupName || undefined,
          group_am: groupNameAm || undefined,
          _id: generateId(),
        };

        newField.name = generateFieldName(newField.label, existingNames);
        const updated = [...current, newField];

        isInternalUpdateRef.current = true;
        onChange(
          updated.map(({ _id, ...rest }) => rest as IntakeFormField),
        );
        return updated;
      });
    },
    [onChange],
  );

  const removeGroup = useCallback(
    (groupName: string) => {
      setFieldsWithId((current) => {
        const updated = current.map((f) => {
          if ((f.group || "").trim() === groupName.trim()) {
            const { group, group_am, ...rest } = f;
            return rest as FieldWithId;
          }
          return f;
        });

        isInternalUpdateRef.current = true;
        onChange(
          updated.map(({ _id, ...rest }) => rest as IntakeFormField),
        );
        return updated;
      });
    },
    [onChange],
  );

  const updateGroupTitles = useCallback(
    (oldTitle: string, newTitle: string, newTitleAm?: string) => {
      setFieldsWithId((current) => {
        const next = current.map((f) => {
          if ((f.group || "").trim() === oldTitle.trim()) {
            return {
              ...f,
              group: newTitle.trim() || undefined,
              group_am: newTitleAm?.trim() || undefined,
            };
          }
          return f;
        });

        isInternalUpdateRef.current = true;
        onChange(
          next.map(({ _id, ...rest }) => rest as IntakeFormField),
        );
        return next;
      });
    },
    [onChange],
  );

  const existingGroups = useMemo(() => {
    const list: { name: string; name_am?: string }[] = [];
    const seen = new Set<string>();
    fieldsWithId.forEach((f) => {
      const g = (f.group || "").trim();
      if (g && !seen.has(g)) {
        seen.add(g);
        list.push({ name: g, name_am: f.group_am });
      }
    });
    return list;
  }, [fieldsWithId]);

  const hasAnyGroups = useMemo(
    () => fieldsWithId.some((f) => (f.group || "").trim().length > 0),
    [fieldsWithId],
  );

  const [showNewGroupInput, setShowNewGroupInput] = useState(false);
  const [newGroupTitle, setNewGroupTitle] = useState("");
  const [newGroupTitleAm, setNewGroupTitleAm] = useState("");

  const handleCreateGroup = () => {
    const trimmed = newGroupTitle.trim();
    if (!trimmed) return;
    addField(trimmed, newGroupTitleAm.trim() || undefined);
    setNewGroupTitle("");
    setNewGroupTitleAm("");
    setShowNewGroupInput(false);
  };

  const groupedFields = useMemo(() => {
    const map = new Map<
      string,
      { key: string; title: string; title_am?: string; fields: FieldWithId[] }
    >();
    const ungroupedKey = "__ungrouped__";

    fieldsWithId.forEach((field) => {
      const g = (field.group || "").trim();
      const key = g || ungroupedKey;
      if (!map.has(key)) {
        map.set(key, {
          key,
          title: g || t("intakeForm.ungrouped"),
          title_am: field.group_am,
          fields: [],
        });
      }
      map.get(key)!.fields.push(field);
    });

    return Array.from(map.values());
  }, [fieldsWithId, t]);

  const updateField = useCallback(
    (
      id: string,
      patch: Partial<ExtendedIntakeFormField>,
    ) => {
      setFieldsWithId((current) => {
        const next = current.map((f) => {
          if (f._id !== id) return f;

          const updated = { ...f, ...patch };

          // Automatically derive unique field name in background when label changes
          if (patch.label !== undefined && patch.label !== f.label) {
            const existingNames = new Set(
              current.filter((item) => item._id !== id).map((item) => item.name),
            );
            updated.name = generateFieldName(patch.label, existingNames, f.name);
          }

          return updated;
        });

        isInternalUpdateRef.current = true;
        onChange(
          next.map(({ _id, ...rest }) => rest as IntakeFormField),
        );
        return next;
      });
    },
    [onChange],
  );

  const removeField = useCallback(
    (id: string) => {
      setFieldsWithId((current) => {
        const filtered = current.filter((f) => f._id !== id);

        isInternalUpdateRef.current = true;
        onChange(
          filtered.map(({ _id, ...rest }) => rest as IntakeFormField),
        );
        return filtered;
      });
    },
    [onChange],
  );

  const duplicateField = useCallback(
    (id: string) => {
      setFieldsWithId((current) => {
        const idx = current.findIndex((f) => f._id === id);
        if (idx === -1) return current;

        const original = current[idx];
        const existingNames = new Set(current.map((f) => f.name));

        const copy: FieldWithId = {
          ...original,
          _id: generateId(),
          name: generateFieldName(
            original.label + " copy",
            existingNames,
          ),
          label: original.label + " (copy)",
        };

        const next = [...current];
        next.splice(idx + 1, 0, copy);

        isInternalUpdateRef.current = true;
        onChange(
          next.map(({ _id, ...rest }) => rest as IntakeFormField),
        );
        return next;
      });
    },
    [onChange],
  );

  const fieldCount = fieldsWithId.length;

  const requiredCount = fieldsWithId.filter(
    (f) => f.required,
  ).length;

  /* ── Preview mode ─────────────────────────────────────────────────────── */

  if (preview) {
    const previewGroups = new Map<
      string,
      { key: string; title: string; title_am?: string; fields: FieldWithId[] }
    >();
    fieldsWithId.forEach((f) => {
      const g = (f.group || "").trim();
      const key = g || "__ungrouped__";
      if (!previewGroups.has(key)) {
        previewGroups.set(key, {
          key,
          title: g || t("intakeForm.ungrouped"),
          title_am: f.group_am,
          fields: [],
        });
      }
      previewGroups.get(key)!.fields.push(f);
    });

    return (
      <div>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900">
            {t("intakeForm.formPreview")}
          </h3>

          <button
            type="button"
            onClick={() => setPreview(false)}
            className="text-sm text-secondary hover:underline"
          >
            {t("intakeForm.backToEditor")}
          </button>
        </div>

        <div className="space-y-4 max-h-[500px] overflow-y-auto p-4 border border-gray-200 rounded-2xl bg-gray-50/60">
          {Array.from(previewGroups.values()).map((group) => (
            <div
              key={group.title}
              className="bg-white rounded-2xl border border-gray-200 p-4 shadow-xs space-y-4"
            >
              {hasAnyGroups && group.key !== "__ungrouped__" && (
                <div className="flex items-center gap-2 pb-2.5 border-b border-gray-100">
                  <div className="w-1.5 h-4 bg-secondary rounded-full" />
                  <h4 className="text-sm font-bold text-gray-800">
                    {group.title}{" "}
                    {group.title_am && (
                      <span className="text-xs text-gray-400 font-normal">
                        ({group.title_am})
                      </span>
                    )}
                  </h4>
                </div>
              )}

              <div className="space-y-4">
                {group.fields.map((field) => {
                  const {
                    type,
                    label,
                    label_am,
                    required,
                    placeholder,
                    options,
                    description,
                  } = field;

                  const id = `preview-${field._id}`;

                  return (
                    <div key={field._id}>
                      <label
                        htmlFor={id}
                        className="block text-sm font-medium text-gray-700 mb-1"
                      >
                        {label}{" "}
                        {label_am && (
                          <span className="text-xs text-gray-400 font-normal">
                            ({label_am})
                          </span>
                        )}{" "}
                        {required && (
                          <span className="text-red-500">*</span>
                        )}
                      </label>

                      {type === "text" && (
                        <input
                          id={id}
                          type="text"
                          placeholder={placeholder}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}

                      {type === "textarea" && (
                        <textarea
                          id={id}
                          rows={3}
                          placeholder={placeholder}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}

                      {type === "email" && (
                        <input
                          id={id}
                          type="email"
                          placeholder={placeholder}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}

                      {type === "phone" && (
                        <input
                          id={id}
                          type="tel"
                          placeholder={placeholder}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}

                      {type === "number" && (
                        <input
                          id={id}
                          type="number"
                          placeholder={placeholder}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}

                      {type === "date" && (
                        <input
                          id={id}
                          type="date"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}

                      {type === "time" && (
                        <input
                          id={id}
                          type="time"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}

                      {type === "datetime" && (
                        <input
                          id={id}
                          type="datetime-local"
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}

                      {type === "select" && (
                        <select
                          id={id}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm bg-white"
                        >
                          <option value="">
                            {placeholder || t("intakeForm.selectPlaceholder")}
                          </option>

                          {(options || []).map((opt, i) => (
                            <option key={i}>{opt}</option>
                          ))}
                        </select>
                      )}

                      {type === "multiselect" && (
                        <div className="mt-1 space-y-1">
                          {(options || []).map((opt, i) => (
                            <label
                              key={i}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="checkbox"
                                className="h-4 w-4 text-secondary"
                              />

                              <span className="text-sm text-gray-700">
                                {opt}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {type === "radio" && (
                        <div className="mt-1 space-y-1">
                          {(options || []).map((opt, i) => (
                            <label
                              key={i}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="radio"
                                name={`radio-${field._id}`}
                                className="h-4 w-4 text-secondary"
                              />

                              <span className="text-sm text-gray-700">
                                {opt}
                              </span>
                            </label>
                          ))}
                        </div>
                      )}

                      {type === "checkbox" && (
                        <div className="mt-1">
                          <label className="flex items-center gap-2">
                            <input
                              id={id}
                              type="checkbox"
                              className="h-4 w-4 text-secondary"
                            />

                            <span className="text-sm text-gray-700">
                              {label}
                            </span>
                          </label>
                        </div>
                      )}

                      {type === "file" && (
                        <input
                          id={id}
                          type="file"
                          className="mt-1 w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-secondary file:text-white hover:file:bg-[#5B46A0]"
                        />
                      )}

                      {type === "url" && (
                        <input
                          id={id}
                          type="url"
                          placeholder={placeholder}
                          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
                        />
                      )}

                      {description && (
                        <p className="text-xs text-gray-400 mt-1">
                          {description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  /* ── Editor ───────────────────────────────────────────────────────────── */

  return (
    <div className="space-y-4">
      <datalist id="intake-groups-list">
        {existingGroups.map((g: { name: string; name_am?: string }) => (
          <option key={g.name} value={g.name} />
        ))}
      </datalist>

      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-gray-900">
            {t("intakeForm.customerIntakeForm")}
          </h3>

          <p className="text-xs text-gray-500 mt-0.5">
            {fieldCount > 0
              ? t("intakeForm.fieldCount", {
                  count: fieldCount,
                  required: requiredCount,
                })
              : t("intakeForm.collectAdditionalInformation")}
          </p>
        </div>

        <div className="flex gap-2">
          {fieldsWithId.length > 0 && (
            <button
              type="button"
              onClick={() => setPreview(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
            >
              <Eye className="h-3.5 w-3.5" />
              {t("intakeForm.preview")}
            </button>
          )}
        </div>
      </div>

      {fieldsWithId.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-200 bg-gray-50/50 py-10 px-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
            <ClipboardList className="h-6 w-6 text-secondary" />
          </div>

          <h3 className="mt-3 text-sm font-semibold text-gray-900">
            {t("intakeForm.noFieldsTitle")}
          </h3>

          <p className="mt-1 max-w-sm text-center text-xs text-gray-500">
            {t("intakeForm.noFieldsDescription")}
          </p>

          <div className="mt-4 flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => setShowNewGroupInput(true)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-purple-200 bg-purple-50 px-4 text-xs font-semibold text-secondary shadow-xs transition hover:bg-purple-100"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              {t("intakeForm.addGroup")}
            </button>
            <button
              type="button"
              onClick={() => addField()}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-secondary px-4 text-xs font-semibold text-white shadow-sm transition hover:bg-[#5B46A0] focus:outline-none focus:ring-2 focus:ring-secondary/30 focus:ring-offset-1"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("intakeForm.addFirstField")}
            </button>
          </div>

          {showNewGroupInput && (
            <div className="mt-4 w-full max-w-lg p-4 rounded-xl border border-secondary/30 bg-purple-50/40 space-y-3">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                {t("intakeForm.newGroup")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  type="text"
                  value={newGroupTitle}
                  onChange={(val) => setNewGroupTitle(val)}
                  placeholder={t("intakeForm.groupTitle")}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-secondary outline-none"
                />
                <FormInput
                  type="text"
                  value={newGroupTitleAm}
                  onChange={(val) => setNewGroupTitleAm(val)}
                  placeholder={t("intakeForm.groupTitleAm")}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-secondary outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewGroupInput(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {t("intakeForm.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={!newGroupTitle.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-secondary text-white rounded-lg hover:bg-[#5B46A0] disabled:opacity-50"
                >
                  {t("intakeForm.add")}
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={fieldsWithId.map((f) => f._id)}
              strategy={verticalListSortingStrategy}
            >
              {!hasAnyGroups ? (
                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {fieldsWithId.map((field: FieldWithId) => (
                      <FieldCard
                        key={field._id}
                        field={field}
                        existingGroups={existingGroups}
                        updateField={(patch) =>
                          updateField(field._id, patch)
                        }
                        removeField={() =>
                          removeField(field._id)
                        }
                        duplicateField={() =>
                          duplicateField(field._id)
                        }
                      />
                    ))}
                  </AnimatePresence>
                </ul>
              ) : (
                <div className="space-y-5">
                  {groupedFields.map(
                    (group: {
                      key: string;
                      title: string;
                      title_am?: string;
                      fields: FieldWithId[];
                    }) => {
                      const isUngrouped = group.key === "__ungrouped__";
                      return (
                        <div
                          key={group.key}
                          className={`rounded-2xl border-2 p-4 space-y-3.5 ${
                            isUngrouped
                              ? "border-gray-200 bg-gray-50/40"
                              : "border-purple-200/80 bg-purple-50/15"
                          }`}
                        >
                          <div className="flex items-center justify-between pb-2.5 border-b border-gray-100 gap-3">
                            <div className="flex items-center gap-2.5 flex-1 min-w-0">
                              <div
                                className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${
                                  isUngrouped
                                    ? "bg-gray-200 text-gray-600"
                                    : "bg-secondary/10 text-secondary"
                                }`}
                              >
                                <Layers className="h-4 w-4" />
                              </div>

                              {isUngrouped ? (
                                <div>
                                  <h4 className="text-sm font-bold text-gray-800">
                                    {t("intakeForm.ungrouped")}
                                  </h4>
                                </div>
                              ) : (
                                <div className="flex items-center gap-2 flex-1 max-w-xl">
                                  <FormInput
                                    type="text"
                                    value={group.title}
                                    onChange={(newTitle) =>
                                      updateGroupTitles(
                                        group.title,
                                        newTitle,
                                        group.title_am
                                      )
                                    }
                                    placeholder={t("intakeForm.groupTitle")}
                                    className="h-8.5 px-3 text-xs font-bold text-gray-900 bg-white border border-gray-200 rounded-lg focus:border-secondary outline-none w-1/2 shadow-2xs"
                                  />
                                  <FormInput
                                    type="text"
                                    value={group.title_am || ""}
                                    onChange={(newTitleAm) =>
                                      updateGroupTitles(
                                        group.title,
                                        group.title,
                                        newTitleAm
                                      )
                                    }
                                    placeholder={t("intakeForm.groupTitleAm")}
                                    className="h-8.5 px-3 text-xs font-medium text-gray-600 bg-white border border-gray-200 rounded-lg focus:border-secondary outline-none w-1/2 shadow-2xs"
                                  />
                                </div>
                              )}

                              <span className="shrink-0 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-white border border-gray-200 text-gray-600">
                                {group.fields.length}{" "}
                                {group.fields.length === 1 ? "field" : "fields"}
                              </span>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="button"
                                onClick={() =>
                                  addField(
                                    isUngrouped ? undefined : group.title,
                                    group.title_am
                                  )
                                }
                                className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-semibold rounded-lg bg-white border border-gray-200 text-secondary hover:bg-purple-50 transition shadow-xs"
                              >
                                <Plus className="h-3.5 w-3.5" />
                                {t("intakeForm.addField")}
                              </button>

                              {!isUngrouped && (
                                <button
                                  type="button"
                                  onClick={() => removeGroup(group.title)}
                                  title={t("intakeForm.deleteGroup")}
                                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 transition"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
                            </div>
                          </div>

                          <ul className="space-y-3">
                            <AnimatePresence initial={false}>
                              {group.fields.map((field: FieldWithId) => (
                                <FieldCard
                                  key={field._id}
                                  field={field}
                                  existingGroups={existingGroups}
                                  updateField={(patch) =>
                                    updateField(field._id, patch)
                                  }
                                  removeField={() =>
                                    removeField(field._id)
                                  }
                                  duplicateField={() =>
                                    duplicateField(field._id)
                                  }
                                />
                              ))}
                            </AnimatePresence>
                          </ul>
                        </div>
                      );
                    }
                  )}
                </div>
              )}
            </SortableContext>
          </DndContext>

          {showNewGroupInput && (
            <div className="mt-4 p-4 rounded-xl border border-secondary/30 bg-purple-50/40 space-y-3">
              <h4 className="text-xs font-bold text-secondary uppercase tracking-wider">
                {t("intakeForm.newGroup")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FormInput
                  type="text"
                  value={newGroupTitle}
                  onChange={(val) => setNewGroupTitle(val)}
                  placeholder={t("intakeForm.groupTitle")}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-secondary outline-none"
                />
                <FormInput
                  type="text"
                  value={newGroupTitleAm}
                  onChange={(val) => setNewGroupTitleAm(val)}
                  placeholder={t("intakeForm.groupTitleAm")}
                  className="h-10 rounded-lg border border-gray-200 bg-white px-3 text-sm focus:border-secondary outline-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowNewGroupInput(false)}
                  className="px-3 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                >
                  {t("intakeForm.cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleCreateGroup}
                  disabled={!newGroupTitle.trim()}
                  className="px-3.5 py-1.5 text-xs font-semibold bg-secondary text-white rounded-lg hover:bg-[#5B46A0] disabled:opacity-50"
                >
                  {t("intakeForm.add")}
                </button>
              </div>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 justify-end">
            <button
              type="button"
              onClick={() => setShowNewGroupInput(true)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-xs font-semibold text-secondary hover:bg-purple-100 transition shadow-xs"
            >
              <FolderPlus className="h-3.5 w-3.5" />
              {t("intakeForm.addGroup")}
            </button>
            <button
              type="button"
              onClick={() => addField()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-secondary px-3 py-2 text-xs font-medium text-white shadow-sm hover:bg-[#5B46A0] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              {t("intakeForm.addField")}
            </button>
          </div>
        </>
      )}
    </div>
  );
}
