import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { usePersistentState } from './usePersistentState';

describe('usePersistentState', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('저장된 값이 없으면 초기값을 쓴다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('init');
  });

  it('저장된 값이 있으면 그 값으로 시작한다', () => {
    localStorage.setItem('k', JSON.stringify('saved'));
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    expect(result.current[0]).toBe('saved');
  });

  it('값을 바꾸면 localStorage에 저장한다', () => {
    const { result } = renderHook(() => usePersistentState('k', 'init'));
    act(() => result.current[1]('next'));
    expect(result.current[0]).toBe('next');
    expect(localStorage.getItem('k')).toBe('"next"');
  });

  it('함수형 업데이트를 지원한다', () => {
    const { result } = renderHook(() => usePersistentState<number>('k', 1));
    act(() => result.current[1]((prev) => prev + 1));
    expect(result.current[0]).toBe(2);
  });

  it('parse가 null을 반환하면 초기값을 쓴다', () => {
    localStorage.setItem('k', JSON.stringify('bad'));
    const parse = (raw: unknown) => (raw === 'google' ? 'google' : null);
    const { result } = renderHook(() => usePersistentState('k', 'anthropic', parse));
    expect(result.current[0]).toBe('anthropic');
  });
});
