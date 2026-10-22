# mikit — frontend

Vite + React + TypeScript (strict). El código fuente está en `ui/`; se compila a `dist/`,
que es lo que `src-tauri/tauri.conf.json` ya consume. `dist/` es salida generada (ignorada por git).

## Comandos

```
pnpm install
pnpm dev        # UI en el navegador (http://localhost:1420) con datos simulados, sin Tauri
pnpm watch      # recompila dist/ en cada cambio; úsalo junto a `cargo tauri dev`
pnpm build      # typecheck + build de producción
```

Orden obligatorio: `pnpm build` **antes** de `cargo tauri build`/`cargo build`, porque
Tauri v1 embebe `dist/` al compilar y `tauri.conf.json` no lanza el build del frontend
(`beforeBuildCommand` está vacío). Lo mismo en CI.

## Agregar una funcionalidad (sin editar archivos existentes)

1. Crear `ui/src/features/<nombre>/` con:
   - `feature.ts` — `export default defineFeature({ id, title, description, category, keywords, component: lazy(() => import("./View")) })`
   - `View.tsx` — el componente (export default)
   - `api.ts` — contrato con Rust: amplía `CommandMap` y expone funciones tipadas
2. Si la categoría no existe, añadirla en `ui/src/core/categories.ts`.

Se registra sola (`import.meta.glob`), aparece en el menú y en el buscador (Ctrl+K).
Un `id` duplicado hace fallar el arranque con el nombre de ambos archivos.

## Reglas

- Nada importa `@tauri-apps/api` fuera de `ui/src/core/tauri.ts`.
- `@tauri-apps/api` debe quedarse en 1.x mientras el backend sea Tauri v1.
- Estilos con CSS Modules (`*.module.css`); colores desde las variables de `styles/global.css`.
- Componentes reutilizables en `ui/src/components/`, hooks de Tauri en `ui/src/core/`.
