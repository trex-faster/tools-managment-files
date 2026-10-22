const DECIMAL = "\\d+(?:\\.\\d+)?";
const PLAIN = new RegExp(`^${DECIMAL}$`);
const UNITS = new RegExp(`^(?:(\\d+)h)?(?:(\\d+)m)?(?:(${DECIMAL})s)?$`);

/**
 * Acepta los mismos formatos que el .bat original: "90", "1m30s", "1h10m20s",
 * "1:30" (M:SS) y "0:01:30" (H:MM:SS). Admite decimales ("1.5s"). Devuelve
 * segundos, o null si el texto no es un tiempo válido.
 */
export function parseTime(input: string): number | null {
  const text = input.trim().toLowerCase().replace(/\s+/g, "").replace(",", ".");
  if (text === "") return null;

  if (text.includes(":")) {
    const parts = text.split(":");
    if (parts.length > 3) return null;
    let total = 0;
    for (const part of parts) {
      if (!PLAIN.test(part)) return null;
      total = total * 60 + Number(part);
    }
    return total;
  }

  if (PLAIN.test(text)) return Number(text);

  const match = UNITS.exec(text);
  if (!match || (match[1] === undefined && match[2] === undefined && match[3] === undefined)) {
    return null;
  }
  return Number(match[1] ?? 0) * 3600 + Number(match[2] ?? 0) * 60 + Number(match[3] ?? 0);
}

/** H:MM:SS. Con `precise`, añade milésimas si las hay (H:MM:SS.mmm). */
export function formatTime(totalSecs: number, precise = false): string {
  const rounded = Math.round(Math.max(0, totalSecs) * 1000) / 1000;
  const whole = Math.floor(rounded);
  const hours = Math.floor(whole / 3600);
  const minutes = Math.floor((whole % 3600) / 60);
  const seconds = whole % 60;
  const base = `${hours}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  if (!precise) return base;

  const millis = Math.round((rounded - whole) * 1000);
  return millis === 0 ? base : `${base}.${String(millis).padStart(3, "0")}`;
}
