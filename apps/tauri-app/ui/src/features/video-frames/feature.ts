import { lazy } from "react";
import { defineFeature } from "@/core/feature";

export default defineFeature({
  id: "video.frames",
  title: "Capturar frames de video",
  description: "Extrae imágenes de un video por tiempo: rango, capturas por segundo, calidad y tamaño.",
  category: "video",
  keywords: ["frames", "fotogramas", "capturas", "imagenes", "screenshots", "mp4", "mkv", "ffmpeg", "escenas"],
  component: lazy(() => import("./View")),
});
