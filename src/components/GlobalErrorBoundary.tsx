import React, { Component, ReactNode } from "react";
import { reportLovableError } from "@/lib/lovable-error-reporting";

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class GlobalErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("GlobalErrorBoundary caught an exception:", error, errorInfo);
    reportLovableError(error, {
      componentStack: errorInfo.componentStack,
      boundary: "GlobalErrorBoundary",
    });
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div
          dir="rtl"
          className="flex min-h-screen items-center justify-center bg-brand-bg px-4 py-12"
        >
          <div className="max-w-md w-full bg-card p-6 rounded-3xl border border-brand-dark/10 shadow-xl text-center space-y-4">
            <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full flex items-center justify-center mx-auto font-black text-2xl">
              ⚠️
            </div>
            <h1 className="text-xl font-bold text-brand-dark">حدث خطأ غير متوقع في التطبيق</h1>
            <p className="text-xs text-muted-foreground leading-relaxed">
              تم تسجيل الخطأ بنجاح. يمكنك إعادة تحميل الجزء المتأثر أو العودة للصفحة الرئيسية.
            </p>
            {this.state.error?.message && (
              <div
                className="bg-secondary/50 p-3 rounded-xl text-left font-mono text-[11px] text-muted-foreground overflow-x-auto max-h-32 text-xs"
                dir="ltr"
              >
                {this.state.error.message}
              </div>
            )}
            <div className="flex flex-wrap gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={this.handleReset}
                className="bg-brand-dark text-brand-bg font-extrabold px-5 py-2.5 rounded-xl text-xs hover:bg-brand-primary transition"
              >
                إعادة المحاولة
              </button>
              <button
                type="button"
                onClick={() => (window.location.href = "/")}
                className="bg-secondary text-brand-dark font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-secondary/80 transition"
              >
                الرئيسية
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
