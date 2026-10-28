# UMCine — 5주차 화면과 Spring Boot API 연결

4주차 React 영화 앱을 별도 프로젝트로 복사하고 `/members`(내 정보)에 닉네임·이메일 중복 확인과 회원별 평점 조회를 연결했습니다. 기존 영화 목록·검색·상세·북마크 화면은 그대로 사용할 수 있습니다. 기존 영화 화면은 로컬 영화 데이터를 사용하며, 이번 주차에 새로 연결한 회원·평점 데이터는 실제 Spring Boot API에서 받습니다.

## 실행

백엔드와 MySQL을 먼저 준비한 뒤 실행합니다. Node.js 22, pnpm 11 기준입니다.

```sh
cd /Users/moongawon/MY_Work/Puding/Week05/react
pnpm install --frozen-lockfile
npm run dev
```

브라우저에서 **http://localhost:5173/members**를 엽니다. `127.0.0.1:5173`은 `localhost:5173`과 다른 출처이므로 기본 CORS 허용 목록에 없습니다. 개발 서버는 5173 포트가 사용 중이면 다른 포트로 이동하지 않고 종료합니다.

API 주소 기본값은 `http://localhost:8080`입니다. 변경할 때 `.env.example`을 `.env.local`로 복사해 `VITE_API_BASE_URL`을 수정하고 개발 서버를 재시작합니다. 프록시를 거치지 않고 브라우저가 백엔드를 직접 호출하므로 CORS 설정 전후를 확인할 수 있습니다.

```sh
npm run typecheck
npm run build
```

## 사용자가 직접 캡처할 화면

`/members` 화면에서 다음 버튼을 눌러 확인합니다. 각 결과의 **요청·응답 자세히 보기**를 펼치면 실제 GET URL·HTTP 상태·JSON을 함께 캡처할 수 있습니다. 이 목록의 스크린샷은 사용자가 직접 촬영하여 워크북에 첨부합니다.

1. 닉네임 `수현`으로 중복 확인 → 이미 사용 중, `available: false`.
2. 닉네임 `푸딩테스트`로 중복 확인 → 사용 가능, `available: true`.
3. 이메일 `noco@umc.com`으로 중복 확인 → 이미 사용 중, `available: false`.
4. 이메일 `puding-test@example.com`으로 중복 확인 → 사용 가능, `available: true`.
5. 회원 번호 `1`로 평점 불러오기 → 영화 155, 550 순서의 평점 2개. 응답은 `ratingId` 내림차순입니다.
6. 회원 번호 `999`로 조회 → 존재하지 않는 회원, HTTP 404.
7. CORS를 끈 서버에서 버튼 클릭 → 응답을 읽을 수 없다는 안내. 개발자 도구 Console의 CORS 오류와 Network의 요청 URL도 함께 캡처합니다. CORS를 켜고 다시 실행한 후 같은 화면에서 정상 응답을 캡처합니다.

브라우저의 입력 검증 때문에 닉네임 2~12자·이메일 형식·양의 정수 회원 번호를 만족해야 요청이 전송됩니다. 서버 자체의 400 응답 검증은 Postman으로 별도 수행할 수 있습니다. 입력값은 `encodeURIComponent`로 경로에 넣으며 한글이나 이메일을 큰따옴표로 감싸지 않습니다.

## 주요 파일

- `src/api/member-api.ts`: API 기본 주소, 직접 fetch 요청, HTTP/JSON/연결 오류 처리.
- `src/pages/members/member-page.tsx`: 닉네임·이메일 확인 폼, 회원 평점 목록, 요청·응답 상세.
- `src/routes/members.tsx`: `/members` 라우트.
- `src/components/layout/header.tsx`: 내 정보·회원가입 준비 화면 이동.
- `vite.config.ts`: localhost:5173 실습을 위한 고정 포트 설정.

실제 회원가입·로그인·평점 등록/수정/삭제는 이번 주차에 구현하지 않습니다. 회원 번호를 직접 입력해 시드 데이터의 평점을 조회합니다. 기존 영화 화면의 로컬 ID와 백엔드의 TMDB `movieId`는 서로 다르므로 평점 영화는 TMDB ID로 표시합니다.

2026-10-28 기존 4주차와 동일한 의존성을 재사용하여 `npm run build`의 TypeScript 검사와 Vite 프로덕션 빌드가 통과했습니다. 브라우저 연동 결과는 워크북 미션 기록에서 확인합니다.
