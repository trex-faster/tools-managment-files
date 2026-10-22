import { call, emitDevEvent, registerDevMock } from "@/core/tauri";
import { formatTime } from "./time";
import type {
  ExtractRequest,
  ExtractSummary,
  FrameProgress,
  Thumbnail,
  ThumbnailRequest,
  VideoInfo,
} from "./types";

declare module "@/core/tauri" {
  interface CommandMap {
    probe_video: { args: { path: string }; result: VideoInfo };
    video_thumbnails: { args: { request: ThumbnailRequest }; result: Thumbnail[] };
    extract_frames: { args: { request: ExtractRequest }; result: ExtractSummary };
    // Tauri v1 convierte job_id (Rust) <-> jobId (JS) solo en los argumentos de primer nivel.
    cancel_job: { args: { jobId: string }; result: null };
    reveal_path: { args: { path: string }; result: null };
  }
  interface EventMap {
    "video-frames:progress": FrameProgress;
  }
}

/** Extensiones del selector. Ajústalas a lo que realmente decodifique tu backend. */
export const VIDEO_EXTENSIONS = ["mp4", "mkv", "mov", "avi", "webm"];

export function probeVideo(path: string): Promise<VideoInfo> {
  return call("probe_video", { path });
}

export function videoThumbnails(request: ThumbnailRequest): Promise<Thumbnail[]> {
  return call("video_thumbnails", { request });
}

export function extractFrames(request: ExtractRequest): Promise<ExtractSummary> {
  return call("extract_frames", { request });
}

export async function cancelJob(jobId: string): Promise<void> {
  await call("cancel_job", { jobId });
}

export async function revealPath(path: string): Promise<void> {
  await call("reveal_path", { path });
}

// --- Simulación para `pnpm dev` en el navegador (sin Rust) --------------------

if (import.meta.env.DEV) {
  const MOCK_DURATION = 754.3;
  const sleep = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));
  const cancelled = new Set<string>();

  const mockThumbnail = (time: number): string => {
    const hue = Math.round((time / MOCK_DURATION) * 300);
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" width="240" height="135">` +
      `<rect width="240" height="135" fill="hsl(${hue} 40% 30%)"/>` +
      `<text x="120" y="75" font-family="sans-serif" font-size="22" fill="#fff" text-anchor="middle">${formatTime(time)}</text>` +
      `</svg>`;
    return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  };

  registerDevMock("probe_video", async ({ path }) => {
    await sleep(400);
    return {
      path,
      duration_secs: MOCK_DURATION,
      width: 1920,
      height: 1080,
      fps: 29.97,
      codec: "h264",
      suggested_out_dir: `${path.replace(/\.[^.\\/]+$/, "")}_frames`,
    };
  });

  registerDevMock("video_thumbnails", async ({ request }) => {
    await sleep(600);
    return Array.from({ length: request.count }, (_, i) => {
      const time = ((i + 1) * MOCK_DURATION) / (request.count + 1);
      return { time_secs: time, data_url: mockThumbnail(time) };
    });
  });

  registerDevMock("extract_frames", async ({ request }) => {
    const startedAt = performance.now();
    const elapsed = () => Math.round(performance.now() - startedAt);
    const step = Math.max((request.end_secs - request.start_secs) / 60, 0.01);
    let frames = 0;

    for (let position = request.start_secs; position < request.end_secs; position += step) {
      if (cancelled.delete(request.job_id)) {
        return { out_dir: request.out_dir, frames, cancelled: true, elapsed_ms: elapsed() };
      }
      await sleep(60);
      frames += Math.max(1, Math.round(step * request.fps));
      emitDevEvent("video-frames:progress", { job_id: request.job_id, position_secs: position, frames });
    }
    return { out_dir: request.out_dir, frames, cancelled: false, elapsed_ms: elapsed() };
  });

  registerDevMock("cancel_job", ({ jobId }) => {
    cancelled.add(jobId);
    return null;
  });

  registerDevMock("reveal_path", () => null);
}
