# FUMA 관리자 단일 사이드바 개편 검증 기록

- 검증일: 2026-08-05 (Asia/Seoul)
- 브랜치: `codex/fuma-admin-ui`
- 검증 기준 HEAD: `4d5e1ec43baad2af23162045137e5cc07d85c3a1`
- 권위 있는 설계 기준: [FUMA 관리자 단일 사이드바 개편 디자인 명세](../specs/2026-08-05-admin-sidebar-redesign-design.md)
- Playwright 자동 검증 URL: `http://127.0.0.1:4174`
- 지속형 수동 검증 URL: `http://127.0.0.1:5173/creators`, `http://127.0.0.1:5173/login`

## 자동 검증 결과

아래 결과는 문서와 로그인 진단 보강 후 새로 실행한 값이다.

| 명령 | 결과 |
| --- | --- |
| production source 금지 참조 guard | exit 0, 일치 0건 |
| test 금지 참조 guard | exit 0, 일치 0건 |
| `npm run lint` | exit 0, ESLint 오류·경고 출력 없음 |
| `npm test -- --run` | test file 14/14, test 144/144 통과, 실패 0건 |
| `npm run build` | exit 0, TypeScript build와 Vite production build 성공, 1,832 modules transformed |
| `FUMA_VISUAL_PORT=4174 npm run test:visual` | 15/15 통과, 실패 0건, 7.2s |
| `git diff --check` | exit 0, 출력 없음 |

금지 참조 guard는 다음 두 명령을 그대로 사용했다.

```text
! rg -n "IconRail|MyMenu|MegaMenu|hsas-icon-rail|hsas-my-menu|hsas-mega-menu|fixture=mega-menu|현재 화면 즐겨찾기|메뉴 편집|hsas-rail-width|hsas-menu-width|hsas-top-bar-height|--rail-width|--menu-width|--topbar-height" src --glob '!**/*.test.ts' --glob '!**/*.test.tsx'
! rg -n "IconRail|MyMenu|MegaMenu|hsas-icon-rail|hsas-my-menu|hsas-mega-menu|fixture=mega-menu|hsas-rail-width|hsas-menu-width|hsas-top-bar-height|--rail-width|--menu-width|--topbar-height" tests
```

첫 시각 테스트 시도는 제한된 sandbox에서 Vite가 `127.0.0.1:4174`를 열지 못해 `listen EPERM`으로 종료되었다. 같은 명령에 로컬 서버 bind 권한을 부여해 다시 실행한 최종 결과가 위의 15/15다. 테스트별 browser diagnostics는 console error, page error, failed request, 허용 origin 밖의 external request를 모두 빈 배열로 확인했다.

## 지속형 서버 preflight

제한된 sandbox 밖에서 `curl -I`를 다시 확인한 결과 두 경로 모두 `HTTP/1.1 200 OK`였다.

- `http://127.0.0.1:5173/creators`
- `http://127.0.0.1:5173/login`

5173 포트에는 이미 PID `1768`의 Vite 서버가 떠 있었고 working directory는 `/Users/leeyukyung/Documents/selectors_ui/.worktrees/fuma-admin-ui`였다. 기존 프로세스를 중지하거나 재시작하지 않았으며 검증 후에도 그대로 유지했다. 별도 클라이언트 포트 4173에는 접근하지 않았다.

## 수동 브라우저 및 이미지 검증

Playwright의 fresh 자동 캡처와 5173 서버의 수동 상태 캡처를 이미지 뷰어에서 원본 크기로 확인했다. 사용한 주요 파일은 `test-results/visual/creators.png`, `creators-1440.png`, `creators-1310-scrolled.png`, `creators-1440-hover.png`, `creators-1440-focus.png`, `login.png`, `login-persistent-5173.png`다. `test-results/`는 gitignore 대상이다.

### `/creators` · 1310×741

