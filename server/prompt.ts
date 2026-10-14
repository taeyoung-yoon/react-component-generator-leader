// 프롬프트 검증용 순수 함수. Bun.serve 부수효과가 없어 단위 테스트가 가능하다.

export const MAX_PROMPT_LENGTH = 500;

/** 프롬프트가 최대 길이(500자) 이내인지 확인한다. */
export function isPromptWithinLimit(prompt: string): boolean {
  return prompt.length <= MAX_PROMPT_LENGTH;
}
