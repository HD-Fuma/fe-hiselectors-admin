# FUMA 관리자 UI 시각 검증 기록

검증일: 2026-08-04 (Asia/Seoul)

대상: React + TypeScript 정적 관리자 UI

시각 테스트 포트: `FUMA_VISUAL_PORT=45184`

## 검증 방식

- Chromium을 `deviceScaleFactor: 1`, `ko-KR`, `Asia/Seoul`, light color scheme, reduced motion으로 고정했다.
- 각 화면 진입 전에 콘솔 오류, page error, request failure를 수집하고, 설정된 로컬 origin과 `data:`/`blob:` 외 요청을 차단한다.
- `[data-app-ready="true"]`, `document.fonts.ready`, 모든 이미지의 complete 상태를 기다린 뒤 측정·캡처한다.
- 관리자 화면은 40px 아이콘 레일, 205px 마이메뉴, 38px 상단 바, 27px 입력 컨트롤, 27~29px 밀도형 표 행을 공통 계약으로 확인했다.
- 모든 캡처를 이미지 뷰어에서 원본 `hsas-01`~`hsas-09`와 직접 대조했다.

## RED → GREEN

- RED: 새 `admin.spec.ts`의 9개 체크포인트 모두가 의도한 route-specific `data-visual-contract` 부재로 실패했다.
- GREEN: 안정 마커와 레거시 비율 보정을 적용한 뒤 새 체크포인트 9/9가 통과했다.
- 전체: 기존 로그인/셸 4건을 포함한 Playwright 시각 테스트 13/13 통과.

## 체크포인트와 측정값

| 캡처 | 경로 · 뷰포트 | 기준 이미지 | 관측 치수 | 판정 |
| --- | --- | --- | --- | --- |
| [login.png](../../../test-results/visual/login.png) | `/login` · 1869×942 | `hsas-09-current-login.png` (주 기준), `hsas-05-legacy-login.png` (색상 맥락) | 카드 460×570px, 문서 폭 1869px | 통과 |
| [creators.png](../../../test-results/visual/creators.png) | `/creators` · 1310×741 | `hsas-01-product-register.png`, `hsas-03-product-edit-table.png` | 레일 40px, 메뉴 205px, 상단 38px, 컨트롤 27px, 행 29px | 통과 |
| [creators-1440.png](../../../test-results/visual/creators-1440.png) | `/creators` · 1440×900 | `hsas-01-product-register.png`, `hsas-03-product-edit-table.png` | 레일 40px, 메뉴 205px, 상단 38px, 문서 폭 1440px | 통과 |
| [applicant-detail.png](../../../test-results/visual/applicant-detail.png) | `/applicants/ap-001` · 1318×742 | `hsas-07-basic-form.png`, `hsas-03-product-edit-table.png` | 공통 셸 40/205/38px, 컨트롤 27px, 밀도형 행 29px | 통과 |
| [campaign-modal.png](../../../test-results/visual/campaign-modal.png) | `/campaigns/new?fixture=product-modal` · 1316×741 | `hsas-02-product-search-modal.png` | 모달 820×531px, x=371px, y=105px, 제목 바 36px, 컨트롤 27px, 행 29px | 통과 |
| [content-edited.png](../../../test-results/visual/content-edited.png) | `/content/reviews/ct-003?fixture=edited` · 1316×735 | `hsas-06-editor-source.png`, `hsas-04-image-upload.png` | 공통 셸 40/205/38px, 2열 편집기, 소스 영역 최소 158px | 통과 |
| [mega-menu.png](../../../test-results/visual/mega-menu.png) | `/?fixture=mega-menu` · 762×577 | `hsas-08-mega-menu.png` | 메뉴 762×577px, 제목 바 25px, 1열 141px, 2열 222px, 문서 폭 1280px | 통과 |
| [performance.png](../../../test-results/visual/performance.png) | `/performance` · 1316×742 | `hsas-03-product-edit-table.png`, `hsas-07-basic-form.png` | 공통 셸 40/205/38px, 지표 띠 49px, 컨트롤 27px, 행 29px | 통과 |
| [settlements.png](../../../test-results/visual/settlements.png) | `/settlements` · 1316×742 | `hsas-03-product-edit-table.png`, `hsas-07-basic-form.png` | 공통 셸 40/205/38px, 컨트롤 27px, 행 29px | 통과 |

## 원본 대비 확인 결과

- `hsas-09`: 로그인 카드 위치·460×570 비율·회색 배경·teal 로그인 버튼·우측 링크/QR 배치를 유지했다.
- `hsas-01`, `hsas-03`, `hsas-07`: 40px/205px 좌측 내비게이션, 사각형 입력, 얇은 회색 경계, 12px 본문, 밀도형 표와 teal 활성 상태를 유지했다.
- `hsas-02`: 상품 선택 모달을 좌측 셸을 제외한 작업 영역 중앙에 배치하고 820px 폭, teal 제목 바, 검색 폼, 긴 결과 영역과 하단 액션 비율을 맞췄다.
- `hsas-06`: 흐린 2단 도구막대와 읽기 전용 HTML 소스 표현, 넓은 흰 편집 영역을 재현했다.
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
