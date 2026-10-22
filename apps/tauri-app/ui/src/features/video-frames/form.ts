import { formatTime, parseTime } from "./time";
import type { ExtractMode, ExtractRequest, Resize, VideoInfo } from "./types";

export type ModeChoice = "fps" | "scene" | "motion";

/** Umbrales de los modos del .bat original (scene > 0.3 y scene > 0.1). */
export const THRESHOLD_PRESET = { scene: "0.3", motion: "0.1" } as const;

const MAX_FPS = 240;
const NUMBER = /^\d+(?:\.\d+)?$/;

/** Todo como texto, tal cual lo escribe el usuario. */
export interface FormState {
  start: string;
  end: string;
  mode: ModeChoice;
  threshold: string;
  fps: string;
  quality: string;
  resize: string;
  outDir: string;
}

export const DEFAULT_FORM: FormState = {
  start: "",
  end: "",
  mode: "fps",
  threshold: THRESHOLD_PRESET.scene,
  fps: "3",
  quality: "95",
  resize: "",
  outDir: "",
};

export function initialForm(info: VideoInfo): FormState {
  return { ...DEFAULT_FORM, outDir: info.suggested_out_dir };
}

export type BuildResult =
  | {
      ok: true;
      request: ExtractRequest;
      /** Avisos que no impiden extraer (p. ej. el fin se ajustó a la duración). */
      notes: string[];
      /** Cota superior de imágenes: (fin - inicio) × fps. */
      maxFrames: number;
    }
  | { ok: false; error: string };

function fail(error: string): BuildResult {
  return { ok: false, error };
}

function toNumber(text: string): number {
  const normalized = text.trim().replace(",", ".");
  return NUMBER.test(normalized) ? Number(normalized) : Number.NaN;
}

function parseResize(text: string): Resize | null {
  const t = text.trim().toLowerCase().replace(/\s+/g, "").replace(",", ".");
  if (t === "") return { kind: "none" };

  const percentMatch = /^(\d+(?:\.\d+)?)%$/.exec(t);
  if (percentMatch) {
    const percent = Number(percentMatch[1]);
    return percent > 0 && percent <= 400 ? { kind: "percent", percent } : null;
  }

  const sizeMatch = /^(\d+)[x×](\d+)$/.exec(t);
  if (sizeMatch) {
    const width = Number(sizeMatch[1]);
    const height = Number(sizeMatch[2]);
    const valid = width > 0 && height > 0 && width <= 16384 && height <= 16384;
    return valid ? { kind: "size", width, height } : null;
  }

  return null;
}

/** Valida el formulario contra el video y construye la petición para Rust. */
export function buildRequest(form: FormState, info: VideoInfo, jobId: string): BuildResult {
  const duration = info.duration_secs;
  const notes: string[] = [];

  let start = 0;
  if (form.start.trim() !== "") {
    const parsed = parseTime(form.start);
    if (parsed === null) {
      return fail(`Inicio inválido: "${form.start.trim()}". Usa 1m30s, 0:01:30 o 90.`);
    }
    start = parsed;
  }
  if (start >= duration) {
    return fail(`El inicio (${formatTime(start)}) debe ser menor que la duración (${formatTime(duration)}).`);
  }

  let end = duration;
  if (form.end.trim() !== "") {
    const parsed = parseTime(form.end);
    if (parsed === null) {
      return fail(`Fin inválido: "${form.end.trim()}". Usa 3m45s, 0:03:45 o 225.`);
    }
    if (parsed > duration) {
      notes.push(`El fin supera la duración del video; se ajustó a ${formatTime(duration)}.`);
    }
    end = Math.min(parsed, duration);
  }
  if (end <= start) return fail("El fin debe ser mayor que el inicio.");

  const fps = toNumber(form.fps);
  if (!(fps > 0 && fps <= MAX_FPS)) {
    return fail(`Capturas por segundo inválido: un número mayor que 0 y hasta ${MAX_FPS} (ej: 3 o 0.5).`);
  }

  const quality = toNumber(form.quality);
  if (!Number.isInteger(quality) || quality < 1 || quality > 100) {
    return fail("Calidad JPEG inválida: un entero de 1 (peor) a 100 (mejor).");
  }

  let mode: ExtractMode = { kind: "fps" };
  if (form.mode !== "fps") {
    const threshold = toNumber(form.threshold);
    if (!(threshold > 0 && threshold < 1)) {
      return fail("Sensibilidad inválida: un número entre 0 y 1 (menor = más frames).");
    }
    mode = { kind: "change", threshold };
  }

  const resize = parseResize(form.resize);
  if (resize === null) {
    return fail(`Redimensionado inválido: "${form.resize.trim()}". Usa 1920x1080, 50% o déjalo vacío.`);
  }

  const outDir = form.outDir.trim();
  if (outDir === "") return fail("Elige una carpeta de salida.");

  return {
    ok: true,
    notes,
    maxFrames: Math.ceil((end - start) * fps),
    request: {
      job_id: jobId,
      path: info.path,
      out_dir: outDir,
      start_secs: start,
      end_secs: end,
      mode,
      fps,
      quality,
      resize,
    },
  };
}
