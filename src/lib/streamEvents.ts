import type { StreamEvent } from '../types';

const EVENT_TYPES = ['delta', 'done', 'error'];

/** 줄바꿈 단위 JSON(NDJSON) 버퍼에서 완결된 이벤트를 꺼내고, 덜 온 줄은 rest로 돌려준다. */
export function parseNdjson(buffer: string): { events: StreamEvent[]; rest: string } {
  const lines = buffer.split('\n');
  const rest = lines.pop() ?? '';

  const events: StreamEvent[] = [];
  for (const line of lines) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line) as StreamEvent;
    if (EVENT_TYPES.includes(parsed.type)) events.push(parsed);
  }
  return { events, rest };
}

/** fetch 응답 본문(바이트 스트림)을 스트림 이벤트 단위로 읽는다. */
export async function* readStreamEvents(body: ReadableStream<Uint8Array>): AsyncGenerator<StreamEvent> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    const { events, rest } = parseNdjson(buffer);
    buffer = rest;
    yield* events;
  }
}
