-- 워크북의 공통 더미 데이터 그대로입니다. 빈 테이블에서 한 번만 실행합니다.
-- 원문에는 notification INSERT가 없으므로 알림은 0행이 정상입니다.
USE umc_week02_library;

START TRANSACTION;

INSERT INTO users (nickname) VALUES ('민서'), ('수현');
INSERT INTO category (name) VALUES ('문학'), ('과학');

INSERT INTO book (category_id, title, description, is_available) VALUES
    (1, '달빛 도서관', '소설', TRUE),
    (1, '겨울의 편지', '에세이', FALSE),
    (2, '우주를 읽는 법', '과학 교양', TRUE);

INSERT INTO rental (user_id, book_id, rented_at, due_at, returned_at) VALUES
    (1, 2, '2026-08-10 10:00:00', '2026-08-17 10:00:00', NULL),
    (2, 1, '2026-08-01 10:00:00', '2026-08-08 10:00:00', '2026-08-07 15:00:00');

INSERT INTO tag (name) VALUES ('소설'), ('추천'), ('과학');
INSERT INTO book_tag (book_id, tag_id) VALUES (1, 1), (1, 2), (3, 3);
INSERT INTO book_like (user_id, book_id) VALUES (1, 1), (1, 3);

COMMIT;
