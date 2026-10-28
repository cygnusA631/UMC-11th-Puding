# 5주차 미션 기록 — Spring Boot

실습일: 2026-10-28 (Asia/Seoul). Java 21, Spring Boot 3.5.0, Gradle, MySQL 8.4.11, Spring Data JPA, React/Vite를 사용했다. 스크린샷은 직접 촬영할 수 있도록 미첨부 상태로 남겼다.

## 1. 요구사항과 구현 범위

4주차 도서 대여 프로젝트와 분리해 `Puding/Week05/study`에 영화 평점 서비스 새 프로젝트를 만들었다. 프론트는 기존 영화 화면을 `Puding/Week05/react`로 복사하고 `/members`에 회원가입 준비·내 평점 화면을 추가했다. 기존 영화 목록 데이터는 로컬 데이터이며 이번 실습에서 TMDB 실시간 API 연동을 수행했다고 기록하지 않는다.

필수 미션의 세 API를 모두 실제 화면에 연결했다. 선택 미션 중 닉네임 2~12자·이메일 형식 검증을 추가했다. 평점 API는 명세의 배열 응답을 유지하며 페이지네이션은 추가하지 않았다. CORS는 `http://localhost:5173`으로 제한했다.

## 2. 요구사항 → ERD → DB 준비

- Member는 이메일·닉네임에 각각 UNIQUE 제약을 둔다.
- Member : Rating = 1 : N, Member : Favorite = 1 : N이다. `member_id`가 FK다.
- `movie_id`는 TMDB 영화 식별자를 저장하는 일반 컬럼이다. 별도 Movie 테이블이나 영화 FK를 만들지 않았다.
- Rating과 Favorite은 `(member_id, movie_id)` 복합 UNIQUE 제약으로 같은 회원의 동일 영화 중복 등록을 막는다.
- Rating의 점수는 TINYINT이며 DB CHECK로 1~5 범위를 제한했다. Entity의 Integer 필드에는 JDBC TINYINT 매핑을 명시했다.
- 공통 `createdAt`, `updatedAt`은 `BaseTimeEntity`를 상속한다.

`sql/01_schema.sql`로 member/rating/favorite 테이블을 만들고 `sql/02_seed.sql`로 회원 2명과 평점 3건을 넣었다. favorite은 0건이다. DB는 새 `umc_movie`를 사용한다. `ddl-auto: validate`는 테이블을 생성하는 옵션이 아니므로 SQL을 먼저 실행하고 JPA 매핑 검증에 사용했다. `setup_db.py`는 DB가 이미 있으면 데이터를 초기화하지 않는다.

- 회원 1: 수현 / noco@umc.com / 영화 550의 평점 5점과 영화 155의 평점 4점.
- 회원 2: 민서 / minseo@umc.com / 영화 550의 평점 3점.
- 비밀번호 칼럼에는 로그인에 사용하지 않는 더미 문자열만 넣었다.

**[스크린샷 직접 첨부 — DB]** MySQL의 member/rating/favorite 테이블 목록과 회원·평점 시드 데이터, ERD를 보여주는 화면.

## 3. API 명세를 먼저 정리

**닉네임 중복 체크**

- GET `/members/nickname/{nickname}`. Path nickname은 문자열이다.
- HTTP 200: `{"available":false}`는 이미 사용 중, `true`는 사용 가능이다.
- 공백·2자 미만·12자 초과는 HTTP 400 `INVALID_REQUEST`다.

**이메일 중복 체크**

- GET `/members/email/{email}`. Path email은 문자열이다.
- HTTP 200: `{"available":boolean}`. 잘못된 형식·254자 초과는 HTTP 400이다.

**유저별 평점 조회**

