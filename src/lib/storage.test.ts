import { beforeEach, describe, expect, it, vi } from 'vitest';
import { loadJSON, saveJSON } from './storage';

describe('storage', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  describe('loadJSON', () => {
    it('저장된 값이 없으면 fallback을 반환한다', () => {
      expect(loadJSON('k', 'fallback')).toBe('fallback');
    });

    it('저장된 JSON을 파싱해 반환한다', () => {
      localStorage.setItem('k', JSON.stringify({ a: 1 }));
      expect(loadJSON('k', {})).toEqual({ a: 1 });
    });

    it('JSON이 깨져 있으면 fallback을 반환한다', () => {
      localStorage.setItem('k', '{not json');
      expect(loadJSON('k', 'fallback')).toBe('fallback');
    });

    it('parse가 null을 반환하면 fallback을 반환한다', () => {
      localStorage.setItem('k', JSON.stringify(123));
      const parse = (raw: unknown) => (typeof raw === 'string' ? raw : null);
      expect(loadJSON('k', 'fallback', parse)).toBe('fallback');
    });

    it('parse가 값을 반환하면 그 값을 쓴다', () => {
      localStorage.setItem('k', JSON.stringify('ok'));
      const parse = (raw: unknown) => (typeof raw === 'string' ? raw : null);
      expect(loadJSON('k', 'fallback', parse)).toBe('ok');
    });

    it('localStorage 접근이 throw해도 fallback을 반환한다', () => {
      vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
        throw new Error('denied');
      });
      expect(loadJSON('k', 'fallback')).toBe('fallback');
    });
  });

  describe('saveJSON', () => {
    it('값을 JSON으로 저장한다', () => {
      saveJSON('k', { a: 1 });
      expect(localStorage.getItem('k')).toBe('{"a":1}');
    });

    it('저장이 throw해도 예외를 밖으로 던지지 않는다', () => {
      vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
        throw new Error('quota');
      });
      expect(() => saveJSON('k', 'v')).not.toThrow();
    });
  });
});
