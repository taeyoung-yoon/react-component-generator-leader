// localStorage 접근을 감싼 헬퍼. 사생활 보호 모드나 용량 초과 등으로 접근이 막혀도 앱이 죽지 않게 한다.

/**
 * 저장된 JSON을 읽는다. 값이 없거나 깨졌거나 parse가 null을 반환하면 fallback을 쓴다.
 * parse는 저장된 값을 검증·복원(예: 날짜 문자열 -> Date)할 때 사용한다.
 */
export function loadJSON<T>(key: string, fallback: T, parse?: (raw: unknown) => T | null): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored === null) return fallback;
    const raw: unknown = JSON.parse(stored);
    if (!parse) return raw as T;
    return parse(raw) ?? fallback;
  } catch {
    return fallback;
  }
}

/** 값을 JSON으로 저장한다. 저장 실패는 조용히 무시한다. */
export function saveJSON(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // 용량 초과나 접근 차단 시 저장만 포기한다.
  }
}
