/**
 * Categorías del menú. El orden de este arreglo es el orden en pantalla.
 * Una funcionalidad con una categoría que no esté aquí no compila.
 */
export const CATEGORIES = [
  { id: "archive", label: "Archivos comprimidos" },
  { id: "video", label: "Video" },
  { id: "files", label: "Archivos y carpetas" },
  { id: "network", label: "Red" },
  { id: "security", label: "Seguridad" },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]["id"];
