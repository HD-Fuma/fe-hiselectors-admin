# FUMA 관리자 UI 시각 검증 기록

> **역사 기록 · 현재 기준 아님:** 이 문서는 2026-08-04 당시의 아이콘 레일·마이메뉴·전체 메뉴 오버레이 기반 셸을 검증한 결과를 변경 없이 보존한다. 현재 관리자 셸의 권위 있는 설계 기준은 [2026-08-05 단일 사이드바 개편 명세](../specs/2026-08-05-admin-sidebar-redesign-design.md)이며, 최신 검증 결과는 [2026-08-05 관리자 사이드바 개편 검증 기록](./2026-08-05-admin-sidebar-redesign.md)을 따른다.

검증일: 2026-08-04 (Asia/Seoul)

대상: React + TypeScript 정적 관리자 UI

시각 테스트 포트: `FUMA_VISUAL_PORT=45184`

## 검증 방식

- Chromium을 `deviceScaleFactor: 1`, `ko-KR`, `Asia/Seoul`, light color scheme, reduced motion으로 고정했다.
- 각 화면 진입 전에 콘솔 오류, page error, request failure를 수집하고, 설정된 로컬 origin과 `data:`/`blob:` 외 요청을 차단한다.
- `[data-app-ready="true"]`, `document.fonts.ready`, 모든 이미지의 complete 상태를 기다린 뒤 측정·캡처한다.
- 관리자 화면은 x=0에서 전체 화면 폭을 차지하는 38px 상단 바, y=38에서 시작하는 40px 아이콘 레일과 205px 마이메뉴, 27px 입력 컨트롤, 27~29px 밀도형 표 행을 공통 계약으로 확인했다.
- 로그인, 화면 헤더, 밀도형 표, 모달, 콘텐츠 비교, 전체메뉴, 성과 지표, 정산 표의 핵심 가시 텍스트 묶음을 지정하고 각 텍스트의 실제 bounding box가 소속 컴포넌트 rectangle 안에 완전히 포함되는지 확인했다.
- 모든 캡처를 이미지 뷰어에서 원본 `hsas-01`~`hsas-09`와 직접 대조했다.

## RED → GREEN

- RED: 새 `admin.spec.ts`의 9개 체크포인트 모두가 의도한 route-specific `data-visual-contract` 부재로 실패했다.
- GREEN: 안정 마커와 레거시 비율 보정을 적용한 뒤 새 체크포인트 9/9가 통과했다.
- 재검토 RED: 콘텐츠 편집 화면의 첫 미디어 영역 하단이 y=879.17px로 735px 뷰포트를 벗어나는 것을 새 가시성 계약이 검출했다.
- 재검토 GREEN: 상세 전용 5열 기본 정보와 editor/media 2열 스냅샷을 적용해 편집기 2개, 미디어 영역 2개, 변경 요약을 모두 고정 뷰포트 안에 배치했고 강화된 핵심 텍스트 경계 검사를 포함해 9/9가 통과했다.
- 셸 RED: 기존 상단 바 x=245px가 전체 폭 계약(x=0px)을 위반했다. 셸을 38px 전역 헤더와 하단 작업행으로 재구성한 뒤 상단 바 x=0px·root 전체 폭, 레일/메뉴 y=38px 계약이 통과했다.
- 전체: 기존 로그인/셸 4건을 포함한 Playwright 시각 테스트 13/13 통과.

## 체크포인트와 측정값

