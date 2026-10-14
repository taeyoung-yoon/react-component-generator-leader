import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// Node의 실험적 전역 localStorage가 --localstorage-file 없이는 jsdom의 것을 가려 동작하지 않는다.
// 테스트에서는 메모리 기반 Storage로 대체한다. 클래스 메서드로 구현해 Storage.prototype에 대한 spyOn이 동작한다.
const memory = new Map<string, string>();
if (typeof window.localStorage?.clear !== 'function') {
  class MemoryStorage {
    get length() {
      return memory.size;
    }
    key(index: number) {
      return [...memory.keys()][index] ?? null;
    }
    getItem(key: string) {
      return memory.has(key) ? (memory.get(key) as string) : null;
    }
    setItem(key: string, value: string) {
      memory.set(key, String(value));
    }
    removeItem(key: string) {
      memory.delete(key);
    }
    clear() {
      memory.clear();
    }
  }
  Object.defineProperty(globalThis, 'Storage', { configurable: true, value: MemoryStorage });
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, value: new MemoryStorage() });
}

// 각 테스트 후 렌더된 DOM을 정리해 테스트 간 격리를 보장한다.
afterEach(() => {
  cleanup();
});
