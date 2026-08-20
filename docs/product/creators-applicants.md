# 크리에이터·지원자 계약

## 크리에이터 풀 목록

크리에이터 풀은 정보 제공에 동의하지 않은 Instagram 또는 YouTube 공개 계정을 조회하는 읽기 전용 표입니다.

- 조회 항목: 계정명, SNS 계정, 플랫폼, 탐색 카테고리, 팔로워/구독자, ER, 최근 90일 활동 수, 최근 활동일
- 필터: 계정 키워드, 플랫폼, 카테고리, 최소 팔로워/구독자, 최소 ER, 최근 90일 최소 활동 수
- 카드, 대표 미디어, 정성 분석, AI 리포트, 상세 route는 제공하지 않음

## 지원자 상세 구조

지원자는 `ProfileDetailShell`과 `ProfileAnalysisReport`를 사용합니다.

- 왼쪽: profile, gallery, 상태
- 오른쪽: 동일한 CREATOR REPORT 정보 구조
- 승인·반려 action은 실제 mutation API가 연결된 경우에만 제공
- list drawer와 route 상세가 같은 데이터·컴포넌트 계약을 사용

새로운 지원자 전용 상세 골격이나 크리에이터 상세 복사본을 만들지 않습니다.

## 분석 지표

- 기준일 `mediaCollectedAt` 이전 90일을 기본 분석 window로 사용하고 `updatedAt`은 별도 표시
- follower/subscriber는 기준일 snapshot
- cadence는 수집 게시물 수, 일/주 평균, 최장 게시 공백을 구분
- 전체 공개 content 수와 90일 수집 게시물 수를 혼용하지 않음
- 평균 조회·좋아요·댓글은 측정 가능한 media만 포함하고 불가값을 0으로 바꾸지 않음
- format mix는 플랫폼이 확인 가능한 native 유형을 사용하고 판별할 수 없는 유형은 미분류로 표시
- 기본 ER은 eligible post별 `(likes + comments) / followerOrSubscriberSnapshot × 100`의 평균
- audience가 0인 표본은 ER에서 제외하고 sample size를 표시
- share/save는 platform 공통 ER에 섞지 않고 보조 지표로 표시

## 정성 분석 범위

크리에이터 풀에서는 동의 전 계정의 게시물·이미지·영상을 정성 분석하지 않습니다. 팔로워/구독자, ER, 최근 90일 활동 수, 탐색 카테고리만 저장·노출합니다.
