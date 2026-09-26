-- 확장용 가상 데이터입니다. 공통 도서 더미 데이터와 별도 DB에 저장합니다.
-- 1주차 회원가입/소셜 계정/약관/선호음식 구조도 함께 유지합니다.
USE umc_week02_reward;
START TRANSACTION;

INSERT INTO member (id, name, email) VALUES
    (1, '민서', 'minseo@example.com'),
    (2, '수현', 'suhyeon@example.com');

INSERT INTO region (id, name, deleted_at) VALUES
    (1, '안암동', NULL),
    (2, '성수동', NULL),
    (3, '운영 종료 지역', '2026-09-20 00:00:00');

INSERT INTO food_category (id, name, deleted_at) VALUES
    (1, '한식', NULL),
    (2, '카페', NULL),
    (3, '운영 종료 분류', '2026-09-20 00:00:00');

INSERT INTO social_account (member_id, provider, provider_user_id) VALUES
    (1, 'KAKAO', 'demo-kakao-001'),
    (2, 'GOOGLE', 'demo-google-002');

INSERT INTO member_food_preference (member_id, food_category_id) VALUES
    (1, 1), (1, 2), (2, 2);

INSERT INTO member_agreement (member_id, agreement_code, version, agreed, agreed_at) VALUES
    (1, 'TERMS_OF_SERVICE', 'v1', TRUE, '2026-09-01 10:00:00'),
    (1, 'PRIVACY', 'v1', TRUE, '2026-09-01 10:00:00'),
    (1, 'MARKETING', 'v1', FALSE, NULL);

INSERT INTO store (id, region_id, food_category_id, name, address, deleted_at) VALUES
    (1, 1, 1, '안암 밥집', '서울 성북구 안암동 예시 주소 1', NULL),
    (2, 1, 2, '안암 카페', '서울 성북구 안암동 예시 주소 2', NULL),
    (3, 2, 2, '성수 카페', '서울 성동구 성수동 예시 주소 3', NULL),
    (4, 1, 1, '삭제된 가게', '서울 성북구 안암동 예시 주소 4', '2026-09-20 00:00:00'),
    (5, 1, 3, '삭제 분류 소속 가게', '서울 성북구 안암동 예시 주소 5', NULL),
    (6, 3, 1, '삭제 지역 소속 가게', '예시 주소 6', NULL);

-- 기준 시각: 2026-09-22 12:00:00. 회원 1 / 지역 1의 정답은 ID 8 → 2.
INSERT INTO mission (id, store_id, title, description, min_amount, reward_point, deadline, deleted_at) VALUES
    (1, 1, '이미 도전 중인 식사 미션', '회원 1의 진행 이력이 있어 제외', 10000, 300, '2026-09-25 18:00:00', NULL),
    (2, 1, '든든한 한 끼', '15000원 이상 식사', 15000, 500, '2026-09-24 18:00:00', NULL),
    (3, 1, '이미 마감된 미션', '기준 시각 이전에 마감되어 제외', 10000, 300, '2026-09-21 18:00:00', NULL),
    (4, 3, '성수 커피 한 잔', '다른 지역이므로 제외', 5000, 100, '2026-09-25 18:00:00', NULL),
    (5, 4, '삭제 가게의 미션', '가게가 논리 삭제되어 제외', 10000, 300, '2026-09-25 18:00:00', NULL),
    (6, 1, '삭제된 미션', '미션 자체가 논리 삭제되어 제외', 10000, 300, '2026-09-25 18:00:00', '2026-09-20 00:00:00'),
    (7, 1, '취소 이력이 있는 미션', '회원 1의 취소 이력이 있어 제외', 10000, 300, '2026-09-25 18:00:00', NULL),
    (8, 2, '오후의 커피', '8000원 이상 주문, 다른 회원의 도전은 영향 없음', 8000, 200, '2026-09-23 18:00:00', NULL),
    (9, 1, '삭제된 수행 이력이 있는 미션', '수행 이력이 논리 삭제되어도 중복 도전 제외', 10000, 300, '2026-09-25 18:00:00', NULL),
    (10, 5, '삭제 분류의 미션', '음식 분류가 논리 삭제되어 제외', 10000, 300, '2026-09-25 18:00:00', NULL),
    (11, 6, '삭제 지역의 미션', '지역이 논리 삭제되어 제외', 10000, 300, '2026-09-25 18:00:00', NULL),
    (12, 1, '정확히 마감 시각인 미션', 'deadline = 기준 시각이면 제외', 10000, 300, '2026-09-22 12:00:00', NULL),
    (13, 1, '완료 이력이 있는 미션', '회원 1의 완료 이력이 있어 제외', 10000, 300, '2026-09-25 18:00:00', NULL);

INSERT INTO member_mission
    (member_id, mission_id, status, started_at, completed_at, deleted_at) VALUES
    (1, 1, 'IN_PROGRESS', '2026-09-21 10:00:00', NULL, NULL),
    (1, 7, 'CANCELED', '2026-09-21 10:00:00', NULL, NULL),
    (2, 8, 'IN_PROGRESS', '2026-09-21 10:00:00', NULL, NULL),
    (1, 9, 'CANCELED', '2026-09-21 10:00:00', NULL, '2026-09-21 11:00:00'),
    (1, 13, 'COMPLETED', '2026-09-21 10:00:00', '2026-09-21 11:00:00', NULL);

COMMIT;
