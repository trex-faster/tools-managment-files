import { call, registerDevMock } from "@/core/tauri";

/** Forma tomada del main.js original; dest/error pueden venir null desde Rust (Option). */
export interface ExtractOutcome {
  archive: string;
  ok: boolean;
  dest?: string | null;
  error?: string | null;
}

declare module "@/core/tauri" {
  interface CommandMap {
    batch_extract: { args: { paths: string[] }; result: ExtractOutcome[] };
  }
}

export const ARCHIVE_FILTERS = [{ name: "Archivos comprimidos", extensions: ["zip", "rar"] }];

export function batchExtract(paths: string[]): Promise<ExtractOutcome[]> {
  return call("batch_extract", { paths });
}

if (import.meta.env.DEV) {
  // Solo para iterar la UI con `pnpm dev` en el navegador.
  registerDevMock("batch_extract", async ({ paths }) => {
    await new Promise((resolve) => setTimeout(resolve, 700));
    return paths.map((archive, i) =>
      i % 3 === 2
        ? { archive, ok: false, error: "Archivo dañado (simulado)" }
        : { archive, ok: true, dest: archive.replace(/\.(zip|rar)$/i, "") },
    );
  });
}
