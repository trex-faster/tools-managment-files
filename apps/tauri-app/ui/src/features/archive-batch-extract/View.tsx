import { useCallback, useRef, useState } from "react";
import { Dropzone } from "@/components/Dropzone";
import { errorMessage, pickFiles } from "@/core/tauri";
import { useFileDrop } from "@/core/useFileDrop";
import { ARCHIVE_FILTERS, batchExtract, type ExtractOutcome } from "./api";
import styles from "./View.module.css";

type State =
  | { kind: "idle" }
  | { kind: "running"; total: number }
  | { kind: "done"; outcomes: ExtractOutcome[] }
  | { kind: "failed"; message: string };

export default function View() {
  const [state, setState] = useState<State>({ kind: "idle" });
  const busy = useRef(false);

  const run = useCallback(async (paths: string[]) => {
    if (busy.current || paths.length === 0) return;
    busy.current = true;
    setState({ kind: "running", total: paths.length });
    try {
      setState({ kind: "done", outcomes: await batchExtract(paths) });
    } catch (error) {
      setState({ kind: "failed", message: errorMessage(error) });
    } finally {
      busy.current = false;
    }
  }, []);

  const pick = useCallback(async () => {
    try {
      await run(await pickFiles({ multiple: true, filters: ARCHIVE_FILTERS }));
    } catch (error) {
      setState({ kind: "failed", message: errorMessage(error) });
    }
  }, [run]);

  const running = state.kind === "running";
  const hovering = useFileDrop({ onDrop: run, enabled: !running });

  return (
    <>
      <Dropzone hovering={hovering} disabled={running} onPick={pick}>
        Suelta los archivos aquí, o haz clic para elegirlos
      </Dropzone>

      {state.kind === "running" && (
        <p className={styles.summary}>Extrayendo {state.total} archivo(s)...</p>
      )}

      {state.kind === "failed" && (
        <p className={`${styles.summary} ${styles.fail}`}>Error: {state.message}</p>
      )}

      {state.kind === "done" && (
        <>
          <ul className={styles.list}>
            {state.outcomes.map((outcome, index) => (
              <li key={`${index}:${outcome.archive}`} className={styles.row}>
                <span className={styles.name}>{outcome.archive}</span>
                <span className={outcome.ok ? styles.ok : styles.fail}>
                  {outcome.ok ? `✓ ${outcome.dest ?? ""}` : `✗ ${outcome.error ?? "Error desconocido"}`}
                </span>
              </li>
            ))}
          </ul>
          <p className={styles.summary}>
            {state.outcomes.filter((o) => o.ok).length}/{state.outcomes.length} archivos extraídos
            correctamente.
          </p>
        </>
      )}
    </>
  );
}
