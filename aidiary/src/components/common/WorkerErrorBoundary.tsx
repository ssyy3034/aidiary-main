import React, { Component, ErrorInfo, ReactNode } from "react";

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Worker나 비동기 로직에서 발생하는 에러를 포착하여
 * 전체 앱이 크래시되지 않도록 보호하는 ErrorBoundary
 */
class WorkerErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Worker Error Caught:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
          <h3 className="font-bold mb-2">
            이미지 처리 중 문제가 발생했습니다.
          </h3>
          <p className="text-sm">
            {this.state.error?.message || "알 수 없는 오류"}
          </p>
          <button
            className="mt-3 px-4 py-2 bg-red-100 hover:bg-red-200 rounded text-sm transition-colors"
            onClick={() => this.setState({ hasError: false, error: null })}
          >
            다시 시도하기
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default WorkerErrorBoundary;
