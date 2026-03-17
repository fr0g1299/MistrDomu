import { useEffect } from "react";

export function useDynamicScrollbar() {
  useEffect(() => {
    const stops = [0, 0.5, 1];
    let rafId: number;

    const update = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(() => {
        const docHeight =
          document.documentElement.scrollHeight - window.innerHeight;
        const s = docHeight > 0 ? window.scrollY / docHeight : 0;
        const root = document.documentElement;
        stops.forEach((p, i) => {
          const dist = Math.abs(p - s);
          root.style.setProperty(
            `--scroll-opacity-${i + 1}`,
            Math.exp(-dist * dist * 8).toFixed(3),
          );
        });
      });
    };

    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => {
      window.removeEventListener("scroll", update);
      cancelAnimationFrame(rafId);
    };
  }, []);
}
