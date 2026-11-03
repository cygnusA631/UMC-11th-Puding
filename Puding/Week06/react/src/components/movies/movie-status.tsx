interface MovieStatusProps {
  message: string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
}

export function MovieStatus({ message, loading = false, error = false, onRetry }: MovieStatusProps) {
  return (
    <div role={error ? "alert" : "status"} aria-live="polite" aria-busy={loading} className="rounded-xl border border-[#e1e4e8] bg-white px-6 py-10 text-center text-[#72767e]">
      <p>{message}</p>
      {onRetry && <button type="button" onClick={onRetry} className="mt-5 rounded-lg bg-[#3861e9] px-5 py-3 text-sm font-semibold text-white hover:bg-[#2047cd] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5]">다시 시도</button>}
    </div>
  );
}
