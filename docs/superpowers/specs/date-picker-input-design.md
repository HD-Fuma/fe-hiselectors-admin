# 날짜 선택 입력 설계

## 목표

공통 `TextInput`의 `date`·`month` 입력은 달력 선택 중심으로 동작한다. 입력 영역 클릭 시 브라우저 기본 picker를 열고, 키보드로 날짜 값을 직접 수정하는 동작은 차단한다.

## 범위

- 각 페이지의 기간 필터
- 기수 생성·수정 날짜 필드
- 캠페인 생성·수정 날짜 필드
- 향후 `TextInput`을 사용하는 `date`·`month` 입력

## 상호작용

- 클릭: `showPicker()`를 지원하는 브라우저에서 native picker를 연다. 미지원 환경에서는 click 기본 동작에 맡긴다.
- 숫자·방향키·삭제키: 기본 동작을 차단한다.
- Space: native picker 호출 성공 시 기본 동작을 차단한다. 호출 실패 시 브라우저 기본 동작에 맡긴다.
- Tab·Escape·Enter: 포커스 이동, 닫기, 검색 제출 동작을 유지한다.
- 소비자가 전달한 `onClick`·`onKeyDown`을 먼저 실행하고 `defaultPrevented`를 존중한다.
- disabled·readOnly 상태에서는 picker 호출을 생략한다.
- `showPicker()` 호출은 기능 감지와 예외 처리를 거친다. 미지원 환경에서도 날짜 직접 편집 키는 같은 기준으로 차단한다.

## 구현 위치

`src/components/ui/Controls.tsx`의 `TextInput`에서 날짜 계열 type을 판별해 공통 이벤트를 합성한다. feature별 날짜 JSX와 CSS는 유지한다.

## 검증

`src/components/ui/controls.test.tsx`에서 `date`·`month`를 매개변수화해 클릭, Space, 숫자 입력, Enter 동작을 검증한다. 날짜 직접 타이핑을 사용하는 기존 테스트는 picker 선택을 표현하는 change 이벤트로 갱신한다.
