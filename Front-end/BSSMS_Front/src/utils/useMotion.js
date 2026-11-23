import { useEffect } from "react";

// Lightweight "Animate UI"-style motion without extra packages (works offline for the demo).
// Cards and tiles fade/slide in with a small stagger when they scroll into view.
const REVEAL = [
  ".sc-card", ".sc-package-card", ".sc-step", ".feedback-review-card", ".feedback-stat-card",
  ".staff-metric", ".ms-card", ".ms-day", ".ctp-card", ".ctp-pkg", ".ctp-note",
  ".rb-room", ".ss-skill", ".sc-mp-row", ".sc-appt-card", ".sc-recent-row",
].join(", ");

export default function useMotion() {
  useEffect(() => {
    const root = document.getElementById("root");
    if (!root || typeof IntersectionObserver === "undefined") return undefined;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return undefined;

    const seen = new WeakSet();
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("mo-in");
        io.unobserve(entry.target);
      });
    }, { rootMargin: "0px 0px -6% 0px", threshold: 0.06 });

    const prepare = (el) => {
      if (seen.has(el)) return;
      seen.add(el);
      const index = el.parentElement ? Array.prototype.indexOf.call(el.parentElement.children, el) : 0;
      el.style.setProperty("--mo-i", String(Math.min(Math.max(index, 0), 8)));
      el.classList.add("mo-reveal");
      io.observe(el);
    };
    const scan = (node) => {
      if (node.nodeType !== 1) return;
      if (node.matches(REVEAL)) prepare(node);
      node.querySelectorAll(REVEAL).forEach(prepare);
    };

    scan(root);
    const mo = new MutationObserver((mutations) => {
      mutations.forEach((m) => m.addedNodes.forEach(scan));
    });
    mo.observe(root, { childList: true, subtree: true });
    return () => {
      io.disconnect();
      mo.disconnect();
    };
  }, []);
}
