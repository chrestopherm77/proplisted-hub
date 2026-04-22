import { formatFormDataToSections, type FormSection, intentionLabelsExport } from './formatFormData';

export type FlowKey = 'sell' | 'buy' | 'build' | 'rent';

export interface LeadPreference {
  /** 1-based index for display */
  index: number;
  /** Uppercase normalized intention: SELL/BUY/BUILD/RENT */
  intention: string;
  /** Human-readable PT-BR intention label */
  intentionLabel: string;
  /** Flow key in form_data (sell/buy/build/rent) */
  flowKey: FlowKey;
  /** Sections rendered for this preference */
  sections: FormSection[];
  /** Raw flow data for this single preference */
  flowData: Record<string, any>;
  /** Index inside the array if the flow stores multiple entries */
  flowArrayIndex: number | null;
}

const INTENTION_TO_FLOW: Record<string, FlowKey> = {
  SELL: 'sell',
  BUY: 'buy',
  BUILD: 'build',
  RENT: 'rent',
};

const FLOW_TO_INTENTION: Record<FlowKey, string> = {
  sell: 'SELL',
  buy: 'BUY',
  build: 'BUILD',
  rent: 'RENT',
};

function normalizeIntention(raw: any): string | null {
  if (!raw) return null;
  const s = String(raw).trim().toUpperCase();
  const map: Record<string, string> = {
    VENDER: 'SELL', SELL: 'SELL',
    COMPRAR: 'BUY', BUY: 'BUY',
    CONSTRUIR: 'BUILD', BUILD: 'BUILD',
    ALUGAR: 'RENT', RENT: 'RENT',
  };
  return map[s] || null;
}

/**
 * Splits a (possibly merged) form_data into one entry per "preferência".
 * Handles 3 cases:
 *  1. Single flow (e.g. { buy: {...} }) → 1 preference.
 *  2. Same intention repeated (e.g. { rent: [{}, {}] }) → N preferences.
 *  3. Multiple intentions (e.g. { buy: {}, rent: {}, intention: ['BUY','RENT'] }) → N preferences.
 */
export function splitFormDataIntoPreferences(formData: any): LeadPreference[] {
  if (!formData || typeof formData !== 'object') return [];

  const prefs: LeadPreference[] = [];
  let counter = 1;

  // Determine ordering: prefer intention array order, else flow detection order
  const intentionField = formData.intention;
  const orderedFlows: FlowKey[] = [];

  if (Array.isArray(intentionField)) {
    for (const it of intentionField) {
      const norm = normalizeIntention(it);
      if (norm && INTENTION_TO_FLOW[norm] && !orderedFlows.includes(INTENTION_TO_FLOW[norm])) {
        orderedFlows.push(INTENTION_TO_FLOW[norm]);
      }
    }
  } else if (typeof intentionField === 'string') {
    const norm = normalizeIntention(intentionField);
    if (norm && INTENTION_TO_FLOW[norm]) orderedFlows.push(INTENTION_TO_FLOW[norm]);
  }

  // Add any flows present in the data that weren't covered by `intention`
  for (const flow of ['sell', 'buy', 'build', 'rent'] as FlowKey[]) {
    if (formData[flow] && !orderedFlows.includes(flow)) orderedFlows.push(flow);
  }

  for (const flowKey of orderedFlows) {
    const flowVal = formData[flowKey];
    if (!flowVal) continue;

    const intention = FLOW_TO_INTENTION[flowKey];
    const intentionLabel = intentionLabelsExport[intention] || intention;

    const entries: Array<{ data: Record<string, any>; arrayIndex: number | null }> = [];
    if (Array.isArray(flowVal)) {
      flowVal.forEach((entry, i) => {
        if (entry && typeof entry === 'object' && Object.keys(entry).length > 0) {
          entries.push({ data: entry, arrayIndex: i });
        }
      });
    } else if (typeof flowVal === 'object' && Object.keys(flowVal).length > 0) {
      entries.push({ data: flowVal, arrayIndex: null });
    }

    for (const e of entries) {
      const localFormData = { intention, [flowKey]: e.data };
      const sections = formatFormDataToSections(intention, localFormData);
      prefs.push({
        index: counter++,
        intention,
        intentionLabel,
        flowKey,
        sections,
        flowData: e.data,
        flowArrayIndex: e.arrayIndex,
      });
    }
  }

  return prefs;
}

/**
 * Generates a top-level description string from a (possibly merged) form_data,
 * matching the format used by merge-or-create-lead:
 *   Preferência 1:\n<lines>\n\nPreferência 2:\n<lines>...
 * If only 1 preference exists, no "Preferência N:" prefix is added.
 */
export function regenerateDescriptionFromFormData(formData: any): string {
  const prefs = splitFormDataIntoPreferences(formData);
  if (prefs.length === 0) return '';

  const blocks = prefs.map((p) => {
    const lines: string[] = [];
    lines.push(`Interesse: ${p.intentionLabel}`);

    // Region detection (mirrors generateDescription in formatFormData.ts)
    const fd = p.flowData;
    const region =
      (p.flowKey === 'build' ? fd.location : fd.region) || '';
    if (region) lines.push(`Região: ${region}`);

    // Characteristics summary
    const chars: string[] = [];
    if (fd.propertyType) chars.push(String(fd.propertyType));
    if (fd.residentialType) chars.push(String(fd.residentialType));
    if (fd.commercialType) chars.push(String(fd.commercialType));
    if (fd.bedrooms) chars.push(`${fd.bedrooms} quarto(s)`);
    if (fd.area) chars.push(`${fd.area}m²`);
    if (chars.length > 0) lines.push(`Características: ${chars.join(', ')}`);

    return lines.join('\n');
  });

  if (blocks.length === 1) return blocks[0];

  return blocks.map((b, i) => `Preferência ${i + 1}:\n${b}`).join('\n\n');
}
