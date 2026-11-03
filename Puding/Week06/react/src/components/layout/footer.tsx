export function Footer() {
  return (
    <footer className="mt-auto border-t border-[#e1e4e8] bg-white">
      <div className="mx-auto flex min-h-[58px] w-full max-w-[1440px] items-center justify-center gap-2 px-5 py-4 text-[11px] leading-normal text-[#838892] min-[768px]:px-10 min-[1200px]:px-20 sm:justify-end">
        <img className="w-7 shrink-0" src="/images/logos/tmdb-logo.svg" alt="TMDB" />
        <p>This product uses the TMDB API but is not endorsed or certified by TMDB.</p>
      </div>
    </footer>
  );
}
