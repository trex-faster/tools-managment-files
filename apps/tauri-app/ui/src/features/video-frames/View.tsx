import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/Button";
import { Dropzone } from "@/components/Dropzone";
import { Field } from "@/components/Field";
import { ProgressBar } from "@/components/ProgressBar";
import { Select } from "@/components/Select";
import { TextInput } from "@/components/TextInput";
import { cx } from "@/core/cx";
import { errorMessage, pickDirectory, pickFiles, subscribe } from "@/core/tauri";
import { useFileDrop } from "@/core/useFileDrop";
import {
  cancelJob,
  extractFrames,
  probeVideo,
  revealPath,
  VIDEO_EXTENSIONS,
  videoThumbnails,
} from "./api";
import {
  buildRequest,
  DEFAULT_FORM,
  initialForm,
  THRESHOLD_PRESET,
  type FormState,
  type ModeChoice,
} from "./form";
import { Thumbnails } from "./Thumbnails";
import { formatTime } from "./time";
import type { ExtractSummary, FrameProgress, Thumbnail, VideoInfo } from "./types";
import styles from "./View.module.css";

type Status = "idle" | "probing" | "running";

interface JobView {
  id: string;
  startSecs: number;
  endSecs: number;
  frames: number;
  positionSecs: number;
  cancelling: boolean;
}

type ThumbsState =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "ready"; items: Thumbnail[] }
  | { kind: "error"; message: string };

const WARN_FRAMES = 5000;

