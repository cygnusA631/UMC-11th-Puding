-- 새 실습용 DB를 준비합니다. 기존 DB나 테이블을 삭제하지 않습니다.
-- 01/02, 07/08은 비어 있는 DB에서 한 번씩만 실행합니다.
CREATE DATABASE IF NOT EXISTS umc_week02_library
    CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE IF NOT EXISTS umc_week02_reward
    CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;

SELECT VERSION() AS mysql_version;
