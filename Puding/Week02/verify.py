"""실제 MySQL에서 제출 SQL과 경계 사례를 검증합니다. 데이터를 변경하지 않습니다.

전제: umc-week02-mysql 컨테이너에 00/01/02/07/08 파일을 최초 1회 실행.
실행: python3 verify.py
"""
from pathlib import Path
import subprocess

ROOT = Path(__file__).resolve().parent


def query(sql):
    result = subprocess.run(
        ["bash", str(ROOT / "mysql.sh"), "--batch", "--raw", "--skip-column-names"],
        input=sql, text=True, capture_output=True, check=True,
    )
    return [line.split("\t") for line in result.stdout.splitlines()]


def mission(filename, **parameters):
    sql = (ROOT / filename).read_text()
    for name, value in parameters.items():
        original = f"SET @{name} = 1;"
        if sql.count(original) != 1 or not isinstance(value, int):
            raise ValueError(f"Unexpected parameter: {name}")
        sql = sql.replace(original, f"SET @{name} = {value};", 1)
    return query(sql)


def check(label, actual, expected):
    if actual != expected:
        raise AssertionError(f"{label}\nexpected: {expected!r}\nactual: {actual!r}")
    print(f"PASS | {label}")


def ids(rows):
    return [row[0] for row in rows]


def main():
    version = query("SELECT VERSION();")[0][0]
    if not version.startswith("8.4."):
        raise AssertionError(f"Expected MySQL 8.4, got {version}")
    print(f"MySQL {version}")

    tables = {"users": 2, "category": 2, "book": 3, "rental": 2,
              "tag": 3, "book_tag": 3, "book_like": 2, "notification": 0}
    counts = query("USE umc_week02_library; " + " UNION ALL ".join(
        f"SELECT '{name}', COUNT(*) FROM `{name}`" for name in tables
    ) + ";")
    check("공통 데이터 8개 테이블의 행 수", counts,
          [[name, str(count)] for name, count in tables.items()])

    available = [["3", "우주를 읽는 법", "과학 교양"], ["1", "달빛 도서관", "소설"]]
    check("단일 조회·JOIN·첫 페이지·빈 두 번째 페이지", mission("03_practice.sql"),
          available + [["1", "달빛 도서관", "문학"]] + available)
    check("미션 1: 문학 AND 대여 가능", mission("04_mission_1.sql"),
          [["달빛 도서관", "소설", "문학"]])
    check("미션 2: 미반납은 연체도 포함", mission("05_mission_2.sql"),
          [["겨울의 편지", "2026-08-10 10:00:00", "2026-08-17 10:00:00"]])
    check("미션 2: 반납 완료 사용자는 빈 목록", mission("05_mission_2.sql", user_id=2), [])
    check("미션 3: 태그 2개 + 좋아요", mission("06_mission_3.sql"),
          [["달빛 도서관", "소설", "1"], ["달빛 도서관", "추천", "1"]])
    check("미션 3: 다른 사용자의 좋아요를 섞지 않음", mission("06_mission_3.sql", user_id=2),
          [["달빛 도서관", "소설", "0"], ["달빛 도서관", "추천", "0"]])
    check("미션 3: 태그·좋아요가 없어도 도서 보존", mission("06_mission_3.sql", book_id=2),
          [["겨울의 편지", "NULL", "0"]])
    check("미션 3: 태그 1개 + 좋아요", mission("06_mission_3.sql", book_id=3),
          [["우주를 읽는 법", "과학", "1"]])
    check("미션 3: 없는 도서는 빈 목록", mission("06_mission_3.sql", book_id=999), [])
    check("확장: 표시 정보와 마감순 정렬", mission("09_extension_query.sql"), [
        ["8", "오후의 커피", "안암 카페", "카페", "안암동", "8000", "200", "2026-09-23 18:00:00"],
        ["2", "든든한 한 끼", "안암 밥집", "한식", "안암동", "15000", "500", "2026-09-24 18:00:00"],
    ])
    check("확장: 다른 회원 이력은 제외 조건이 아님",
          ids(mission("09_extension_query.sql", member_id=2)), ["2", "1", "7", "9", "13"])
    check("확장: 지역 변경", ids(mission("09_extension_query.sql", region_id=2)), ["4"])
    check("확장: 논리 삭제 지역은 조회하지 않음", mission("09_extension_query.sql", region_id=3), [])
    check("확장: 없는 지역은 빈 목록", mission("09_extension_query.sql", region_id=999), [])
    print("15 checks passed. No data was modified.")


if __name__ == "__main__":
    main()
