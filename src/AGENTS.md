# src/AGENTS.md

## Module Context

Vite + React 19 프론트엔드. 서버와는 `/api/generate`, `/api/config`로만 통신하며, 생성된 코드는 react-live로 브라우저에서 직접 실행한다.

## Tech Stack & Constraints

- 미리보기는 `react-live`의 `LiveProvider noInline` 모드다 (`components/LivePreview.tsx:14`). 생성 코드는 문자열로만 다루고 `eval`/`new Function`을 직접 쓰지 않는다.
- 서버 호출은 상대 경로 `/api/...`만 쓴다. 호스트나 포트를 하드코딩하지 않는다 (Vite 프록시 사용). 근거: `hooks/useComponentGenerator.ts:23`.

## Implementation Patterns

- 서버 통신과 상태는 `hooks/useComponentGenerator.ts`에 모으고, 컴포넌트는 props로 받는다.
- 공유 타입은 `types/index.ts`에 둔다. `Provider`는 서버에도 중복 정의되어 있으므로 값 변경 시 `server/index.ts:57`도 함께 수정한다.
- 테스트 파일은 대상 옆에 `*.test.tsx`로 둔다. 공통 설정은 `test/setup.ts`.

## Testing Strategy

- 현재 테스트는 `components/PromptInput.test.tsx`뿐이다. 훅, `LivePreview`, `App`은 비어 있다.
- 새 UI 로직은 Testing Library(`@testing-library/react`, `user-event`)로 사용자 동작 기준으로 작성한다.
- 실행: `bunx vitest run src`

## Local Golden Rules

- Do: API 키는 `App`의 로컬 state에만 둔다 (`App.tsx:14`). `localStorage` 등에 저장하지 않는다.
- Do: 키 입력이 없고 서버 환경변수도 없으면 요청 전에 막는다 (`App.tsx:34-38`). 이 가드를 우회하지 않는다.
- Don't: 서버 환경변수 키의 실제 값을 클라이언트가 받을 수 있게 하지 않는다. `/api/config`는 boolean만 받는다.
- Don't: 에러 처리에서 서버가 준 한국어 `error` 문구를 덮어쓰지 않는다 (`hooks/useComponentGenerator.ts:31-33`).
