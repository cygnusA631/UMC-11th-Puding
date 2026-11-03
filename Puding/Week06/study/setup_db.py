"""Create an isolated Week06 database once; never reset existing data."""

from pathlib import Path
import os
import re
import subprocess

DATABASE = os.environ.get("DB_NAME", "umc_movie_week06")
ROOT = Path(__file__).resolve().parent
MYSQL = ROOT.parents[1] / "Week02" / "mysql.sh"


def mysql(sql: str) -> str:
    environment = os.environ.copy()
    colima_socket = Path.home() / ".colima/default/docker.sock"
    if colima_socket.exists() and not any(
        name in environment for name in ("DOCKER_HOST", "DOCKER_CONTEXT")
    ):
        environment["DOCKER_HOST"] = f"unix://{colima_socket}"
    result = subprocess.run(
        [str(MYSQL), "--batch", "--skip-column-names"],
        input=sql, text=True, capture_output=True, check=True, env=environment,
    )
    return result.stdout


def main() -> None:
    if not re.fullmatch(r"[A-Za-z0-9_]+", DATABASE):
        raise SystemExit("DB_NAME must contain only letters, digits, and underscores")
    if DATABASE == "umc_movie":
        raise SystemExit("Choose a separate Week06 database; umc_movie is reserved for Week05")
    exists = mysql(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA "
        f"WHERE SCHEMA_NAME = '{DATABASE}';"
    ).strip()
    if exists != "0":
        print(f"{DATABASE} already exists; schema and data were not changed")
        return
    mysql(
        f"CREATE DATABASE `{DATABASE}` "
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
    )
    # Keep a partially initialized database on errors; never drop user data.
    schema = (ROOT / "sql/01_schema.sql").read_text().replace(
        "USE umc_movie_week06;", f"USE `{DATABASE}`;", 1
    )
    mysql(schema)
    print(f"Created {DATABASE}: empty member, rating, favorite tables")


if __name__ == "__main__":
    main()
