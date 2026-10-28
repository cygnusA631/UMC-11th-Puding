import { cn } from "../../utils/cn";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ currentPage, totalPages, onPageChange }: PaginationProps) {
  return (
    <nav className="mt-[52px] flex items-center justify-center gap-1.5" aria-label="영화 목록 페이지">
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-md text-[#777d87] hover:bg-[#e9edf6] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]"
        aria-label="이전 페이지"
        disabled={currentPage === 1}
        onClick={() => onPageChange(currentPage - 1)}
      >
        <img className="h-5 w-5" src="/icons/chevron-left.svg" alt="" />
      </button>
      {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
        <button
          key={page}
          type="button"
          className={cn(
            "grid h-9 w-9 place-items-center rounded-md text-sm text-[#777d87] hover:bg-[#e9edf6] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]",
            page === currentPage && "bg-[#3861e9] font-bold text-white hover:bg-[#2047cd]",
          )}
          aria-label={`${page}페이지`}
          aria-current={page === currentPage ? "page" : undefined}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}
      <button
        type="button"
        className="grid h-9 w-9 place-items-center rounded-md text-[#777d87] hover:bg-[#e9edf6] disabled:cursor-default disabled:opacity-35 disabled:hover:bg-transparent focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]"
        aria-label="다음 페이지"
        disabled={currentPage === totalPages}
        onClick={() => onPageChange(currentPage + 1)}
      >
        <img className="h-5 w-5" src="/icons/chevron-right.svg" alt="" />
      </button>
    </nav>
  );
}
