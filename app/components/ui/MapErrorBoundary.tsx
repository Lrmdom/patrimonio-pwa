/**
 * Error Boundary para componentes de mapa
 * Melhora UX e debugging quando ocorrem erros
 */

import React, { Component, type ErrorInfo, type ReactNode } from 'react';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error?: Error;
  errorInfo?: ErrorInfo;
  retryCount: number;
}

export class MapErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error: Error): Partial<State> {
    return {
      hasError: true,
      error
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log para debugging
    console.error('Map Error Boundary caught an error:', error, errorInfo);
    
    // Notificar componente pai
    this.props.onError?.(error, errorInfo);
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: undefined,
      errorInfo: undefined,
      retryCount: prevState.retryCount + 1
    }));
  };

  render() {
    if (this.state.hasError) {
      // Se foi fornecido fallback personalizado
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Fallback padrão
      return (
        <div className="flex flex-col items-center justify-center p-8 bg-red-50 border border-red-200 rounded-lg min-h-[400px]">
          <div className="text-red-600 text-4xl mb-4">🗺️</div>
          <h3 className="text-red-800 font-semibold text-lg mb-2">
            Erro no Mapa
          </h3>
          <p className="text-red-600 text-center mb-4 max-w-md">
            Não foi possível carregar o mapa. Isso pode ser devido a problemas de conexão 
            ou configuração de geolocalização.
          </p>
          
          {process.env.NODE_ENV === 'development' && this.state.error && (
            <details className="mb-4 text-left">
              <summary className="cursor-pointer text-red-700 font-mono text-sm mb-2">
                Detalhes do Erro (Development)
              </summary>
              <div className="bg-red-100 p-3 rounded text-xs font-mono text-red-800 overflow-auto max-h-32">
                <div className="font-bold mb-1">Error:</div>
                <div className="mb-2">{this.state.error.message}</div>
                {this.state.error.stack && (
                  <>
                    <div className="font-bold mb-1">Stack:</div>
                    <div className="whitespace-pre-wrap">{this.state.error.stack}</div>
                  </>
                )}
              </div>
            </details>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={this.handleRetry}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
              disabled={this.state.retryCount >= 3}
            >
              {this.state.retryCount >= 3 ? 'Máximo de tentativas' : 'Tentar Novamente'}
            </button>
            
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            >
              Recarregar Página
            </button>
          </div>
          
          {this.state.retryCount > 0 && (
            <p className="text-red-500 text-sm mt-3">
              Tentativas: {this.state.retryCount}/3
            </p>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}

// Hook funcional para uso mais simples
export function withMapErrorBoundary<T extends object>(
  Component: React.ComponentType<T>,
  fallback?: ReactNode
) {
  return function WrappedComponent(props: T) {
    return (
      <MapErrorBoundary fallback={fallback}>
        <Component {...props} />
      </MapErrorBoundary>
    );
  };
}
