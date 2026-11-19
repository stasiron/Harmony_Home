import { useEffect, useState } from "react";

/** Komputer / duży tablet (Tailwind `lg`) — dwie kolumny zamiast okien */
const WIDE_BREAKPOINT = 1024;

export function useIsWide() {
  const [wide, setWide] = useState(false);
  useEffect(() => {
    const mql = window.matchMedia(`(min-width: ${WIDE_BREAKPOINT}px)`);
    const onChange = () => setWide(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);
  return wide;
}
