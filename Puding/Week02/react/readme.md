# UMCine — 2주차 React 미션

Figma의 영화 목록 화면을 React + TypeScript + CSS로 구현했다. 필수 미션과 반응형·페이지 선택의 선택 미션 2개를 포함한다.

## 실행

검증 환경: Node.js 22.19.0, pnpm 11.25.0.

```sh
cd /Users/moongawon/MY_Work/Puding/Week02/react
pnpm install --frozen-lockfile
pnpm dev
```

개발 서버 주소는 터미널에 출력된다. 배포용 파일 생성과 확인:

```sh
pnpm build
pnpm preview --port 5173 --strictPort
```

별도 타입 검사: `pnpm typecheck`.

## 사용

- 영화 포스터 오른쪽 위 북마크를 클릭하면 해당 영화만 추가/해제된다.
- 키보드 Tab으로 이동하고 Space 또는 Enter로 토글할 수 있다.
- 페이지 1~5 중 하나를 클릭하면 해당 번호만 활성화된다.
- 화면 너비에 따라 5 → 3 → 2 → 1열로 배치된다.

검색·로그인·내 정보는 정적 헤더 표시다. 페이지 버튼은 선택 상태만 바꾸며 같은 더미 영화 10편을 유지한다. 새로고침하면 북마크와 페이지 상태가 초기화된다.

## 결과

- [미션 기록](mission-record.md)
- [브라우저 검증 로그](results/browser-checks.json)
- [모바일 화면](results/mobile.jpg)
- [데스크톱 일부 화면](results/desktop-detail.jpg)
- [빌드 로그](results/build.txt)

이미지·아이콘은 워크북에서 제공한 파일명과 내용을 보존했다. 3주차에 사용할 배경 이미지와 상세 영화 메타데이터도 포함되어 있다. 출처는 [SOURCES.md](public/images/SOURCES.md)에 있다.