- GET `/members/{memberId}/ratings`. Path memberId는 양의 정수다.
- HTTP 200: `ratingId`·`movieId`(정수), `score`(정수), `comment`(문자열 또는 null), `createdAt`·`updatedAt`(ISO 날짜·시간 문자열)의 배열이다.
- 최신순 기준은 `ratingId` 내림차순, 즉 등록 순서다. 회원이 존재하지만 평점이 없으면 `[]`, 회원이 없으면 HTTP 404 `MEMBER_NOT_FOUND`, ID 형식이 잘못되면 HTTP 400이다.

## 4. Entity → Repository → DTO → Service → Controller 구현

1. `com.umc.movie` 아래에 entity/repository/dto/service/controller/config/exception 패키지를 나눴다.
2. Member, Rating, Favorite Entity와 BaseTimeEntity를 작성했다. Rating과 Favorite의 Member 연관관계는 `@ManyToOne(fetch = LAZY)`로 매핑했다.
3. `existsByNickname`, `existsByEmail`로 중복 여부를 조회하고 `!exists`를 available로 반환했다.
4. `findByMember_MemberIdOrderByRatingIdDesc`로 유저의 평점을 조회했다. 조회 전에 회원 존재 여부를 먼저 확인해 없는 회원과 빈 목록을 구분했다.
5. Entity를 직접 반환하지 않고 NicknameCheckResponse, EmailCheckResponse, RatingResponse로 변환했다. 평점 DTO에는 Member 객체·비밀번호를 포함하지 않는다.
6. 조회 Service에 `@Transactional(readOnly = true)`를 적용하고 Controller는 경로 및 유효성 검증을 담당하도록 했다.
7. `@RestControllerAdvice`에서 400·404의 응답을 `{code,message}`로 통일했다.

핵심 코드는 `src/main/java/com/umc/movie` 아래의 다음 파일에 있다.

- Entity: `entity/BaseTimeEntity.java`, `entity/Member.java`, `entity/Rating.java`, `entity/Favorite.java`.
- DTO: `dto/NicknameCheckResponse.java`, `dto/EmailCheckResponse.java`, `dto/RatingResponse.java`.
- Repository: `repository/MemberRepository.java`, `repository/RatingRepository.java`.
- Service: `service/MemberService.java`, `service/RatingService.java`.
- Controller: `controller/MemberController.java`, `controller/RatingController.java`.
- CORS: `config/WebConfig.java`.

**[코드 원문 수록 완료]** Entity, DTO, Controller/Service, Repository, CORS 설정의 실제 구현 코드를 Notion 미션 기록에 코드 블록으로 수록했다. 코드 부분은 별도 스크린샷 없이 해당 코드 블록으로 확인한다.

## 5. 실제 웹 화면 연결 및 CORS 전후 확인

백엔드는 `http://localhost:8080`, 프론트는 `http://localhost:5173`으로 실행했다. 포트가 다르므로 서로 다른 Origin이다. 프론트는 API proxy를 사용하지 않고 백엔드로 직접 fetch한다. 닉네임·이메일은 `encodeURIComponent`로 경로 값을 인코딩했다.

CORS 설정을 비활성화한 서버에서 닉네임 중복 확인을 누르자 브라우저는 `TypeError: Failed to fetch`와 연결 확인 안내를 표시했다. 같은 API에 Origin을 담아 직접 HTTP 요청했을 때는 200과 `{"available":false}`가 왔지만 `Access-Control-Allow-Origin`은 없었다. 이 결과로 API 처리와 브라우저의 응답 접근 허용은 별개임을 확인했다.

WebMvcConfigurer에서 모든 API 경로의 허용 출처를 `http://localhost:5173`, 메서드를 GET/POST/PATCH/DELETE로 설정한 뒤 서버를 재시작했다. 같은 화면에서 닉네임·이메일은 이미 사용 중, 회원 1은 평점 2개를 표시했다. 평점 2번(영화 155)이 1번(영화 550)보다 먼저 나왔다. 펼침 영역에서 세 요청 모두 HTTP 200과 실제 JSON을 확인했다. 미사용 값인 푸딩/puding@example.com은 사용 가능, 회원 999는 회원 없음 안내를 표시했다.

