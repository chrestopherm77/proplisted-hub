import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error: Error | null; errorInfo: React.ErrorInfo | null; lastPath: string }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      lastPath: typeof window !== "undefined" ? window.location.pathname : "",
    };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("[ErrorBoundary] Erro capturado:", error);
    console.error("[ErrorBoundary] Stack:", error.stack);
    console.error("[ErrorBoundary] Component stack:", info.componentStack);
    this.setState({ errorInfo: info });
  }

  componentDidMount() {
    // Reseta o erro quando o usuário navega (evita ficar preso na tela de erro)
    window.addEventListener("popstate", this.handleNavigation);
    this.pollPathChange();
  }

  componentWillUnmount() {
    window.removeEventListener("popstate", this.handleNavigation);
    if (this.pathInterval) clearInterval(this.pathInterval);
  }

  pathInterval: ReturnType<typeof setInterval> | null = null;

  pollPathChange = () => {
    // react-router usa pushState, que não dispara popstate.
    // Polling leve só pra resetar o boundary quando a rota muda.
    this.pathInterval = setInterval(() => {
      if (!this.state.hasError) {
        this.setState({ lastPath: window.location.pathname });
        return;
      }
      if (window.location.pathname !== this.state.lastPath) {
        this.setState({ hasError: false, error: null, errorInfo: null, lastPath: window.location.pathname });
      }
    }, 500);
  };

  handleNavigation = () => {
    if (this.state.hasError) {
      this.setState({ hasError: false, error: null, errorInfo: null });
    }
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      const isDev = import.meta.env.DEV;
      const message = this.state.error?.message || "Erro desconhecido";

      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "0.75rem" }}>Algo deu errado</h1>
          <p style={{ marginBottom: "1rem", color: "#666", maxWidth: 600 }}>
            Ocorreu um erro inesperado. Você pode tentar recarregar ou voltar para o início.
          </p>
          <p style={{ marginBottom: "1.5rem", color: "#b91c1c", fontSize: "0.875rem", fontFamily: "monospace", maxWidth: 700, wordBreak: "break-word" }}>
            {message}
          </p>
          {isDev && this.state.error?.stack && (
            <details style={{ marginBottom: "1.5rem", maxWidth: 800, textAlign: "left", background: "#f8f8f8", padding: "0.75rem", borderRadius: "0.5rem", fontSize: "0.75rem" }}>
              <summary style={{ cursor: "pointer", fontWeight: 600 }}>Detalhes técnicos (dev)</summary>
              <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem" }}>{this.state.error.stack}</pre>
              {this.state.errorInfo?.componentStack && (
                <pre style={{ whiteSpace: "pre-wrap", marginTop: "0.5rem", color: "#666" }}>
                  {this.state.errorInfo.componentStack}
                </pre>
              )}
            </details>
          )}
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", justifyContent: "center" }}>
            <button
              onClick={() => window.location.reload()}
              style={{ padding: "0.75rem 1.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "1rem" }}
            >
              Recarregar página
            </button>
            <button
              onClick={this.handleGoHome}
              style={{ padding: "0.75rem 1.5rem", background: "#fff", color: "#2563eb", border: "1px solid #2563eb", borderRadius: "0.5rem", cursor: "pointer", fontSize: "1rem" }}
            >
              Voltar para o início
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </React.StrictMode>
);
