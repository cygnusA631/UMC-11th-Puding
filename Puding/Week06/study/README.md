# 6주차 Spring Boot — 입력한 데이터를 저장하기

Java 21, Spring Boot 3.5.0, JPA, MySQL을 사용한다. 5주차 조회 API를 유지하고 회원가입과 평점 등록·수정·삭제를 추가했다. 데이터베이스는 별도 `umc_movie_week06`이며, 기존 5주차 DB를 초기화하지 않는다.

## 실행 준비

MySQL 컨테이너가 중지되어 있다면 `colima start`, `docker --context colima start umc-week02-mysql`로 시작한다. 최초 한 번 `python3 setup_db.py`로 별도 DB와 빈 테이블을 만든다. DB가 이미 있으면 스키마와 데이터를 변경하지 않는다. 초기 더미 회원이나 평점은 없으므로 먼저 회원가입 API를 호출한다.

`.env.example`을 참고해 DB_HOST, DB_PORT, DB_NAME, DB_USER, DB_PASSWORD를 환경 변수로 설정한다. DB_NAME은 `umc_movie_week06`을 사용한다. 비밀번호가 담긴 설정은 저장소에 올리지 않는다.

```sh
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
./gradlew bootRun --no-daemon
```

기본 주소는 `http://localhost:8080`이다. 기존 서버가 실행 중이라면 `SERVER_PORT=8086`으로 별도 실행할 수 있다. CORS 허용 출처는 `http://localhost:5173`이며 GET/POST/PATCH/DELETE를 허용한다.

## API와 응답

- POST `/members`: `{email,password,nickname}`. 성공 201, result는 `{memberId,email,nickname}`이다.
- POST `/members/{memberId}/ratings`: `{movieId,score,comment}`. 성공 201, result는 생성된 ratingId다.
- PATCH `/members/{memberId}/ratings/{ratingId}`: `{score,comment}`. score는 필수이고 comment를 생략하면 null로 바뀐다. 성공 200, result는 null이다.
- DELETE `/members/{memberId}/ratings/{ratingId}`: 성공 204, 응답 본문이 없다.

쓰기 성공 및 오류 응답은 `{isSuccess,code,message,result}`를 사용한다. 기존 조회 API의 성공 응답은 호환성을 위해 `{available}` 또는 평점 배열을 유지한다. GET `/members/nickname/{nickname}`, GET `/members/email/{email}`, GET `/members/{memberId}/ratings`를 그대로 사용할 수 있다.

회원가입은 이메일 형식/최대254자, 닉네임2~12자, 비밀번호 대문자·소문자·숫자·특수문자(!@#$%^&*) 포함 최소8자를 검증한다. bcrypt는 UTF-8 최대72바이트까지만 허용하고 cost10의 무작위 salt로 해시한다. 비밀번호는 응답 DTO에서 제외한다.

movieId는 양의 정수이고 별도 Movie FK는 없다. score는 1~5 정수, comment는 선택 입력/최대500자다. 소수 값을 정수로 절삭하지 않도록 Jackson ACCEPT_FLOAT_AS_INT를 끈다. 수정·삭제는 평점 소유자의 memberId를 비교한다. 현재 경로 memberId는 로그인 인증을 대신하지 않으며, 토큰 인증은 다음 주차 범위다.

오류 코드는 다음과 같다.

- 400 COMMON400: 입력값·경로 ID·JSON 자료형 오류.
- 409 MEMBER4091: 이메일 중복, MEMBER4092: 닉네임 중복, RATING4091: 회원별 동일 영화 평점 중복.
- 404 MEMBER4041: 없는 회원, RATING4041: 없는 평점.
- 403 RATING4031: 다른 회원의 평점 수정·삭제.
- 500 COMMON500: 알려진 UNIQUE 위반이 아닌 저장 무결성 오류. SQL 상세나 입력 비밀번호는 응답에 담지 않는다.

서비스 사전 중복 검사와 DB의 명명된 UNIQUE 제약을 함께 사용한다. 동시 요청이 사전 검사를 통과해도 DB에서 거절한 UNIQUE 제약 이름에 따라 같은409 코드로 응답한다. 모든 무결성 오류를 중복으로 처리하지 않는다. DB의 회원 FK와 점수 CHECK도 유지한다.

## 검증 및 캡처

```sh
./gradlew test --no-daemon
```

회원가입201, 입력실패400, 평점등록201/수정200/삭제204, 중복409, 소유자403, 없는회원·평점404를 확인한다. 검증 결과와 미션 기록은 별도 결과 문서에 정리한다. Postman의 요청 URL·메서드·응답 상태·JSON, DB의60자 해시 저장, 스터디 인증샷은 직접 캡처해 첨부한다. DB 비밀번호와 실제 사용자 비밀번호가 화면에 노출되지 않도록 한다.
