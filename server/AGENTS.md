# server/AGENTS.md

## Module Context

Bun 런타임 위의 AI API 프록시. `index.ts`가 라우팅과 프로바이더 호출을, `generator.ts`와 `fallback.ts`가 순수 로직을 담당한다. Vite 개발 서버가 `/api`를 3002로 프록시한다.

## Tech Stack & Constraints

- 외부 HTTP SDK 없이 전역 `fetch`와 `Bun.serve`만 사용한다. 새 의존성을 추가하지 않는다. 근거: `index.ts:69,101,138`.
- 환경변수는 `process.env`로 읽는다: `ANTHROPIC_API_KEY`, `GOOGLE_API_KEY` (`index.ts:59-62`).

## Implementation Patterns

- 새 프로바이더는 `callXxx(prompt, apiKey)` 형태로 추가하고, 응답 텍스트를 반환한 뒤 `stripCodeFences` -> `ensureRenderCall` 순서로 정규화한다 (`index.ts:183-188`).
- 모델 폴백이 필요하면 `withModelFallback(models, attempt)`를 쓴다 (`index.ts:135`). 모델 목록은 파일 상단 상수에서 우선순위 순으로 관리한다 (`index.ts:5`).
- 모든 응답에 `CORS_HEADERS`를 붙인다. 에러 응답도 예외 없다 (`index.ts:155-211`).

## Testing Strategy

- 테스트 대상은 부수효과 없는 모듈만이다: `generator.test.ts`, `fallback.test.ts`.
- `index.ts`는 import 시 `Bun.serve`가 즉시 실행되므로 테스트에서 import하지 않는다. 테스트하고 싶은 로직은 별도 모듈로 분리한다.
- 실행: `bunx vitest run server`

## Local Golden Rules

- Do: 시스템 프롬프트(`index.ts:7-49`)를 수정할 때 "import 금지, `render()` 호출, 순수 JS, 코드펜스 금지" 4개 규칙을 유지한다. 후처리(`generator.ts`)가 일부만 보완한다.
- Do: 프로바이더가 던지는 에러 메시지는 `<Provider> API error: <status>` 형식을 유지한다. 503/429 매핑이 문자열 포함 검사에 의존한다 (`index.ts:194,201`).
- Don't: 요청 본문의 `apiKey`나 Google URL(`index.ts:99`)을 `console.log`로 출력하지 않는다.
- Don't: `resolveApiKey`의 우선순위(클라이언트 키 > 환경변수)를 바꾸지 않는다. UI 직접 입력이 `.env`를 덮어쓰는 것이 README 동작이다 (`index.ts:64-66`).
