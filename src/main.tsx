import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error("ErrorBoundary caught:", error, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "2rem", textAlign: "center", fontFamily: "system-ui, sans-serif" }}>
          <h1 style={{ fontSize: "1.5rem", marginBottom: "1rem" }}>Algo deu errado</h1>
          <p style={{ marginBottom: "1.5rem", color: "#666" }}>Ocorreu um erro inesperado. Tente recarregar a página.</p>
          <button
            onClick={() => window.location.reload()}
            style={{ padding: "0.75rem 1.5rem", background: "#2563eb", color: "#fff", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "1rem" }}
          >
            Recarregar página
          </button>
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