허용 Origin의 응답 헤더에는 `Access-Control-Allow-Origin: http://localhost:5173`이 있었고, OPTIONS 사전 요청도 200이었다. `http://127.0.0.1:5173` Origin은 403으로 거절됐다. localhost와 127.0.0.1은 호스트가 달라 별도 출처다. CORS는 로그인이나 인증을 대신하지 않으며 브라우저 밖 클라이언트의 접근 통제 수단으로 삼을 수 없다.

**[스크린샷 직접 첨부 — CORS 적용 전]** `--app.cors.enabled=false`로 실행하고 같은 화면에서 버튼을 누른 뒤 Console 오류를 촬영한다.

**[스크린샷 직접 첨부 — CORS 적용 후/실제 화면]** 정상 서버로 다시 실행한 뒤 `/members`의 닉네임·이메일·평점을 모두 호출하고 각각 요청·응답 자세히 보기를 펼쳐 촬영한다. 현재 구현한 모든 API가 보여야 한다.

## 6. 실제 검증 결과

2026-10-28 Java 21에서 실제 MySQL을 사용하는 통합 테스트 9개가 통과했다. 중복·미사용 응답, 입력 400, 회원 없음 404, 기존 회원의 빈 배열, 평점 등록순 정렬·DTO 필드, 허용/불허 CORS와 사전 요청을 검증했다. 테스트 데이터는 트랜잭션으로 되돌렸으며 시드 행 수는 유지했다.

실제 서버 HTTP 요청 14건도 통과했고 프론트의 TypeScript 검사와 Vite 빌드가 성공했다. 브라우저 CORS 전후와 세 API 화면 연결도 직접 실행해 확인했다. 이후 Postman 앱에도 요청 모음을 불러와 닉네임·이메일의 중복/사용 가능 응답과 회원 1 평점 조회, 총 5개 요청이 HTTP 200을 반환하는 것을 확인했다. 요청별 Test Results도 2/2였다. 화면 촬영과 Notion 첨부는 사용자가 직접 진행한다.

회원 1의 실제 HTTP 200 응답:

```json
[
  {
    "ratingId": 2,
    "movieId": 155,
    "score": 4,
    "comment": "다시 봐도 명작",
    "createdAt": "2026-10-28T11:00:00",
    "updatedAt": "2026-10-28T11:00:00"
  },
  {
    "ratingId": 1,
    "movieId": 550,
    "score": 5,
    "comment": "최고의 영화!",
    "createdAt": "2026-10-28T10:00:00",
    "updatedAt": "2026-10-28T10:00:00"
  }
]
```

