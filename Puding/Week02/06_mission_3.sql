USE umc_week02_library;
SET @book_id = 1; -- 1: 태그 2개. 2: 태그 없음. 999: 존재하지 않는 도서.
SET @user_id = 1; -- 1: 도서 1에 좋아요 있음. 2: 좋아요 없음.

-- 요구사항: 선택한 도서의 제목·태그 이름·현재 사용자의 좋아요 여부.
-- book 기준으로 연결 테이블 book_tag와 tag를 LEFT JOIN하고 book_like도 연결합니다.
-- 책은 WHERE로 선택하고, 사용자 조건은 book_like의 ON에 두어 좋아요가 없어도 책을 보존합니다.
-- 태그 ID 순서로 태그당 한 행을 반환합니다. 전체 태그를 보여 주므로 LIMIT은 없습니다.
SELECT
    b.title,
    t.name AS tag_name,
    CASE WHEN bl.user_id IS NULL THEN 0 ELSE 1 END AS is_liked
FROM book AS b
LEFT JOIN book_tag AS bt ON bt.book_id = b.book_id
LEFT JOIN tag AS t ON t.tag_id = bt.tag_id
LEFT JOIN book_like AS bl
    ON bl.book_id = b.book_id
   AND bl.user_id = @user_id
WHERE b.book_id = @book_id
ORDER BY t.tag_id ASC;
