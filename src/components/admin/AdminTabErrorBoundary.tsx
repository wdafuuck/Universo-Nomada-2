"use client";

import { Component, type ErrorInfo, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type Props = { children: ReactNode; tabLabel?: string };
type State = { error: Error | null };

/** Evita que un error en una pestaña tumbe todo el panel (y el tab del navegador). */
export class AdminTabErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[AdminTabErrorBoundary]", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6 text-center space-y-3">
          <p className="text-white font-semibold">
            Error en {this.props.tabLabel ?? "esta sección"}
          </p>
          <p className="text-white/60 text-sm break-words">
            {this.state.error.message || "Error inesperado"}
          </p>
          <Button
            type="button"
            className="bg-teal text-[#070f1a] font-bold"
            onClick={() => this.setState({ error: null })}
          >
            Reintentar
          </Button>
        </div>
      );
    }
    return this.props.children;
  }
}
