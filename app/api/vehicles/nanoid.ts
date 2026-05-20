/**
 * Generates a stable slug-like ID from vehicle attributes, with a short random
 * suffix to avoid collisions when two vehicles share the same details.
 */
export function nanoid(
  _title: string,
  brand: string,
  model: string,
  year: string | number
): string {
  const base = [brand, model, String(year)]
    .join("-")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

  const suffix = Math.random().toString(36).slice(2, 7);
  return `${base}-${suffix}`;
}
