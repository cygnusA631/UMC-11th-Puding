# Week02 — SQL 실습과 미션

[2주차 워크북 원문](https://app.notion.com/p/2-SQL-31d5056fdfa98396ba25014d71388a20?source=copy_link)의 공통 도서 대여 예제로 필수 미션 1~3을 작성하고, 1주차 리워드 ERD로 확장 미션을 작성하는 실습입니다. 도서 서비스와 리워드 서비스는 각각 별도 데이터베이스를 사용합니다.

## 먼저 읽기

- 공통 미션 DB: `umc_week02_library`. `users`, `category`, `book`, `rental`, `tag`, `book_tag`, `book_like`, `notification`의 8개 테이블입니다.
- 확장 미션 DB: `umc_week02_reward`. 1주차 ERD의 회원·지역·가게·미션 등 9개 테이블을 사용합니다.
- 공통 초기 데이터는 워크북 예제입니다. 리워드 초기 데이터는 확장 조회를 확인하기 위한 별도 예시입니다.
- SQL 파일 안의 주석을 읽고 번호 순서대로 실행하세요. 파일 전체를 실행해야 앞부분의 DB 선택 및 조회 변수 설정도 반영됩니다.

## 실행 검증 완료

2026-09-22에 **MySQL Community Server 8.4.11**에서 공통 8개·확장 9개 테이블을 만들고 더미 데이터를 적재했습니다. 공통 미션 3개와 확장 1개의 결과가 아래 기대값과 일치했으며, 경계 사례를 포함한 **15개 검증이 모두 통과**했습니다. 이 컴퓨터의 전용 서버는 이미 초기화했으므로 `01/02/07/08`을 다시 실행하지 말고 조회 파일부터 실행하세요.

- [서버 버전·테이블·공통 데이터 행 수](results/00_environment.txt)
- [스키마와 데이터 적재 실행 로그](results/01_setup.txt)
- [미션 1 실제 결과](results/04_mission_1.txt), [미션 2 실제 결과](results/05_mission_2.txt), [미션 3 실제 결과](results/06_mission_3.txt)
- [확장 실제 결과](results/09_extension_query.txt)
- [15개 검증 결과](results/verification.txt)
- [Workbench 실제 실행 화면 6장](results/screenshots/README.md): 버전, 공통 데이터 적재 확인, 필수 미션 3개, 확장 미션 1개입니다.

위 `.txt`는 실제 MySQL 클라이언트 출력이며 화면 캡처를 대신 꾸민 파일이 아닙니다. [미션 기록](docs/mission-record.md)에 요구사항을 나눈 과정과 환경 문제 해결 내용을 정리했습니다.

MySQL Workbench 8.0.47도 설치했고 `UMC Week02` 연결을 저장했습니다. MySQL 8.4 연결 시 Workbench가 지원 버전 경고를 표시하지만, 이번 과제의 조회는 Workbench에서도 정상 실행했습니다. 비밀번호는 Workbench 키체인에 따로 저장하지 않았습니다.

## 이번에 준비한 실행 환경

과제 전용 MySQL 8.4 서버를 Docker/Colima의 `umc-week02-mysql` 컨테이너로 실행합니다. 기존 MariaDB와 분리하기 위해 로컬 포트 `13306`을 사용합니다. SQL 문법과 실제 DB 엔진은 MySQL이며, 워크북의 `3306` 대신 연결 포트만 달라집니다.

Workbench에서 다음 정보로 연결하세요.

- Connection Name: `UMC Week02`
- Connection Method: `Standard (TCP/IP)`
- Hostname: `127.0.0.1`
- Port: `13306`
- Username: `root`
- Password: 이 폴더의 `.env`에 기록된 `MYSQL_ROOT_PASSWORD` 값

`.env`는 로컬 전용이며 Git에서 제외했습니다. 다른 환경에서 시작할 때는 `.env.example`을 `.env`로 복사하고 비밀번호를 변경하세요.

서버를 **처음 만드는 환경**에서만 다음을 실행합니다. 기존 컨테이너가 있다면 `docker start umc-week02-mysql`로 다시 켜세요.

```bash
cd /Users/moongawon/MY_Work/Puding/Week02
colima start
docker run --detach --name umc-week02-mysql \
  --env-file .env --env MYSQL_ROOT_HOST=% --env TZ=Asia/Seoul \
  --publish 127.0.0.1:13306:3306 \
  --volume week02_mysql_data:/var/lib/mysql mysql:8.4
```

Workbench 없이 터미널에서도 동일한 SQL 파일을 실행할 수 있습니다.

```bash
cd /Users/moongawon/MY_Work/Puding/Week02
./mysql.sh --table < 04_mission_1.sql
./mysql.sh --table < 05_mission_2.sql
./mysql.sh --table < 06_mission_3.sql
./mysql.sh --table < 09_extension_query.sql
python3 verify.py
```

`verify.py`는 원본 더미 데이터의 기대 결과와 경계 사례 15개를 실제 DB에서 검사하며 데이터를 변경하지 않습니다. 실습을 마치고 서버만 끄려면 `docker stop umc-week02-mysql`을 실행하세요. DB 데이터는 Docker 볼륨에 남습니다.

## 실행 순서와 파일 역할

비어 있는 DB를 준비할 때 MySQL에 연결한 SQL 편집기에서 다음 파일을 순서대로 열고 실행합니다. **스키마와 seed는 최초 한 번만 실행**하세요. 이미 적재된 DB에서 seed를 다시 실행하면 원본 데이터와 달라질 수 있습니다. 조회 파일은 반복 실행해도 됩니다.

1. `00_create_databases.sql`: 공통 실습과 확장 실습에 사용할 DB를 준비합니다.
2. `01_schema.sql`: 공통 도서 서비스의 8개 테이블과 관계를 생성합니다.
3. `02_seed.sql`: 워크북의 회원·분류·도서·대여·태그·좋아요 예제 데이터를 입력합니다. 원문에 초기 알림 데이터가 없어 `notification`은 비어 있습니다.
4. `03_practice.sql`: 미션에 사용할 기본 조회와 JOIN을 연습합니다.
5. `04_mission_1.sql`: 문학 분류의 대여 가능한 도서를 조회합니다.
6. `05_mission_2.sql`: 특정 사용자가 아직 반납하지 않은 도서를 조회합니다.
7. `06_mission_3.sql`: 특정 도서의 태그와 특정 사용자의 좋아요 여부를 조회합니다.
8. `07_extension_schema.sql`: 1주차 리워드 ERD의 9개 테이블을 생성합니다.
9. `08_extension_seed.sql`: 지역별 도전 가능 여부를 구분할 리워드 예제 데이터를 입력합니다.
10. `09_extension_query.sql`: 특정 회원에게 특정 지역에서 새로 도전 가능한 미션을 조회합니다.

`10_execution_check.sql`은 버전·테이블 목록·초기 데이터 행 수를 다시 확인하는 읽기 전용 SQL입니다. 제출용 캡처에 사용하세요.

조회 파일 `04`~`06`, `09`는 앞의 스키마와 초기 데이터가 준비되면 다시 실행하면서 조건을 바꿔 볼 수 있습니다. 결과가 바뀌는 이유를 확인하려면 한 번에 조건 하나씩 바꾸세요.

## 기본 데이터에서 예상되는 결과

아래 기대 결과를 실제 실행 로그 및 `verify.py`로 확인했습니다.

- 미션 1: `달빛 도서관` 1행. 설명은 `소설`, 분류는 `문학`입니다. `겨울의 편지`는 대여 불가라 제외하고, `우주를 읽는 법`은 과학 분류라 제외합니다.
- 미션 2: 민서(`user_id = 1`) 기준 `겨울의 편지` 1행. 대여 시각은 `2026-08-10 10:00:00`, 반납 예정 시각은 `2026-08-17 10:00:00`입니다. `returned_at`이 NULL이므로 반납 예정일이 지났더라도 미반납 목록에 나옵니다.
- 미션 3: 민서(`user_id = 1`)와 `달빛 도서관`(`book_id = 1`) 기준 태그 `소설`, `추천`으로 2행이며 좋아요 여부는 모두 `1`입니다. 같은 회원으로 `겨울의 편지`(`book_id = 2`)를 조회하면 태그 NULL, 좋아요 `0`인 1행이 남아야 합니다.
- 확장: 회원 `1`, 안암동(`region_id = 1`), 기준 시각 `2026-09-22 12:00:00`이면 미션 ID `8`, `2` 순서로 2행이 나와야 합니다. 마감 시각이 가까운 미션이 먼저입니다. 기준 시각을 고정해 예제의 결과가 실행 날짜에 따라 바뀌지 않도록 했습니다.

## 제출 전에 이해할 내용

- [미션별 설명과 설계 가정](docs/mission-explanations.md): SELECT·JOIN·WHERE·정렬을 이렇게 쓴 이유와 놓치기 쉬운 조건입니다.
- [JOIN 경로](docs/join-paths.mmd): 공통 미션 및 확장 미션이 어떤 FK 경로를 따라가는지 나타낸 Mermaid 도식입니다.
- [공통 ERD](docs/library-erd.mmd): 도서 서비스의 8개 테이블과 PK/FK입니다. Notion 코드 블록 언어를 Mermaid로 선택해 붙여 넣으면 도식으로 볼 수 있습니다.
- [핵심 키워드 6개](docs/keywords.md): DDL/DML, PK/FK, NULL, 정렬, 페이지네이션을 예제로 설명합니다.
- `SELECT`는 보여 줄 컬럼, `FROM`은 기준 테이블, `JOIN ... ON`은 연결 방법, `WHERE`는 남길 행, `ORDER BY`는 정렬, `LIMIT`은 반환할 행 수를 지정합니다.
- `INNER JOIN`은 연결된 행만, `LEFT JOIN`은 왼쪽 행을 보존하면서 오른쪽 데이터가 없으면 NULL로 보여 줍니다.
- NULL은 `= NULL`이 아니라 `IS NULL`로 검사합니다. 미반납 여부는 날짜 비교가 아닌 `returned_at IS NULL`로 판단합니다.

쿼리와 결과를 확인한 뒤 Notion 미션 기록에 각 SQL, 실제 실행 화면, JOIN 경로, 조건을 선택한 이유를 붙이세요. `results/screenshots/`에 저장한 실제 Workbench 화면을 사용할 수 있습니다. 회고에는 본인이 이해한 내용과 아직 헷갈리는 내용을 직접 작성하세요.

## Notion 제출 순서

1. `10_execution_check.sql`의 버전·테이블·행 수 확인 화면을 첨부합니다. 원본 스키마/seed 적재 과정은 `results/01_setup.txt`에도 남아 있습니다.
2. `04/05/06/09` SQL 파일과 실행 결과를 첨부합니다. 각 쿼리 아래에는 `docs/mission-explanations.md`의 설명과 결과가 맞는 이유를 기록합니다.
3. `docs/library-erd.mmd`와 `docs/join-paths.mmd`의 도식을 붙이고, `docs/mission-record.md`의 과정을 참고해 미션 기록을 정리합니다.
4. 직접 이해한 내용으로 학습 후기를 작성합니다. 스터디 인증샷은 실제 스터디 사진을 사용합니다.
5. 본인 Notion 미션 기록 페이지의 URL을 워크북에 안내된 [UMC AI 피드백 시스템](https://umc.ai.kr/)에 제출합니다.

## 직접 작성할 회고

- 내가 설명할 수 있게 된 JOIN은 무엇인가?
- 미션 3에서 사용자 조건을 `ON`에 쓰는 이유는 무엇인가?
- 미반납과 연체는 어떻게 다른가?
- 1주차 ERD를 조회에 사용하면서 보완하고 싶어진 점은 무엇인가?
