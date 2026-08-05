# 크리에이터 풀 카드 그리드 최종 검증 기록

- 검증 시각: 2026-08-05 20:58:01 KST (+0900, Asia/Seoul)
- 브랜치: `codex/fuma-admin-ui`
- worktree: `/Users/leeyukyung/Documents/selectors_ui/.worktrees/fuma-admin-ui`
- 검증 전 구현 SHA: `fcd3c2c92ab8cf07ab3b897ca19074da87ec2cc1`

이 기록은 위 구현 SHA에서 명령을 새로 실행하고 생성된 PNG 세 장을 원본 해상도로 직접 확인한 결과다. 검증 중 production 및 test 코드는 수정하지 않았다.

## 시작 상태와 검증 기준

아래 순서로 시작 상태를 확인했다.

| 명령 | exit | 실제 결과 |
| --- | ---: | --- |
| `git status --short` | 0 | stdout 출력 없음(0 bytes). 구현·테스트 변경이 없는 clean worktree 확인. |
| `git rev-parse HEAD` | 0 | `fcd3c2c92ab8cf07ab3b897ca19074da87ec2cc1` |

## 자동 검증 결과

각 명령은 별도로 실행했으며 결과는 다음과 같다.

| 명령 | exit | 실제 결과 |
| --- | ---: | --- |
| `npm run lint` | 0 | `eslint .` 완료. 오류·경고 출력 없음. |
| `npm test -- --run` | 0 | test file 19/19, test 180/180 통과, 실패 0건, Vitest duration 9.88s. |
| `npm run build` | 0 | `tsc -b && vite build` 완료. 1,838 modules transformed, Vite build 259ms. |
| `npm run test:visual` (sandbox 실행) | 1 | 로컬 web server가 `127.0.0.1:4173`에 bind할 때 환경 권한으로 `listen EPERM`이 발생해 Playwright가 시작 전에 종료됨. 애플리케이션 또는 테스트 assertion 실패는 아님. |
| `npm run test:visual` (localhost bind가 허용된 재실행) | 0 | Playwright 17/17 통과, 실패 0건, duration 7.8s. |

성공한 전체 visual run에는 `captures diagnostics emitted before a popup page is available` 테스트도 포함되어 통과했다. 공유 diagnostic fixture는 각 테스트 종료 시 `externalRequests`, `externalWebSockets`, `consoleErrors`, `pageErrors`, `requestFailures`가 모두 빈 배열인지 assertion한다. adversarial diagnostic 테스트가 의도적으로 만든 sentinel만 확인 후 제거하고 다른 항목은 그대로 남겨 공통 teardown이 검사한다. 따라서 성공한 17-test run에서 예상 밖 browser diagnostic은 0건이었다. 출력에 있던 `NO_COLOR`/`FORCE_COLOR` 문구는 Node의 터미널 색상 환경변수 경고이며 browser diagnostic 또는 테스트 실패가 아니다.

## PNG 크기

아래 명령은 exit 0이었다.

```sh
sips -g pixelWidth -g pixelHeight test-results/visual/creators.png test-results/visual/creators-1180.png test-results/visual/creators-1440.png
```

| PNG 절대 경로 | 실제 크기 |
| --- | ---: |
| `/Users/leeyukyung/Documents/selectors_ui/.worktrees/fuma-admin-ui/test-results/visual/creators.png` | 1310×741 px |
| `/Users/leeyukyung/Documents/selectors_ui/.worktrees/fuma-admin-ui/test-results/visual/creators-1180.png` | 1280×1045 px |
| `/Users/leeyukyung/Documents/selectors_ui/.worktrees/fuma-admin-ui/test-results/visual/creators-1440.png` | 1440×1045 px |

`creators-1180.png`은 1180×900 viewport에서 full-page로 캡처했다. 관리자 desktop shell의 의도된 최소 폭 때문에 document scroll width가 1280px로 유지되어 결과 PNG도 1280px 폭이다. 이는 좁은 viewport에서 의도된 shell-level 수평 overflow이며 카드 내부 overflow가 아니다.

## Artifact integrity

아래 세 기존 PNG는 복사하거나 다시 쓰지 않고 정확한 경로를 force-add했으며, 이 문서와 같은 evidence commit에서 Git 추적 파일로 보존한다. `shasum -a 256`의 실제 결과는 다음과 같다.

