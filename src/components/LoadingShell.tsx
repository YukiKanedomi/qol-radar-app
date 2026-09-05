/**
 * 読み込み中の骨組み。ヘッダーの形とカードの輪郭だけ先に出し、
 * 「白い画面で待つ」時間を無くす（data/picks.json は 170KB あり、回線次第で1〜2秒かかる）。
 */
export function LoadingShell() {
  return (
    <div className="shell" aria-busy="true" aria-label="読み込み中">
      <div className="site-header">
        <div className="hbar">
          <div className="brand">
            <span className="mark">📡</span>
            <h1>QOLレーダー</h1>
          </div>
        </div>
      </div>
      <div className="wrap shell-body">
        <div className="sk sk-vol" />
        <div className="sk sk-h2" />
        <div className="sk sk-h2 short" />
        <div className="sk-grid">
          {Array.from({ length: 6 }).map((_, i) => (
            <div className="sk-card" key={i}>
              <div className="sk sk-line w30" />
              <div className="sk sk-title" />
              <div className="sk sk-line" />
              <div className="sk sk-line w60" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
