export function formatEnumLabel(value: string | null | undefined) {
  if (!value) return "";

  return value
    .replace(/[_-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .split(" ")
    .map((token) => {
      if (["YES", "NO", "UNKNOWN"].includes(token)) {
        return token.charAt(0) + token.slice(1).toLowerCase();
      }
      if (/^[A-Z]{1,4}\d*$/.test(token) || /^\d+x\d+$/i.test(token)) {
        return token.toUpperCase();
      }
      const lowered = token.toLowerCase();
      return lowered.charAt(0).toUpperCase() + lowered.slice(1);
    })
    .join(" ");
}
