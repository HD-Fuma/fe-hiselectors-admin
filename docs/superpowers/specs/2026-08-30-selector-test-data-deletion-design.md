# 셀렉터스 테스트 데이터 영구 삭제 설계

## 목적

관리자가 지정한 YouTube 채널의 테스트 진행 데이터를 초기 상태로 되돌린다. 같은 로그인 계정으로 지원 과정을 여러 차례 반복할 수 있어야 한다.

기본 채널 ID는 `UCD2RQE52TloxzZxZ2fyq8HQ`이며 관리자가 다른 채널 ID를 입력할 수 있다. `users` 행과 로그인 정보는 유지한다.

## 관리자 화면

- 사이드바 환경설정 메뉴에 `셀렉터스 데이터 영구 삭제` action을 둔다.
- action을 선택하면 공통 `Modal` 기반 경고 창을 연다.
- YouTube 채널 ID 입력창은 기본 채널 ID로 채운다.
- 관리자는 입력값을 다른 채널 ID로 교체할 수 있다.
- 확인 문구 `영구 삭제`가 정확히 입력되면 실행 action이 활성화된다.
- 채널 ID가 바뀌면 확인 문구를 비우고, 실행 action 옆에 최종 대상 채널 ID를 표시한다.
- 요청 진행 중 입력, 닫기, 실행 action을 잠근다.
- 성공 시 삭제 대상 채널 ID와 전체 삭제 행 수를 환경설정 영역에 표시한다.
- `noOp: true`는 `삭제할 테스트 데이터가 없습니다.`로 표시한다.
- 실패 시 입력값과 확인 문구를 유지하고 서버 메시지를 모달 내부 경고로 표시한다.

## API 계약

관리자 권한으로 보호되는 영구 삭제 endpoint를 제공한다.

```http
DELETE /api/admin/selectors/test-data?channelId={youtubeChannelId}
```

채널 ID는 trim 후 `UC`와 영문·숫자·`_`·`-` 22자리로 구성된 canonical ID만 허용하고 대소문자를 그대로 비교한다. 조회 조건은 `sns_code = YOUTUBE`와 채널 ID exact match다. 빈 값과 형식 오류에는 `400`을 반환한다.

응답은 채널 ID, 대상 셀렉터스 ID, 대상 지원서 ID, 전체 삭제 행 수, 테이블별 삭제 행 수, `noOp`을 담는다. 채널 ID에 연결된 지원서와 셀렉터스가 모두 0건이면 `200`과 `noOp: true`를 반환한다. 이 결과는 최초 호출, 성공 응답 유실 후 재요청, 이미 초기화된 대상에 동일하게 적용된다.

## 삭제 범위와 순서

서비스는 `application.sns_account_id`와 `selectors_sns_account.account_id` 양쪽에서 채널 ID를 찾는다. 한쪽에만 데이터가 있는 부분 상태도 정상 삭제 대상으로 처리한다. 최초 일치 지원서의 `user_id`, 최초 일치 셀렉터스의 `user_id`, 최초 일치 셀렉터스의 `application_id`가 가리키는 지원서의 `user_id`를 합친다. 수집한 사용자별 모든 지원서와 셀렉터스를 찾고, 새로 찾은 셀렉터스의 `application_id`까지 따라가 관계 폐쇄를 완성한다. 서로 다른 `user_id`가 두 개 이상 연결된 채널은 데이터 충돌로 보고 `409`를 반환한다. 사용자 연결이 전혀 없는 셀렉터스도 채널에 직접 일치하면 삭제 집합에 포함한다.

대상 사용자 행을 비관적 쓰기 잠금으로 읽어 같은 사용자에 대한 요청을 직렬화한다. 잠금 획득 후 채널 일치와 관계 폐쇄를 다시 계산한다. 대기한 후 데이터가 사라진 요청은 `noOp: true`를 반환한다. 이후 하나의 트랜잭션에서 자식 행부터 삭제한다.

