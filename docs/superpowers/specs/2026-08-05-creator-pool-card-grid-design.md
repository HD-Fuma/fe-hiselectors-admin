# 크리에이터 풀 단일 플랫폼 프로필 카드 설계

## 1. 결정과 범위

`/creators`의 기본 화면은 사용자가 제공한 [프로필 카드 참고 이미지](../references/creator-profile-card-reference.png)처럼 **한 사람의 프로필과 인기 콘텐츠가 먼저 보이는 카드**로 구성한다. 한 크리에이터 프로필은 `Instagram` 또는 `YouTube` 중 하나에만 속한다. 다중 플랫폼 배열과 Facebook 프로필은 제거한다.

이번 변경은 별도 예시 화면을 만들지 않고 현재 FUMA 관리자 프로젝트의 `/creators` 경로에 직접 반영한다. 기존 상세·제안·목록 보기 라우팅은 유지한다. 백엔드 API 연동은 현재 저장소에 계약이 없으므로 추가하지 않으며, UI는 추후 Meta Graph API 또는 YouTube Data API가 전달할 프로필/썸네일 URL을 받을 수 있는 필드로 렌더링한다.

관리자 셸은 변경하지 않는다. `src/components/shell/*`, `src/app/navigation.ts`, `src/styles/tokens.css`, `.hsas-admin-*` 스타일은 수정 범위에서 제외한다. 현재 248px 사이드바, 44px 상단바, 메뉴 구조와 활성·포커스 상태를 그대로 유지한다.

## 2. 화면 구조

기존 `PageHeader`, 검색 패널, 결과 도구 모음, 페이지네이션을 유지한다. 플랫폼 검색 옵션은 `전체`, `Instagram`, `YouTube`만 제공한다. 카드 보기가 기본이며 목록 보기로 기존 `DenseTable`을 사용할 수 있다.

카드 그리드는 viewport 1280px 이상에서 3열, 1279px 이하에서 2열이다. 기존 셸의 1280px 최소 너비와 가로 스크롤 계약은 바꾸지 않는다. 별도 데모나 시각 표본 경로는 만들지 않는다.

## 3. 카드 정보 구조

카드는 아래 순서를 고정한다.

1. 카드 안쪽 12px 여백에 1:1 비율의 인기 콘텐츠 썸네일 3개를 8px 간격으로 한 줄 배치한다. 각 모서리는 8px이며, 영상에는 작은 재생 표식만 둔다. 데이터가 부족해도 세 칸을 유지하고 빈 칸은 중립 placeholder로 채운다.
2. 76px 원형 프로필 이미지를 썸네일 strip 아래 경계에 38px 겹친다. 프로필 우측 아래에 22px Instagram 또는 YouTube 아이콘 하나만 표시한다.
3. 이름, 핸들, 카테고리를 중앙 정렬한다. 콘텐츠 수는 카테고리와 같은 줄의 보조 정보로만 표시한다.
4. 얇은 구분선 아래에 지표 2개만 크게 표시한다.
   - Instagram: `평균 반응`, `팔로워`
   - YouTube: `평균 조회`, `구독자`
5. 티어, AI 상태, 제안 상태, 최근 활동일은 작은 운영 정보 한 줄로 낮춘다. 기존 `상세 보기`와 제안 액션 링크는 얇은 하단 영역에 유지한다.

카드 전면의 세 번째 지표, 여러 플랫폼 아이콘, 플랫폼별 콘텐츠 캡션, 강한 청록 면 버튼, hover 상승 애니메이션은 제거한다. 핵심 정보는 hover 없이 항상 보인다.

## 4. 데이터 계약

지원 플랫폼은 다음 유니온으로 제한한다.

```ts
export type CreatorPlatform = "Instagram" | "YouTube";
```

각 크리에이터는 배열 대신 단일 `profile`을 가진다. `platforms`, `channels`, 최상위 `followers`, 콘텐츠별 `platform` 필드는 삭제한다.

```ts
interface CreatorProfileFixture {
  platform: CreatorPlatform;
  handle: string;
  followers: number;
  averageViews: number;
  averageReactions: number;
  profileImageUrl: string;
}

interface CreatorFeaturedContentFixture {
  id: string;
  title: string;
  mediaType: "이미지" | "동영상";
  views: number;
  visual: CreatorMediaVisual;
  thumbnailUrl: string;
}

interface CreatorBaseFixture {
  id: string;
  name: string;
  profile: CreatorProfileFixture;
  featuredContents: CreatorFeaturedContentFixture[];
  // categories, tier, contentCount, recentActivity, aiReport,
  // proposalStatus, availableProposalChannels, email은 기존 계약 유지
}
```

