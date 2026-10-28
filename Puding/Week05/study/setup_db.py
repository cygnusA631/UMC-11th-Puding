"""Initialize only the new Week05 database; never reset an existing database."""

from pathlib import Path
import os
import subprocess

DATABASE = "umc_movie"
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
    exists = mysql(
        "SELECT COUNT(*) FROM INFORMATION_SCHEMA.SCHEMATA "
        f"WHERE SCHEMA_NAME = '{DATABASE}';"
    ).strip()
    if exists != "0":
        print(f"{DATABASE} already exists; schema and seed were not changed")
        return
    mysql(
        f"CREATE DATABASE `{DATABASE}` "
        "CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;"
    )
    # Keep any partial database on error for diagnosis; never drop user data.
    mysql((ROOT / "sql/01_schema.sql").read_text())
    mysql((ROOT / "sql/02_seed.sql").read_text())
    print(f"Created {DATABASE}: member=2, rating=3, favorite=0")


if __name__ == "__main__":
    main()
