import { useEffect, useState } from 'react';
import type { Dispatch, SetStateAction } from 'react';
import { loadJSON, saveJSON } from '../lib/storage';

/** useState와 같지만 값을 localStorage에 저장하고, 새로고침 후 복원한다. */
export function usePersistentState<T>(
  key: string,
  initial: T,
  parse?: (raw: unknown) => T | null,
): [T, Dispatch<SetStateAction<T>>] {
  const [value, setValue] = useState<T>(() => loadJSON(key, initial, parse));

  useEffect(() => {
    saveJSON(key, value);
  }, [key, value]);

  return [value, setValue];
}
