-- 제출용 실행 확인: 기존 테이블이나 데이터를 변경하지 않습니다.
-- Workbench에서 이 파일 전체를 실행한 뒤 Result Grid를 캡처합니다.
USE umc_week02_library;

SELECT VERSION() AS mysql_version, @@version_comment AS engine;

SHOW TABLES;

SELECT 'users' AS table_name, COUNT(*) AS row_count FROM users
UNION ALL SELECT 'category', COUNT(*) FROM category
UNION ALL SELECT 'book', COUNT(*) FROM book
UNION ALL SELECT 'rental', COUNT(*) FROM rental
UNION ALL SELECT 'tag', COUNT(*) FROM tag
UNION ALL SELECT 'book_tag', COUNT(*) FROM book_tag
UNION ALL SELECT 'book_like', COUNT(*) FROM book_like
UNION ALL SELECT 'notification', COUNT(*) FROM notification;
