import { lazy } from "react";
import { defineFeature } from "@/core/feature";

export default defineFeature({
  id: "archive.batch-extract",
  title: "Extracción por lotes",
  description: "Arrastra varios .zip / .rar aquí. Cada uno se extrae a su propia carpeta.",
  category: "archive",
  keywords: ["zip", "rar", "descomprimir", "extraer", "unzip", "lote"],
  component: lazy(() => import("./View")),
});
