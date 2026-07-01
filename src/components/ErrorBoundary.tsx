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
          const message = this.state.error.message;
          
          if (message.includes('removeChild') || message.includes('Node')) {
            errorMessage = "Une extension de navigateur (comme Google Traduction) perturbe l'affichage.";
            errorDetails = "Veuillez désactiver la traduction automatique ou vos extensions pour ce site.";
          } else {
            try {
              const parsedError = JSON.parse(message);
              if (parsedError.error) {
                errorDetails = parsedError.error;
                if (errorDetails.includes('Missing or insufficient permissions')) {
                  errorMessage = "Vous n'avez pas les permissions nécessaires pour effectuer cette action.";
                }
              }
            } catch (e) {
              errorDetails = message;
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
              <div className="text-[10px] text-red-400 font-mono mb-6 max-w-lg mx-auto opacity-75 bg-red-100/50 p-4 rounded-xl text-left overflow-auto max-h-48 whitespace-pre-wrap">
                <p className="font-bold">{errorDetails}</p>
                {this.state.error?.stack && (
                  <p className="mt-2 text-[9px] text-red-500/70">{this.state.error.stack}</p>
                )}
              </div>
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