삭제 범위:

- 지원: `application_media`, `application_report`, `application_content_analysis`, `application`
- 콘텐츠와 검수: `violation_evidence_history`, `violation_item`, `penalty_history`, `content_report`, `content_media`, `content_engagement`, `content_version`, `content`
- 셀렉터스 활동: `click_log`, `purchase_history`, `product_group_item`, `product_group`, `blacklist_history`, `settlement_history`, `settlement_account`, `selector_excellence_selection`, `selectors_generation`, `selectors_sns_account`, `selectors`
- 사용자 연결: 대상 `user_id`의 `user_kakao_recipient`와 대상 진행 데이터를 참조하는 `notification`

`purchase_history`는 `selectors_id IN (:selectorsIds) OR user_id IN (:userIds)` 조건으로 삭제한다.

`notification`은 다음 조건 중 하나를 만족하면 삭제한다.

- `receiver`가 삭제 대상 `user_kakao_recipient.kakao_message_uuid`와 일치
- `APPLICATION_RECEIVED`, `SELECTION_APPROVED`, `SELECTION_REJECTED`, `APP_QUANT_START`, `APP_QUAL_START`, `APP_QUAL_DONE`: `reference_id`가 대상 지원서 ID와 일치
- `FIRST_PURCHASE`, `FIRST_REVENUE`, `LAST_MONTH_SALES`, `MID_MONTH_ACTIVITY`, `NO_PAGE_VIEWS`, `SALES_100K`, `SALES_500K`, `SALES_1M`, `SALES_5M`, `SALES_10M`, `ORDERS_10`, `ORDERS_50`, `ORDERS_100`, `WEEKLY_SALES_GROWTH`: `reference_id`가 대상 셀렉터스 ID와 일치
- `SETTLEMENT_COMPLETED`, `SETTLEMENT_CARRYOVER`, `SETTLEMENT_MISSING`, `SETTLEMENT_UPCOMING`: `reference_id`가 삭제 대상 `settlement_history` ID와 일치
- `PENALTY_RELEASED`: `reference_id`가 삭제 대상 `penalty_history` ID와 일치
- `CONTENT_EDIT_REQUEST`: `reference_id`가 삭제 대상 `content` ID 또는 `violation_item` ID와 일치

알림은 참조 대상 도메인 행과 카카오 연결보다 먼저 삭제한다. `users` 행은 유지한다. 삭제 도중 오류가 발생하면 트랜잭션 전체를 롤백한다.

## 감사 기록

검증 실패, 충돌, no-op, 삭제 실패, 삭제 성공을 기존 batch event logger에 기록한다. 성공 이벤트는 트랜잭션 `afterCommit`에서 기록하고 롤백 완료 시 실패 이벤트를 기록한다. 성공 로그에는 관리자 로그인 ID, 채널 ID, 삭제 행 수, 대상 지원서 수, 대상 셀렉터스 수를 담는다. 민감한 사용자 프로필 값은 로그에서 생략한다.

## 테스트

- 백엔드 서비스 단위 테스트로 대상 탐색, 삭제 순서, 사용자 행 유지, 사용자 구매·카카오 연결 삭제, 실패 시 감사 기록을 검증한다.
- 백엔드 controller 테스트로 관리자 endpoint, 입력 검증, 응답 계약을 검증한다.
- 백엔드 데이터베이스 통합 테스트로 나열된 연관 테이블 전체, 알림 참조, 부분 상태, 사용자 credential 유지, 재요청 no-op, 동시 요청 직렬화, 중간 실패 롤백을 검증한다.
- 프런트 entity API 테스트로 URL 인코딩, `DELETE`, 인증 header, 오류 메시지를 검증한다.
- 사이드바 테스트로 기본 채널 ID, 편집, 확인 문구, 진행 상태, 성공·실패 피드백을 검증한다.
- 관련 테스트 후 각 저장소의 표준 전체 검사를 실행한다.
