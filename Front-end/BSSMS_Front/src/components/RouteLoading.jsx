export default function RouteLoading() {
  return (
    <div className="route-loading" role="status" aria-label="Đang tải giao diện">
      <span className="visually-hidden">Đang tải giao diện…</span>
      <div className="route-loading-heading" aria-hidden="true">
        <span className="route-loading-shimmer route-loading-title" />
        <span className="route-loading-shimmer route-loading-subtitle" />
      </div>
      <div className="route-loading-cards" aria-hidden="true">
        <span className="route-loading-shimmer" />
        <span className="route-loading-shimmer" />
        <span className="route-loading-shimmer" />
      </div>
      <span className="route-loading-shimmer route-loading-content" aria-hidden="true" />
      <span className="route-loading-shimmer route-loading-content route-loading-content-short" aria-hidden="true" />
    </div>
  );
}