- 사이드바는 248px, 상단 유틸리티 바는 44px 계약을 유지하고 업무 콘텐츠와 겹치지 않았다.
- 브랜드는 고정된 채 내비게이션만 스크롤되었다. 측정값은 `clientHeight=673`, `scrollHeight=806`, 최하단 이동 후 `scrollTop=133`이었다.
- 스크롤 후 `공지사항` 링크 bounding box는 `x=12`, `y=695`, `width=223`, `height=34`로 741px 뷰포트 안에 완전히 들어왔다.
- 크리에이터 검색 필터, 결과 4건, 고밀도 표와 페이지네이션이 잘림 없이 유지되었다.

### `/creators` · 1440×900

- 업무군 8개는 `크리에이터`, `셀렉터스`, `지원자`, `캠페인`, `콘텐츠`, `성과`, `정산`, `시스템` 순서로 모두 보였다.
- 링크 14개는 `크리에이터 목록`, `제안 이력`, `기수 관리`, `셀렉터스 현황`, `자격 관리`, `지원자 목록`, `캠페인 관리`, `콘텐츠 검수`, `위반 관리`, `성과 대시보드`, `크리에이터 분석`, `콘텐츠 분석`, `정산 관리`, `공지사항`이었다.
- 활성 `크리에이터 목록`은 `rgb(17, 111, 96)` 배경, 흰색 텍스트, 700 굵기, 3px 좌측 marker로 확인했다.
- 비활성 `제안 이력` hover는 `rgb(44, 56, 53)` 배경과 흰색 텍스트로 확인했다.
- 키보드 focus-visible은 활성 링크에서 흰색 2px, 비활성 링크에서 `rgb(36, 159, 142)` 2px outline으로 확인했다.
- `현재 화면 즐겨찾기`, `메뉴 편집`, `전체 메뉴` 텍스트와 dialog는 각각 0개였다.
- 화면 제목 `크리에이터 풀`, 표 4행, 첫 ID `cr-001`, 마지막 이름 `오하늘`을 확인해 기능 콘텐츠가 유지됨을 점검했다.

### `/login` · 1869×942

- 로그인 카드는 `x=694.5`, `y=193`, `460×570px`였고 기존 중앙 배치 허용 범위 안에 있었다.
- `더현대Hi | Partners`, ID/비밀번호, `아이디 저장`, 로그인·계정 지원 버튼, `신규입점문의`, `광고신청/안내`, QR과 `파트너스 APP 다운로드`가 유지되었다.
- 관리자 셸 root는 0개였으며 로그인에 사이드바가 렌더되지 않았다.

수동 browser probe의 console error, page error, request failure, external request도 모두 0건이었다.

## 대비 확인

Task 2에서 확정한 대비 계산값을 현재 토큰과 상태에 대조했다.

| 대상 | 대비 |
| --- | --- |
| 활성 링크 focus 표시 | `6.06:1` |
| 상단 바 역할 텍스트 | `6.31:1` |
| 사이드바 scrollbar thumb | `3.74:1` |

활성 상태는 색상 외에도 3px marker와 700 굵기를 사용하며, focus-visible은 별도 2px outline을 사용한다.

## 역사적 자료 처리

- [2026-08-03 시각 검증 기록](./2026-08-03-fuma-admin-ui.md)은 당시 40px 레일, 205px 마이메뉴, 38px 상단 바와 전체 메뉴 오버레이 결과를 보존한 역사 기록이며 현재 합격 기준이 아니다.
- `docs/superpowers/references/hsas-08-mega-menu.png`는 역사적 참고 자료로만 남긴다.
- ignored 경로에 남아 있을 수 있는 `test-results/visual/mega-menu.png`는 이전 실행 산출물이다. 이번 15-test run에는 전체 메뉴 checkpoint가 없으므로 현재 결과로 해석하지 않는다.

## 판정

단일 사이드바 셸, 8개 업무군·14개 링크, 독립 스크롤, 활성·hover·focus 상태, 제거 UI 부재, 기존 기능 화면과 로그인 회귀, 브라우저 diagnostics가 모두 현재 설계와 자동·수동 검증 기준을 충족했다.
