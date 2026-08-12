# 아키텍처

## 현재 흐름

```text
main
 └─ app: route와 layout 조립
     ├─ features: route/page 기능
     │   ├─ entities: 도메인 공개 API
     │   ├─ components: 공통 UI
     │   └─ lib: 순수 helper
     └─ components/shell
```

`src/app/navigation.ts`가 메뉴, 제목, 화면 코드, 작업 탭, lazy component의 단일 원본입니다. `src/app/router.tsx`는 manifest를 route object로 변환합니다. route를 추가할 때 별도 switch나 중복 route 목록을 만들지 않습니다.

## 폴더 역할

| 경로 | 책임 |
| --- | --- |
| `src/app` | composition root, route manifest, router, layout 상태 |
| `src/features` | 사용자가 접근하는 route/page와 해당 use case 상태 |
| `src/entities` | 도메인 타입, fixture, 순수 계산, 제한된 도메인 UI, 작은 public API |
| `src/components/ui` | 도메인에 독립적인 UI와 현재 공용 profile 패턴 |
| `src/components/shell` | sidebar, work tabs, page header, admin shell |
| `src/components/charts` | 재사용 가능한 chart primitive |
| `src/components/social` | SNS icon과 platform option |
| `src/lib` | formatting, pagination, asset URL 같은 순수 함수 |
| `src/styles` | token, global, shell, feature stylesheet |
| `src/test` | Vitest 공통 setup와 route render helper |
| `tests/visual` | 명시적으로 요청할 때만 실행하는 Playwright smoke/diagnostics |

## 허용 의존 방향

```text
app      -> features, entities, components, lib
features -> entities, components, lib
entities -> components, lib
components -> lib
```

- sibling feature import 금지
- entity에서 feature import 금지
- feature/app/components는 entity의 `index.ts`만 사용
- 여러 entity의 데이터를 합치는 코드는 feature, widget 또는 demo read-model에 배치
- `model`은 UI를 import하지 않음

현재 ESLint가 feature 경계, entity→feature, entity deep import를 검사합니다.

## Route 추가 방식

1. 해당 feature에 named page export를 만듭니다.
2. `src/app/navigation.ts`에서 `lazyPage()`로 import합니다.
3. 같은 manifest entry에 path, group, menuLabel, title, screenCode, work-tab metadata를 선언합니다.
4. redirect가 필요할 때만 `src/app/router.tsx`에 명시합니다.

하나의 큰 feature 파일이 여러 route export를 가지면 lazy chunk도 공유합니다. 화면이 커질 때는 route별 entry module로 분리합니다.

## Entity 공개 API

각 entity root의 `index.ts`는 실제 외부 소비자에게 필요한 named export만 제공합니다.

```ts
import { CREATORS, type CreatorFixture } from "../../entities/creator";
```

다음 형태는 금지됩니다.

```ts
import { CREATORS } from "../../entities/creator/model/fixtures";
```

fixture, status union, formatter를 feature에 복제하지 않습니다. 도메인 소유 entity 또는 `lib`의 기존 값을 확장합니다.

## 다음 구조 개선 순서

1. `entities/selectors/model/detailData.ts`의 cross-entity 조인을 `data/demo/read-models`로 이동
2. `SelectorDetailPanel`, profile detail/report 같은 복합 UI를 `widgets`로 재분류
3. 큰 page 파일을 list/detail/editor와 route entry로 분리
4. `admin.css`를 shell·widget·feature CSS로 순서 보존 이동
5. 실제 API 계약이 생기면 fixture adapter와 API adapter의 경계를 추가

각 단계는 import/구조만 먼저 바꾸고 디자인과 class 변경은 별도 작업으로 진행합니다.
