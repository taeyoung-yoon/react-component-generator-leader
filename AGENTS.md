# AGENTS.md

## Operational Commands

- 패키지 매니저는 bun 고정. npm/yarn/pnpm 사용 금지 (`bun.lock` 사용).
- 개발 서버(API + Vite 동시): `bun run dev`
- API 서버만: `bun run server` (포트 3002)
- 테스트 전체: `bun run test` (vitest run). 단일 파일: `bunx vitest run server/generator.test.ts`
- 린트: `bun run lint`
- 타입 체크 + 빌드: `bun run build` (`tsc -b && vite build`)
- 변경 후 최소 `bun run test`와 `bun run lint`를 통과시킨다.

## Golden Rules

### Immutable
- `.env`는 읽거나 출력하거나 커밋하지 않는다. API 키 값을 코드, 로그, 응답에 넣지 않는다. 근거: `.gitignore:32`, `server/index.ts:59-62`.
- 서버 환경변수 키는 클라이언트로 내려보내지 않는다. `/api/config`는 존재 여부(boolean)만 반환한다. 근거: `server/index.ts:147-153`.
- Google 호출 URL에 API 키가 쿼리스트링으로 들어간다(`server/index.ts:99`). 이 URL을 로그나 에러 메시지에 노출하지 않는다.

### 팀 고유 규칙
- **미리보기 계약(Hard Constraint)**: 생성 코드는 import 없이, 순수 JavaScript로, 마지막에 `render(<Name />)`을 호출해야 한다. react-live가 `noInline`으로 실행하고 TypeScript 변환을 하지 않기 때문이다. 시스템 프롬프트나 `LivePreview`를 바꾸면 이 세 가지를 함께 유지한다. 근거: `src/components/LivePreview.tsx:14`, `server/index.ts:11-20`, `server/generator.ts:13`.
- **이중 방어(Double Defense)**: 코드펜스 금지와 `render()` 호출 요구는 시스템 프롬프트(`server/index.ts:12,16`)와 후처리(`server/generator.ts:5,16`) 양쪽에서 막는다. 한쪽을 제거하면 모델이 어기는 순간 미리보기가 깨진다. 둘 다 유지한다.
- **프로바이더 비대칭(Asymmetry)**: 모델 폴백과 `MAX_TOKENS` 잘림 검사는 Google 경로에만 있다. Anthropic 경로(`server/index.ts:68-96`)에는 없다. 이를 "누락"으로 보고 임의로 맞추지 말고, 변경 시 사용자에게 먼저 확인한다. 근거: `server/index.ts:5,123,134`.
- **포트 동기화**: API 포트 3002는 `server/index.ts:139`와 `vite.config.ts:11`에 각각 하드코딩되어 있다. 하나를 바꾸면 반드시 둘 다 바꾼다.
- **에러 문자열 결합**: 503/429 매핑은 에러 메시지 문자열 포함 여부로 판정한다(`server/index.ts:194,201`). 이 판정은 `callAnthropic`/`callGoogleModel`이 던지는 `... error: ${status}` 형식(`server/index.ts:85,112`)에 의존한다. 메시지 형식을 바꾸면 매핑도 같이 고친다.
- **테스트 경계**: 순수 함수(`server/generator.ts`, `server/fallback.ts`)와 `PromptInput`만 테스트가 있다. `server/index.ts`, `useComponentGenerator`, `LivePreview`, `App`은 테스트가 없다. 새 로직은 `Bun.serve` 부수효과 바깥의 순수 함수로 추출해 테스트를 붙인다. 근거: `server/generator.ts:1-2`.

### Do / Don't
- Do: 프로바이더 추가 시 `Provider` 타입, `ENV_KEYS`, `/api/config` 응답, UI 선택지를 함께 수정한다.
- Don't: `Provider` 타입이 `server/index.ts:57`과 `src/types/index.ts:1`에 중복 정의되어 있다. 한쪽만 수정하지 않는다.
- Don't: 서버 CORS가 `*`로 열려 있다(`server/index.ts:51`). 인증이 필요한 엔드포인트를 이 서버에 추가하지 않는다.

## Project Context

프롬프트로 React 컴포넌트를 생성하고 실시간 미리보기를 제공하는 도구. 자세한 소개와 실행 방법은 `README.md` 참조.

Tech Stack: React 19, TypeScript, Vite, Bun, react-live, Vitest, Testing Library.

## Standards & References

- 커밋 메시지: 한국어 `feat|fix|refactor|chore: 요약`. 커밋은 `commit` 스킬을 사용한다.
- 코드 주석과 에러 메시지는 기존 파일처럼 한국어를 쓴다.
- Maintenance Policy: 이 문서의 규칙과 코드가 어긋나면 수정 대신 먼저 업데이트를 제안한다.

## Context Map

- **[API 서버 수정 (Bun)](./server/AGENTS.md)** — 프록시 라우트, 프로바이더 호출, 응답 후처리 작업 시.
- **[프론트엔드 수정 (React)](./src/AGENTS.md)** — 컴포넌트, 훅, 미리보기, 테스트 작업 시.
