import { useState, useEffect } from "react";

/**
 * Returns a value that updates only after `delayMs` has passed with no new changes.
 * Use for search inputs: user types immediately, API is called with debounced value.
 */
export function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const t = window.setTimeout(() => {
      setDebouncedValue(value);
    }, delayMs);
    return () => clearTimeout(t);
  }, [value, delayMs]);

  return debouncedValue;
}
