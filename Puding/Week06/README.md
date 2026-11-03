# 6주차 — 서버 데이터 조회와 저장

## Frontend — TanStack Query로 서버 데이터 조회

목록·검색·상세를 useQuery와 queryOptions로 전환했다. 전역 staleTime 1분·gcTime 5분, 상세 staleTime 30초를 적용하고 요청 조건별 캐시, 요청 취소와 오류 후 재시도를 검증한다.

- [프론트 실행·구현·검증·캡처 안내](react/README.md)
- [Query 통합 검증 결과](results/query-verification.json)
- [브라우저 UI·캐시 검증 결과](results/query-browser-verification.json)
- [실제 TMDB 브라우저 검증 결과](results/live-query-browser-verification.json)
- [직접 캡처 18장과 재촬영 안내](results/screenshots/README.md)

## Backend — 입력한 데이터를 저장하기

Spring Boot로 회원가입과 영화 평점 등록·수정·삭제를 구현했다. 5주차 조회 API를 유지하며 별도 DB `umc_movie_week06`을 사용한다.

- 코드와 API 규칙: [study/README.md](study/README.md)
- 과정·트러블슈팅·회고: [미션 기록](study/docs/mission-record.md)
- 실제 MySQL 통합 테스트: [16개 통과](results/integration-verification.json)
- 실행 중인 서버 HTTP 요청: [27건 통과](results/http-verification.json)
- 직접 캡처용 요청 모음: [Postman 16개 요청](results/week06.postman_collection.json)

## 실행

기존 로컬의 Git 제외 설정을 읽되, 6주차 DB 이름을 뒤에서 지정한다. 설정 내용이나 DB 비밀번호를 문서에 복사하지 않는다.

```sh
cd /Users/moongawon/MY_Work/Puding/Week06/study
export JAVA_HOME=/opt/homebrew/opt/openjdk@21/libexec/openjdk.jdk/Contents/Home
set -a
source ../../Week05/study/.env
set +a
export DB_NAME=umc_movie_week06
python3 setup_db.py
./gradlew bootRun --no-daemon
```

MySQL이 꺼져 있다면 먼저 `colima start`와 `docker --context colima start umc-week02-mysql`을 실행한다. `setup_db.py`는 DB가 이미 있으면 데이터를 바꾸지 않는다. 기존 5주차 서버가 8080을 사용 중이면 `SERVER_PORT=8086 ./gradlew bootRun --no-daemon`으로 실행하고 Postman의 `baseUrl`도 바꾼다.

같은 환경 변수를 읽은 별도 터미널에서 `./gradlew test --no-daemon`으로 테스트할 수 있다. HTTP 재검증은 서버를 켠 뒤 Week06 폴더에서 `python3 verify_http.py`로 실행한다. 이 스크립트는 매 실행마다 합성 회원 2명과 캡처용 평점 1건을 남긴다.

## 직접 캡처할 항목

Postman 모음은 생성했으며 **Postman 앱에서 실행한 결과는 아직 없다**. Import 후 01~16을 순서대로 실행하면 ID 변수가 자동으로 채워진다.

- [ ] 회원가입 201과 password가 없는 응답
- [ ] 입력 검증 400, 이메일·닉네임·평점 중복 409
- [ ] 평점 등록 201, 수정 200과 조회 결과
- [ ] 다른 회원의 수정·삭제 403, 없는 평점 404
- [ ] 평점 삭제 204의 빈 본문과 삭제 후 빈 목록
- [ ] DB에 해시가 저장된 사실과 스터디 인증샷

요청 메서드·URL·상태·응답이 함께 보이게 촬영한다. 촬영 및 Notion 첨부는 남겨두었다. DB 제약 경로 검증은 통합 테스트로 수행했으며, 실제 동시 요청 캡처를 수행한 것으로 기록하지 않는다.
