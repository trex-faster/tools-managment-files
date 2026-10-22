import type { ComponentType, LazyExoticComponent } from "react";
import type { CategoryId } from "./categories";

export interface FeatureDef {
  /** Estable y único. Convención: "<categoria>.<nombre>". */
  id: string;
  title: string;
  /** Subtítulo bajo el título; también se usa en la búsqueda. */
  description: string;
  category: CategoryId;
  /** Sinónimos para el buscador. */
  keywords?: readonly string[];
  /** Siempre con lazy(): la UI de cada funcionalidad se carga al abrirla. */
  component: LazyExoticComponent<ComponentType>;
}

export function defineFeature(def: FeatureDef): FeatureDef {
  return def;
}
