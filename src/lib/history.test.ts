import { describe, expect, it } from 'vitest';
import { MAX_HISTORY, addToHistory, parseHistory } from './history';

describe('addToHistory', () => {
  it('새 프롬프트를 맨 앞에 추가한다', () => {
    expect(addToHistory(['a'], 'b')).toEqual(['b', 'a']);
  });

  it('이미 있는 프롬프트는 중복 없이 맨 앞으로 옮긴다', () => {
    expect(addToHistory(['a', 'b', 'c'], 'b')).toEqual(['b', 'a', 'c']);
  });

  it('최대 개수를 넘으면 오래된 항목을 버린다', () => {
    const full = Array.from({ length: MAX_HISTORY }, (_, i) => `p${i}`);
    const next = addToHistory(full, 'new');
    expect(next).toHaveLength(MAX_HISTORY);
    expect(next[0]).toBe('new');
    expect(next).not.toContain(`p${MAX_HISTORY - 1}`);
  });

  it('공백뿐인 프롬프트는 무시한다', () => {
    expect(addToHistory(['a'], '   ')).toEqual(['a']);
  });
});

describe('parseHistory', () => {
  it('문자열 배열만 통과시킨다', () => {
    expect(parseHistory(['a', 'b'])).toEqual(['a', 'b']);
  });

  it('배열이 아니면 null을 반환한다', () => {
    expect(parseHistory('x')).toBeNull();
    expect(parseHistory({})).toBeNull();
  });

  it('문자열이 아닌 항목은 걸러낸다', () => {
    expect(parseHistory(['a', 1, null, 'b'])).toEqual(['a', 'b']);
  });
});
