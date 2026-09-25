# UMC 1주차 ERD 미션 작업 기록

- [미션 원문](https://app.notion.com/p/1-34a5056fdfa9828fb122012c03370581?source=copy_link)
- [ERDCloud 설계](https://www.erdcloud.com/d/sgiC7TXnmYk7C7ha3) — 비공개 문서
- 실행용 원본: 같은 폴더의 `schema.sql`

## 설계 및 확인 과정

2026년 9월 22일, 사용자 요청에 따라 Codex가 화면 요구사항을 수집하고 로그인·회원가입, 지역·가게, 미션 목록·수행 내역에 필요한 데이터를 정리했다. 9개 테이블을 추출한 뒤 1:N 외래 키 관계와 N:M 중간 테이블을 정하고, MySQL 원본 SQL을 작성해 ERDCloud로 가져왔다.

이후 ERDCloud의 Export SQL Preview를 확인했다. 테이블 9개, 컬럼 68개, PK 9개, FK 9개는 유지됐지만 `AUTO_INCREMENT`와 복합 `UNIQUE` 4개는 가져오기 후 내보낸 SQL에서 누락됐다. ERD 메모에 해당 조건과 설계 가정을 보완했다. 이 기록은 Codex가 수행한 작업이며, 사용자가 직접 조작하거나 검증했다는 의미는 아니다. 실제 MySQL 실행 검증은 수행하지 않았다.

## 테이블 역할

- `member`: 회원 정보와 탈퇴 시각. `social_account`: 회원의 소셜 로그인 계정.
- `region`: 지역. `store`: 지역별 가게와 대표 음식 카테고리. `food_category`: 음식 분류.
- `member_food_preference`: 회원과 선호 음식 카테고리의 N:M 연결.
- `mission`: 가게별 수행 조건·최소 결제 금액·보상·마감 시각.
- `member_mission`: 회원별 도전·완료·취소 상태와 수행 시각.
- `member_agreement`: 약관 종류·버전별 동의 또는 거부 기록.

## 관계와 설계 가정

모든 PK는 독립된 `id BIGINT NOT NULL AUTO_INCREMENT`이며 FK는 자식 PK에 포함하지 않는다. 가게는 지역과 대표 카테고리를 각각 하나씩 가지고, 회원은 여러 선호 카테고리와 소셜 계정을 가질 수 있다. 회원의 이메일·성별·생년월일·주소는 선택값이며 가게 주소는 필수다. 소셜 계정은 이메일 대신 제공자와 제공자 사용자 ID의 조합으로 식별한다.

복합 UNIQUE는 소셜 계정의 `(provider, provider_user_id)`, 선호 음식의 `(member_id, food_category_id)`, 미션 수행의 `(member_id, mission_id)`, 약관 응답의 `(member_id, agreement_code, version)`에 둔다. 따라서 동일 미션은 회원별 한 번만 수행하고, 같은 버전의 약관 응답은 한 행으로 관리한다. 약관 응답 변경 이력 전체는 별도로 보관하지 않으며, 거부 시 `agreed_at`은 NULL이다.

공통 `deleted_at`은 NULL을 허용해 논리 삭제를 표현한다. 삭제 후에도 UNIQUE는 유지되므로 같은 조합을 다시 활성화할 때는 기존 행을 복구한다. `created_at`·`updated_at`은 생성 시 기본값을 가지며 수정 시 `updated_at` 갱신은 애플리케이션에서 처리한다.

## 구현 범위와 주의점

도전 상태는 `member_mission.status`에 두며 `IN_PROGRESS`, `COMPLETED`, `CANCELED`를 사용한다. 완료 상태와 `completed_at`의 일관성, 금액·포인트의 유효 범위는 애플리케이션에서 검증한다. SQL에 CHECK나 트리거는 포함하지 않았다.

회원·지역별 완료 수는 수행 내역 → 미션 → 가게 → 지역 관계로 집계할 수 있다. 지역별 10개 완료 시 1,000포인트 지급은 별도 지급 이력과 중복 지급 방지가 필요한 확장 범위다. 현재 `mission.reward_point`는 개별 미션 보상이며 지역 완료 보너스 지급을 구현한 것은 아니다. 최초 1회인지 10개마다 반복 지급인지도 확정해야 한다.

**ERD 메모는 데이터베이스 제약을 실행하지 않는다. 실제 DB 생성에는 ERDCloud에서 다시 내보낸 SQL 대신 함께 제공한 원본 `schema.sql`을 사용해야 한다.** 비공개 ERD 링크의 제출·공유 가능 여부는 별도로 확인하고, 제출용 Notion에는 ERD 이미지와 이 기록을 첨부한다.
