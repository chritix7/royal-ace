"use client";

import { Component, type ReactNode } from "react";

/**
 * Classe car React n'accepte pas (encore) les error boundaries en composant
 * fonctionnel. Attrape toute erreur de rendu ou de cycle de vie des enfants
 * et affiche un fallback plutôt que l'écran blanc / l'overlay Next.
 *
 * Les stores (wallet, achievements, etc.) restent intacts côté localStorage,
 * donc "Reload" ramène l'utilisateur à l'état où il était avant le crash.
 */
type Props = {
  /** Nom lisible du module en crash, affiché dans le fallback. */
  label?: string;
  /** Contenu normal à afficher tant que rien ne crash. */
  children: ReactNode;
  /** Fallback personnalisé ; sinon on affiche le fallback générique. */
  fallback?: ReactNode;
};

type State = {
  error: Error | null;
};

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string | null }) {
    console.error(
      `ErrorBoundary caught in ${this.props.label ?? "unknown"}:`,
      error,
      info.componentStack,
    );
  }

  reset = () => {
    this.setState({ error: null });
  };

  reload = () => {
    if (typeof window !== "undefined") window.location.reload();
  };

  render() {
    const { error } = this.state;

    if (!error) return this.props.children;
    if (this.props.fallback) return this.props.fallback;

    return (
      <div
        role="alert"
        className="mx-auto flex max-w-md flex-col items-center gap-4 rounded-3xl border border-[#d7b45b]/40 bg-[#101713]/90 p-6 text-center shadow-2xl"
      >
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-[#e5c779]">
          Something broke
        </p>

        <h2 className="text-lg font-bold text-white">
          {this.props.label
            ? `The ${this.props.label} crashed`
            : "A piece of the app crashed"}
        </h2>

        <p className="text-sm text-white/60">
          Your chips, achievements and progress are safe — they live in local
          storage. Reload the page to pick up where you left off.
        </p>

        {error.message && (
          <p className="w-full break-words rounded-xl border border-white/10 bg-black/30 px-3 py-2 text-left text-[11px] font-mono text-white/60">
            {error.message}
          </p>
        )}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={this.reset}
            className="rounded-xl border border-white/20 bg-white/[0.04] px-4 py-2 text-xs font-bold text-white/85 transition hover:border-[#d7b45b] hover:text-[#e5c779]"
          >
            Try again
          </button>

          <button
            type="button"
            onClick={this.reload}
            className="rounded-xl border border-[#d7b45b] bg-[#d7b45b] px-4 py-2 text-xs font-bold text-[#10130e] transition hover:bg-[#efd58c]"
          >
            Reload
          </button>
        </div>
      </div>
    );
  }
}
