export function Header() {
  return (
    <header className="site-header">
      <div className="header-inner">
        <a className="brand" href="#movies" aria-label="UMCine 영화 목록">
          <img className="brand-icon" src="/icons/movie.svg" alt="" />
          <span>UMCine</span>
        </a>
        <nav className="header-nav" aria-label="주 메뉴">
          <span className="nav-link-active" aria-current="page">
            영화
          </span>
          <span>검색</span>
          <span>내 정보</span>
        </nav>
        <div className="header-actions">
          <span className="search-icon">
            <img src="/icons/search.svg" alt="" />
          </span>
          <span className="login-label">로그인</span>
        </div>
      </div>
    </header>
  );
}
