// lib/radius.ts — pequeña utilidad testeable
// ==============================================
export function nextRadius(current: number): number {
  if (current === 0) return 1000;
  if (current === 1000) return 5000;
  if (current === 5000) return 20000;
  return 0;
}
