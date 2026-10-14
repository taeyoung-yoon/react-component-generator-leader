import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useComponentGenerator } from './useComponentGenerator';

const encoder = new TextEncoder();

// 테스트가 직접 청크를 밀어 넣을 수 있는 NDJSON 응답 본문.
function controlledStream() {
  let controller!: ReadableStreamDefaultController<Uint8Array>;
  const body = new ReadableStream<Uint8Array>({
    start(c) {
      controller = c;
    },
  });
  return {
    body,
    push: (event: object) => controller.enqueue(encoder.encode(`${JSON.stringify(event)}\n`)),
    close: () => controller.close(),
  };
}

describe('useComponentGenerator 스트리밍', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('delta를 받는 동안 pending.code가 누적되고, done에서 컴포넌트로 확정된다', async () => {
    const stream = controlledStream();
    const fetchMock = vi.fn().mockResolvedValue(new Response(stream.body));
    vi.stubGlobal('fetch', fetchMock);

    const { result } = renderHook(() => useComponentGenerator());

    let generating!: Promise<void>;
    act(() => {
      generating = result.current.generate('버튼', 'key', 'google');
    });

    await waitFor(() => expect(result.current.pending).not.toBeNull());
    expect(result.current.pending?.code).toBe('');
    expect(result.current.pending?.prompt).toBe('버튼');

    await act(async () => {
      stream.push({ type: 'delta', text: 'const A' });
    });
    await waitFor(() => expect(result.current.pending?.code).toBe('const A'));

    const pendingId = result.current.pending!.id;

    await act(async () => {
      stream.push({ type: 'delta', text: ' = 1;' });
      stream.push({ type: 'done', code: 'const A = 1;\n\nrender(<A />);' });
      stream.close();
      await generating;
    });

    expect(result.current.pending).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.components).toHaveLength(1);
    expect(result.current.components[0].id).toBe(pendingId);
    expect(result.current.components[0].code).toBe('const A = 1;\n\nrender(<A />);');
    expect(fetchMock.mock.calls[0][0]).toBe('/api/generate/stream');
  });

  it('스트림 중 error 이벤트가 오면 에러를 표시하고 컴포넌트를 추가하지 않는다', async () => {
    const stream = controlledStream();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream.body)));

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      const generating = result.current.generate('버튼', 'key', 'google');
      stream.push({ type: 'delta', text: 'const' });
      stream.push({ type: 'error', error: '요청이 너무 많습니다.' });
      stream.close();
      await generating;
    });

    expect(result.current.error).toBe('요청이 너무 많습니다.');
    expect(result.current.pending).toBeNull();
    expect(result.current.components).toHaveLength(0);
  });

  it('done 없이 스트림이 끊기면 에러를 표시하고 컴포넌트를 추가하지 않는다', async () => {
    const stream = controlledStream();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response(stream.body)));

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      const generating = result.current.generate('버튼', 'key', 'google');
      stream.push({ type: 'delta', text: 'const' });
      stream.close();
      await generating;
    });

    expect(result.current.error).toBe('응답이 중간에 끊겼습니다. 다시 시도해주세요.');
    expect(result.current.pending).toBeNull();
    expect(result.current.components).toHaveLength(0);
  });

  it('HTTP 에러 응답은 서버가 준 error 문구를 그대로 보여준다', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(Response.json({ error: 'API 서버가 과부하입니다.' }, { status: 503 })),
    );

    const { result } = renderHook(() => useComponentGenerator());

    await act(async () => {
      await result.current.generate('버튼', 'key', 'google');
    });

    expect(result.current.error).toBe('API 서버가 과부하입니다.');
    expect(result.current.pending).toBeNull();
    expect(result.current.isLoading).toBe(false);
  });
});
