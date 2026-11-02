"use client";

import { useEffect, useRef, useState } from "react";

/** Tracks whether an element is on (or near) screen — used to load 3D lazily and pause it off-screen. */
export function useVisible<T extends Element>(margin = "200px") {
  const ref = useRef<T>(null);
  const [visible, setVisible] = useState(false);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === "undefined") {
      setVisible(true);
      setSeen(true);
      return;
    }
    const io = new IntersectionObserver(([e]) => {
      setVisible(e.isIntersecting);
      if (e.isIntersecting) setSeen(true);
    }, { rootMargin: margin });
    io.observe(el);
    return () => io.disconnect();
  }, [margin]);
  return { ref, visible, seen };
}
