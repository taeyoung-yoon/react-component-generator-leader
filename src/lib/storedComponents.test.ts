import { describe, expect, it } from 'vitest';
import { parseComponents } from './storedComponents';

describe('parseComponents', () => {
  it('createdAt 문자열을 Date로 복원한다', () => {
    const iso = '2026-01-02T03:04:05.000Z';
    const result = parseComponents([{ id: '1', prompt: 'p', code: 'c', createdAt: iso }]);
    expect(result).toHaveLength(1);
    expect(result?.[0].createdAt).toBeInstanceOf(Date);
    expect(result?.[0].createdAt.toISOString()).toBe(iso);
  });

  it('배열이 아니면 null을 반환한다', () => {
    expect(parseComponents('x')).toBeNull();
    expect(parseComponents(null)).toBeNull();
  });

  it('필수 필드가 빠졌거나 타입이 틀린 항목은 버린다', () => {
    const iso = '2026-01-02T03:04:05.000Z';
    const result = parseComponents([
      { id: '1', prompt: 'p', code: 'c', createdAt: iso },
      { id: 2, prompt: 'p', code: 'c', createdAt: iso },
      { id: '3', prompt: 'p', createdAt: iso },
      { id: '4', prompt: 'p', code: 'c', createdAt: 'not-a-date' },
      null,
    ]);
    expect(result?.map((c) => c.id)).toEqual(['1']);
  });
});
