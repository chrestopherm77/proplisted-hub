export type MenuMode = 'section' | 'url';

export interface MenuItem {
  id: string;
  label: string;
  visible: boolean;
  mode: MenuMode;
  target: string;
}

const DEFAULT_LABELS: Record<string, string> = {
  home: 'Início',
  sobre: 'Sobre',
  contato: 'Contato',
  financie: 'Financie',
  negociar: 'Negocie seu Imóvel',
};

const DEFAULT_IDS = ['home', 'sobre', 'contato', 'financie', 'negociar'];

export function defaultMenuItems(): MenuItem[] {
  return DEFAULT_IDS.map((id) => ({
    id,
    label: DEFAULT_LABELS[id],
    visible: true,
    mode: 'section',
    target: id,
  }));
}

/** Lê menu_items do branding; se não existir, monta a partir do menu_labels antigo. */
export function resolveMenuItems(branding: Record<string, any> | null | undefined): MenuItem[] {
  const b = branding ?? {};
  if (Array.isArray(b.menu_items) && b.menu_items.length) {
    return b.menu_items.map((it: any, idx: number) => ({
      id: it.id ?? `item-${idx}`,
      label: it.label ?? DEFAULT_LABELS[it.id] ?? '',
      visible: it.visible !== false,
      mode: (it.mode === 'url' ? 'url' : 'section') as MenuMode,
      target: it.target ?? it.id ?? 'home',
    }));
  }
  const labels = b.menu_labels ?? {};
  return DEFAULT_IDS.map((id) => ({
    id,
    label: labels[id] || DEFAULT_LABELS[id],
    visible: true,
    mode: 'section',
    target: id,
  }));
}