검증 원문은 `Puding/Week05/results/http-verification.json`, `cors-before.json`, `browser-verification.json`에, Postman 가져오기 파일은 `week05.postman_collection.json`에 저장했다. 소스와 문서는 [GitHub의 Puding 브랜치](https://github.com/cygnusA631/UMC-11th-Puding/tree/Puding/Puding/Week05)에서 관리한다. Postman Local View의 요청 파일은 저장소 루트의 `postman/collections/UMC Week05 Spring Boot 영화 평점 API`에도 있다.

## 7. 직접 촬영·첨부할 목록

- [ ] 스터디 인증샷.
- [ ] DB/ERD: member, rating, favorite 관계와 시드 데이터.
- [x] 핵심 코드 원문: Entity, DTO, Controller/Service, Repository, CORS 설정을 Notion 미션 기록에 코드 블록으로 수록 완료.
- [ ] Postman 닉네임: 수현 → 200 false, 푸딩 → 200 true.
- [ ] Postman 이메일: noco@umc.com → 200 false, puding@example.com → 200 true.
- [ ] Postman 회원 1 평점: 200, ratingId 2 → 1 순서.
- [ ] Postman 없는 회원 999: 404 `MEMBER_NOT_FOUND`.
- [ ] 선택 검증: nickname=a, email=not-an-email → 400 `INVALID_REQUEST`.
- [ ] CORS 전: 브라우저 Console 오류와 요청 출처.
- [ ] CORS 후: 실제 `/members` 화면에서 세 API의 결과·요청 URL·HTTP 상태·JSON.

Postman은 요청 메서드·URL, 응답 HTTP 상태·JSON이 한눈에 보이게 촬영한다. `results/week05.postman_collection.json`을 Import하면 요청들을 바로 사용할 수 있다.

## 트러블슈팅 — 실제 확인한 문제

### No.1 MySQL 실행 환경 중지 및 Docker 연결 경로 불일치

**이슈:** 첫 DB 점검에서 Docker API 연결 실패가 발생했고 `colima status`는 not running이었다. Colima를 켠 후에도 기본 Docker endpoint가 `/var/run/docker.sock`을 가리켜 `docker start`가 실패했다.

**문제:** MySQL 컨테이너를 실행할 Colima가 중지돼 있었고, 기본 Docker context가 실제 Colima 소켓을 사용하지 않았다. API 코드나 DB 계정 오류가 원인은 아니었다.

**해결:** `colima start` 후 `DOCKER_HOST=unix:///Users/moongawon/.colima/default/docker.sock docker start umc-week02-mysql`로 올바른 연결에 컨테이너를 시작했다. 재실행 안내에서는 같은 효과의 `docker --context colima start umc-week02-mysql`를 사용한다. DB 준비 도우미에도 명시 설정이 없고 로컬 Colima 소켓이 있으면 그 연결을 선택하도록 반영했다. 전역 Docker 설정은 변경하지 않았다. 이후 새 DB 생성과 통합 테스트 9개가 통과했다.

참고: [Docker contexts](https://docs.docker.com/engine/manage-resources/contexts/), [Colima](https://github.com/abiosoft/colima).

**[스크린샷 직접 첨부 — 필요 시]** DB 컨테이너 실행 상태와 Spring 서버의 DB 연결 성공 로그. 비밀번호는 캡처하지 않는다.

### No.2 HTTP 요청은 성공하지만 브라우저 fetch 실패

**이슈:** CORS 비활성 상태에서 브라우저의 닉네임 중복 확인은 `TypeError: Failed to fetch`였다. 직접 HTTP 요청은 200과 정상 JSON을 반환했다.

**문제:** 프론트 5173과 백엔드 8080은 다른 출처다. 이 GET 요청의 서버 응답에는 CORS 허용 헤더가 없어 브라우저에서 읽지 못했다.

**해결:** WebMvcConfigurer의 addCorsMappings에 `allowedOrigins("http://localhost:5173")` 정책을 적용하고 서버를 재시작했다. 동일 화면에서 세 API 모두 HTTP 200과 정상 데이터를 표시했고 허용 헤더도 확인했다. 사전 요청 대상에서는 OPTIONS 허가가 실패하면 본 요청 자체가 전송되지 않으므로 모든 CORS 상황을 '요청은 무조건 서버에 도착한다'고 일반화하지 않는다.

참고: [Spring MVC CORS 6.2](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc-cors.html).

**[스크린샷 직접 첨부 — 필수]** 위의 CORS 전 Console 오류와 적용 후 세 API 정상 응답 화면. CORS 설정 코드는 Notion 미션 기록의 코드 블록으로 수록했다.

### No.3 워크북의 따옴표 예시로 닉네임 값이 달라지는 문제

**이슈:** 경로 값 `수현`을 요청하면 false였지만 워크북 안내처럼 큰따옴표를 포함한 `"수현"`을 요청하면 true가 나왔다. 실제 서버 요청으로 두 결과를 확인했다.

**문제:** 큰따옴표는 URL 경로 문자열의 일부다. DB의 수현과 따옴표를 포함한 닉네임은 다른 값이므로 중복 검사 결과가 달라진다.

**해결:** 입력에 따옴표를 추가하지 않고 `encodeURIComponent(value)`로 경로 값만 인코딩했다. `수현`은 `%EC%88%98%ED%98%84`로 요청하며 브라우저에서도 false와 이미 사용 중이라는 안내를 확인했다.

참고: [MDN encodeURIComponent](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent).


## 핵심 키워드

### SOP와 CORS

**개념**

SOP(Same-Origin Policy)는 브라우저가 다른 출처의 데이터에 접근하는 것을 제한하는 보안 정책이다. 출처(Origin)는 프로토콜·호스트·포트의 조합이다. CORS는 서버가 응답 헤더로 허용한 출처에 대해 브라우저의 교차 출처 접근을 허용하는 방식이다.

**이번 실습에 적용**

프론트 `http://localhost:5173`과 Spring Boot 서버 `http://localhost:8080`은 포트가 달라 다른 출처다. `WebMvcConfigurer`의 `addCorsMappings`에서 프론트 출처를 허용했고, 응답의 `Access-Control-Allow-Origin`을 확인했다. Postman은 브라우저의 SOP를 적용받지 않으므로 Postman 성공만으로 브라우저 연동까지 성공했다고 판단할 수 없다.

**정리**

단순 GET 요청은 서버가 처리해도 CORS 허용 헤더가 없으면 브라우저가 JavaScript에 응답을 전달하지 못한다. 반면 사전 요청이 필요한 경우 OPTIONS가 거절되면 본 요청을 보내지 않는다. 따라서 모든 CORS 오류를 “서버에는 요청이 무조건 도착한다”라고 설명하면 안 된다. CORS는 사용자 인증·인가를 대신하지 않는다.

참고: [MDN 동일 출처 정책](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Same-origin_policy), [MDN CORS](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS), [Spring MVC CORS](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc-cors.html).

### Same-Origin과 Same-Site의 차이

**판단 기준**

- **Same-Origin**: 프로토콜·호스트·포트가 모두 같다. 브라우저의 출처 간 데이터 접근과 CORS를 이해할 때 사용하는 기준이다.
- **Same-Site**: 현재 브라우저의 schemeful 기준에서는 프로토콜과 등록 가능 도메인(eTLD+1)을 비교한다. 포트나 서브도메인이 달라도 같은 사이트일 수 있다. 쿠키의 SameSite를 판단할 때 사용하는 기준이다.

**예시**

`https://app.example.com`과 `https://api.example.com`은 등록 가능 도메인과 프로토콜이 같으므로 Same-Site지만, 호스트가 달라 Cross-Origin이다. `http://app.example.com`과 `https://app.example.com`은 프로토콜이 달라 Cross-Origin이며 schemeful 기준에서는 Cross-Site다.

**이번 실습에서의 이해**

두 localhost 서버는 프로토콜과 호스트가 같아도 포트가 다르므로 Cross-Origin이다. “같은 컴퓨터에서 실행한다” 또는 “같은 사이트다”라는 이유로 CORS 설정을 생략할 수는 없다. 쿠키 전송 조건과 JavaScript의 응답 읽기 허용을 각각 구분해서 확인해야 한다.

참고: [web.dev Same-site와 Same-origin](https://web.dev/articles/same-site-same-origin), [web.dev Schemeful Same-Site](https://web.dev/articles/schemeful-samesite).

### 쿠키의 SameSite 속성

**개념과 옵션**

SameSite는 다른 사이트에서 시작된 요청에 쿠키를 보낼 수 있는 범위를 제어한다.

- `Strict`: 같은 사이트 요청에서만 쿠키 전송을 허용한다. 외부 사이트의 링크를 통해 처음 이동하는 경우에도 해당 요청에는 쿠키가 포함되지 않을 수 있다.
- `Lax`: 같은 사이트 요청과, 외부 링크를 통한 GET 같은 안전한 메서드의 최상위 페이지 이동에서 전송을 허용한다. 일반적인 Cross-Site fetch나 iframe 요청까지 허용하는 것은 아니다.
- `None`: Cross-Site 전송을 허용하며 `Secure`를 함께 지정해야 한다. 실서비스에서는 HTTPS 사용이 필요하다.

**CORS와 함께 확인할 점**

Cross-Origin fetch에서 쿠키를 사용하려면 프론트의 `credentials: "include"`, 서버의 `allowCredentials(true)`와 구체적인 허용 Origin을 함께 고려해야 한다. 자격 증명을 포함한 응답에는 허용 출처로 `*`를 사용할 수 없다. SameSite 설정과 쿠키의 Domain·Path, 브라우저의 제3자 쿠키 정책도 별도로 적용되므로 `SameSite=None; Secure`만으로 전송이 보장되지는 않는다.

**이번 실습과의 연결**

5주차는 쿠키 로그인이나 JWT 인증을 구현하기 전의 조회 API 실습이므로 인증 쿠키를 추가하지 않았다. 로그인 실습에서는 SameSite의 허용 범위와 CORS의 응답 접근 허용을 따로 확인할 계획이다.

참고: [MDN Set-Cookie와 SameSite](https://developer.mozilla.org/en-US/docs/Web/HTTP/Reference/Headers/Set-Cookie#samesitesamesite-value), [MDN 자격 증명이 포함된 CORS 요청](https://developer.mozilla.org/en-US/docs/Web/HTTP/Guides/CORS#requests_with_credentials), [Spring MVC CORS](https://docs.spring.io/spring-framework/reference/6.2/web/webmvc-cors.html).

### 복합 UNIQUE 제약을 사용하는 이유는?

**개념**

여러 컬럼을 하나의 조합으로 묶어 그 조합의 중복을 막는 제약이다. 이번 실습에서는 Rating과 Favorite에 `UNIQUE(member_id, movie_id)`를 두어 한 회원이 같은 영화에 평점이나 즐겨찾기를 중복 등록하지 못하도록 했다.

**단일 UNIQUE와의 차이**

- `(member_id=1, movie_id=550)`과 `(1, 155)`는 다른 조합이므로 같은 회원이 여러 영화를 등록할 수 있다.
- `(1, 550)`과 `(2, 550)`도 다른 조합이므로 여러 회원이 같은 영화를 등록할 수 있다.
- `(1, 550)`을 다시 넣으면 같은 조합이므로 중복 오류가 발생한다.

두 컬럼에 각각 UNIQUE를 걸면 회원당 한 행, 영화당 한 행만 허용되어 서비스 요구사항과 달라진다.

**DB에도 제약이 필요한 이유**

애플리케이션에서 먼저 중복을 조회하더라도 동시 요청이 모두 “중복 없음”을 확인할 수 있다. 최종 저장 시점의 중복 방지는 DB 제약이 담당하도록 해야 한다. 두 컬럼은 `NOT NULL`로 두었고, FK는 회원의 존재를 확인하는 역할이므로 중복 방지용 UNIQUE와는 목적이 다르다.

참고: [MySQL 8.4 UNIQUE 및 다중 컬럼 인덱스](https://dev.mysql.com/doc/refman/8.4/en/create-index.html), [MySQL 8.4 외래키 제약](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html).

### 외부 Open API 연동 시 API Key를 프론트/백엔드 중 어디에 두어야 안전한가?

**기본 원칙**

비밀로 유지해야 하는 API Key나 토큰은 백엔드에 보관하는 것이 안전하다. 서버 환경 변수나 비밀값 관리 기능으로 보관하고, 프론트는 우리 백엔드 API를 호출하며 백엔드가 외부 API에 인증 정보를 붙여 요청하도록 구성할 수 있다.

**프론트 환경 변수의 한계**

Vite의 `VITE_*` 환경 변수는 빌드된 클라이언트 코드에 포함된다. 프론트의 `.env`를 Git에서 제외하더라도 브라우저가 키를 사용하면 번들이나 Network 탭에서 확인할 수 있다. HTTPS는 전송 구간을 보호하지만, 브라우저를 사용하는 사람에게 키를 숨겨주지는 않는다.

**서비스별 사용 방식과 판단**

제공자가 공개 클라이언트용으로 허용한 키라면 공식 정책에 맞춰 출처·권한·사용량 제한 등을 적용할 수 있다. 이런 제한이 키 자체를 비밀로 만들어 주는 것은 아니다. TMDB의 API Key와 API Read Access Token도 브라우저 요청에 넣으면 노출될 수 있으며, Bearer 헤더를 사용한다고 비밀 보관이 되는 것은 아니다.

워크북의 “프론트가 TMDB를 직접 호출한다”는 구조는 영화 데이터 호출의 역할 분담이다. 키의 비밀 보관이 필요한 서비스라면 백엔드 중계 여부와 제공자의 정책을 함께 검토해야 한다. 이번에 복사한 영화 목록 화면은 로컬 데이터를 사용하므로 실제 TMDB 키 보관이나 실시간 호출을 검증한 것으로 기록하지 않는다.

참고: [Vite 환경 변수와 보안 안내](https://vite.dev/guide/env-and-mode), [TMDB 애플리케이션 인증](https://developer.themoviedb.org/docs/authentication-application).

## 학습 후기

**이번 주차에서 배운 점**

이번 주차에는 도서 대여 서비스에서 영화 평점 서비스로 도메인을 바꾸고, Member·Rating·Favorite의 관계와 API 응답 형식을 먼저 정리한 뒤 Spring Boot 코드로 옮겼다. Entity는 저장 구조를 표현하고 DTO는 화면에 필요한 데이터만 전달하도록 나누면서, DB의 모든 필드를 그대로 응답할 필요가 없다는 점을 확인했다. 특히 평점 응답에서 Member 객체와 비밀번호를 제외하고 필요한 여섯 필드만 반환한 부분이 DTO의 역할을 이해하는 데 도움이 됐다.

**실습을 통해 확실해진 부분**

가장 크게 정리된 개념은 CORS다. 직접 HTTP 요청과 Postman에서는 정상 JSON이 와도, 출처가 다른 브라우저 화면에서는 그 응답을 읽을 수 없었다. 프론트의 5173과 백엔드의 8080은 포트가 달라 서로 다른 출처라는 점을 확인했고, WebMvcConfigurer에 허용 출처를 설정한 뒤 같은 화면에서 세 API의 결과가 표시되는 것을 확인했다. 앞으로는 연결 오류가 생기면 서버 실행 여부, HTTP 상태, Origin과 CORS 응답 헤더를 순서대로 확인하려고 한다.

닉네임·이메일의 exists 결과를 반대로 바꿔 available을 반환하고, 존재하지 않는 회원의 404와 평점이 없는 회원의 빈 배열을 구분하면서 응답 의미를 명확히 설계하는 연습도 했다. 정상 응답뿐 아니라 입력값 오류와 없는 회원, 정렬 순서까지 검증해야 화면과 연결할 때 예상하지 못한 동작을 줄일 수 있다는 점을 배웠다.

**추가로 공부할 부분과 다음 목표**

SOP와 CORS, Same-Origin과 Same-Site의 기준은 구분해 정리했다. 다만 SameSite와 credentials가 실제 쿠키 인증 흐름에 미치는 영향은 이번 조회 API만으로 충분히 검증한 범위가 아니므로, 로그인 실습에서 개발자 도구의 Cookie·Network 탭과 함께 더 확인할 부분으로 남겼다. 현재 세 API를 실제 화면에 연결한 흐름을 바탕으로 다음 주차에는 회원가입과 평점 CRUD를 확장하고, 저장 요청에서도 입력 검증과 DB 제약을 함께 적용하고 싶다.
