# 콘텐츠 검수 요구사항

## 처리 단계

1. 이미지·영상과 제목, 본문, 해시태그, 멘션, URL 수집
2. OCR과 ASR/STT로 텍스트·등장 시간·화면 위치 추출
3. 광고 표시, 필수/금지 문구, 해시태그, 멘션, URL 규칙 검사
4. 제출 정보 일치, 과장 표현, 브랜드 적합성, 수정 근거 AI 분석
5. 관리자가 원문과 AI 분석 근거를 확인하고 최종 승인 또는 반려

## 화면 최소 정보

- 작성자 프로필·이름·계정·플랫폼
- 콘텐츠 제목과 형식
- 최초 등록일과 마지막 수정
- 버전 선택
- 콘텐츠 원문
- AI 분석(콘텐츠 요약, 검수 근거, 수정 버전의 변경점)
- 같은 번호로 연결된 위반 후보와 위반/정상 판정, 승인·반려 action

## UI 원칙

- 위반 항목을 근거 영상 시간 또는 화면 위치와 연결합니다.
- 자동 추출, 규칙 검사, AI 판단을 구분합니다.
- 승인·반려 전에 선택한 버전의 원문과 AI 분석 근거를 확인할 수 있어야 합니다.
- 원문 위치, 검수 근거, 관리자 판정은 같은 번호로 연결합니다.
- 관리자가 모든 위반 후보를 위반 또는 정상으로 고른 뒤에만 승인·반려할 수 있습니다.
- AI 판단만으로 최종 상태를 확정하지 않습니다.
- route와 코드 용어는 `/content/inspections`, `inspection`, `검수`를 사용합니다.

## 위치 주석 계약

- API evidence의 `contentMediaId`로 선택 버전의 `media`와 위치를 연결합니다.
- image bbox는 원본 이미지 픽셀 좌표이며 로드된 원본 크기로 화면 비율을 계산합니다.
- video의 초 단위 `startTime/endTime`은 시간 라벨이 있는 미디어 마커로 표시합니다.
- text 위반은 해당 미디어 `body.text` 기준 UTF-16 `[startIndex, endIndex)`를 사용합니다.
- 좌표가 없는 media-level location은 해당 미디어 또는 콘텐츠 카드 헤더 경고 배지로 표시합니다.
- locations가 비어 있으면 콘텐츠 전체 위반으로 근거 패널에만 표시합니다.
- 검수 출처는 evidence의 `RULE`/`AI` 값을 배지로 구분합니다.
- URL 위반은 `targetIndex`로 해당 link row와 연결합니다.
- `state: "active"`인 annotation만 원본 표시와 안내 rail을 만듭니다. 다만 과거 버전을 선택하면 현재 해결·기각 상태와 별개로 당시 evidence 위치를 표시합니다.
- 번호가 같은 원본 mark와 안내문을 연결하고, 색상 외에도 번호·아이콘·텍스트로 구분합니다.
- quote나 index가 원본과 맞지 않으면 잘못된 위치를 추정하지 않습니다. 원본 강조는 생략하고 안내문은 해당 section에 유지합니다.
- annotation은 `detectedIssues`나 분석 문장에서 UI가 추론하지 않고 typed fixture/API data로 받습니다.

## 관리자 확정 계약

- 모든 후보를 판정한 뒤 `PATCH /api/admin/contents/{contentId}/versions/{contentVersionId}/inspection`을 한 번 호출합니다.
- 승인은 `APPROVED`, 반려는 `REJECTED`로 보내며 후보에는 실제 `violationItemId`와 목표 상태만 담습니다.
- 위반 판정은 `VIOLATION_CONFIRMED`, 정상 판정은 `DISMISSED`를 사용합니다.
- 화면 번호, 한국어 판정명, 중간 `PENDING` 상태는 요청에 포함하지 않습니다.
- 성공 후 선택 버전 상세를 다시 조회해 서버가 확정한 상태를 화면에 반영합니다.
