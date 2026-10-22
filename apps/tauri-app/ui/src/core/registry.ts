import { CATEGORIES } from "./categories";
import type { FeatureDef } from "./feature";
import { normalize } from "./search";

export interface RegisteredFeature extends FeatureDef {
  readonly searchText: string;
}

// Cada carpeta features/<nombre>/ con un feature.ts se registra sola.
// Solo se cargan los metadatos; la UI (lazy) se descarga al abrir la funcionalidad.
const modules = import.meta.glob<{ default?: FeatureDef }>(
  "../features/*/feature.ts",
  { eager: true },
);

function build(): RegisteredFeature[] {
  const origin = new Map<string, string>();
  const features: RegisteredFeature[] = [];

  for (const [path, mod] of Object.entries(modules)) {
    const def = mod.default;
    if (!def) {
      throw new Error(`${path}: debe exportar por defecto defineFeature({...})`);
    }
    const previous = origin.get(def.id);
    if (previous) {
      throw new Error(
        `Id de funcionalidad duplicado "${def.id}" en ${previous} y ${path}`,
      );
    }
    origin.set(def.id, path);

    const category = CATEGORIES.find((c) => c.id === def.category);
    features.push({
      ...def,
      searchText: normalize(
        [def.title, def.description, category?.label ?? "", ...(def.keywords ?? [])].join(" "),
      ),
    });
  }

  return features.sort((a, b) => a.title.localeCompare(b.title, "es"));
}

export const FEATURES: readonly RegisteredFeature[] = build();

const byId = new Map(FEATURES.map((f) => [f.id, f]));

export function getFeature(id: string): RegisteredFeature | undefined {
  return byId.get(id);
}
