import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error caught by ErrorBoundary:', error, errorInfo);
    this.setState({ errorInfo });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    window.location.reload();
  };

  private handleClearAndReset = () => {
    try {
      localStorage.clear();
    } catch {}
    window.location.reload();
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-[#1F120C] text-[#F5EDE6] flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-[#2C1911] border border-[#5A3828] rounded-2xl p-6 shadow-2xl text-center space-y-4">
            <div className="w-14 h-14 mx-auto rounded-full bg-amber-950/60 border border-amber-600/40 flex items-center justify-center text-amber-400">
              <AlertTriangle className="w-7 h-7" />
            </div>

            <div className="space-y-1">
              <h2 className="text-xl font-bold text-[#FAF6F2]">
                KENNY Brew Intelligence
              </h2>
              <p className="text-xs text-[#D8C1A8]">
                A view component experienced an unexpected issue. Your data is safely preserved.
              </p>
            </div>

            {this.state.error && (
              <div className="p-3 bg-[#1F120C] rounded-lg text-left text-xs font-mono text-[#E2BA97] overflow-auto max-h-28 border border-[#44281B]">
                {this.state.error.message}
              </div>
            )}

            <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 py-2.5 px-4 bg-[#8A4A28] hover:bg-[#A35932] text-white font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-sm"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Reload Application</span>
              </button>

              <button
                onClick={this.handleClearAndReset}
                className="py-2.5 px-3 bg-[#3F2417] hover:bg-[#4F2E1E] text-[#D8C1A8] hover:text-white text-xs rounded-lg transition-colors cursor-pointer border border-[#5A3828]"
                title="Wipe local cache if issue persists"
              >
                Reset Cache
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
