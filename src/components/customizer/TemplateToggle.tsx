"use client";

import type { DesignTemplate } from "@/types/database";

interface TemplateToggleProps {
  templates: DesignTemplate[];
  activeTemplateId: string;
  onChange: (template: DesignTemplate) => void;
  disabled?: boolean;
}

export function TemplateToggle({
  templates,
  activeTemplateId,
  onChange,
  disabled = false,
}: TemplateToggleProps) {
  return (
    <div className="flex rounded-xl border border-white/10 bg-gem-slate p-1">
      {templates.map((template) => {
        const isActive = template.id === activeTemplateId;

        return (
          <button
            key={template.id}
            type="button"
            disabled={disabled}
            onClick={() => onChange(template)}
            className={`flex-1 rounded-lg px-3 py-2 text-center text-xs transition sm:text-sm ${
              isActive
                ? "bg-gem-gold text-gem-ink"
                : "text-gem-mist/70 hover:text-gem-mist"
            } ${disabled ? "opacity-40" : ""}`}
          >
            <span className="block font-medium">{template.name}</span>
            <span className={`block text-[10px] ${isActive ? "text-gem-ink/70" : "text-gem-mist/40"}`}>
              {template.slot_count} slots
            </span>
          </button>
        );
      })}
    </div>
  );
}
