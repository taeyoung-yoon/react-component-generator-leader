import { describe, it, expect } from 'vitest';
import { parseNdjson, readStreamEvents } from './streamEvents';

describe('parseNdjson', () => {
  it('완결된 줄을 이벤트로 파싱하고 덜 온 줄은 rest로 돌려준다', () => {
    const { events, rest } = parseNdjson(
      '{"type":"delta","text":"a"}\n{"type":"done","code":"b"}\n{"type":"del',
    );
    expect(events).toEqual([
      { type: 'delta', text: 'a' },
      { type: 'done', code: 'b' },
    ]);
    expect(rest).toBe('{"type":"del');
  });

  it('빈 줄은 무시한다', () => {
    const { events } = parseNdjson('\n{"type":"delta","text":"a"}\n\n');
    expect(events).toEqual([{ type: 'delta', text: 'a' }]);
  });

  it('알 수 없는 type의 줄은 무시한다', () => {
    const { events } = parseNdjson('{"type":"weird"}\n{"type":"error","error":"x"}\n');
    expect(events).toEqual([{ type: 'error', error: 'x' }]);
  });
});

describe('readStreamEvents', () => {
  it('청크 경계에 걸쳐 쪼개진 줄도 순서대로 복원한다', async () => {
    const encoder = new TextEncoder();
    const body = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode('{"type":"delta","te'));
        controller.enqueue(encoder.encode('xt":"a"}\n{"type":"done","code":"a"}\n'));
        controller.close();
      },
    });

    const out = [];
    for await (const event of readStreamEvents(body)) out.push(event);
    expect(out).toEqual([
      { type: 'delta', text: 'a' },
      { type: 'done', code: 'a' },
    ]);
  });
});