function newJobId(): string {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `job-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

function baseName(path: string): string {
  return path.split(/[\\/]/).pop() ?? path;
}

export default function View() {
  const [video, setVideo] = useState<VideoInfo | null>(null);
  const [form, setForm] = useState<FormState>(DEFAULT_FORM);
  const [status, setStatus] = useState<Status>("idle");
  const [job, setJob] = useState<JobView | null>(null);
  const [result, setResult] = useState<ExtractSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [thumbs, setThumbs] = useState<ThumbsState>({ kind: "idle" });

  const activeJob = useRef<string | null>(null);
  // Se incrementa con cada video nuevo (y al desmontar) para descartar respuestas viejas.
  const videoToken = useRef(0);

  const busy = status !== "idle";

  // Progreso: Rust puede emitir muchos eventos por segundo; se aplican como máximo uno por frame de pantalla.
  useEffect(() => {
    let raf = 0;
    let latest: FrameProgress | null = null;

    const off = subscribe("video-frames:progress", (progress) => {
      if (progress.job_id !== activeJob.current) return;
      latest = progress;
      if (raf !== 0) return;
      raf = requestAnimationFrame(() => {
        raf = 0;
        const current = latest;
        if (!current) return;
        setJob((j) =>
          j && j.id === current.job_id
            ? { ...j, frames: current.frames, positionSecs: current.position_secs }
            : j,
        );
      });
    });

    return () => {
      off();
      if (raf !== 0) cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(
    () => () => {
      videoToken.current += 1;
    },
    [],
  );

  const loadVideo = useCallback(async (path: string) => {
    const token = ++videoToken.current;
    setStatus("probing");
    setError(null);
    try {
      const info = await probeVideo(path);
      if (token !== videoToken.current) return;
      setVideo(info);
      setForm(initialForm(info));
      setResult(null);
      setThumbs({ kind: "idle" });
    } catch (e) {
      if (token !== videoToken.current) return;
      // Se conserva el video anterior: un archivo equivocado no debe borrar la configuración.
      setError(errorMessage(e));
    } finally {
      if (token === videoToken.current) setStatus("idle");
    }
  }, []);

  const hovering = useFileDrop({
    enabled: !busy,
    onDrop: (paths) => {
      const first = paths[0];
      if (first) void loadVideo(first);
    },
  });

  const pickVideo = async () => {
    try {
      const [path] = await pickFiles({
        multiple: false,
        filters: [{ name: "Video", extensions: VIDEO_EXTENSIONS }],
        devResult: import.meta.env.DEV ? ["C:\\demo\\clip.mp4"] : undefined,
      });
      if (path) await loadVideo(path);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const chooseOutDir = async () => {
    try {
      const dir = await pickDirectory();
      if (dir) setForm((f) => ({ ...f, outDir: dir }));
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const loadThumbs = async () => {
    if (!video) return;
    const token = videoToken.current;
    setThumbs({ kind: "loading" });
    try {
      const items = await videoThumbnails({ path: video.path, count: 10, width: 240 });
      if (token === videoToken.current) setThumbs({ kind: "ready", items });
    } catch (e) {
      if (token === videoToken.current) setThumbs({ kind: "error", message: errorMessage(e) });
    }
  };

  const patch = (changes: Partial<FormState>) => setForm((f) => ({ ...f, ...changes }));

  const changeMode = (mode: ModeChoice) =>
    setForm((f) => ({
      ...f,
      mode,
      threshold: mode === "fps" ? f.threshold : THRESHOLD_PRESET[mode],
    }));

  // Validación en vivo: habilita el botón y muestra el estimado de imágenes.
  const built = useMemo(() => (video ? buildRequest(form, video, "preview") : null), [form, video]);

  const start = async () => {
    if (!video || busy) return;
    const request = buildRequest(form, video, newJobId());
    if (!request.ok) {
      setError(request.error);
      return;
    }
    const { request: payload } = request;

    setError(null);
    setResult(null);
    activeJob.current = payload.job_id;
    setJob({
      id: payload.job_id,
      startSecs: payload.start_secs,
      endSecs: payload.end_secs,
      frames: 0,
      positionSecs: payload.start_secs,
      cancelling: false,
    });
    setStatus("running");
    try {
      setResult(await extractFrames(payload));
    } catch (e) {
      setError(errorMessage(e));
    } finally {
      activeJob.current = null;
      setJob(null);
      setStatus("idle");
    }
  };

  const cancel = async () => {
    if (!job || job.cancelling) return;
    setJob({ ...job, cancelling: true });
    try {
      await cancelJob(job.id);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const reveal = async () => {
    if (!result) return;
    try {
      await revealPath(result.out_dir);
    } catch (e) {
      setError(errorMessage(e));
    }
  };

  const percent = job ? ((job.positionSecs - job.startSecs) / (job.endSecs - job.startSecs)) * 100 : 0;
  const changeMode_ = form.mode !== "fps";

  return (
    <div className={styles.stack}>
      {video ? (
        <div className={cx(styles.card, hovering && styles.cardHover)}>
          <div className={styles.cardInfo}>
            <div className={styles.cardName} title={video.path}>
              {baseName(video.path)}
            </div>
            <div className={styles.cardMeta}>
              {formatTime(video.duration_secs)} · {video.width}×{video.height}
              {video.fps !== null && ` · ${Number(video.fps.toFixed(2))} fps`}
              {video.codec && ` · ${video.codec.toUpperCase()}`}
            </div>
          </div>
          <Button onClick={() => void pickVideo()} disabled={busy}>
            Cambiar video
          </Button>
        </div>
      ) : (
        <Dropzone hovering={hovering} disabled={busy} onPick={() => void pickVideo()}>
          {status === "probing" ? "Analizando video…" : "Suelta un video aquí, o haz clic para elegirlo"}
        </Dropzone>
      )}

      {error && (
        <p role="alert" className={styles.error}>
          {error}
        </p>
      )}

      {video && (
        <>
          <section>
            <div className={styles.rowBetween}>
              <h2 className={styles.h2}>Previsualización</h2>
              <Button onClick={() => void loadThumbs()} disabled={busy || thumbs.kind === "loading"}>
                {thumbs.kind === "ready" ? "Regenerar" : "Generar"}
              </Button>
            </div>
            {thumbs.kind === "idle" && (
              <p className={styles.muted}>Genera miniaturas repartidas por el video para elegir el rango.</p>
            )}
            {thumbs.kind === "loading" && <p className={styles.muted}>Generando miniaturas…</p>}
            {thumbs.kind === "error" && <p className={styles.errorText}>{thumbs.message}</p>}
            {thumbs.kind === "ready" && (
              <Thumbnails
                items={thumbs.items}
                disabled={busy}
                onSetStart={(t) => patch({ start: formatTime(t, true) })}
                onSetEnd={(t) => patch({ end: formatTime(t, true) })}
              />
            )}
          </section>

          <section>
            <h2 className={cx(styles.h2, styles.sectionTitle)}>Opciones</h2>
            <div className={styles.grid}>
              <Field label="Desde" hint="Vacío = inicio. Ej: 1m30s, 0:01:30, 90">
                <TextInput
                  value={form.start}
                  placeholder="0:00:00"
                  disabled={busy}
                  onChange={(e) => patch({ start: e.target.value })}
                />
              </Field>
              <Field label="Hasta" hint="Vacío = fin del video">
                <TextInput
                  value={form.end}
                  placeholder={formatTime(video.duration_secs)}
                  disabled={busy}
                  onChange={(e) => patch({ end: e.target.value })}
                />
              </Field>

              <Field label="Modo">
                <Select
                  value={form.mode}
                  disabled={busy}
                  onChange={(e) => changeMode(e.target.value as ModeChoice)}
                >
                  <option value="fps">Normal (FPS constante)</option>
                  <option value="scene">Detección de escenas</option>
                  <option value="motion">Por movimiento</option>
                </Select>
              </Field>
              <Field
                label={changeMode_ ? "Máx. capturas por segundo" : "Capturas por segundo"}
                hint="Admite decimales: 0.5 = una cada 2 s"
              >
                <TextInput
                  inputMode="decimal"
                  value={form.fps}
                  disabled={busy}
                  onChange={(e) => patch({ fps: e.target.value })}
                />
              </Field>

              {changeMode_ && (
                <Field label="Sensibilidad (0–1)" hint="Menor = más frames" className={styles.full}>
                  <TextInput
                    inputMode="decimal"
                    value={form.threshold}
                    disabled={busy}
                    onChange={(e) => patch({ threshold: e.target.value })}
                  />
                </Field>
              )}

              <Field label="Calidad JPEG (1–100)" hint="100 = mejor calidad">
                <TextInput
                  inputMode="numeric"
                  value={form.quality}
                  disabled={busy}
                  onChange={(e) => patch({ quality: e.target.value })}
                />
              </Field>
              <Field label="Redimensionar" hint="Ej: 1920x1080 o 50%. Vacío = original">
                <TextInput
                  value={form.resize}
                  disabled={busy}
                  onChange={(e) => patch({ resize: e.target.value })}
                />
              </Field>

              <div className={cx(styles.outRow, styles.full)}>
                <Field label="Carpeta de salida" className={styles.grow}>
                  <TextInput
                    value={form.outDir}
                    disabled={busy}
                    onChange={(e) => patch({ outDir: e.target.value })}
                  />
                </Field>
                <Button onClick={() => void chooseOutDir()} disabled={busy}>
                  Elegir…
                </Button>
              </div>
            </div>
          </section>

          {built && !built.ok && <p className={styles.errorText}>{built.error}</p>}
          {built?.ok && (
            <>
              {built.notes.map((note) => (
                <p key={note} className={styles.note}>
                  {note}
                </p>
              ))}
              <p className={cx(styles.estimate, built.maxFrames > WARN_FRAMES && styles.warn)}>
                {changeMode_ ? "Hasta ≈ " : "≈ "}
                {built.maxFrames.toLocaleString("es")} imágenes
                {built.maxFrames > WARN_FRAMES && " — son muchas; considera bajar las capturas por segundo."}
              </p>
            </>
          )}

          {job ? (
            <div className={styles.progress}>
              <ProgressBar percent={percent} label="Progreso de la extracción" />
              <div className={styles.progressMeta}>
                <span>
                  {job.frames.toLocaleString("es")} imágenes · {formatTime(job.positionSecs)} /{" "}
                  {formatTime(job.endSecs)}
                </span>
                <Button variant="danger" onClick={() => void cancel()} disabled={job.cancelling}>
                  {job.cancelling ? "Cancelando…" : "Cancelar"}
                </Button>
              </div>
            </div>
          ) : (
            <div className={styles.actions}>
              <Button variant="primary" onClick={() => void start()} disabled={busy || !built?.ok}>
                Extraer frames
              </Button>
            </div>
          )}

          {result && (
            <div className={styles.result}>
              <p className={styles.resultText}>
                {result.cancelled ? (
                  <strong>Cancelado.</strong>
                ) : result.frames === 0 ? (
                  <strong className={styles.warn}>No se generaron imágenes.</strong>
                ) : (
                  <strong className={styles.ok}>Listo.</strong>
                )}{" "}
                {result.frames > 0 && (
                  <>
                    {result.frames.toLocaleString("es")} imágenes en {result.out_dir} (
                    {(result.elapsed_ms / 1000).toFixed(1)} s)
                  </>
                )}
                {result.frames === 0 && !result.cancelled && (
                  <>Prueba un rango más largo, más capturas por segundo o el modo normal.</>
                )}
              </p>
              {result.frames > 0 && <Button onClick={() => void reveal()}>Abrir carpeta</Button>}
            </div>
          )}
        </>
      )}
    </div>
  );
}