| 캡처 | 경로 · 뷰포트 | 기준 이미지 | 관측 치수 | 판정 |
| --- | --- | --- | --- | --- |
| [login.png](../../../test-results/visual/login.png) | `/login` · 1869×942 | `hsas-09-current-login.png` (주 기준), `hsas-05-legacy-login.png` (색상 맥락) | 카드 460×570px, 문서 폭 1869px | 통과 |
| [creators.png](../../../test-results/visual/creators.png) | `/creators` · 1310×741 | `hsas-01-product-register.png`, `hsas-03-product-edit-table.png` | 상단 바 x=0·w=1310·h=38px, 레일/메뉴 y=38px·w=40/205px, 컨트롤 27px, 행 29px | 통과 |
| [creators-1440.png](../../../test-results/visual/creators-1440.png) | `/creators` · 1440×900 | `hsas-01-product-register.png`, `hsas-03-product-edit-table.png` | 상단 바 x=0·w=1440·h=38px, 레일/메뉴 y=38px, 문서 폭 1440px | 통과 |
| [applicant-detail.png](../../../test-results/visual/applicant-detail.png) | `/applicants/ap-001` · 1318×742 | `hsas-07-basic-form.png`, `hsas-03-product-edit-table.png` | 공통 셸 40/205/38px, 컨트롤 27px, 밀도형 행 29px | 통과 |
| [campaign-modal.png](../../../test-results/visual/campaign-modal.png) | `/campaigns/new?fixture=product-modal` · 1316×741 | `hsas-02-product-search-modal.png` | 모달 820×531px, x=371px, y=105px, 제목 바 36px, 컨트롤 27px, 행 29px | 통과 |
| [content-edited.png](../../../test-results/visual/content-edited.png) | `/content/reviews/ct-003?fixture=edited` · 1316×735 | `hsas-06-editor-source.png`, `hsas-04-image-upload.png` | 기본 정보 99px, 비교 영역 y=327~634px, 미디어 하단 최대 y=633px, 변경 요약 y=644~682px | 통과 |
| [mega-menu.png](../../../test-results/visual/mega-menu.png) | `/?fixture=mega-menu` · 762×577 | `hsas-08-mega-menu.png` | 메뉴 762×577px, 제목 바 25px, 1열 141px, 2열 222px, 문서 폭 1280px | 통과 |
| [performance.png](../../../test-results/visual/performance.png) | `/performance` · 1316×742 | `hsas-03-product-edit-table.png`, `hsas-07-basic-form.png` | 공통 셸 40/205/38px, 지표 띠 49px, 컨트롤 27px, 행 29px | 통과 |
| [settlements.png](../../../test-results/visual/settlements.png) | `/settlements` · 1316×742 | `hsas-03-product-edit-table.png`, `hsas-07-basic-form.png` | 공통 셸 40/205/38px, 컨트롤 27px, 행 29px | 통과 |

## 원본 대비 확인 결과

- `hsas-09`: 로그인 카드 위치·460×570 비율·회색 배경·teal 로그인 버튼·우측 링크/QR 배치를 유지했다.
- `hsas-01`, `hsas-03`, `hsas-07`: 40px/205px 좌측 내비게이션, 사각형 입력, 얇은 회색 경계, 12px 본문, 밀도형 표와 teal 활성 상태를 유지했다.
- `hsas-02`: 상품 선택 모달을 좌측 셸을 제외한 작업 영역 중앙에 배치하고 820px 폭, teal 제목 바, 검색 폼, 긴 결과 영역과 하단 액션 비율을 맞췄다.
- `hsas-06`: 흐린 2단 도구막대와 읽기 전용 HTML 소스 표현, 넓은 흰 편집 영역을 재현했다. 1316×735 캡처 안에서 이전/현재 editor frame, 양쪽 media tiles, 변경 요약을 동시에 확인할 수 있다.
- `hsas-08`: 762×577 화면 전체를 덮는 전체메뉴, 25px teal 제목 바, 141px 업무군 열과 222px 하위 메뉴 열을 맞췄다.

허용한 차이는 기능 명세에 따른 콘텐츠 차이뿐이다. 원본의 상품 등록 데이터·HSAS 명칭 대신 FUMA 크리에이터/지원자/캠페인/콘텐츠/성과/정산 텍스트를 사용했고, 교육 영상의 자막·마우스 포인터는 UI가 아니므로 제외했다. 상품 사진 대신 기능 명세용 로컬 SVG 미디어 타일을 사용하며 외부 네트워크 요청은 없다.

## 최종 명령

```text
npm test -- --run
npm run lint
npm run build
FUMA_VISUAL_PORT=45184 npm run test:visual
git diff --check
```

최종 결과: unit 142/142, lint 통과, production build 통과, visual 13/13, diff check 통과.
