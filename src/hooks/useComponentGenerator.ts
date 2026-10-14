import { useState, useCallback } from 'react';
import type { GeneratedComponent, Provider } from '../types';
import { addToHistory, parseHistory } from '../lib/history';
import { parseComponents } from '../lib/storedComponents';
import { readStreamEvents } from '../lib/streamEvents';
import { usePersistentState } from './usePersistentState';

const COMPONENTS_KEY = 'rcg:components';
const HISTORY_KEY = 'rcg:promptHistory';

interface UseComponentGeneratorReturn {
  components: GeneratedComponent[];
  /** 스트리밍으로 생성 중인 컴포넌트. 완료되면 같은 id로 components에 확정된다. */
  pending: GeneratedComponent | null;
  promptHistory: string[];
  isLoading: boolean;
  error: string | null;
  generate: (prompt: string, apiKey: string | undefined, provider: Provider) => Promise<void>;
  removeComponent: (id: string) => void;
  clearAll: () => void;
}

export function useComponentGenerator(): UseComponentGeneratorReturn {
  const [components, setComponents] = usePersistentState<GeneratedComponent[]>(
    COMPONENTS_KEY,
    [],
    parseComponents,
  );
  const [promptHistory, setPromptHistory] = usePersistentState<string[]>(
    HISTORY_KEY,
    [],
    parseHistory,
  );
  const [pending, setPending] = useState<GeneratedComponent | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = useCallback(async (prompt: string, apiKey: string | undefined, provider: Provider) => {
    setIsLoading(true);
    setError(null);

    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const createdAt = new Date();

    try {
      const res = await fetch('/api/generate/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, ...(apiKey && { apiKey }), provider }),
      });

      if (!res.ok || !res.body) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to generate component');
      }

      setPending({ id, prompt, code: '', createdAt });

      let finalCode: string | null = null;
      for await (const event of readStreamEvents(res.body)) {
        if (event.type === 'delta') {
          setPending((prev) => (prev ? { ...prev, code: prev.code + event.text } : prev));
        } else if (event.type === 'error') {
          throw new Error(event.error);
        } else {
          finalCode = event.code;
        }
      }

      if (finalCode === null) {
        throw new Error('응답이 중간에 끊겼습니다. 다시 시도해주세요.');
      }

      setComponents((prev) => [{ id, prompt, code: finalCode, createdAt }, ...prev]);
      setPromptHistory((prev) => addToHistory(prev, prompt));
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
    } finally {
      setPending(null);
      setIsLoading(false);
    }
  }, [setComponents, setPromptHistory]);

  const removeComponent = useCallback((id: string) => {
    setComponents((prev) => prev.filter((c) => c.id !== id));
  }, [setComponents]);

  const clearAll = useCallback(() => {
    setComponents([]);
  }, [setComponents]);

  return { components, pending, promptHistory, isLoading, error, generate, removeComponent, clearAll };
}
