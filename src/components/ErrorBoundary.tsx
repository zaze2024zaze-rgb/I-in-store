import React, { Component, ErrorInfo, ReactNode } from 'react';
import { AlertCircle, RefreshCw, Home, ShieldAlert } from 'lucide-react';

interface Props {
  children: ReactNode;
  fallbackTitle?: string;
  onReset?: () => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an unhandled error:', error, errorInfo);
  }

  private handleReset = () => {
    this.setState({ hasError: false, error: null });
    if (this.props.onReset) {
      this.props.onReset();
    } else {
      window.location.reload();
    }
  };

  public render() {
    if (this.state.hasError) {
      return (
        <div 
          className="min-h-[500px] flex items-center justify-center p-6 bg-[#F7F5F0] text-right font-sans"
          dir="rtl"
        >
          <div className="max-w-md w-full bg-white rounded-2xl p-6 sm:p-8 shadow-xl border border-[#E0D9CE] space-y-5 text-center">
            <div className="w-14 h-14 mx-auto rounded-full bg-[#FAF4EE] text-[#A34E36] flex items-center justify-center border border-[#F3DFD6]">
              <ShieldAlert className="w-7 h-7" />
            </div>

            <div className="space-y-2">
              <h2 className="text-lg font-extrabold text-[#111111]">
                {this.props.fallbackTitle || 'تم استعادة النظام بأمان'}
              </h2>
              <p className="text-xs text-[#666666] leading-relaxed">
                حدث تنبيه عارض أثناء معالجة هذه الصفحة، وتم الحفاظ على كافة بيانات المتجر والمنتجات بأمان دون أي فقدان.
              </p>
              {this.state.error?.message && (
                <div className="p-2.5 bg-[#FAF8F5] rounded-xl border border-[#EDE8DC] text-[11px] font-mono text-[#8B6B3F] text-left overflow-x-auto">
                  {this.state.error.message}
                </div>
              )}
            </div>

            <div className="flex flex-col sm:flex-row gap-2 pt-2">
              <button
                onClick={this.handleReset}
                className="flex-1 flex items-center justify-center gap-2 bg-[#111111] hover:bg-[#2A2A2A] text-white py-2.5 px-4 rounded-xl text-xs font-bold transition-all shadow-md cursor-pointer"
              >
                <RefreshCw className="w-4 h-4 text-[#C5A880]" />
                <span>إعادة المحاولة والمتابعة</span>
              </button>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) {
                    this.props.onReset();
                  } else {
                    window.location.href = '/';
                  }
                }}
                className="flex items-center justify-center gap-2 bg-[#FAF9F6] hover:bg-[#EFECE6] text-[#111111] py-2.5 px-4 rounded-xl text-xs font-bold border border-[#D5CFC7] transition-all cursor-pointer"
              >
                <Home className="w-4 h-4 text-[#8B6B3F]" />
                <span>الرئيسية</span>
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}
