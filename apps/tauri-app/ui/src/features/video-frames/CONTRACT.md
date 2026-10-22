# Contrato frontend ↔ Rust — video.frames

Lo que la UI espera del backend (Tauri v1). Los nombres de campo van en snake_case
(el valor por defecto de serde), salvo el argumento de primer nivel `jobId` (ver abajo).
Los tipos TypeScript equivalentes están en `types.ts` y `api.ts`.

## Comandos

| Comando            | Argumentos (JS)             | Respuesta           |
| ------------------ | --------------------------- | ------------------- |
| `probe_video`      | `{ path }`                  | `VideoInfo`         |
| `video_thumbnails` | `{ request: ThumbnailRequest }` | `Vec<Thumbnail>` |
| `extract_frames`   | `{ request: ExtractRequest }`   | `ExtractSummary` |
| `cancel_job`       | `{ jobId }`                 | `()`                |
| `reveal_path`      | `{ path }`                  | `()`                |

Evento (Rust → UI): `video-frames:progress` con `FrameProgress`.

## Structs sugeridas

```rust
use serde::{Deserialize, Serialize};

#[derive(Serialize)]
pub struct VideoInfo {
    pub path: String,
    pub duration_secs: f64,
    pub width: u32,
    pub height: u32,
    pub fps: Option<f64>,
    pub codec: Option<String>,
    pub suggested_out_dir: String, // <carpeta del video>/<nombre>_frames
}

#[derive(Deserialize)]
pub struct ThumbnailRequest { pub path: String, pub count: u32, pub width: u32 }

#[derive(Serialize)]
pub struct Thumbnail { pub time_secs: f64, pub data_url: String } // "data:image/jpeg;base64,..."

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum ExtractMode { Fps, Change { threshold: f64 } }

#[derive(Deserialize)]
#[serde(tag = "kind", rename_all = "snake_case")]
pub enum Resize { None, Percent { percent: f64 }, Size { width: u32, height: u32 } }

#[derive(Deserialize)]
pub struct ExtractRequest {
    pub job_id: String,
    pub path: String,
    pub out_dir: String,
    pub start_secs: f64,
    pub end_secs: f64,
    pub mode: ExtractMode,
    pub fps: f64,
    pub quality: u8, // JPEG 1..=100, mayor = mejor
    pub resize: Resize,
}

#[derive(Serialize)]
pub struct ExtractSummary { pub out_dir: String, pub frames: u32, pub cancelled: bool, pub elapsed_ms: u64 }

#[derive(Serialize, Clone)]
pub struct FrameProgress { pub job_id: String, pub position_secs: f64, pub frames: u32 }
```

## Semántica que la UI da por hecha

- **Errores:** `Err(String)` con un mensaje legible; la UI lo muestra tal cual. Un formato
  no soportado debe fallar en `probe_video`, no a mitad de la extracción.
- **No bloquear el hilo principal:** decodificar es trabajo pesado; los comandos deben ser
  `async` y mover el trabajo a `spawn_blocking` (o a un hilo propio).
- **Cancelación:** `cancel_job` marca el job; `extract_frames` termina limpiamente y
  responde `cancelled: true` con las imágenes ya escritas (no devuelve `Err`).
- **Argumento `jobId`:** en Tauri v1 el argumento de primer nivel se escribe `jobId` en JS
  y `job_id` en la firma Rust. Los campos dentro de structs no se convierten.
- **Progreso:** emitir con `window.emit("video-frames:progress", ...)`, idealmente no más de
  ~20 por segundo. `position_secs` va entre `start_secs` y `end_secs` (la barra se calcula con eso;
  el total de imágenes se desconoce en modo `change`).
- **Rango:** la UI ya valida `0 <= start < end <= duration`. `end_secs` llega recortado a la duración.
- **`fps`:** en modo `fps`, capturas por segundo; en modo `change`, tope de capturas por segundo
  entre los frames que superan `threshold` (como `select='gt(scene,T)',fps=N` del .bat).
  Los umbrales por defecto de la UI son 0.3 (escenas) y 0.1 (movimiento), tomados del .bat; con un
  detector propio no equivalen al `scene` de ffmpeg, así que la UI deja editar la sensibilidad.
- **`Resize::Size`:** ancho × alto exactos (como `scale=WxH`). `Percent` escala ambos lados.
- **Miniaturas:** `count` posiciones repartidas en `i * duration / (count + 1)`; JPEG de bajo
  peso en base64 para no depender del protocolo `asset:` ni de permisos de `fs`.
- **`reveal_path`:** abrir la carpeta en el explorador del sistema. No se usa `shell.open` del
  frontend porque su alcance por defecto en Tauri v1 solo admite URLs, no rutas locales.
- **Permisos:** el selector de carpeta usa `dialog.open`, que ya está habilitado en
  `tauri.conf.json`. No hace falta cambiar el `allowlist`.
