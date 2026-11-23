import { useEffect, useRef } from "react";

// Floating message pinned to the screen, so it is visible wherever the user has scrolled.
// variant: "danger" | "warning" | "success" | "info". Auto-hides after `timeout` ms (0 = stay until closed).
export default function FloatingAlert({ message, variant = "danger", onClose, timeout = 6000 }) {
  // Keep the latest onClose without restarting the timer on every parent render
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  useEffect(() => {
    if (!message || !timeout) return undefined;
    const timer = setTimeout(() => closeRef.current?.(), timeout);
    return () => clearTimeout(timer);
  }, [message, timeout]);

  if (!message) return null;
  const icon = variant === "success" ? "bi-check-circle-fill"
    : variant === "info" ? "bi-info-circle-fill"
      : variant === "warning" ? "bi-exclamation-triangle-fill"
        : "bi-exclamation-circle-fill";
  return (
    <div className={`sc-toast sc-toast--${variant}`} role={variant === "danger" ? "alert" : "status"} aria-live={variant === "danger" ? "assertive" : "polite"}>
      <i className={`bi ${icon}`} aria-hidden="true" />
      <span className="sc-toast-text">{message}</span>
      {onClose && (
        <button type="button" className="sc-toast-close" onClick={onClose} aria-label="Close message">
          <i className="bi bi-x-lg" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
