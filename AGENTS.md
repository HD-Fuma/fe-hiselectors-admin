# Hi-Selectors 작업 규칙

이 파일은 저장소 전체에 적용됩니다. 사람과 에이전트 모두 같은 기준으로 작업합니다.

## 먼저 읽을 것

기본적으로 이 파일만 읽고 시작합니다. 필요한 문서만 추가로 엽니다.

- 라우트·폴더·의존성 변경: `docs/architecture.md`
- UI·CSS·컴포넌트 변경: `docs/design-system.md`
- 구현·테스트·인계 방식: `docs/development.md`
- 크리에이터·지원자 카드·상세·분석 변경: `docs/product/creators-applicants.md`
- 콘텐츠 검수 변경: `docs/product/content-inspection.md`
- 크리에이터 이미지 교체: `docs/assets/creator-media.md`

큰 `Pages.tsx`나 CSS 전체를 처음부터 읽지 마세요. `rg`로 대상 심볼·class·유사 화면을 찾고 필요한 부분만 읽습니다.

## 기준의 우선순위

1. 사용자의 최신 지시
2. 사용자가 확인한 현재 화면 동작과 디자인
3. 현재 소스·테스트·이 문서
4. Git 과거 이력

현재 UI를 임의로 재설계하지 않습니다. 구조 변경은 JSX, 문구, class 이름과 동작을 가능한 그대로 보존합니다.

## 용어와 화면 계약

- 폴더·route·도메인 이름은 단수와 복수 모두 `selectors`를 사용합니다. `selector/` 폴더나 `/selector` route를 새로 만들지 않습니다.
- 사용자 문구는 항상 `셀렉터스`입니다.
- 콘텐츠 도메인은 `inspection`, `inspections`, `검수`를 사용합니다. 콘텐츠에 `review`를 다시 도입하지 않습니다. 지원자 심사의 review 용어는 별개입니다.
- 정산 feature는 `settlements`입니다. `operations` feature를 다시 만들지 않습니다.
- 크리에이터 풀 카드는 카드 자체를 클릭해 상세를 엽니다. 별도 `상세보기` 버튼을 추가하지 않습니다.
- 선택 모드에서는 카드 클릭이 선택/해제를 수행합니다.
- 크리에이터 카드의 제안 action 문구는 `제안하기`입니다.
- 지원자 상세는 크리에이터 상세와 같은 `ProfileDetailShell`·`ProfileAnalysisReport` 구조를 사용합니다.
- 카카오 수신 현황은 `/notifications/kakao-recipients`입니다. 수신 가능·미연결·수신 불가만 보여 주고, 친구 목록·테스트 발송·발신 OAuth는 이 화면에 넣지 않습니다.

## 구조와 의존성

- `app`: route manifest, router, layout 조립
- `features`: route/page 단위 사용자 기능
- `entities`: 도메인 타입·fixture·계산·도메인 UI
- `components`: 공통 UI와 shell
- `lib`: 순수 helper
- `styles`: token, global, shell, feature CSS

규칙:

- route/menu/title/work-tab은 `src/app/navigation.ts`에 한 번만 선언합니다.
- route component는 lazy import를 유지합니다.
- feature끼리 직접 import하지 않습니다.
- entity는 feature를 import하지 않습니다.
- 외부에서는 `entities/<name>/index.ts`만 import하고 `model/`, `ui/`를 직접 열지 않습니다.
- 기존 entity 공개 API에 필요한 항목이 없으면 작은 named export를 추가합니다. `export *`는 사용하지 않습니다.
- 다른 entity 여러 개를 조합하는 코드를 entity 내부에 새로 추가하지 않습니다. feature/widget/read-model 계층에서 조합합니다.
- 실제 API 계약이 생기기 전에는 repository, DI, 전역 상태 계층을 미리 만들지 않습니다.

ESLint가 일부 경계를 강제합니다. 규칙을 우회하는 disable comment보다 구조를 고칩니다.

## 디자인 시스템 사용

새 UI를 만들기 전에 `src/components/ui`와 가장 비슷한 기존 화면을 확인합니다.

- 입력과 action: `Button`, `TextInput`, `Select`, `Checkbox`, `SegmentedControl`
- 검색: `SearchPanel` + `FilterField` + `SearchActions`
- 상태/분류 전환: `ChoiceTabs`
- 결과 머리말: `ResultToolbar`
- 목록: `DenseTable` + `Pagination` + `EmptyState`
- 상태 표시: `StatusPill`
- overlay: `Modal`, `AlertDialog`, `SidePanel`
- 프로필 상세: `ProfileDetailShell` + `ProfileAnalysisReport`
- 페이지 제목: `PageHeader`
- 차트·그래프: ECharts (`HsECharts` / `PeriodLineChart` / `AnalysisFormatDonut`). feature에서 `echarts`를 직접 import하거나 SVG로 차트를 새로 그리지 않습니다. Recharts·Chart.js·Visx 등 다른 차트 라이브러리를 도입하지 않습니다.

동일한 DOM과 class를 feature에서 복사하지 않습니다. 두 화면 이상에서 같은 패턴이 실제로 필요할 때만 공통 컴포넌트로 추출합니다.

CSS는 `docs/design-system.md`를 따릅니다. font와 spacing은 token을 사용하고, 기존 class를 우선하며, 같은 selector를 파일 끝에서 다시 override하지 않습니다.

## 작업 순서

1. `git status --short`로 다른 작업자의 변경을 확인합니다.
2. `rg`로 대상과 유사 구현을 찾습니다.
3. 변경 파일과 유지해야 할 화면 계약을 짧게 정합니다.
4. 가장 작은 범위로 구현합니다.
5. 관련 테스트를 먼저 실행하고 마지막에 `npm run check`를 실행합니다.
6. UI 변경은 사용자가 확인할 정확한 route와 상태를 전달합니다.

사용자가 별도로 요청하지 않는 한 브라우저나 Playwright를 실행하지 않습니다. 시각 검증은 사용자에게 요청합니다.

## 테스트와 문서

- 테스트는 현재 동작을 지키는 계약입니다. 이미 사라진 화면을 검증하는 테스트는 업데이트하거나 삭제합니다.
- 실패를 숨기기 위해 유효한 assertion을 약화하지 않습니다.
- 날짜가 붙은 구현 계획, 작업 일지, 검증 로그, 자동 생성 screenshot을 저장소에 추가하지 않습니다.
- 현재 기준이 바뀌면 이 파일이나 `docs/`의 해당 문서만 짧게 갱신합니다. 과거 내용은 Git 이력으로 확인합니다.
- 빌드 결과, 로그, coverage, Playwright 결과는 커밋하지 않습니다.

## 금지 사항

- 관련 없는 dirty worktree 변경 되돌리기
- 화면 보존 리팩터링과 디자인 변경을 한 번에 수행하기
- 기존 공통 컴포넌트가 있는데 feature 전용 복제본 만들기
- fixture/status/formatter를 feature마다 다시 선언하기
- 중첩된 button/link 등 접근성이 깨지는 interactive 구조 만들기
- 타입 문제를 `any`나 근거 없는 cast로 덮기
- 새 의존성을 기존 코드로 해결 가능한데 추가하기
