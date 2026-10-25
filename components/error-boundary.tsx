"use client";

import { Component, type ReactNode } from "react";
import { Button } from "@/components/ui/button";

type ErrorBoundaryProps = {
  children: ReactNode;
  fallbackTitle?: string;
};

type ErrorBoundaryState = {
  hasError: boolean;
  message?: string;
};

export class ErrorBoundary extends Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, message: error.message };
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-panel p-8 text-center">
          <h2 className="font-display text-lg font-semibold">
            {this.props.fallbackTitle ?? "Bir şeyler ters gitti"}
          </h2>
          <p className="mt-2 text-sm opacity-90">
            {this.state.message ??
              "Sayfa yüklenirken beklenmeyen bir hata oluştu. Lütfen sayfayı yenileyin."}
          </p>
          <Button
            type="button"
            variant="outline"
            className="mt-4"
            onClick={() => this.setState({ hasError: false })}
          >
            Tekrar Dene
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}
