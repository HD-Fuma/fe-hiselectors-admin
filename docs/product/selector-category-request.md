# 셀렉터스 카테고리 필드 백엔드 요청서

## 배경
`/selectors` 목록에 버블(발견 풀) 뷰를 추가했다. 버블은 카테고리 중심 노드를 기준으로 묶이는데,
현재 `GET /api/admin/selectors` 응답에는 카테고리가 없어 전부 `미분류` 한 덩어리로 모인다.

카테고리 값 자체는 이미 지원자 AI 리포트에 있다.
`AdminApplicationAiReport.category` / `representativeCategory` (예: `BEAUTY`, `FASHION` — `CREATOR_CATEGORY_OPTIONS` 코드계)

## 요청 사항

### 1. 셀렉터스 엔티티에 카테고리 보관
지원자가 셀렉터스로 승인되는 시점에 해당 지원서의 AI 리포트 카테고리를 셀렉터스 레코드에 복사해 저장한다.
(리포트를 매번 조인하지 않고 목록에서 바로 쓰기 위함. 리포트 재생성 시 갱신)

- 우선순위: `representativeCategory` → 없으면 `category` → 둘 다 없으면 `null`
- 저장 형식: 코드값(`BEAUTY`) 저장, 라벨은 프론트에서 매핑

> 반영 완료(2026-08-25): 목록 응답이 단일 `category` 필드로 카테고리를 내려준다.
> 프론트는 `SelectorSummary.category`를 읽어 `CREATOR_CATEGORY_OPTIONS`로 한글 라벨 매핑 후 버블 클러스터를 만든다.

### 2. 목록 응답에 필드 추가
`GET /api/admin/selectors` 의 `content[]` 각 항목에 추가:

```json
{
  "id": 7,
  "selectorsCode": "SEL0007",
  "categoryCode": "BEAUTY",
  "categoryName": "뷰티"
}
```

- `categoryCode`: `string | null` — 카테고리 코드
- `categoryName`: `string | null` — 표시용 한글 라벨(내려주면 프론트가 그대로 사용, 없으면 코드로 매핑)

프론트는 이미 두 필드를 옵셔널로 받도록 되어 있어(`SelectorSummary`), 배포 순서 상관없이 안전하다.

### 3. (선택) 카테고리 필터 파라미터
`GET /api/admin/selectors?categoryCode=BEAUTY` 지원. 버블 뷰에서 특정 카테고리만 남겨 보는 기능에 사용 예정.

### 4. (선택) 상세 응답에도 동일 필드
`GET /api/admin/selectors/{id}` 에도 `categoryCode` / `categoryName` 추가.

## 확인 필요
- 지원자 → 셀렉터스 승인 플로우에서 AI 리포트가 항상 존재하는지(없으면 `null` 허용)
- 리포트 재분석 시 셀렉터스 카테고리도 함께 갱신할지, 승인 시점 값으로 고정할지
