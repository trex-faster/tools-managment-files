import { Component, Suspense, type ErrorInfo, type ReactNode } from "react";
import type { RegisteredFeature } from "@/core/registry";
import styles from "./FeatureHost.module.css";

interface BoundaryState {
  error: Error | null;
}

/** Aísla fallos: una funcionalidad rota no tumba el resto de la app. */
class ErrorBoundary extends Component<{ children: ReactNode }, BoundaryState> {
  override state: BoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): BoundaryState {
    return { error };
  }

  override componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error(error, info.componentStack);
  }

  override render(): ReactNode {
    if (this.state.error) {
      return (
        <div role="alert" className={styles.crash}>
          <strong>Esta funcionalidad falló al mostrarse.</strong>
          <pre>{this.state.error.message}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

export function FeatureHost({ feature }: { feature: RegisteredFeature }) {
  return (
    <ErrorBoundary key={feature.id}>
      <header>
        <h1 className={styles.title}>{feature.title}</h1>
        <p className={styles.subtitle}>{feature.description}</p>
      </header>
      <Suspense fallback={<p className={styles.subtitle}>Cargando…</p>}>
        <feature.component />
      </Suspense>
    </ErrorBoundary>
  );
}
