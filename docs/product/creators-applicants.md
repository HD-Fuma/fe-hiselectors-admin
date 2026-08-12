# 크리에이터·지원자 계약

## 크리에이터 풀 카드

카드 한 장은 Instagram 또는 YouTube profile 하나를 나타냅니다.

- 상단에 대표 게시물 3개와 이미지/영상 cue
- profile 이미지, platform badge, 이름, account ID/channel name
- category와 keyword chip
- 비교 지표는 팔로워/구독자와 ER
- tier와 AI 적합도는 pool card에 표시하지 않음
- 일반 모드에서 카드 전체 클릭은 상세 열기
- 선택 모드에서 카드 전체 클릭은 선택/해제
- 별도 `상세보기` button 없음
- 일반 모드 action 문구는 `제안하기`

## 상세 구조

크리에이터와 지원자는 모두 `ProfileDetailShell`과 `ProfileAnalysisReport`를 사용합니다.

- 왼쪽: profile, gallery, 상태, action
- 오른쪽: 동일한 CREATOR REPORT 정보 구조
- 지원자 고유 승인·반려 상태와 action은 slot/data로 주입
- list drawer와 route 상세가 같은 데이터·컴포넌트 계약을 사용

새로운 지원자 전용 상세 골격이나 크리에이터 상세 복사본을 만들지 않습니다.

## 분석 지표

- 기준일 `updatedAt` 이전 90일을 기본 분석 window로 사용
- follower/subscriber는 기준일 snapshot
- cadence는 수집 게시물 수, 일/주 평균, 최장 게시 공백을 구분
- 전체 공개 content 수와 90일 수집 게시물 수를 혼용하지 않음
- 평균 조회·좋아요·댓글은 측정 가능한 media만 포함하고 불가값을 0으로 바꾸지 않음
- format mix는 Instagram feed/Reels, YouTube Shorts/long-form처럼 platform native 유형 사용
- 기본 ER은 eligible post별 `(likes + comments) / followerOrSubscriberSnapshot × 100`의 평균
- audience가 0인 표본은 ER에서 제외하고 sample size를 표시
- share/save는 platform 공통 ER에 섞지 않고 보조 지표로 표시

## AI 분석

요약, category, keyword, 협업, style, tone, risk, 강점/주의 claim은 가능한 경우 근거 content URL과 연결합니다. OCR, STT, 본문, 영상 frame 등 근거 종류를 구분하며, 분모가 정의되지 않은 keyword 비율은 임의로 표시하지 않습니다.
