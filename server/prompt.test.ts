import { describe, expect, it } from 'vitest';
import { MAX_PROMPT_LENGTH, isPromptWithinLimit } from './prompt';

describe('isPromptWithinLimit', () => {
  it('제한 길이는 500자다', () => {
    expect(MAX_PROMPT_LENGTH).toBe(500);
  });

  it('500자 이하 프롬프트는 허용한다', () => {
    expect(isPromptWithinLimit('a'.repeat(500))).toBe(true);
  });

  it('500자를 초과하는 프롬프트는 거부한다', () => {
    expect(isPromptWithinLimit('a'.repeat(501))).toBe(false);
  });

  it('한글도 글자 수로 센다', () => {
    expect(isPromptWithinLimit('가'.repeat(500))).toBe(true);
    expect(isPromptWithinLimit('가'.repeat(501))).toBe(false);
  });
});