인기 콘텐츠는 해당 프로필의 플랫폼을 상속하므로 콘텐츠마다 플랫폼을 다시 선언하지 않는다. 카드, 목록 표, 상세 채널 표는 모두 `creator.profile`만 읽는다.

기본 fixture는 same-origin 로컬 자산 경로를 필수로 가진다. `public/creator-media/`에 프로필 4장과 콘텐츠 12장을 포함하며 외부 이미지 요청을 만들지 않는다. 기본 화면에서 fallback을 사용하지 않는다. URL이 깨지는 오류 테스트에서만 크리에이터 이니셜과 콘텐츠 제목을 가진 중립 fallback을 사용한다. API 결과가 3개 미만이면 `CreatorMediaMosaic`이 동일한 1:1 placeholder를 추가해 항상 세 칸의 geometry를 유지한다.

`cr-001`·`cr-003`은 Instagram, `cr-002`는 YouTube, `cr-004`는 Instagram으로 고정한다. `followers`, `averageViews`, `averageReactions`는 한 프로필의 팔로워·평균 조회·평균 반응 값이다. 제안 채널은 프로필 플랫폼과 독립적이며 기존 fixture를 그대로 유지한다. 따라서 Instagram 프로필도 선언된 이메일 채널을 계속 사용할 수 있고 기존 제안 이력은 바꾸지 않는다.

## 5. 시각 방향

참고 이미지의 구조를 따르되 기존 관리자 제품 안에서 과장되지 않게 조정한다.

- 표면: `#FFFFFF`
- 페이지 배경: 기존 `#F7F7F8`
- 본문: 기존 `#24282B`
- 보조 글자: `#596166`
- 경계: 기존 `#D8DCDD`
- 플랫폼 색상: Instagram 브랜드 그라디언트, YouTube `#FF0033`
- 글꼴: 기존 관리자 글꼴과 크기 체계 유지
- 카드 반경: 14px, 안쪽 여백 12px, 그림자는 기본 상태에서 사용하지 않음

이 화면의 유일한 시각적 서명은 **동일 크기 인기 콘텐츠 3장과 중앙에 겹친 프로필 사진**이다. 나머지 영역에는 장식적 그라디언트, 큰 배지, 과한 그림자나 애니메이션을 추가하지 않는다.

## 6. 접근성·오류 처리

- 카드 그리드는 이름 있는 `list`, 카드는 `listitem`과 이름 있는 `article`을 유지한다.
- 카드마다 접근 가능한 플랫폼 아이콘은 정확히 하나이며 이름은 `Instagram 플랫폼` 또는 `YouTube 플랫폼`이다.
- 프로필과 콘텐츠 `<img>`에는 크리에이터명과 콘텐츠 제목을 포함한 대체 텍스트를 제공한다.
- 이미지 URL이 없거나 로드에 실패해도 동일한 크기의 fallback이 표시된다.
- 콘텐츠가 0–3개일 때도 정확히 세 칸을 유지하며 없는 항목은 이름 있는 중립 placeholder로 채운다.
- 액션 링크의 포커스 표시와 이름은 기존 계약을 유지한다.

## 7. 완료 조건

1. 모든 크리에이터 fixture가 Instagram 또는 YouTube 단일 `profile`만 가진다.
2. `/creators`의 플랫폼 필터에 Facebook이 없고 카드마다 플랫폼 아이콘이 하나만 표시된다.
3. 카드 상단이 1:1 썸네일 3개, 8px gap, 76px 중앙 프로필과 38px overlap 구조다.
4. 기본 프로필 영역에는 지표 2개만 표시되며 플랫폼별 라벨이 맞다.
5. 목록 보기와 상세 채널 표도 크리에이터당 플랫폼 한 개만 표시한다.
6. 사이드바 컴포넌트·토큰·스타일 diff가 없다.
7. 1279px에서는 2열, 1280px와 1440px에서는 3열인 Playwright geometry 검증이 성공한다.
8. 단위 테스트, ESLint, TypeScript 빌드, Playwright 시각 검증이 성공한다.
