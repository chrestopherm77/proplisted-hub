import { Badge } from '@/components/ui/badge';
import {
  normalizeAmenities,
  getCondoGroupLabel,
  getFeatureGroupLabel,
  getFeatureQuestionLabel,
  PROPERTY_FEATURES,
} from '@/lib/propertyUtils';

interface AmenitiesDisplayProps {
  value: unknown;
}

/** Renderiza comodidades do condomínio + características do imóvel agrupadas. */
export function AmenitiesDisplay({ value }: AmenitiesDisplayProps) {
  const norm = normalizeAmenities(value);

  const hasLegacy = (norm.legacy?.length || 0) > 0;
  const hasCondo = norm.condo && Object.keys(norm.condo).length > 0;
  const hasProperty = norm.property && Object.keys(norm.property).length > 0;

  if (!hasLegacy && !hasCondo && !hasProperty) return null;

  // Mapear question -> grupo de feature para agrupar exibição
  const featureGroupOf = (qKey: string): string | null => {
    for (const g of PROPERTY_FEATURES) {
      if (g.questions.some((q) => q.key === qKey)) return g.key;
    }
    return null;
  };

  const groupedFeatures: Record<string, Array<{ qKey: string; items: string[] }>> = {};
  if (norm.property) {
    for (const [qKey, items] of Object.entries(norm.property)) {
      const gKey = featureGroupOf(qKey) || 'other';
      if (!groupedFeatures[gKey]) groupedFeatures[gKey] = [];
      groupedFeatures[gKey].push({ qKey, items });
    }
  }

  return (
    <div className="space-y-5">
      {hasLegacy && (
        <div>
          <p className="text-sm font-semibold mb-2">Geral</p>
          <div className="flex flex-wrap gap-2">
            {norm.legacy!.map((a) => (
              <Badge key={a} variant="secondary">
                {a}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {hasCondo &&
        Object.entries(norm.condo!).map(([gKey, items]) => (
          <div key={`c-${gKey}`}>
            <p className="text-sm font-semibold mb-2">{getCondoGroupLabel(gKey)}</p>
            <div className="flex flex-wrap gap-2">
              {items.map((item) => (
                <Badge key={item} variant="secondary">
                  {item}
                </Badge>
              ))}
            </div>
          </div>
        ))}

      {hasProperty &&
        Object.entries(groupedFeatures).map(([gKey, questions]) => (
          <div key={`p-${gKey}`}>
            <p className="text-sm font-semibold mb-2">{getFeatureGroupLabel(gKey)}</p>
            <div className="space-y-3">
              {questions.map(({ qKey, items }) => (
                <div key={qKey}>
                  <p className="text-xs text-muted-foreground mb-1.5">
                    {getFeatureQuestionLabel(gKey, qKey)}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <Badge key={item} variant="secondary">
                        {item}
                      </Badge>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
    </div>
  );
}
