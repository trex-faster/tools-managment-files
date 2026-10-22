import { useCallback, useState } from "react";
import { FEATURES, getFeature } from "@/core/registry";
import styles from "./App.module.css";
import { FeatureHost } from "./FeatureHost";
import { Sidebar } from "./Sidebar";

const LAST_KEY = "mikit.lastFeature";

function readLast(): string | undefined {
  try {
    return localStorage.getItem(LAST_KEY) ?? undefined;
  } catch {
    return undefined;
  }
}

function writeLast(id: string): void {
  try {
    localStorage.setItem(LAST_KEY, id);
  } catch {
    /* almacenamiento no disponible: se ignora */
  }
}

export function App() {
  const [activeId, setActiveId] = useState<string | undefined>(() => {
    const last = readLast();
    return last && getFeature(last) ? last : FEATURES[0]?.id;
  });

  const select = useCallback((id: string) => {
    setActiveId(id);
    writeLast(id);
  }, []);

  const feature = activeId ? getFeature(activeId) : undefined;

  return (
    <div className={styles.app}>
      <Sidebar activeId={activeId} onSelect={select} />
      <main className={styles.content}>
        {feature ? <FeatureHost feature={feature} /> : <p>No hay funcionalidades registradas.</p>}
      </main>
    </div>
  );
}
