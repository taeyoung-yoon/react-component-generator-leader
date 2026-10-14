---
name: create-pr
description: 현재 브랜치의 커밋과 변경사항을 분석해 GitHub Pull Request를 생성한다. 프로젝트 성격에 따라 영문 템플릿(해외 오픈소스)과 한국어 템플릿(국내 프로젝트) 중 알맞은 것을 골라 본문을 작성한다. 사용자가 "PR 만들어줘", "PR 올려줘", "풀리퀘스트 생성", "create a PR", "open a pull request", "리뷰 요청할 수 있게 PR로 올려줘"처럼 현재 작업을 GitHub PR로 올려 달라고 하면, "PR"이라는 단어가 정확히 없어도 반드시 이 스킬을 사용한다. 커밋만 원하는 경우에는 commit 스킬을 쓰고, 기존 PR의 리뷰 코멘트 반영은 autofix 스킬을 쓴다.
context: fork
---

# create-pr

현재 브랜치를 분석해 GitHub PR을 만든다. 이 스킬은 `context: fork`로 서브 에이전트에서 실행되므로, 대화 기록을 볼 수 없다고 가정하고 **git 상태만 근거로** 판단한다. 끝나면 PR URL과 선택한 템플릿·이유를 요약해서 돌려준다.

## 절차

### 1. 사전 점검
```bash
git branch --show-current
git status --short
gh auth status
git remote -v
```
- 기본 브랜치(main/master)에 있으면 PR을 만들 수 없다. 멈추고 "작업 브랜치를 먼저 만들어 달라"고 보고한다. 브랜치를 임의로 만들어 옮기면 사용자가 의도하지 않은 이름과 상태가 남는다.
- 커밋되지 않은 변경이 있으면 PR에 담기지 않는다. 임의로 커밋하지 말고 이 사실을 결과에 분명히 적는다(커밋은 commit 스킬의 몫이다).
- `gh`가 로그인되어 있지 않으면 멈추고 `gh auth login`이 필요하다고 보고한다.

### 2. base 브랜치와 변경 범위 파악
```bash
gh repo view --json defaultBranchRef -q .defaultBranchRef.name   # base 후보
git log --oneline <base>..HEAD
git diff <base>...HEAD --stat
git diff <base>...HEAD
```
- 사용자가 base를 지정했으면 그것을 쓴다. 아니면 기본 브랜치.
- `<base>..HEAD`에 커밋이 없으면 PR할 내용이 없으므로 멈추고 보고한다.
- 이미 같은 head의 열린 PR이 있는지 `gh pr list --head <브랜치> --state open`으로 확인한다. 있으면 새로 만들지 않고 그 URL을 알린다.

### 3. 템플릿 결정
아래 순서로 판단하고, **먼저 일치하는 것을 따른다.**

1. **저장소 자체 PR 템플릿**: `.github/pull_request_template.md`, `.github/PULL_REQUEST_TEMPLATE/`, 루트의 `pull_request_template.md`가 있으면 그것을 쓴다. 팀이 정한 형식이 우리 기본값보다 우선하기 때문이다. 이 경우 references의 템플릿은 쓰지 않는다.
2. **사용자 지정**: 사용자가 "영문으로", "한글로"라고 했으면 그대로 따른다.
3. **프로젝트 성격 추정**: 아래 신호를 모아 다수결로 정한다.

| 신호 | 한국어 템플릿 | 영문 템플릿 |
|---|---|---|
| 최근 커밋 메시지(`git log -20`) | 한국어 위주 | 영어 위주 |
| README 본문 언어 | 한국어 | 영어 |
| CONTRIBUTING / CODE_OF_CONDUCT 존재 | - | 있으면 영문 쪽 |
| 저장소 소유자·조직, 기존 PR/이슈 언어 (`gh pr list -L 10`) | 국내 조직·한국어 | 해외 조직·영어 |
| 기여자 풀 | 사내·국내 팀 | 외부 기여자 다수 |

신호가 갈리거나 불분명하면 **한국어/영어를 억지로 섞지 말고**, 커밋 메시지 언어를 기준으로 정한다. 그 뒤 결과 보고에 "어떤 신호로 골랐는지"를 적어 사용자가 바로잡을 수 있게 한다.

선택 후 해당 파일을 읽는다.
- 한국어: `references/template-ko.md`
- 영문: `references/template-en.md`

### 4. 제목과 본문 작성
- **제목**: 70자 이내 한 줄. 커밋이 하나면 그 메시지를 다듬어 쓰고, 여러 개면 전체를 아우르는 문장을 새로 쓴다. 한국어 템플릿이면 한국어, 영문이면 영어로. 저장소에 `feat:`/`fix:` 접두어 관례가 있으면 맞춘다.
- **본문**: 선택한 템플릿의 섹션을 모두 채운다. 변경 이유(why)를 가장 먼저 쓰고, diff만 봐도 알 수 있는 나열은 줄인다.
- 템플릿 칸을 채울 근거가 diff에 없으면 지어내지 말고 "해당 없음"(N/A)으로 둔다. 실행하지 않은 테스트를 실행했다고 체크하지 않는다.
- 이슈 번호는 브랜치명이나 커밋 메시지에 있을 때만 `Closes #N`으로 연결한다.
- 비밀값, 내부 URL, 개인정보를 본문에 옮기지 않는다.
- 본문 맨 끝에 하네스가 지시한 attribution 줄이 있으면 붙인다.

### 5. push와 PR 생성
```bash
git push -u origin <브랜치>     # 원격에 없거나 뒤처졌을 때만
gh pr create --base <base> --title "<제목>" --body-file <본문 파일>
```
- 본문은 임시 파일에 써서 `--body-file`로 넘긴다. 여러 줄 본문과 따옴표를 쉘 인자로 직접 넣으면 깨지기 쉽다.
- `--force` push는 하지 않는다. push가 거부되면 원인(원격이 앞서 있음 등)을 보고하고 멈춘다.
- 사용자가 요청한 경우에만 `--draft`, `--reviewer`, `--label`을 붙인다.
- 생성 후 `gh pr view --json url,title,baseRefName -q .`로 확인한다.

### 6. 결과 보고
서브 에이전트의 마지막 메시지가 사용자에게 전달되는 전부이므로, 아래를 간결하게 담는다.
- PR URL, 제목, base <- head
- 선택한 템플릿(저장소 자체 / 한국어 / 영문)과 그 근거 신호
- 포함된 커밋 수와 한 줄 요약
- 주의사항: 미커밋 변경이 남아 있음, N/A로 둔 항목 등
