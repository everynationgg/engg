import React from "react";
import { systemToast } from "@/components/common/SystemToast";

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    systemToast("A temporary UI glitch occurred.", "error", 5000);
    console.error("[ErrorBoundary caught error]:", error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  handleGoHome = () => {
    this.setState({ hasError: false, error: null });
    window.location.href = "/";
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-6 text-center">
          <div className="max-w-md w-full bg-slate-900/90 border border-red-500/30 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
            <div className="w-12 h-12 mx-auto mb-4 rounded-full bg-red-500/10 flex items-center justify-center text-red-400">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-white mb-2">Something interrupted the screen</h2>
            <p className="text-sm text-slate-400 mb-6">
              A temporary display glitch occurred. You can try reloading this view or return to the main lobby.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                type="button"
                onClick={this.handleReset}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white font-medium text-sm transition-all shadow-lg shadow-cyan-600/20"
              >
                Try Again
              </button>
              <button
                type="button"
                onClick={this.handleGoHome}
                className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 active:scale-95 text-slate-300 font-medium text-sm transition-all border border-slate-700"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

interface SafeBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name?: string;
  label?: string;
}

interface SafeBoundaryState {
  hasError: boolean;
}

/**
 * Lightweight silent boundary for non-gameplay subsystems (audio controller,
 * background effects, secondary modals) so a peripheral UI error never unmounts
 * an active match.
 */
export class SafeBoundary extends React.Component<SafeBoundaryProps, SafeBoundaryState> {
  constructor(props: SafeBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(): SafeBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.warn("[SafeBoundary isolated error]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback ?? null;
    }
    return this.props.children;
  }
}


