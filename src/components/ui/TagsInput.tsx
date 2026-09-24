import React, { useState, type KeyboardEvent } from "react";
import { Tag, X, Plus } from "lucide-react";

interface TagsInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  placeholder?: string;
  suggestions?: string[];
  maxTags?: number;
  disabled?: boolean;
}

export const TagsInput: React.FC<TagsInputProps> = ({
  tags = [],
  onChange,
  placeholder = "Type tag and press Enter...",
  suggestions = [],
  maxTags = 15,
  disabled = false,
}) => {
  const [inputVal, setInputVal] = useState("");

  const addTag = (text: string) => {
    const trimmed = text.trim();
    if (!trimmed) return;
    if (tags.length >= maxTags) return;
    // Check duplicate case-insensitively
    if (tags.some((t) => t.toLowerCase() === trimmed.toLowerCase())) {
      setInputVal("");
      return;
    }
    onChange([...tags, trimmed]);
    setInputVal("");
  };

  const removeTag = (indexToRemove: number) => {
    if (disabled) return;
    onChange(tags.filter((_, idx) => idx !== indexToRemove));
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault();
      addTag(inputVal);
    } else if (e.key === "Backspace" && !inputVal && tags.length > 0) {
      removeTag(tags.length - 1);
    }
  };

  // Filter suggestions to those not already in tags
  const availableSuggestions = suggestions.filter(
    (s) => !tags.some((t) => t.toLowerCase() === s.toLowerCase())
  );

  return (
    <div className="space-y-2">
      <div
        className={`w-full min-h-[46px] border-2 rounded-xl p-1.5 flex flex-wrap items-center gap-1.5 transition-all ${
          disabled
            ? "bg-gray-100 border-gray-200 cursor-not-allowed"
            : "bg-gray-50/80 border-gray-200 focus-within:border-secondary focus-within:bg-white focus-within:ring-2 focus-within:ring-secondary/10"
        }`}
      >
        {tags.map((tag, idx) => (
          <span
            key={`${tag}-${idx}`}
            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-purple-50 text-secondary border border-secondary/20 shadow-xs transition-colors hover:bg-purple-100"
          >
            <Tag className="h-3 w-3 shrink-0 opacity-70" />
            <span className="max-w-[140px] truncate">{tag}</span>
            {!disabled && (
              <button
                type="button"
                onClick={() => removeTag(idx)}
                className="ml-0.5 rounded-full p-0.5 text-secondary/70 hover:text-secondary hover:bg-secondary/15 transition"
                title={`Remove ${tag}`}
                aria-label={`Remove tag ${tag}`}
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </span>
        ))}

        {!disabled && tags.length < maxTags && (
          <div className="flex-1 min-w-[120px] flex items-center">
            <input
              type="text"
              value={inputVal}
              onChange={(e) => setInputVal(e.target.value)}
              onKeyDown={handleKeyDown}
              onBlur={() => {
                if (inputVal.trim()) addTag(inputVal);
              }}
              placeholder={tags.length === 0 ? placeholder : "Add more..."}
              className="w-full bg-transparent px-2 py-1 text-sm outline-none placeholder:text-gray-400 font-medium"
            />
            {inputVal.trim() && (
              <button
                type="button"
                onClick={() => addTag(inputVal)}
                className="shrink-0 mr-1 p-1 rounded-md text-secondary hover:bg-secondary/10 transition"
                title="Add tag"
              >
                <Plus className="h-4 w-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Suggestion Chips */}
      {!disabled && availableSuggestions.length > 0 && tags.length < maxTags && (
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[11px] font-medium text-gray-400 mr-1">Suggestions:</span>
          {availableSuggestions.slice(0, 8).map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              onClick={() => addTag(suggestion)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium bg-gray-100 text-gray-600 hover:bg-purple-50 hover:text-secondary border border-gray-200 hover:border-purple-200 transition"
            >
              <Plus className="h-2.5 w-2.5 opacity-60" />
              <span>{suggestion}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
