import { Link, useLocation } from "@tanstack/react-router";
import { cn } from "../../utils/cn";

export function Header() {
  const pathname = useLocation({ select: (location) => location.pathname });
  const movieRouteIsActive = pathname === "/" || pathname.startsWith("/movies/");
  const searchRouteIsActive = pathname === "/search";
  const memberRouteIsActive = pathname === "/members";

  return (
    <header className="border-b border-[#e2e4e8] bg-white">
      <div className="mx-auto flex min-h-[104px] w-full max-w-[1440px] flex-wrap items-center gap-x-4 gap-y-2 px-5 pt-4 pb-3 min-[480px]:min-h-[76px] min-[480px]:flex-nowrap min-[480px]:gap-x-6 min-[480px]:py-0 min-[768px]:min-h-[90px] min-[768px]:gap-x-11 min-[768px]:px-10 min-[1200px]:px-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-xl font-extrabold tracking-[-0.8px] focus-visible:rounded focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-[#153cc5]"
          aria-label="UMCine 영화 목록"
        >
          <img className="h-8 w-8 rounded-lg border-2 border-current p-1" src="/icons/movie.svg" alt="" />
          <span>UMCine</span>
        </Link>

        <nav className="order-3 flex w-full items-center gap-6 text-[13px] min-[480px]:order-none min-[480px]:w-auto min-[480px]:gap-[18px] min-[480px]:text-sm min-[768px]:gap-7" aria-label="주 메뉴">
          <Link
            to="/"
            aria-current={movieRouteIsActive ? "page" : undefined}
            className={cn(
              "py-2 text-[#555a63] transition-colors hover:text-[#17181c] focus-visible:rounded focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]",
              movieRouteIsActive && "font-bold text-[#17181c] underline decoration-2 underline-offset-4",
            )}
          >
            영화
          </Link>
          <Link
            to="/search"
            aria-current={searchRouteIsActive ? "page" : undefined}
            className={cn(
              "py-2 text-[#555a63] transition-colors hover:text-[#17181c] focus-visible:rounded focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]",
              searchRouteIsActive && "font-bold text-[#17181c] underline decoration-2 underline-offset-4",
            )}
          >
            검색
          </Link>
          <Link
            to="/members"
            aria-current={memberRouteIsActive ? "page" : undefined}
            className={cn(
              "py-2 text-[#555a63] transition-colors hover:text-[#17181c] focus-visible:rounded focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]",
              memberRouteIsActive && "font-bold text-[#17181c] underline decoration-2 underline-offset-4",
            )}
          >
            내 정보
          </Link>
        </nav>

        <div className="ml-auto flex items-center gap-3">
          <Link
            to="/search"
            className="hidden h-10 w-10 items-center justify-center rounded-lg border border-[#eef0f4] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5] min-[768px]:flex"
            aria-label="영화 검색"
          >
            <img className="h-5 w-5" src="/icons/search.svg" alt="" />
          </Link>
          <Link to="/members" className="inline-flex h-[34px] items-center justify-center rounded-md bg-[#3861e9] px-[14px] text-[13px] font-semibold text-white min-[480px]:h-10 min-[480px]:px-[18px]">
            회원가입 준비
          </Link>
        </div>
      </div>
    </header>
  );
}
