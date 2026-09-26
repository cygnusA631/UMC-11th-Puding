# 2주차 React — UMCine 미션 기록

- 원문: https://app.notion.com/p/2-React-UI-a535056fdfa9832b8d2081740a9a5c07
- 디자인: https://www.figma.com/design/erFuXxEy5svB8Be5gjIqdu/?node-id=129-2
- 검증일: 2026-09-23
- 환경: Node.js 22.19.0 / pnpm 11.25.0 / React 19.3.0 / Vite 8.3.0 / TypeScript 7.0.2

## 필수 미션

Notion MCP로 미션 요구와 제공된 Movie 타입, 영화 10편의 데이터를 확인했다. 제공 ZIP의 이미지·출처 파일 22개와 아이콘 14개를 파일명과 내용 그대로 사용했다. 포스터, 영화 제목, 개봉일, 북마크 버튼을 목록으로 렌더링했다.

Figma의 영화 목록 프레임을 직접 확인하여 흰 헤더, UMCine 로고, 연한 회색 배경, 데스크톱 5열 그리드, 포스터 우측 상단 북마크, TMDB 출처 영역을 반영했다. 영화 순서·날짜·초기 북마크 상태는 워크북의 더미 데이터를 기준으로 유지했다.

### 컴포넌트 구성

- `src/app.tsx`: 영화 목록과 현재 페이지 상태 관리.
- `src/components/header.tsx`: 헤더와 로고.
- `src/components/movie-grid.tsx`: map으로 영화 목록 렌더링, movie.id를 key로 사용.
- `src/components/movie-card.tsx`: 포스터·제목·개봉일 표시, 북마크 변경 요청.
- `src/components/pagination.tsx`: 1~5 페이지 및 이전·다음 버튼.
- `src/types/movie.ts`, `src/data/movies.ts`: 제공 타입·데이터 분리.
- `src/styles.css`: 디자인, 활성 스타일, 반응형 배치.

### 북마크 핵심 코드

```tsx
const [movieList, setMovieList] = useState<Movie[]>(movies);

function handleToggleBookmark(movieId: Movie["id"]) {
  setMovieList((previousMovies) =>
    previousMovies.map((movie) =>
      movie.id === movieId
        ? { ...movie, isBookmarked: !movie.isBookmarked }
        : movie,
    ),
  );
}
```

App이 상태를 소유하고 MovieGrid와 MovieCard에 데이터와 콜백을 전달한다. 자식은 props를 직접 수정하지 않고 영화 ID를 부모에게 전달한다. 부모는 map과 전개 문법으로 선택한 객체만 새로 만들고 다른 영화는 유지한다. 이벤트 시점의 최신 상태를 바탕으로 계산하도록 함수형 업데이터를 사용한다.

```tsx
<button
  type="button"
  className="bookmark-button"
  aria-label={`${movie.title} 북마크`}
  aria-pressed={movie.isBookmarked}
  onClick={() => onToggleBookmark(movie.id)}
>
  <img
    src={movie.isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"}
    alt=""
  />
</button>
```

### 검증 결과

- `pnpm build` 성공: TypeScript strict 검사 및 Vite 프로덕션 빌드 통과.
- 빌드 결과를 `pnpm preview --port 5173 --strictPort`로 실행하여 검증.
- 영화 10편과 화면의 이미지 26개 정상 로딩.
- 영화별 북마크 추가/해제 20회: 선택한 영화만 변경되고 아이콘도 상태에 맞게 변경.
- Space로 해제하고 Enter로 다시 선택하는 키보드 동작 정상.
- 브라우저 Console 오류·경고 0개.
- 원본 ZIP과 비교하여 이미지·아이콘 파일 내용 보존 확인.

## 선택 미션

### 1. 반응형 그리드

```css
.movie-grid { grid-template-columns: repeat(5, minmax(0, 1fr)); }
@media (max-width: 1199px) {
  .movie-grid { grid-template-columns: repeat(3, minmax(0, 1fr)); }
}
@media (max-width: 767px) {
  .movie-grid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
}
@media (max-width: 479px) {
  .movie-grid { grid-template-columns: minmax(0, 1fr); }
}
```

실제 브라우저에서 1440px → 5열, 1000px → 3열, 700px → 2열, 390px → 1열을 확인했다. 모든 너비에서 영화는 10편이며 가로 넘침이 없었다. 모바일에서는 헤더 메뉴를 두 줄로 배치했다.

### 2. 현재 페이지 상태

```tsx
const [currentPage, setCurrentPage] = useState(1);
<Pagination currentPage={currentPage} totalPages={5} onPageChange={setCurrentPage} />
```

1~5 버튼을 모두 클릭했을 때 선택한 번호에만 aria-current="page"와 활성 색상이 적용됐다. 1페이지에서는 이전 버튼, 5페이지에서는 다음 버튼이 비활성화된다. 이전·다음 이동도 검증했다.

## 트러블 슈팅

- 이슈: 활성 페이지 버튼 위에 마우스를 올리면 일반 hover 배경색이 활성 배경색을 덮었다. Console 오류 메시지는 없었다.
- 원인: `.page-button:hover:not(:disabled)`의 CSS 선택자 우선순위가 활성 상태 선택자보다 높았다.
- 해결: `.page-button[aria-current="page"]:hover` 규칙을 추가했다.
- 확인: 재빌드 후 1~5페이지를 다시 클릭하여 활성 hover 배경이 `rgb(32, 71, 205)`로 유지되는 것을 확인했다.
- 배운 점: 상태 스타일은 기본 상태뿐 아니라 hover·focus 조합에서도 확인해야 한다.

## 실행 범위

필수·선택 미션의 영화 목록과 북마크·페이지 선택을 구현했다. 검색·로그인·내 정보는 디자인에 포함된 정적 헤더 표시이며 실제 기능은 없다. 페이지 선택은 활성 번호만 바꾸며 영화 데이터는 동일한 10편을 유지한다. 북마크와 현재 페이지는 새로고침하면 초기화된다. 실제 API 연결 및 서버 저장은 하지 않는다.

## 검증 자료

- `results/browser-checks.json`: 실제 브라우저 상호작용·반응형·콘솔 검사 결과.
- `results/mobile.jpg`: 390px 모바일 화면 캡처.
- `results/desktop-detail.jpg`: 1440px 데스크톱 화면의 일부 캡처.
- `results/build.txt`: 최종 빌드 로그.

## 참고 자료

- [React: Updating Arrays in State](https://react.dev/learn/updating-arrays-in-state)
- [Vite: Getting Started](https://vite.dev/guide/)
- 제공 이미지 출처: `public/images/SOURCES.md`
