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

- 테스트가 있는 곳: `components/PromptInput.test.tsx`, `lib/*.test.ts`, `hooks/usePersistentState.test.ts`. `useComponentGenerator`, `LivePreview`, `App`은 비어 있다.
- Node 26의 전역 `localStorage`가 jsdom을 가려서 `test/setup.ts`가 메모리 Storage로 대체한다. 이 대체를 지우지 않는다.
- 새 UI 로직은 Testing Library(`@testing-library/react`, `user-event`)로 사용자 동작 기준으로 작성한다.
- 실행: `bunx vitest run src`

## Local Golden Rules

- Do: 영속 상태(API 키, provider, 프롬프트 히스토리, 컴포넌트 목록)는 `usePersistentState`와 `lib/storage.ts`로만 다룬다. `localStorage`를 직접 호출하지 않는다. 키 이름은 `rcg:` 접두어를 쓴다.
- Do: 저장된 값은 반드시 `parse`로 검증·복원해서 읽는다. `createdAt`은 JSON에서 문자열이 되므로 `lib/storedComponents.ts`가 `Date`로 복원한다.
- Security: API 키가 평문으로 `localStorage`에 저장된다(`rcg:apiKeys`). 미리보기는 AI가 생성한 코드를 같은 오리진에서 실행하므로(`react-live`), 그 코드가 키를 읽을 수 있다. 이 저장 항목을 로그, 에러 메시지, 서버 요청 본문(필요한 `apiKey` 필드 제외)에 노출하지 않는다.
- Do: 키 입력이 없고 서버 환경변수도 없으면 요청 전에 막는다 (`App.tsx:34-38`). 이 가드를 우회하지 않는다.
- Don't: 서버 환경변수 키의 실제 값을 클라이언트가 받을 수 있게 하지 않는다. `/api/config`는 boolean만 받는다.
- Don't: 에러 처리에서 서버가 준 한국어 `error` 문구를 덮어쓰지 않는다 (`hooks/useComponentGenerator.ts:31-33`).
