CREATE TABLE member (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '회원 식별자',
  name VARCHAR(50) NOT NULL COMMENT '회원 이름',
  email VARCHAR(255) NULL COMMENT '이메일',
  gender VARCHAR(20) NULL COMMENT '성별',
  birth_date DATE NULL COMMENT '생년월일',
  address VARCHAR(255) NULL COMMENT '회원 주소',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '탈퇴 일시',
  PRIMARY KEY (id)
) COMMENT='회원';

CREATE TABLE region (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '지역 식별자',
  name VARCHAR(50) NOT NULL COMMENT '지역 이름',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '삭제 일시',
  PRIMARY KEY (id)
) COMMENT='지역';

CREATE TABLE food_category (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '음식 카테고리 식별자',
  name VARCHAR(50) NOT NULL COMMENT '음식 카테고리 이름',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '삭제 일시',
  PRIMARY KEY (id)
) COMMENT='음식 카테고리';

CREATE TABLE social_account (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '소셜 계정 식별자',
  member_id BIGINT NOT NULL COMMENT '회원 식별자',
  provider VARCHAR(30) NOT NULL COMMENT '소셜 로그인 제공자',
  provider_user_id VARCHAR(255) NOT NULL COMMENT '제공자에서 발급한 사용자 식별자',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '연결 해제 일시',
  PRIMARY KEY (id),
  UNIQUE KEY uq_social_account_provider_user (provider, provider_user_id),
  CONSTRAINT fk_social_account_member FOREIGN KEY (member_id) REFERENCES member (id)
) COMMENT='회원 소셜 로그인 계정';

CREATE TABLE store (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '가게 식별자',
  region_id BIGINT NOT NULL COMMENT '지역 식별자',
  food_category_id BIGINT NOT NULL COMMENT '대표 음식 카테고리 식별자',
  name VARCHAR(100) NOT NULL COMMENT '가게 이름',
  address VARCHAR(255) NOT NULL COMMENT '가게 주소',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '삭제 일시',
  PRIMARY KEY (id),
  CONSTRAINT fk_store_region FOREIGN KEY (region_id) REFERENCES region (id),
  CONSTRAINT fk_store_food_category FOREIGN KEY (food_category_id) REFERENCES food_category (id)
) COMMENT='가게';

CREATE TABLE member_food_preference (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '회원 선호 음식 식별자',
  member_id BIGINT NOT NULL COMMENT '회원 식별자',
  food_category_id BIGINT NOT NULL COMMENT '음식 카테고리 식별자',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '선호 해제 일시',
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_food_preference (member_id, food_category_id),
  CONSTRAINT fk_member_food_preference_member FOREIGN KEY (member_id) REFERENCES member (id),
  CONSTRAINT fk_member_food_preference_category FOREIGN KEY (food_category_id) REFERENCES food_category (id)
) COMMENT='회원 선호 음식';

CREATE TABLE mission (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '미션 식별자',
  store_id BIGINT NOT NULL COMMENT '가게 식별자',
  title VARCHAR(100) NOT NULL COMMENT '미션 제목',
  description TEXT NOT NULL COMMENT '미션 설명 및 수행 조건',
  min_amount INT NOT NULL COMMENT '미션 최소 결제 금액',
  reward_point INT NOT NULL COMMENT '미션 완료 보상 포인트',
  deadline DATETIME NOT NULL COMMENT '미션 마감 일시',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '삭제 일시',
  PRIMARY KEY (id),
  CONSTRAINT fk_mission_store FOREIGN KEY (store_id) REFERENCES store (id)
) COMMENT='가게 방문 미션';

CREATE TABLE member_mission (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '회원 미션 수행 식별자',
  member_id BIGINT NOT NULL COMMENT '회원 식별자',
  mission_id BIGINT NOT NULL COMMENT '미션 식별자',
  status VARCHAR(20) NOT NULL DEFAULT 'IN_PROGRESS' COMMENT '수행 상태: IN_PROGRESS, COMPLETED, CANCELED',
  started_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '미션 시작 일시',
  completed_at DATETIME NULL DEFAULT NULL COMMENT '미션 완료 일시',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '수정 일시',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '삭제 일시',
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_mission (member_id, mission_id),
  CONSTRAINT fk_member_mission_member FOREIGN KEY (member_id) REFERENCES member (id),
  CONSTRAINT fk_member_mission_mission FOREIGN KEY (mission_id) REFERENCES mission (id)
) COMMENT='회원별 미션 수행 내역';

CREATE TABLE member_agreement (
  id BIGINT NOT NULL AUTO_INCREMENT COMMENT '회원 약관 응답 식별자',
  member_id BIGINT NOT NULL COMMENT '회원 식별자',
  agreement_code VARCHAR(50) NOT NULL COMMENT '약관 종류 코드',
  version VARCHAR(30) NOT NULL COMMENT '약관 버전',
  agreed BOOLEAN NOT NULL COMMENT '동의 여부: 참은 동의, 거짓은 거부',
  agreed_at DATETIME NULL DEFAULT NULL COMMENT '동의 일시, 거부한 경우 비어 있음',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '응답 기록 생성 일시',
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP COMMENT '응답 기록 수정 일시',
  deleted_at DATETIME NULL DEFAULT NULL COMMENT '삭제 일시',
  PRIMARY KEY (id),
  UNIQUE KEY uq_member_agreement (member_id, agreement_code, version),
  CONSTRAINT fk_member_agreement_member FOREIGN KEY (member_id) REFERENCES member (id)
) COMMENT='회원 약관 동의 및 거부 내역';
