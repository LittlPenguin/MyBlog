function ShellCard({ className = "" }: { className?: string }) {
  return <div className={`loading-card ${className}`} aria-hidden="true" />;
}

export default function Loading() {
  return (
    <div className="page-loading-shell pb-10 pt-2">
      <section className="loading-board">
        <aside className="loading-sidebar">
          <div className="loading-brand" />
          <div className="space-y-3">
            <div className="loading-nav-pill loading-nav-pill-active" />
            <div className="loading-nav-pill" />
            <div className="loading-nav-pill" />
            <div className="loading-nav-pill" />
            <div className="loading-nav-pill" />
          </div>
          <div className="loading-cta" />
        </aside>

        <div className="loading-main">
          <div className="shell-mobile-nav" aria-hidden="true">
            <div className="shell-mobile-nav-bar">
              <div className="loading-mobile-brand" />
              <div className="loading-mobile-toggle" />
            </div>
          </div>

          <div className="loading-topbar">
            <div className="loading-topbar-actions">
              <span className="loading-icon" />
              <span className="loading-icon" />
              <span className="loading-icon loading-icon-active" />
              <span className="loading-avatar" />
            </div>
          </div>

          <div className="loading-grid">
            <ShellCard className="loading-hero" />
            <ShellCard className="loading-clock" />
            <ShellCard className="loading-calendar" />
            <ShellCard className="loading-mini" />
            <ShellCard className="loading-mini" />
            <ShellCard className="loading-mini" />
            <ShellCard className="loading-mini loading-editor" />
            <div className="loading-footer-strip" />
          </div>
        </div>
      </section>
    </div>
  );
}
