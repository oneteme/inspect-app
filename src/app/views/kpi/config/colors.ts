const STATUS_COLORS = {
  0: ['#94a3b8', '#64748b', '#475569', '#334155'],
  2: ['#4ade80', '#22c55e', '#16a34a', '#15803d' ],
  3: ['#67e8f9', '#22d3ee', '#06b6d4', '#0891b2', '#0e7490'],
  4: ['#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309'],
  5: ['#fca5a5', '#f87171', '#ef4444', '#dc2626', '#b91c1c']
}

export const PERFORMANCE_TRANCHE1 = {
  '1': { label: '< 1s', color: '#22c55e' },  // vert    – excellent
  '2': { label: '[1-3s[', color: '#84cc16' },  // lime    – bon
  '3': { label: '[3-5s[', color: '#eab308' },  // jaune   – acceptable
  '4': { label: '[5-10s[', color: '#f97316' },  // orange  – lent
  '5': { label: '≥ 10s', color: '#ef4444' },  // rouge   – très lent
}

export const PERFORMANCE_TRANCHE2 = {
  '1': { label: '< 5s', color: '#84cc16' },  // vert    – excellent
  '2': { label: '[5-10s[', color: '#f97316' },  // lime    – bon
  '3': { label: '≥ 10s', color: '#ef4444' }  // jaune   – acceptable
}

export const SIZE_TRANCHE = {
  '1': { label: '< 100o', color: '#22c55e' },
  '2': { label: '[100-200o[', color: '#84cc16' },
  '3': { label: '[200-300o[', color: '#eab308' },
  '4': { label: '≥ 300o', color: '#f97316' }
}

/** Retourne une couleur hex selon la famille du code HTTP. */
export function statusColor(status: number | string): string {
  const family = parseInt(String(status)[0], 10); // 200 → 2, "2xx" → 2
  const palette = STATUS_COLORS[family];
  if (!palette) return '#94a3b8';

  // Cas code exact 200, 201… → nuance dans la palette
  const code = typeof status === 'number' ? status : parseInt(status, 10);
  return pickStatusColor(code, family * 100, palette);
}

/** Sélectionne une teinte dans la palette selon la position du code dans sa famille. */
export function pickStatusColor(status: number, base: number, palette: string[]): string {
  return palette[Math.floor((status - base) / 20) % palette.length];
}
