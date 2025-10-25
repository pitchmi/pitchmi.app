// lib/categories.ts — llaves canónicas + colores
// =============================================
export type CategoryKey =
  | 'gastronomía'
  | 'lugares'
  | 'fiesta'
  | 'rutas'
  | 'mercadillos'
  | 'noche'
  | 'ferias'
  | 'evento'
  | 'deporte'
  | 'otros';

export const CATEGORY_KEYS: CategoryKey[] = [
  'gastronomía','lugares','fiesta','rutas','mercadillos','noche','ferias','evento','deporte','otros'
];

export const CATEGORY_COLORS: Record<CategoryKey, string> = {
  gastronomía: '#f59e0b',
  lugares: '#22c55e',
  fiesta: '#ef4444',
  rutas: '#3b82f6',
  mercadillos: '#8b5cf6',
  noche: '#0ea5e9',
  ferias: '#e11d48',
  evento: '#16a34a',
  deporte: '#10b981',
  otros: '#64748b',
};
