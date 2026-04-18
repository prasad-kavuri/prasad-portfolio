'use client';

import type { ErrorInfo, ReactNode } from 'react';
import { Component } from 'react';

type Props = {
  children: ReactNode;
  worldId: string;
};

type State = {
  hasError: boolean;
};

const WORLD_DEBUG = process.env.NODE_ENV !== 'production';

export class WorldPreviewErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    if (!WORLD_DEBUG) return;
    console.error('[world-generation-debug] preview.render_error', {
      worldId: this.props.worldId,
      message: error.message,
      stack: errorInfo.componentStack,
    });
  }

  componentDidUpdate(prevProps: Props) {
    if (prevProps.worldId !== this.props.worldId && this.state.hasError) {
      this.setState({ hasError: false });
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[360px] items-center justify-center rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-center text-sm text-red-100">
          Preview temporarily unavailable. Artifact metadata is still available below. Regenerate or revise inputs to recover.
        </div>
      );
    }
    return this.props.children;
  }
}
