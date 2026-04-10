'use client';

import { useInView } from 'framer-motion';
import { useEffect, useRef, useState } from 'react';

interface CounterProps {
  value: string;
  className?: string;
}

export function AnimatedCounter({ value, className }: CounterProps) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState(value);

  const match = value.match(/^(\d+)(.*)/);
  const isNumeric = match !== null;
  const target = isNumeric ? parseInt(match[1]) : 0;
  const suffix = isNumeric ? match[2] : '';

  useEffect(() => {
    if (!isInView || !isNumeric) return;

    let start = 0;
    const duration = 1500;
    const step = 16;
    const increment = target / (duration / step);

    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setDisplay(value);
        clearInterval(timer);
      } else {
        setDisplay(Math.floor(start) + suffix);
      }
    }, step);

    return () => clearInterval(timer);
  }, [isInView, isNumeric, target, suffix, value]);

  return (
    <span ref={ref} className={className}>
      {display}
    </span>
  );
}
