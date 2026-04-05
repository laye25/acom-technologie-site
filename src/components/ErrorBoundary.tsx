import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null
    };
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      let errorMessage = "Une erreur inattendue s'est produite.";
      let errorDetails = "";
      
      try {
        if (this.state.error?.message) {
          const parsedError = JSON.parse(this.state.error.message);
          if (parsedError.error) {
            errorDetails = parsedError.error;
            if (errorDetails.includes('Missing or insufficient permissions')) {
              errorMessage = "Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
            }
          }
        } else if (this.state.error) {
          errorDetails = this.state.error.toString();
        }
      } catch (e) {
        errorDetails = this.state.error?.message || this.state.error?.toString() || "";
      }

      return (
        <div className="min-h-[400px] flex items-center justify-center p-8">
          <div className="bg-red-50 border border-red-100 rounded-3xl p-8 max-w-md text-center">
            <h2 className="text-2xl font-bold text-red-900 mb-4">Oups !</h2>
            <p className="text-red-700 mb-4">{errorMessage}</p>
            {errorDetails && (
              <p className="text-[10px] text-red-400 font-mono mb-6 break-all max-w-xs mx-auto opacity-50">
                {errorDetails}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all"
            >
              Recharger la page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
