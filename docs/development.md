# 개발 방식

## 최소 탐색 순서

불필요한 전체 파일 읽기를 피합니다.

1. 루트 `AGENTS.md`
2. `package.json`
3. route 작업이면 `src/app/navigation.ts`
4. 변경 대상과 가장 유사한 feature 및 관련 test
5. 필요한 entity의 `index.ts`
6. UI 작업이면 `src/styles/tokens.css`와 실제로 연결된 stylesheet의 관련 selector

검색은 `rg`와 `rg --files`를 우선 사용합니다. 큰 `Pages.tsx`, `admin.css`, fixture 전체는 필요한 심볼 주변만 읽습니다.

## 구현 원칙

- 기존 동작을 먼저 확인하고 최소 diff로 변경
- 같은 문제를 이미 해결한 공통 컴포넌트와 helper 재사용
- 상태·fixture·formatter의 단일 원본 유지
- route는 manifest에 추가하고 lazy loading 유지
- 새로운 공통화는 실제 소비자가 두 곳 이상이고 API가 안정적일 때 수행
- 구조 이동 중에는 JSX, 문구, class 이름을 유지
- 다른 사람의 dirty worktree 변경을 되돌리지 않음
- 새 package는 현재 의존성과 작은 로컬 코드로 해결할 수 없을 때만 추가

## 테스트 원칙

테스트의 목적은 현재 사용자 계약과 재사용 컴포넌트의 핵심 동작을 지키는 것입니다.

- 순수 계산: 작은 unit test
- filter/pagination/selection: 사용자 상호작용 test
- route/manifest/shell: 대표 smoke test
- 접근성 lifecycle: 공통 Modal/SidePanel/DenseTable test
- 과거에 제거된 화면만 검증하는 test는 함께 제거
- 구현 세부 class나 fixture 전체 snapshot에 과도하게 결합하지 않음

관련 테스트를 먼저 실행하고 마지막에 다음을 실행합니다.

```bash
npm run check
```

개별 명령:

```bash
npm run lint
npm run test:run
npm run build
```

사용자가 명시적으로 요청하지 않으면 `npm run test:visual`, Playwright, 브라우저 자동 조작을 실행하지 않습니다. UI 확인은 route와 상태를 지정해 사용자에게 요청합니다.

## 변경 유형별 확인

### Route·메뉴

- `ADMIN_ROUTE_MANIFEST`만 수정했는가
- 기존 redirect와 work-tab parent가 유지되는가
- 새 page가 lazy import되는가

### 목록·필터

- 검색/초기화가 page를 1로 되돌리는가
- 빈 결과에 `EmptyState` 또는 table empty message가 있는가
- nested action 클릭이 row/card action으로 전파되지 않는가

### 상세·overlay

- 기존 공통 shell을 사용했는가
- 닫기, Escape, focus 복귀, background inert가 유지되는가
- route 상세와 list drawer가 같은 내용 계약을 사용하는가

### CSS

- 기존 token과 component class를 재사용했는가
- 같은 selector의 중복 override를 추가하지 않았는가
- 관련 없는 화면 selector를 변경하지 않았는가

## 완료 보고

다음 네 가지만 간결하게 남깁니다.

1. 달라진 사용자 동작
2. 주요 구조 변경
3. 실행한 비브라우저 검증 결과
4. 사용자가 직접 확인할 route와 상태

날짜별 계획서, 긴 작업 일지, 명령 전체 출력, screenshot 결과를 새 문서로 만들지 않습니다. 과거 기록은 Git commit/PR을 사용합니다.
