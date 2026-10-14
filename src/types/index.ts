export type Provider = 'anthropic' | 'google';

/** `/api/generate/stream`이 줄바꿈(NDJSON) 단위로 내려보내는 이벤트. */
export type StreamEvent =
  | { type: 'delta'; text: string }
  | { type: 'done'; code: string }
  | { type: 'error'; error: string };

export interface GeneratedComponent {
  id: string;
  prompt: string;
  code: string;
  createdAt: Date;
}
