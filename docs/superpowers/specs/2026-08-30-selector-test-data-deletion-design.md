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
- 요청 진행 중 입력, 닫기, 실행 action을 잠근다.
- 성공 시 삭제 대상 채널 ID와 전체 삭제 행 수를 환경설정 영역에 표시한다.
- 실패 시 서버 메시지를 모달 내부 경고로 표시한다.

## API 계약

관리자 권한으로 보호되는 영구 삭제 endpoint를 제공한다.

```http
DELETE /api/admin/selectors/test-data?channelId={youtubeChannelId}
```

응답은 채널 ID, 대상 셀렉터스 ID, 대상 지원서 ID, 전체 삭제 행 수, 테이블별 삭제 행 수를 담는다. 대상 채널의 지원서와 셀렉터스를 찾을 수 없을 때 `404`를 반환한다. 빈 채널 ID와 YouTube 채널 ID 형식 오류에는 `400`을 반환한다.

## 삭제 범위와 순서

서비스는 YouTube 채널 ID로 지원서와 셀렉터스를 찾고 양쪽의 `user_id`까지 수집한다. 이후 하나의 트랜잭션에서 자식 행부터 삭제한다.

삭제 범위:

- 지원: `application_media`, `application_report`, `application_content_analysis`, `application`
- 콘텐츠와 검수: `violation_evidence_history`, `violation_item`, `penalty_history`, `content_report`, `content_media`, `content_engagement`, `content_version`, `content`
- 셀렉터스 활동: `click_log`, `purchase_history`, `product_group_item`, `product_group`, `blacklist_history`, `settlement_history`, `settlement_account`, `selector_excellence_selection`, `selectors_generation`, `selectors_sns_account`, `selectors`
- 사용자 연결: 대상 `user_id`의 `user_kakao_recipient`와 해당 수신 UUID를 참조하는 `notification`

`purchase_history`는 `selectors_id`와 대상 `user_id` 양쪽 조건을 사용해 반복 테스트 흔적을 정리한다. `users` 행은 유지한다. 삭제 도중 오류가 발생하면 트랜잭션 전체를 롤백한다.

## 감사 기록

삭제 성공과 실패를 기존 batch event logger에 기록한다. 성공 로그에는 관리자 로그인 ID, 채널 ID, 삭제 행 수, 대상 지원서 수, 대상 셀렉터스 수를 담는다. 민감한 사용자 프로필 값은 로그에 담지 않는다.

## 테스트

- 백엔드 서비스 단위 테스트로 대상 탐색, 삭제 순서, 사용자 행 유지, 사용자 구매·카카오 연결 삭제, 실패 시 감사 기록을 검증한다.
- 백엔드 controller 테스트로 관리자 endpoint, 입력 검증, 응답 계약을 검증한다.
- 프런트 entity API 테스트로 URL 인코딩, `DELETE`, 인증 header, 오류 메시지를 검증한다.
- 사이드바 테스트로 기본 채널 ID, 편집, 확인 문구, 진행 상태, 성공·실패 피드백을 검증한다.
- 관련 테스트 후 각 저장소의 표준 전체 검사를 실행한다.

