"use client"

import * as React from "react";

export function Slider({ value, min = 0, max = 100, step = 1, onValueChange }: { value: number[]; min?: number; max?: number; step?: number; onValueChange: (val: number[]) => void }) {
  const v = Math.min(max, Math.max(min, value?.[0] ?? min));
  return (
    <input
      type="range"
      value={v}
      min={min}
      max={max}
      step={step}
      onChange={(e) => onValueChange([Number(e.target.value)])}
      className="w-full accent-teal-600"
    />
  );
}
