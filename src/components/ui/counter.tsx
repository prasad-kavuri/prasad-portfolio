'use client';

import { useInView, useMotionValue, useSpring } from 'framer-motion';
import { useEffect, useRef } from 'react';

interface CounterProps {
  value: string;
  className?: string;
}

export function AnimatedCounter({ value, className }: CounterProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const inViewRef = useRef(null);
  const isInView = useInView(inViewRef, { once: true });

  // Extract number and suffix (e.g. "200+" -> 200, "+")
  const match = value.match(/^([\d.]+)(.*)$/);
  const numericValue = match ? parseFloat(match[1]) : 0;
  const suffix = match ? match[2] : value;
  const isNumeric = match !== null;

  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 60,
    stiffness: 100,
  });

  useEffect(() => {
    if (isInView && isNumeric) {
      motionValue.set(numericValue);
    }
  }, [isInView, isNumeric, motionValue, numericValue]);

  useEffect(() => {
    return springValue.on('change', (latest) => {
      if (ref.current) {
        const rounded = numericValue >= 10
          ? Math.round(latest)
          : Math.round(latest * 10) / 10;
        ref.current.textContent = rounded + suffix;
      }
    });
  }, [springValue, suffix, numericValue]);

  if (!isNumeric) {
    return <span className={className}>{value}</span>;
  }

  return (
    <div ref={inViewRef}>
      <span ref={ref} className={className}>
        0{suffix}
      </span>
    </div>
  );
}
