/**
 * Tipos del contrato con Rust. Los campos van en snake_case porque son los
 * nombres por defecto de serde: así el lado Rust no necesita rename_all.
 * Ver CONTRACT.md para las structs equivalentes.
 */

export interface VideoInfo {
  path: string;
  duration_secs: number;
  width: number;
  height: number;
  fps: number | null;
  codec: string | null;
  /** Carpeta de salida por defecto: <carpeta del video>/<nombre>_frames. */
  suggested_out_dir: string;
}

export interface ThumbnailRequest {
  path: string;
  count: number;
  /** Ancho en px; el alto conserva la proporción. */
  width: number;
}

export interface Thumbnail {
  time_secs: number;
  /** data:image/jpeg;base64,... */
  data_url: string;
}

export type ExtractMode =
  | { kind: "fps" }
  /** Solo frames donde la imagen cambia más que `threshold` (0..1); `fps` es el tope de frames por segundo. */
  | { kind: "change"; threshold: number };

export type Resize =
  | { kind: "none" }
  | { kind: "percent"; percent: number }
  | { kind: "size"; width: number; height: number };

export interface ExtractRequest {
  /** Lo genera la UI; sirve para cancelar y para filtrar eventos de progreso. */
  job_id: string;
  path: string;
  out_dir: string;
  start_secs: number;
  end_secs: number;
  mode: ExtractMode;
  /** Capturas por segundo (admite decimales, p. ej. 0.5). */
  fps: number;
  /** JPEG 1..100, mayor = mejor (distinto de -q:v de ffmpeg, que va de 31 a 1). */
  quality: number;
  resize: Resize;
}

export interface ExtractSummary {
  out_dir: string;
  frames: number;
  cancelled: boolean;
  elapsed_ms: number;
}

export interface FrameProgress {
  job_id: string;
  /** Posición actual dentro del video, en segundos. */
  position_secs: number;
  /** Imágenes escritas hasta ahora. */
  frames: number;
}
