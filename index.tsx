
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { CartProvider } from './context/CartContext';
import { ProductProvider } from './context/ProductContext';

// Catch-all for uncaught runtime errors to assist in diagnostics
if (typeof window !== 'undefined') {
  const handleError = (errorEvent: ErrorEvent | PromiseRejectionEvent) => {
    const error = 'error' in errorEvent ? errorEvent.error : (errorEvent as PromiseRejectionEvent).reason;
    const errorMessage = error?.message || error || 'Unspecified runtime error';
    const errorStack = error?.stack || '';

    let errorDiv = document.getElementById('runtime-error-overlay');
    if (!errorDiv) {
      errorDiv = document.createElement('div');
      errorDiv.id = 'runtime-error-overlay';
      errorDiv.style.position = 'fixed';
      errorDiv.style.top = '0';
      errorDiv.style.left = '0';
      errorDiv.style.width = '100vw';
      errorDiv.style.height = '100vh';
      errorDiv.style.backgroundColor = '#fef2f2';
      errorDiv.style.color = '#991b1b';
      errorDiv.style.padding = '2rem';
      errorDiv.style.zIndex = '999999';
      errorDiv.style.overflow = 'auto';
      errorDiv.style.fontFamily = 'monospace';
      errorDiv.style.border = '4px solid #ef4444';
      
      document.body.appendChild(errorDiv);
    }
    
    errorDiv.innerHTML = `
      <h1 style="font-size: 1.5rem; margin-bottom: 1rem; font-weight: bold;">⚠️ Erro de Execução Detectado</h1>
      <p style="margin-bottom: 0.5rem; font-weight: bold;">Mensagem: ${errorMessage}</p>
      <pre style="background: #fee2e2; padding: 1rem; border-radius: 4px; overflow-x: auto; font-size: 0.85rem;">${errorStack}</pre>
      <div style="margin-top: 1.5rem;">
        <button onclick="window.location.reload()" style="background: #991b1b; color: white; border: none; padding: 0.5rem 1rem; border-radius: 4px; cursor: pointer; font-weight: bold;">
          Recarregar Página
        </button>
      </div>
    `;
  };

  window.addEventListener('error', handleError);
  window.addEventListener('unhandledrejection', handleError);
}

class ErrorBoundary extends React.Component<{ children: React.ReactNode }, { hasError: boolean; error: any }> {
  constructor(props: any) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: any) {
    return { hasError: true, error };
  }

  componentDidCatch(error: any, errorInfo: any) {
    console.error("ErrorBoundary caught an error", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-8">
          <div className="max-w-2xl w-full bg-white border border-red-200 rounded-lg shadow-lg p-6">
            <h1 className="text-2xl font-bold text-red-800 mb-4 flex items-center">
              ⚠️ Um erro ocorreu na interface
            </h1>
            <p className="text-gray-700 font-semibold mb-2">Detalhes:</p>
            <pre className="bg-red-50 p-4 rounded text-red-700 font-mono text-xs overflow-x-auto mb-6">
              {this.state.error?.message || String(this.state.error)}
              {"\n\n"}
              {this.state.error?.stack}
            </pre>
            <button
              onClick={() => window.location.reload()}
              className="bg-red-700 text-white font-semibold px-4 py-2 rounded hover:bg-red-800 transition-colors"
            >
              Tentará recarregar a página
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <ErrorBoundary>
      <ProductProvider>
        <CartProvider>
          <App />
        </CartProvider>
      </ProductProvider>
    </ErrorBoundary>
  </React.StrictMode>
);
