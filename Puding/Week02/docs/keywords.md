# 2주차 핵심 키워드

공통 도서 실습을 기준으로 정리한 학습 메모입니다. 문법 설명은 MySQL 8.4 공식 문서를 참고했습니다.

## 1. 요구사항을 SQL로 바꾸기

먼저 “어떤 정보를, 어떤 대상에서, 어떤 조건으로, 어떤 순서로, 몇 개 보여 줄까?”를 정합니다. 보여 줄 컬럼은 `SELECT`, 기준 테이블은 `FROM`, 다른 테이블 연결은 `JOIN ... ON`, 대상 조건은 `WHERE`, 정렬은 `ORDER BY`, 개수는 `LIMIT`에 대응합니다. [MySQL SELECT 문서](https://dev.mysql.com/doc/refman/8.4/en/select.html)

미션 1의 “문학 분류에서 대여 가능한 도서의 제목·설명·분류를 최신순으로 10개”는 다음처럼 나눌 수 있습니다.

- 보여 줄 정보: `b.title`, `b.description`, `c.name`
- 기준 및 연결: `book b`에서 `category c`를 `category_id`로 연결
- 조건: `c.name = '문학' AND b.is_available = TRUE`
- 순서와 개수: `ORDER BY b.book_id DESC LIMIT 10`

## 2. DDL·DML·ALTER

**DDL**은 테이블 같은 데이터 구조를 만드는 명령입니다. `CREATE TABLE`은 생성, `ALTER TABLE`은 기존 구조 변경, `DROP TABLE`은 제거에 해당합니다. **DML**은 데이터를 조회·입력·수정·삭제하는 명령으로 `SELECT`, `INSERT`, `UPDATE`, `DELETE` 등이 있습니다. MySQL 공식 문서는 `SELECT`도 DML 항목에 포함합니다. [DDL 목록](https://dev.mysql.com/doc/refman/8.4/en/sql-data-definition-statements.html), [DML 목록](https://dev.mysql.com/doc/refman/8.4/en/sql-data-manipulation-statements.html)

`ALTER TABLE`은 컬럼을 추가하거나 자료형을 바꾸는 등 **구조를 변경할 때** 사용합니다. 예를 들어 `ALTER TABLE book ADD COLUMN publisher VARCHAR(100);`는 출판사 컬럼을 추가합니다. 설명용 예시이므로 이번 공통 스키마에 실행할 필요는 없습니다. [ALTER TABLE 문서](https://dev.mysql.com/doc/refman/8.4/en/alter-table.html)

## 3. PK·FK·JOIN

**PK(기본 키)**는 한 행을 구별하는 값이며 중복과 NULL을 허용하지 않습니다. `book.book_id`가 예시이고, `book_tag`처럼 여러 컬럼의 조합을 하나의 PK로 사용할 수도 있습니다. **FK(외래 키)**는 다른 테이블의 키를 참조하여 관계를 표현하고 잘못된 참조를 막습니다. `book.category_id`는 `category.category_id`를 참조합니다. [PRIMARY KEY 문서](https://dev.mysql.com/doc/refman/8.4/en/create-table.html), [FOREIGN KEY 문서](https://dev.mysql.com/doc/refman/8.4/en/create-table-foreign-keys.html)

**JOIN**은 관계를 따라 여러 테이블의 정보를 한 결과로 조회하는 방법입니다. `INNER JOIN`은 연결 조건이 맞는 행을 반환하고, `LEFT JOIN`은 연결된 오른쪽 행이 없어도 왼쪽 행을 남기며 오른쪽 컬럼을 NULL로 표시합니다. 미션 3에서는 태그나 좋아요가 없는 도서도 보여 주기 위해 `LEFT JOIN`을 사용합니다. FK를 정의하는 것과 JOIN으로 조회하는 것은 별개의 작업입니다. [JOIN 문서](https://dev.mysql.com/doc/refman/8.4/en/join.html)

연결 조건을 빠뜨려 모든 행을 서로 연결하면 불필요하게 행이 늘어납니다. 반면 도서에 태그가 2개 있어서 미션 3이 2행을 반환하는 것은 관계에 맞는 정상 결과입니다.

## 4. NULL

NULL은 값이 없거나 아직 정해지지 않았음을 나타냅니다. 숫자 `0`이나 빈 문자열 `''`과 다르며, `= NULL` 대신 `IS NULL`, `IS NOT NULL`로 확인합니다. 따라서 미반납 도서는 `returned_at IS NULL`로 찾습니다. [NULL 문서](https://dev.mysql.com/doc/refman/8.4/en/working-with-null.html)

미션 3에서 태그가 없어 표시되는 `tag_name = NULL`도 “NULL이라는 이름의 태그”가 있다는 뜻이 아닙니다. 연결된 태그 행이 없다는 뜻입니다.

## 5. 일관된 정렬

목록에는 원하는 순서를 `ORDER BY`로 지정해야 합니다. 정렬 값이 같은 행은 순서가 달라질 수 있으므로, 마지막 기준에 고유한 ID를 추가하면 데이터가 같은 동안 결과 순서를 일정하게 만들 수 있습니다. [LIMIT과 정렬 문서](https://dev.mysql.com/doc/refman/8.4/en/limit-optimization.html)

미션 2의 `ORDER BY r.due_at ASC, r.rental_id ASC`는 반납 예정일이 빠른 순서로 보여 주고, 같은 예정일이면 대여 ID가 작은 순서로 보여 줍니다. 미션 1의 `book_id DESC`는 워크북에서 정한 최신 기준이며, 실제 등록 시각을 사용한 정렬과 구분해야 합니다.

## 6. LIMIT·OFFSET

`LIMIT`은 최대 몇 행을 보여 줄지, `OFFSET`은 앞에서 몇 행을 건너뛸지 정합니다. `LIMIT 10 OFFSET 0`은 첫 10행, `LIMIT 10 OFFSET 10`은 그다음 최대 10행입니다. OFFSET의 시작은 `0`이며, 데이터가 부족하면 10행보다 적게 반환됩니다. [SELECT의 LIMIT 문서](https://dev.mysql.com/doc/refman/8.4/en/select.html)

페이지를 바꿀 때는 조회 조건과 정렬을 유지한 채 OFFSET을 변경합니다. 이번 연습의 대여 가능 도서는 2권이므로 첫 페이지는 2행, 두 번째 페이지는 0행이 정상입니다.

페이지 번호를 1부터 센다면 `OFFSET = (페이지 번호 - 1) × 페이지 크기`입니다. OFFSET 방식은 이해하기 쉽지만 페이지 조회 사이에 데이터가 추가·삭제되면 행의 위치가 달라져 중복이나 누락이 생길 수 있습니다. 큰 OFFSET에서의 성능과 마지막으로 본 키를 기준으로 조회하는 방식은 이후 최적화 과제로 남깁니다.
