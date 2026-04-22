import React from "react";
import { splitFormDataIntoPreferences } from "@/lib/leadPreferences";

interface Props {
  formData: any;
  /** When false, hide the "🎯 Preferência N — ..." headers (used when there's only 1 preference and you want a clean UI). Defaults to true. */
  showPreferenceHeaders?: boolean;
  /** Tailwind size class for field text */
  fieldTextClass?: string;
  /** Tailwind size class for section title */
  sectionTitleClass?: string;
}

export function LeadPreferencesView({
  formData,
  showPreferenceHeaders = true,
  fieldTextClass = "text-sm",
  sectionTitleClass = "text-sm",
}: Props) {
  const preferences = splitFormDataIntoPreferences(formData);

  if (preferences.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nenhuma informação do formulário foi fornecida.
      </p>
    );
  }

  // Hide headers automatically when there's only 1 preference
  const showHeader = showPreferenceHeaders && preferences.length > 1;

  return (
    <div className="space-y-5">
      {preferences.map((pref) => (
        <div
          key={`${pref.flowKey}-${pref.flowArrayIndex ?? 0}-${pref.index}`}
          className={showHeader ? "rounded-lg border border-border bg-muted/30 p-4 space-y-4" : "space-y-4"}
        >
          {showHeader && (
            <div className="flex items-center gap-2 pb-2 border-b border-border/60">
              <span className="text-base font-semibold text-foreground">
                🎯 Preferência {pref.index} — {pref.intentionLabel}
              </span>
            </div>
          )}

          {pref.sections.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Sem detalhes adicionais para esta preferência.
            </p>
          ) : (
            pref.sections.map((section, idx) => (
              <div key={idx} className="space-y-2">
                <h4 className={`${sectionTitleClass} font-semibold text-foreground flex items-center gap-2`}>
                  <span>{section.icon}</span>
                  {section.title}
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pl-6">
                  {section.fields.map((field, fieldIdx) => (
                    <div key={fieldIdx} className={fieldTextClass}>
                      <span className="text-muted-foreground">{field.label}:</span>{" "}
                      <span className="font-medium text-foreground">{field.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      ))}
    </div>
  );
}
