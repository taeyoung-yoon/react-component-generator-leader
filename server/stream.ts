// 프로바이더 스트리밍(SSE) 응답을 파싱하는 순수 함수들.
// 부수효과(Bun.serve 등)가 없어 단위 테스트가 가능하다.

/** 버퍼에서 완결된 SSE 이벤트의 data 페이로드를 꺼내고, 덜 온 나머지는 rest로 돌려준다. */
export function parseSseEvents(buffer: string): { events: string[]; rest: string } {
  const blocks = buffer.replace(/\r\n/g, '\n').split('\n\n');
  const rest = blocks.pop() ?? '';

  const events: string[] = [];
  for (const block of blocks) {
    const data = block
      .split('\n')
      .filter((line) => line.startsWith('data:'))
      .map((line) => line.slice(5).trimStart())
      .join('\n');
    if (data) events.push(data);
  }
  return { events, rest };
}

/** fetch 응답 본문(바이트 스트림)을 SSE data 페이로드 단위로 읽는다. */
export async function* readSseData(body: ReadableStream<Uint8Array>): AsyncGenerator<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const { events, rest } = parseSseEvents(buffer);
      buffer = rest;
      yield* events;
    }
    // 마지막 이벤트가 빈 줄 없이 끝나도 버리지 않는다.
    yield* parseSseEvents(`${buffer + decoder.decode()}\n\n`).events;
  } finally {
    // 소비를 중간에 멈추면(클라이언트 끊김, 에러) 업스트림 연결을 닫는다.
    await reader.cancel().catch(() => {});
  }
}

// 스트림 중간에 오는 error 이벤트는 HTTP 상태가 없어, 503/429 매핑이 읽을 수 있게 상태로 바꾼다.
const ANTHROPIC_ERROR_STATUS: Record<string, number> = {
  rate_limit_error: 429,
  overloaded_error: 503,
};

/** Anthropic 스트림 이벤트에서 텍스트 조각을 꺼낸다. 텍스트가 없으면 빈 문자열. */
export function extractAnthropicDelta(data: string): string {
  const event = JSON.parse(data) as {
    type: string;
    delta?: { type?: string; text?: string };
    error?: { type?: string };
  };

  if (event.type === 'error') {
    const status = ANTHROPIC_ERROR_STATUS[event.error?.type ?? ''] ?? 'stream';
    throw new Error(`Claude API error: ${status}`);
  }
  if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
    return event.delta.text ?? '';
  }
  return '';
}

/** Google 스트림 청크에서 텍스트 조각을 꺼낸다. MAX_TOKENS로 잘리면 에러를 던진다. */
export function extractGoogleDelta(data: string): string {
  const chunk = JSON.parse(data) as {
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string }> };
      finishReason?: string;
    }>;
  };

  const candidate = chunk.candidates?.[0];
  if (candidate?.finishReason === 'MAX_TOKENS') {
    throw new Error('생성된 코드가 너무 길어 잘렸습니다. 더 간단한 컴포넌트를 요청해주세요.');
  }
  return candidate?.content?.parts?.map((part) => part.text ?? '').join('') ?? '';
}
