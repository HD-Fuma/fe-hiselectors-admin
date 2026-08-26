# 디자인 시스템

현재 화면이 디자인의 기준입니다. 별도 요청이 없으면 레이아웃, 정보 밀도, 문구, 색상, class와 상호작용을 유지합니다.

## 시각 원칙

- 1280px 이상 데스크톱 shell을 기준으로 한 조밀한 정보 밀도
- 기본 라이트 모드의 흰 sidebar·surface와 teal accent, 설정에서 다크 모드 선택 가능
- 기본 본문 12px, control 높이 27px, 작은 radius 중심
- 장식보다 표, 필터, 상태, 근거 정보의 판독성을 우선
- 상태는 색만으로 구분하지 않고 텍스트를 함께 표시

공통 값은 `src/styles/tokens.css`의 `--hsas-*` token을 사용합니다. font-size와 margin/padding/gap에는 `--hsas-font-*`, `--hsas-space-*`를 사용해야 하며 관련 token test가 이를 검사합니다. 기존 semantic token이 있으면 raw color를 새로 만들지 않습니다. 전역 token 값 변경은 모든 화면에 영향을 주므로 별도 요청 없이 수정하지 않습니다. 차트처럼 데이터에 따라 달라지는 크기·위치만 inline style로 둡니다.

## 표준 페이지 조합

관리 목록 화면은 아래 구조를 우선 사용합니다.

```tsx
<section className="fuma-page">
  <PageHeader title="..." />
  <div className="fuma-page__body">
    <SearchPanel actions={<SearchActions onReset={reset} onSearch={search} />}>
      <FilterField htmlFor="keyword" label="검색어">
        <TextInput id="keyword" />
      </FilterField>
    </SearchPanel>
    <ChoiceTabs ariaLabel="상태" options={options} value={value} onChange={setValue} />
    <ResultToolbar title="목록" meta={...} actions={...} />
    <DenseTable columns={columns} rowKey={(row) => row.id} rows={rows} />
    <Pagination page={page} pageSize={pageSize} totalPages={totalPages} />
  </div>
</section>
```

검색 state는 입력 중인 draft와 적용된 값이 필요한지 먼저 판단합니다. 조회·초기화 시 page를 1로 되돌리고, 필터 후 현재 page가 범위를 벗어나지 않게 `paginate()`를 사용합니다.

## 공통 컴포넌트 선택

| 필요 | 사용할 것 |
| --- | --- |
| 버튼·링크형 action | `Button`, 링크에는 `buttonClassNames()` |
| 텍스트·선택 입력 | `TextInput`, `Select`, `Checkbox` |
| 소수 보기 전환 | `SegmentedControl` |
| 상태·카테고리 filter | `ChoiceTabs` |
| 검색 영역 | `SearchPanel`, `FilterField`, `SearchActions` |
| 결과 제목·수량·action | `ResultToolbar` |
| 데이터 목록 | `DenseTable`, `Pagination`, `EmptyState` |
| 상태 badge | `StatusPill` |
| 확인/경고 | `AlertDialog` 또는 `Modal` |
| 상세 drawer | `SidePanel` |
| 크리에이터·지원자 상세 | `ProfileDetailShell`, `ProfileAnalysisReport` |
| SNS 표시 | `PlatformIcon`, `SOCIAL_PLATFORM_FILTER_OPTIONS` |
| 차트·그래프 | ECharts (`HsECharts`, `PeriodLineChart`, `AnalysisFormatDonut` 등) |

Modal과 SidePanel은 공통 focus trap, scroll lock, inert 처리를 사용합니다. feature에서 overlay lifecycle을 다시 구현하지 않습니다.

## 상세·카드 계약

- 크리에이터 풀: 카드 클릭으로 상세 열기, 별도 `상세보기` action 없음
- 선택 모드: 카드 클릭으로 선택/해제, 선택 상태가 시각·접근성 상태에 반영됨
- 카드 action: `제안하기`
- 지원자 상세: 크리에이터 상세와 동일한 profile/gallery/action + report 골격
- selector/정산에서 selector 상세가 필요하면 기존 `SelectorDetailPanel` 사용
- 행 전체가 실제 action일 때만 `DenseTable.onRowClick` 제공

## CSS 규칙

- `hsas-*`: 공통 primitive와 shell
- `fuma-<feature>-*`: feature/domain 전용
- BEM 형태인 `block__element--modifier`를 유지
- 컴포넌트가 출력하는 `ui-*`, `status-pill*` 호환 hook을 feature JSX에서 직접 작성하지 않음
- 기존 class가 제공하는 구조를 feature에서 복제하지 않음
- 같은 selector를 stylesheet 뒤에서 재정의하기 전에 원래 rule을 찾아 수정
- 새 feature 전용 스타일은 가능한 한 별도 `src/styles/<feature>.css`에 두고 route에서 한 번 import
- `admin.css`에 새로운 feature override를 계속 쌓지 않음
- `!important`, DOM 순서 기반 selector, 광범위한 element selector를 피함
- CSS 정리와 class rename을 동시에 하지 않음
- 아이콘은 기존 `lucide-react`와 `PlatformIcon`을 우선 사용
- public asset은 `assetUrl()`을 거쳐 base path에서도 동작하게 함
- 기존 `data-visual-contract`는 검증 hook이므로 제거하거나 이름을 바꾸지 않음

## 접근성

- click 대상은 가능한 native `button`, `a`, `input` 사용
- 모든 button은 의도한 `type`을 가짐
- 입력 label은 `htmlFor`/`id`로 연결
- option group에는 목적을 설명하는 `aria-label` 제공
- interactive container 안에 link/button을 중첩하지 않음
- custom clickable row/card는 Enter와 Space, focus 표시를 지원
- 읽기 전용 table row에는 불필요한 `tabIndex`를 추가하지 않음
- icon-only action에는 접근 가능한 이름을 제공
- 상태, 선택, 오류를 색상만으로 전달하지 않음

## 시각 변경 완료 조건

자동 browser 검사는 기본 작업에 포함하지 않습니다. 구현자는 `npm run check`를 통과시킨 뒤 사용자에게 다음을 전달합니다.

- 확인할 정확한 route
- 열어야 할 drawer/modal/filter 상태
- 유지되어야 할 기존 동작
- 의도적으로 달라진 부분
