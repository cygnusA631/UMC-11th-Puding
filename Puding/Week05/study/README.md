# 5주차 Spring Boot 영화 평점 서비스

Java 21, Spring Boot 3.5.0, Gradle, Spring Data JPA, MySQL을 사용하는 새 프로젝트다. 이전 도서 서비스와 별개인 `umc_movie` 데이터베이스를 사용한다.

## 실행

이 컴퓨터의 MySQL 컨테이너는 `umc-week02-mysql`, 호스트 포트는 `13306`이다. Colima가 꺼져 있다면 먼저 아래 순서로 시작한다. Docker의 전역 설정을 바꾸지 않고 이 명령에만 Colima를 지정한다.

```sh
colima start
docker --context colima start umc-week02-mysql
cd /Users/moongawon/MY_Work/Puding/Week05/study
python3 setup_db.py
```

`setup_db.py`는 기존 2주차의 MySQL 실행 도우미를 사용한다. 새 DB가 없을 때만 SQL을 적용하고, 이미 있으면 아무것도 초기화하지 않는다. 로컬 Colima 소켓이 있으면 해당 연결을 사용하며, 명시적으로 지정한 `DOCKER_HOST`/`DOCKER_CONTEXT`가 있으면 그 값을 따른다. 다른 MySQL 환경에서는 `sql/01_schema.sql`, `sql/02_seed.sql`을 본인의 DB에 최초 한 번 적용한다.

이 컴퓨터에는 비밀번호를 출력하지 않고 기존 로컬 설정에서 가져온 `.env`가 준비되어 있다. 다른 환경에서는 `.env.example`을 복사해 본인 DB 정보를 채운다. `.env`는 Git에서 제외된다.

```sh
cd /Users/moongawon/MY_Work/Puding/Week05/study
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
set -a
source .env
set +a
./gradlew bootRun --no-daemon
```

Java 21이 이미 설정되어 있으면 `JAVA_HOME` 줄을 생략할 수 있다. 서버는 `http://localhost:8080`에서 실행된다. 별도 터미널에서 프론트를 실행한다.

```sh
cd /Users/moongawon/MY_Work/Puding/Week05/react
npm run dev
```

브라우저에서 **http://localhost:5173/members**를 연다. 기본 CORS 허용 출처가 `http://localhost:5173`이므로 `127.0.0.1` 주소 대신 `localhost`로 접속한다. 닉네임·이메일 중복 확인과 평점 불러오기 후 각 **요청·응답 자세히 보기**를 펼치면 URL, HTTP 상태, JSON을 함께 볼 수 있다.

## API

- `GET /members/nickname/{nickname}`: `{"available": boolean}`. 닉네임은 공백이 아니고 2~12자여야 한다.
- `GET /members/email/{email}`: `{"available": boolean}`. 이메일 형식과 최대 254자를 검증한다.
- `GET /members/{memberId}/ratings`: 평점 DTO 배열을 `ratingId` 내림차순으로 반환한다. 존재하는 회원의 평점이 없으면 `200 []`, 없는 회원이면 `404 MEMBER_NOT_FOUND`다.
- 입력 검증 실패와 잘못된 회원 ID는 `400 INVALID_REQUEST`다.

초기 데이터는 회원 `1=수현/noco@umc.com`, `2=민서/minseo@umc.com`, 평점 3건이다. 회원 1의 조회 결과는 평점 2번(영화 155), 1번(영화 550) 순서다. `favorite`는 테이블과 Entity만 준비하며 API는 이후 주차 범위다. 로그인용 실제 비밀번호를 넣지 않았다.

## 검증 및 직접 캡처

2026-10-28 실제 MySQL에 연결한 통합 테스트 9개, 실제 HTTP 확인 14건, 프론트 빌드가 통과했다. 실제 브라우저에서 CORS 비활성 시 실패와 활성 시 세 API 정상 응답을 확인했다. 테스트는 트랜잭션으로 데이터를 되돌리며, MySQL의 AUTO_INCREMENT 번호는 건너뛸 수 있다.

```sh
# 위 실행 준비와 동일하게 .env 및 Java 21을 설정한 상태에서
./gradlew test --no-daemon
```

Postman에서는 `../results/week05.postman_collection.json`을 Import하면 된다. 이 컴퓨터의 Postman 앱에도 요청 모음을 불러왔으며, 닉네임·이메일의 중복/사용 가능 응답과 회원 1 평점 조회가 HTTP 200을 반환하는 것을 확인했다. 화면 촬영과 Notion 첨부는 사용자 직접 수행 항목이다. 검증 원문은 `../results/http-verification.json`, `../results/cors-before.json`, `../results/browser-verification.json`에 저장했다.

CORS 설정 전 화면을 직접 촬영하려면 정상 서버를 `Ctrl+C`로 끄고 아래 명령으로 잠시 실행한다.

```sh
./gradlew bootRun --no-daemon --args='--app.cors.enabled=false'
```

같은 프론트에서 닉네임 중복 확인을 눌러 개발자 도구 Console 오류를 촬영한다. 이후 서버를 끄고 옵션 없는 정상 실행 명령으로 다시 시작하여 성공 화면을 촬영한다. CORS를 끈 서버와 켠 서버를 동시에 8080 포트에서 실행하지 않는다.

구현 과정, 실제 응답, 핵심 코드 위치와 캡처 목록은 [미션 기록](docs/mission-record.md)에 정리했다. 제출 코드는 [GitHub의 Puding 브랜치](https://github.com/cygnusA631/UMC-11th-Puding/tree/Puding/Puding/Week05)에서 확인할 수 있다.