| Git 추적 경로 | SHA-256 |
| --- | --- |
| `test-results/visual/creators.png` | `f4686eef7a3ce5bd285511f4e84303f884df2cf06f61b4d04493c192ff526467` |
| `test-results/visual/creators-1180.png` | `51871ae3d9d697a448d79eb5cf844f4a6489f4959197e16867698824c66050ef` |
| `test-results/visual/creators-1440.png` | `03fa7596d99b8acbb67ede90de80f4c4c270defb8af9f3ae9e19afa8daca7e5b` |

## 원본 이미지 육안 검증

세 PNG를 모두 원본 해상도로 열어 확인했다.

### 1310×741 checkpoint

- 첫 세 카드가 같은 상단선에 맞춰 3열로 정렬되어 있다.
- 네 번째 카드는 의도대로 두 번째 행에서 시작한다. viewport 높이 기준 캡처이므로 이 파일에는 네 번째 카드 상단 mosaic까지만 보인다.
- 첫 행의 세 카드에서는 카드 테두리, media source caption, 본문, 지표 행, 상태·날짜 행, 하단 action 영역이 서로 침범하지 않는다.

### 1440×1045 full-page checkpoint

- 첫 세 카드가 같은 상단선에 맞춰 3열로 정렬되어 있다.
- 네 번째 카드는 의도대로 두 번째 행 첫 열에서 시작하며 mosaic부터 하단 action까지 완전하게 보인다.
- 첫 행 카드와 두 번째 행 카드 사이에 정상적인 grid gap이 유지된다.
- 이 full-page artifact에서는 네 카드 모두 카드 본문, 지표, 상태·날짜, 하단 action 및 media source caption이 테두리 안에서 겹침 없이 완전하게 보인다.

### 1180 viewport checkpoint · 1280×1045 artifact

- 네 카드가 2열×2행으로 모두 완전하게 보인다.
- 1280px desktop shell이 1180px viewport보다 넓어 생기는 의도된 수평 overflow가 캡처 폭에 반영되어 있다.
- 카드들은 각 열 안에 유지되며 카드 자체의 가로 overflow나 오른쪽 잘림은 없다.
- 이 full-page artifact에서도 네 카드 모두 본문, 지표, 상태·날짜, 하단 action 및 media source caption이 겹침 없이 완전하게 보인다.

### 1440/1180 full-page artifact의 네 카드 공통 확인

- 네 카드의 테두리, 하단 action, media source caption 사이에 겹침이나 이탈이 없고 카드 내부의 수평 overflow도 없다. 자동 checkpoint의 카드별 `scrollWidth <= clientWidth` assertion도 1310/1440에서 통과했다.
- Instagram, YouTube, Facebook 색상 mark와 source label이 각각 알아볼 수 있다.
- 이름과 handle/채널명(`김서연`/`@seo.yeon`, `박도윤`/`도윤의 집밥`, `이지아`/`@zia.trip`, `오하늘`/`@today.haneul`)이 읽힌다.
- 팔로워·구독자, 평균 조회, 평균 반응률 수치와 AI 적합도/생성 대기 상태, 발송 완료/셀렉터스 전환/발송 실패/미제안 상태가 읽힌다.
- 최근 활동일 `2026-08-02`, `2026-07-31`, `2026-07-29`, `2026-08-03`과 `상세 보기`, `제안 이력`, `다시 제안`, `영입 제안` action이 읽힌다.
- 고채도·다색 영역은 카드 상단의 콘텐츠 mosaic에 집중되어 있다. 관리자 chrome은 어두운 sidebar, 흰색·연회색 surface, 제한된 청록색 상태·action으로 절제되어 있다.
- 제목, 필터, 정렬·보기 전환, 카드 핵심 텍스트, 상태, 날짜, 페이지네이션에서 겹침·잘림·컨테이너 밖 이탈이 보이지 않는다.

## 판정과 환경 메모

lint, 19-file/180-test unit suite, production build, 17-test visual suite가 모두 성공했다. 1310/1440의 3열 배치, 1440 full-page의 완전한 두 번째 행 카드, 1180 checkpoint의 완전한 2×2 카드 배치와 의도된 1280px desktop-shell overflow를 확인했다. 발견된 카드 레이아웃 또는 browser diagnostic 회귀는 없다.

첫 visual 실행의 유일한 환경 이슈는 sandbox가 localhost bind를 거부한 `EPERM`이었다. 동일 명령을 localhost bind가 허용된 환경에서 다시 실행해 17/17 통과 결과를 얻었다.
