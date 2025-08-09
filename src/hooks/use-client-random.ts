import { useState, useEffect, useRef } from 'react';

/**
 * A hook to generate random values only on the client side to prevent hydration mismatches.
 * @param generator A function that generates a single random value object.
 * @param count The number of random value objects to generate.
 * @returns An array of generated random value objects.
 */
export function useClientRandom<T>(generator: () => T, count: number): T[] {
  const [values, setValues] = useState<T[]>([]);
  const initializedRef = useRef(false);

  useEffect(() => {
    // Only generate values on the client side and only once per count change
    if (typeof window === 'undefined') return;

    // If not initialized yet or count changed (length mismatch), (re)generate
    if (!initializedRef.current || values.length !== count) {
      const generated = Array.from({ length: count }, () => generator());
      setValues(generated);
      initializedRef.current = true;
    }
    // Note: deliberately not depending on `generator` to avoid re-generation
    // when an inline function is re-created each render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [count, values.length]);

  return values;
}
