# 6주차 — TanStack Query로 영화 데이터 조회

5주차 프론트를 기반으로 목록·검색·상세의 요청과 캐시를 TanStack Query v5로 전환했다. 기존 5주차 코드와 6주차 Spring 서버는 보존했다.

## 실행

```sh
cd /Users/moongawon/MY_Work/Puding/Week06/react
pnpm install --frozen-lockfile
cp .env.example .env.local
# .env.local에 본인의 TMDB API Read Access Token 설정
pnpm dev --host 127.0.0.1 --port 5176
```

기존 로컬 `Week05/react/.env.local` 설정을 재사용하려면 `pnpm dev:live`를 실행한다. 이 명령은 토큰을 새 파일에 복사하지 않고 해당 환경 파일을 읽는다. 새 프로젝트의 `.env.local`을 사용하려면 일반 `pnpm dev`를 사용한다. 설정 파일은 Git 제외 대상이다.

실제 TMDB 대신 로컬 합성 데이터로 상태 UI를 확인할 수 있다. Postman CLI 1.70 이상이 필요하다.

```sh
pnpm dev:fixtures
```

앱: `http://127.0.0.1:5176`, 시뮬레이션: `http://127.0.0.1:18086/tmdb`. 이 명령은 두 서버를 함께 실행하고 Ctrl+C로 종료한다. 다른 서버가 같은 포트를 쓰고 있다면 먼저 해당 서버를 종료한다.

## 구현

- `src/config/query-client.ts`: 공유 QueryClient, 전역 staleTime 60초·gcTime 5분.
- `src/main.tsx`: QueryClientProvider 및 개발용 React Query Devtools.
- `src/api/movies/movie-query-options.ts`: 목록·검색·상세의 queryOptions. 검색어는 trim하고 페이지·검색어·영화 ID를 key에 포함한다. 상세 staleTime은 30초다.
- `src/pages/movies/*`: useQuery로 데이터·로딩·오류·재시도를 관리한다. 입력값과 URL 이동은 기존 화면 상태로 유지한다.
- `src/api/tmdb-client.ts`: ky 재시도는 0으로 설정해 TanStack Query와 재시도가 중첩되지 않게 한다. Query는 네트워크 오류·5xx·429를 최대 한 번 재시도하고 설정 오류·잘못된 입력·그 밖의 4xx는 재시도하지 않는다.
- Query가 전달하는 AbortSignal을 ky 요청에 연결한다. 검색 조건이 바뀌면 이전 요청을 취소하며, 늦은 결과가 새 검색을 덮어쓰지 않게 한다.
- 백그라운드 재조회 중에는 기존 데이터를 유지하며 갱신 안내를 표시한다. 재조회 실패 시에도 기존 데이터와 오류·재시도 버튼을 함께 보여 준다.

## 검증

로컬 시뮬레이션과 fixture 앱이 실행 중인 상태에서 순서대로 실행한다. 두 검증은 같은 mock 상태를 제어하므로 동시에 실행하지 않는다.

```sh
pnpm typecheck
pnpm build
pnpm verify:query
pnpm verify:browser
```

브라우저 검증은 설치된 Google Chrome을 사용한다. 다른 지원 브라우저 채널은 `BROWSER_CHANNEL`로 지정할 수 있다. lint 설정은 없으며 TypeScript 검사와 빌드를 수행한다.

- `../results/query-verification.json`: 실제 앱의 QueryClient·queryOptions와 HTTP 요청을 연결한 11개 검증.
- `../results/query-browser-verification.json`: Chrome UI·캐시·Devtools·취소·오류 복구 등 12개 검증.
- 시간 조건은 설정값을 줄이지 않고 Node 및 브라우저 가상 시계로 확인한다. 실제 30초·5분 동안 기다린 검증으로 기록하지 않는다.
- Postman 프록시는 클라이언트 취소를 upstream 소켓 종료로 전파하지 않을 수 있다. 검증은 클라이언트 AbortError·Query idle·늦은 응답의 캐시 미반영을 확인하며 upstream 종료 여부는 별도로 기록한다.

실제 TMDB 검증은 유효한 로컬 토큰으로 live 개발 서버를 실행한 뒤 수행한다. 기본 검증 대상 포트는 5178이다.

```sh
node --env-file-if-exists=../../Week05/react/.env.local node_modules/vite/bin/vite.js --host 127.0.0.1 --port 5178
# 별도 터미널
pnpm verify:live
# 다른 포트 사용 시 APP_BASE_URL=http://127.0.0.1:5176 pnpm verify:live
```

결과: `../results/live-query-browser-verification.json`. 조회 요청만 수행하며 인증 헤더나 토큰을 저장하지 않는다. 자동 캡처는 생성하지 않는다.

## 직접 캡처

1. 스터디 인증샷.
2. 목록 1·2페이지와 Devtools의 page별 key.
3. 검색 결과와 검색어·page key; 빈 검색어 입력 안내.
4. 상세 화면의 영화 ID key와 조회 30초 후 stale 상태.
5. 로딩·오류/재시도·빈 결과.
6. fresh 상태에서 1 → 2 → 1 이동 시 1페이지 API 요청이 추가되지 않는 Network 기록. 새로고침하면 메모리 캐시가 사라지므로 SPA 페이지 버튼으로 이동한다.

Devtools는 key 객체의 속성 순서를 정규화해 표시할 수 있다. 예를 들어 코드의 `{ query, page }`가 화면에는 `{ page, query }` 순으로 보이는 것은 같은 캐시다.

fixture 모드에서 `__empty__` 검색은 빈 결과, `slow` 검색은 지연 응답을 제공한다. 오류 캡처는 아래처럼 검색 요청을 500으로 설정한 뒤 새 검색어로 검색한다. 캡처 후 반드시 200으로 돌린다.

```sh
curl -fsS 'http://127.0.0.1:18086/tmdb/__control?path=%2F3%2Fsearch%2Fmovie&status=500'
curl -fsS 'http://127.0.0.1:18086/tmdb/__control?path=%2F3%2Fsearch%2Fmovie&status=200'
```

fixture 화면에는 합성 데이터를 사용했다는 캡션을 붙인다. Network를 촬영할 때 Authorization 토큰은 가린다. 선택 미션 캡처에는 옵션 파일과 각 페이지의 useQuery 호출부를 남기면 된다.
