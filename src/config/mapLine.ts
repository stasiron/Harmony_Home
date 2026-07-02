/**
 * Ustawienia grubości linii na mapie (kształt „linia”).
 *
 * `mapLineWidth` to wartość `strokeWidth` w SVG (z `vectorEffect="non-scaling-stroke"`).
 */
export const MAP_LINE_SETTINGS = {
  /** Domyślna grubość, gdy pole nie ustawione */
  defaultWidth: 2.5,
  minWidth: 0.5,
  maxWidth: 8,
  step: 0.5,
} as const;

export function resolveMapLineWidth(width?: number): number {
  const { defaultWidth, minWidth, maxWidth } = MAP_LINE_SETTINGS;
  const value = width ?? defaultWidth;
  return Math.min(maxWidth, Math.max(minWidth, value));
}
