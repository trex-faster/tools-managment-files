/**
 * Única puerta hacia Tauri v1. Ninguna funcionalidad importa @tauri-apps/api
 * directamente: todo pasa por aquí, tipado.
 */
import { open as openDialog } from "@tauri-apps/api/dialog";
import { listen, type UnlistenFn } from "@tauri-apps/api/event";
import { invoke } from "@tauri-apps/api/tauri";

/**
 * Contrato de comandos Rust. Cada funcionalidad lo amplía en su propio api.ts:
 *
 *   declare module "@/core/tauri" {
 *     interface CommandMap {
 *       mi_comando: { args: { ruta: string }; result: string };
 *     }
 *   }
 */
// eslint-disable-next-line @typescript-eslint/no-empty-object-type
export interface CommandMap {}

/** Eventos que emite Tauri/Rust y su payload. También ampliable por funcionalidad. */
export interface EventMap {
  "tauri://file-drop": string[];
  "tauri://file-drop-hover": string[];
  "tauri://file-drop-cancelled": null;
}

type ArgsOf<K extends keyof CommandMap> = CommandMap[K] extends { args: infer A } ? A : never;
type ResultOf<K extends keyof CommandMap> = CommandMap[K] extends { result: infer R } ? R : never;

export function isTauri(): boolean {
  return typeof window !== "undefined" && "__TAURI_IPC__" in window;
}

// --- Simulación solo para `pnpm dev` en el navegador (sin Tauri) -------------

const devMocks = new Map<string, (args: unknown) => unknown>();

export function registerDevMock<K extends keyof CommandMap>(
  command: K,
  handler: (args: ArgsOf<K>) => ResultOf<K> | Promise<ResultOf<K>>,
): void {
  devMocks.set(command, handler as unknown as (args: unknown) => unknown);
}

const devListeners = new Map<string, Set<(payload: unknown) => void>>();

/** Emite un evento simulado a quienes hicieron subscribe() en el navegador. */
export function emitDevEvent<K extends keyof EventMap>(event: K, payload: EventMap[K]): void {
  devListeners.get(event)?.forEach((handler) => handler(payload));
}

// -----------------------------------------------------------------------------

export async function call<K extends keyof CommandMap>(
  command: K,
  args: ArgsOf<K>,
): Promise<ResultOf<K>> {
  if (isTauri()) {
    return invoke<ResultOf<K>>(command, args as Record<string, unknown>);
  }
  const mock = import.meta.env.DEV ? devMocks.get(command) : undefined;
  if (!mock) {
    throw new Error(`Comando "${command}" no disponible fuera de Tauri`);
  }
  return (await mock(args)) as ResultOf<K>;
}

export interface PickFilesOptions {
  multiple?: boolean;
  filters?: Array<{ name: string; extensions: string[] }>;
  /** Solo se usa en `pnpm dev` en el navegador, donde no hay diálogo nativo. */
  devResult?: string[];
}

/** Diálogo nativo de selección. Devuelve [] si el usuario cancela. */
export async function pickFiles(options: PickFilesOptions = {}): Promise<string[]> {
  if (!isTauri()) {
    if (import.meta.env.DEV) {
      return options.devResult ?? ["C:\\demo\\uno.zip", "C:\\demo\\dos.rar", "C:\\demo\\tres.zip"];
    }
    throw new Error("El diálogo de archivos solo existe dentro de Tauri");
  }
  const selected = await openDialog({
    multiple: options.multiple ?? true,
    filters: options.filters,
  });
  if (selected === null) return [];
  return Array.isArray(selected) ? selected : [selected];
}

/** Diálogo nativo para elegir una carpeta. Devuelve null si el usuario cancela. */
export async function pickDirectory(options: { devResult?: string } = {}): Promise<string | null> {
  if (!isTauri()) {
    if (import.meta.env.DEV) return options.devResult ?? "C:\\demo\\salida";
    throw new Error("El diálogo de carpetas solo existe dentro de Tauri");
  }
  const selected = await openDialog({ directory: true, multiple: false });
  return typeof selected === "string" ? selected : null;
}

/** Suscribe a un evento; devuelve la función para cancelar (segura aunque aún no se haya resuelto listen). */
export function subscribe<K extends keyof EventMap>(
  event: K,
  handler: (payload: EventMap[K]) => void,
): () => void {
  if (!isTauri()) {
    if (!import.meta.env.DEV) return () => {};
    const listeners = devListeners.get(event) ?? new Set<(payload: unknown) => void>();
    const wrapped = handler as (payload: unknown) => void;
    listeners.add(wrapped);
    devListeners.set(event, listeners);
    return () => {
      listeners.delete(wrapped);
    };
  }

  let unlisten: UnlistenFn | undefined;
  let disposed = false;

  listen<EventMap[K]>(event, (e) => handler(e.payload))
    .then((fn) => {
      if (disposed) fn();
      else unlisten = fn;
    })
    .catch((err: unknown) => console.error(`listen(${event}) falló`, err));

  return () => {
    disposed = true;
    unlisten?.();
  };
}

/** Los errores de Rust llegan normalmente como string. */
export function errorMessage(error: unknown): string {
  if (typeof error === "string") return error;
  if (error instanceof Error) return error.message;
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}
