import { Component, type ErrorInfo, type ReactNode } from "react";

interface State {
  error: Error | null;
}

/** 描画中の例外で白画面にならないための最後の受け皿。再読み込みの導線だけ出す */
export class ErrorBoundary extends Component<{ children: ReactNode }, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("QOLレーダー: 描画エラー", error, info.componentStack);
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <div className="center-note fatal" role="alert">
        <p className="mincho">表示中に問題が起きました。</p>
        <p className="sub">再読み込みで直ることが多いです。お気に入りや状態は保存されています。</p>
        <button type="button" className="clear-link" onClick={() => location.reload()}>
          再読み込み
        </button>
      </div>
    );
  }
}
