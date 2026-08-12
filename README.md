# Hi-Selectors Admin UI

React, TypeScript, Vite로 만든 Hi-Selectors 관리자 UI입니다. 현재는 로컬 fixture를 사용하는 프런트엔드 프로토타입입니다.

## 시작

```bash
npm ci
npm run dev
```

브라우저를 제외한 전체 검증은 다음 한 줄로 실행합니다.

```bash
npm run check
```

`check`는 ESLint, Vitest, TypeScript, production build를 순서대로 실행합니다.

## 문서

- [AGENTS.md](./AGENTS.md): 모든 작업자가 가장 먼저 읽는 필수 규칙
- [아키텍처](./docs/architecture.md): 폴더 역할, 의존 방향, 다음 구조 개선 순서
- [디자인 시스템](./docs/design-system.md): 재사용 컴포넌트, CSS, 접근성, 화면 계약
- [개발 방식](./docs/development.md): 최소 탐색 순서, 구현·검증·인계 방식
- [크리에이터·지원자 계약](./docs/product/creators-applicants.md): 카드, 상세, 분석 지표 계약
- [콘텐츠 검수 요구사항](./docs/product/content-inspection.md): 콘텐츠 검수 도메인 계약
- [크리에이터 이미지 출처](./docs/assets/creator-media.md): 현재 데모 이미지의 출처와 사용 조건
- [시각 참고자료](./docs/references/README.md): 관련 UI 작업에서만 선택적으로 확인하는 원본 참고 이미지

라우트와 메뉴의 단일 원본은 `src/app/navigation.ts`입니다. 문서의 경로나 화면명이 코드와 다르면 현재 코드와 사용자의 최신 지시를 우선합니다.
