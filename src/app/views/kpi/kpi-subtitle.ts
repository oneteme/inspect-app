export function volumeSubtitle(rows: any[], distinctSingular: string, distinctPlural: string, volumeNoun: string = 'appel'): string {
  if (!rows?.length) return '';
  const total = rows.reduce((sum, r) => sum + (r.count || 0), 0);
  const distinct = rows.length;
  return `${total.toLocaleString('fr-FR')} ${volumeNoun}${total > 1 ? 's' : ''} · ${distinct} ${distinct > 1 ? distinctPlural : distinctSingular}`;
}
