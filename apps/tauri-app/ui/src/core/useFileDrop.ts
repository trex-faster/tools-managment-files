import { useEffect, useRef, useState } from "react";
import { subscribe } from "./tauri";

interface Options {
  onDrop: (paths: string[]) => void;
  /** Con false se desuscribe (por ejemplo mientras hay un trabajo en curso). */
  enabled?: boolean;
}

/**
 * Arrastrar y soltar archivos del sistema sobre la ventana.
 * Los eventos de Tauri v1 son de toda la ventana, por eso solo la funcionalidad
 * montada escucha. Devuelve true mientras hay archivos sobre la ventana.
 */
export function useFileDrop({ onDrop, enabled = true }: Options): boolean {
  const [hovering, setHovering] = useState(false);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  });

  useEffect(() => {
    if (!enabled) {
      setHovering(false);
      return;
    }
    const unsubscribers = [
      subscribe("tauri://file-drop", (paths) => {
        setHovering(false);
        onDropRef.current(paths);
      }),
      subscribe("tauri://file-drop-hover", () => setHovering(true)),
      subscribe("tauri://file-drop-cancelled", () => setHovering(false)),
    ];
    return () => unsubscribers.forEach((off) => off());
  }, [enabled]);

  return hovering;
}
