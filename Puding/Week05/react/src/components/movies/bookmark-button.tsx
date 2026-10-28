import { useBookmarkStore } from "../../stores/bookmark-store";
import type { Movie } from "../../types/movie";
import { cn } from "../../utils/cn";

interface BookmarkButtonProps {
  movie: Pick<Movie, "id" | "title">;
  variant?: "card" | "default" | "detail";
  className?: string;
}

export function BookmarkButton({ movie, variant = "default", className }: BookmarkButtonProps) {
  const isBookmarked = useBookmarkStore((state) => state.bookmarkedIds.includes(movie.id));
  const toggleBookmark = useBookmarkStore((state) => state.toggleBookmark);
  const label = isBookmarked ? "북마크 해제" : "북마크 추가";
  const isCard = variant === "card";

  return (
    <button
      type="button"
      className={cn(
        "inline-flex shrink-0 items-center justify-center gap-2 rounded-md border font-semibold transition-colors focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]",
        isCard
          ? "absolute right-2.5 top-2.5 h-10 w-10 border-white/70 text-white min-[480px]:h-[34px] min-[480px]:w-[34px]"
          : "min-h-10 px-4 py-2 text-sm",
        isBookmarked
          ? "border-[#3861e9] bg-[#3861e9] text-white hover:bg-[#2047cd]"
          : isCard
            ? "bg-[#1c1e24]/75 hover:bg-[#202a43]"
            : variant === "detail"
              ? "border-white/50 bg-white/10 text-white hover:bg-white/20 focus-visible:outline-white"
              : "border-[#d5d9e2] bg-white text-[#3861e9] hover:bg-[#edf1ff]",
        className,
      )}
      aria-label={`${movie.title} ${label}`}
      aria-pressed={isBookmarked}
      onClick={() => toggleBookmark(movie.id)}
    >
      <img
        className={cn("h-5 w-5", isCard && "h-6 w-6", (isBookmarked || isCard || variant === "detail") && "brightness-0 invert")}
        src={isBookmarked ? "/icons/bookmark.svg" : "/icons/bookmark-outline.svg"}
        alt=""
      />
      {!isCard && <span>{label}</span>}
    </button>
  );
}
