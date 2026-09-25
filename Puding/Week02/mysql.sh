#!/usr/bin/env bash
# 이 과제 전용 컨테이너의 MySQL 클라이언트입니다.
# 예: ./mysql.sh < 04_mission_1.sql
set -euo pipefail
exec docker exec -i umc-week02-mysql sh -c \
  'MYSQL_PWD="$MYSQL_ROOT_PASSWORD" exec mysql --default-character-set=utf8mb4 -uroot "$@"' \
  sh "$@"
