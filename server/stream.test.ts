import { describe, it, expect } from 'vitest';
import {
  parseSseEvents,
  readSseData,
  extractAnthropicDelta,
  extractGoogleDelta,
} from './stream';

describe('parseSseEvents', () => {
  it('완결된 이벤트의 data 페이로드를 꺼내고 나머지는 rest로 돌려준다', () => {
    const { events, rest } = parseSseEvents('data: {"a":1}\n\ndata: {"b":2}\n\ndata: {"c"');
    expect(events).toEqual(['{"a":1}', '{"b":2}']);
    expect(rest).toBe('data: {"c"');
  });

  it('CRLF 구분자도 처리한다', () => {
    const { events, rest } = parseSseEvents('data: x\r\n\r\n');
    expect(events).toEqual(['x']);
    expect(rest).toBe('');
  });

  it('data 줄이 없는 이벤트(event: 만 있는 경우)는 무시한다', () => {
    const { events } = parseSseEvents('event: ping\n\ndata: y\n\n');
    expect(events).toEqual(['y']);
  });
});

describe('readSseData', () => {
  it('청크 경계에 걸쳐 쪼개진 이벤트도 순서대로 복원한다', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('data: {"a"'));
        controller.enqueue(encoder.encode(':1}\n\ndata: 2\n\n'));
        controller.close();
      },
    });

    const out: string[] = [];
    for await (const data of readSseData(body)) out.push(data);
    expect(out).toEqual(['{"a":1}', '2']);
  });
});

describe('readSseData 종료 처리', () => {
  it('마지막 이벤트가 빈 줄 없이 끝나도 버리지 않는다', async () => {
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: last'));
        controller.close();
      },
    });

    const out: string[] = [];
    for await (const data of readSseData(body)) out.push(data);
    expect(out).toEqual(['last']);
  });

  it('소비를 중간에 멈추면 업스트림 스트림을 취소한다', async () => {
    let cancelled = false;
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('data: a\n\n'));
      },
      cancel() {
        cancelled = true;
      },
    });

    for await (const data of readSseData(body)) {
      expect(data).toBe('a');
      break;
    }
    expect(cancelled).toBe(true);
  });
});

describe('extractAnthropicDelta', () => {
  it('content_block_delta의 text_delta 텍스트를 반환한다', () => {
    const data = JSON.stringify({
      type: 'content_block_delta',
      delta: { type: 'text_delta', text: 'const A' },
    });
    expect(extractAnthropicDelta(data)).toBe('const A');
  });

  it('텍스트가 없는 이벤트는 빈 문자열을 반환한다', () => {
    expect(extractAnthropicDelta(JSON.stringify({ type: 'message_start' }))).toBe('');
  });

  it('error 이벤트는 "Claude API error" 형식으로 던진다', () => {
    const data = JSON.stringify({ type: 'error', error: { type: 'overloaded_error' } });
    expect(() => extractAnthropicDelta(data)).toThrow('Claude API error');
  });
});

describe('extractAnthropicDelta 에러 상태 매핑', () => {
  it('rate_limit_error는 429 상태가 포함된 메시지로 던진다', () => {
    const data = JSON.stringify({ type: 'error', error: { type: 'rate_limit_error' } });
    expect(() => extractAnthropicDelta(data)).toThrow('Claude API error: 429');
  });

  it('overloaded_error는 503 상태가 포함된 메시지로 던진다', () => {
    const data = JSON.stringify({ type: 'error', error: { type: 'overloaded_error' } });
    expect(() => extractAnthropicDelta(data)).toThrow('Claude API error: 503');
  });
});

describe('extractGoogleDelta', () => {
  it('candidates의 parts 텍스트를 이어붙여 반환한다', () => {
    const data = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'a' }, { text: 'b' }] } }],
    });
    expect(extractGoogleDelta(data)).toBe('ab');
  });

  it('finishReason이 MAX_TOKENS이면 잘림 에러를 던진다', () => {
    const data = JSON.stringify({
      candidates: [{ content: { parts: [{ text: 'x' }] }, finishReason: 'MAX_TOKENS' }],
    });
    expect(() => extractGoogleDelta(data)).toThrow('너무 길어');
  });

  it('candidates가 없으면 빈 문자열을 반환한다', () => {
    expect(extractGoogleDelta('{}')).toBe('');
  });
});
