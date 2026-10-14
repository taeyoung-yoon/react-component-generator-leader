export const MAX_HISTORY = 20;

/** 프롬프트를 히스토리 맨 앞에 추가한다. 중복은 앞으로 옮기고, 최대 개수를 넘으면 오래된 것을 버린다. */
export function addToHistory(history: string[], prompt: string): string[] {
  const trimmed = prompt.trim();
  if (!trimmed) return history;
  return [trimmed, ...history.filter((p) => p !== trimmed)].slice(0, MAX_HISTORY);
}

/** 저장된 값에서 문자열 항목만 골라 복원한다. 배열이 아니면 null. */
export function parseHistory(raw: unknown): string[] | null {
  if (!Array.isArray(raw)) return null;
  return raw.filter((item): item is string => typeof item === 'string');
}
