"use client";

import { useEffect, useRef } from "react";
import { animate, useMotionValue, useTransform } from "framer-motion";

interface CountUpProps {
  value: number;
  duration?: number;
  className?: string;
  formatter?: (value: number) => string;
}

/**
 * Animates a number from 0 -> value once, on mount (dashboard stat cards).
 * Built on framer-motion's imperative `animate()` driving a motion value,
 * rather than a setInterval loop, so it's interruption-safe and shares
 * the same easing engine as the rest of the UI's motion.
 */
export function CountUp({
  value,
  duration = 1.4,
  className,
  formatter = (v) => Math.round(v).toLocaleString(),
}: CountUpProps) {
  const motionValue = useMotionValue(0);
  const rounded = useTransform(motionValue, (latest) => formatter(latest));
  const spanRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const controls = animate(motionValue, value, {
      duration,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, duration, motionValue]);

  useEffect(() => {
    return rounded.on("change", (latest) => {
      if (spanRef.current) spanRef.current.textContent = latest;
    });
  }, [rounded]);

  return (
    <span ref={spanRef} className={className}>
      0
    </span>
  );
}
