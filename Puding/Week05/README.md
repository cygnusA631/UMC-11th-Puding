# 5주차 — 화면과 Spring Boot API 연결

영화 평점 서비스의 닉네임·이메일 중복 확인과 회원별 평점 조회를 구현하고, React 화면에서 실제 API를 호출하는 과제다.

- [Spring Boot 프로젝트와 실행 안내](study/README.md): Java 21, Spring Boot 3.5.0, MySQL, JPA, DTO, 유효성 검증과 CORS.
- [React 화면과 실행 안내](react/README.md): `/members`에서 세 API를 호출하고 요청 URL·HTTP 상태·JSON을 확인한다.
- [미션 기록·트러블슈팅·핵심 키워드·학습 후기](study/docs/mission-record.md).
- [Postman 가져오기 파일](results/week05.postman_collection.json).
- [실제 HTTP 검증 기록](results/http-verification.json), [브라우저 검증 기록](results/browser-verification.json).
- [Notion 워크북](https://app.notion.com/p/62e5056fdfa982bb95120171d258a752).

데이터베이스와 서버를 준비하는 순서는 Spring Boot 실행 안내에 있다. 비밀번호는 `study/.env.example`을 복사한 `.env`에 설정하며, 실제 `.env`와 설치 의존성·빌드 결과는 Git에서 제외한다. 스크린샷은 사용자가 직접 촬영하여 워크북에 첨부한다.
