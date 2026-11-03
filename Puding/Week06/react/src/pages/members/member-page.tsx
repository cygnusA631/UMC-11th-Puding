import { useState } from "react";
import type { FormEvent } from "react";
import { useApiRequest } from "../../api/member-api";
import type { ApiResult, AvailabilityResponse, RatingResponse } from "../../api/member-api";

const inputStyle = "h-12 min-w-0 w-full rounded-lg border border-[#dce0e8] bg-white px-4 text-sm focus:border-[#3861e9] focus:outline-2 focus:outline-[#c9d6ff]";
const buttonStyle = "inline-flex h-12 shrink-0 items-center justify-center rounded-lg bg-[#3861e9] px-5 text-sm font-bold text-white transition hover:bg-[#284ed0] focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-[#153cc5] disabled:cursor-wait disabled:opacity-60";

function RequestDetails<T>({ result }: { result: ApiResult<T> | null }) {
  if (!result) return null;
  return (
    <details className="mt-5 rounded-lg border border-[#e2e6ef] bg-[#f8f9fc] px-4 py-3 text-xs">
      <summary className="cursor-pointer font-semibold text-[#60697a]">요청·응답 자세히 보기</summary>
      <div className="mt-3 space-y-2">
        <p className="break-all font-mono text-[#394358]">GET {result.url}</p>
        <p className={result.ok ? "font-semibold text-[#1c7548]" : "font-semibold text-[#b93434]"}>
          {result.status === null ? "응답을 읽을 수 없음 · 서버 연결/CORS 확인" : `HTTP ${result.status}`}
        </p>
        <pre className="max-h-72 overflow-auto whitespace-pre-wrap break-all rounded-md bg-[#172239] p-3 text-[#e4ecff]">{JSON.stringify(result.body, null, 2)}</pre>
      </div>
    </details>
  );
}

function AvailabilityField({ kind }: { kind: "nickname" | "email" }) {
  const isNickname = kind === "nickname";
  const label = isNickname ? "닉네임" : "이메일";
  const [value, setValue] = useState(isNickname ? "수현" : "noco@umc.com");
  const { loading, result, request } = useApiRequest<AvailabilityResponse>();
  const [checkedValue, setCheckedValue] = useState("");

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const submittedValue = value.trim();
    setCheckedValue(submittedValue);
    void request(`/members/${kind}/${encodeURIComponent(submittedValue)}`);
  }

  return (
    <div>
      <form onSubmit={submit}>
        <label className="mb-2 block text-sm font-semibold" htmlFor={kind}>{label}</label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <input id={kind} className={inputStyle} value={value} onChange={(event) => setValue(event.target.value)} type={isNickname ? "text" : "email"} required minLength={isNickname ? 2 : undefined} maxLength={isNickname ? 12 : 254} autoComplete={isNickname ? "nickname" : "email"} />
          <button className={buttonStyle} disabled={loading} type="submit">{loading ? "확인 중…" : `${label} 중복 확인`}</button>
        </div>
        <p className="mt-2 text-xs text-[#7c8493]">{isNickname ? "닉네임은 2~12자로 입력해 주세요." : "가입할 이메일 주소를 입력해 주세요."}</p>
      </form>
      <div aria-live="polite" className="mt-3">
        {result?.data && <p className={`rounded-lg px-4 py-3 text-sm ${result.data.available ? "bg-[#eaf7f0] text-[#247349]" : "bg-[#fff3e5] text-[#936024]"}`}>“{checkedValue}”{result.data.available ? ` · 사용할 수 있는 ${label}이에요.` : ` · 이미 사용 중인 ${label}이에요.`}</p>}
        {result?.error && <p role="alert" className="rounded-lg bg-[#fff0f0] px-4 py-3 text-sm text-[#b93434]">{result.error}</p>}
      </div>
      <RequestDetails result={result} />
    </div>
  );
}

function RatingList() {
  const [memberId, setMemberId] = useState("1");
  const [checkedMemberId, setCheckedMemberId] = useState("");
  const { loading, result, request } = useApiRequest<RatingResponse[]>();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCheckedMemberId(memberId);
    void request(`/members/${encodeURIComponent(memberId)}/ratings`);
  }

  return (
    <section className="rounded-2xl border border-[#e2e6ed] bg-white p-6 sm:p-8" aria-labelledby="ratings-heading">
      <div className="mb-6 flex items-start gap-3">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#fff6dc]"><img className="h-6 w-6" src="/icons/star.svg" alt="" /></div>
        <div><h2 id="ratings-heading" className="text-xl font-bold">내 평점</h2><p className="mt-1 text-sm text-[#747c8a]">영화에 남긴 평점과 코멘트를 최신순으로 확인해요.</p></div>
      </div>
      <form onSubmit={submit}>
        <label htmlFor="member-id" className="mb-2 block text-sm font-semibold">회원 번호</label>
        <div className="flex gap-2"><input id="member-id" type="number" min="1" step="1" required className={inputStyle} value={memberId} onChange={(event) => setMemberId(event.target.value)} /><button type="submit" className={buttonStyle} disabled={loading}>{loading ? "불러오는 중…" : "평점 불러오기"}</button></div>
      </form>
      <div className="mt-5 space-y-3" aria-live="polite">
        {result?.error && <p role="alert" className="rounded-lg bg-[#fff0f0] px-4 py-3 text-sm text-[#b93434]">{result.status === 404 ? "해당 회원을 찾을 수 없어요. 회원 번호를 확인해 주세요." : result.error}</p>}
        {result?.data && <p className="text-sm text-[#677185]">회원 {checkedMemberId} · 평점 <span className="font-bold text-[#3861e9]">{result.data.length}</span>개</p>}
        {result?.data?.length === 0 && <p className="rounded-xl bg-[#f6f7fa] px-5 py-8 text-center text-sm text-[#778093]">아직 남긴 평점이 없어요.</p>}
        {result?.data?.map((rating) => (
          <article key={rating.ratingId} className="rounded-xl border border-[#e5e8f0] p-4">
            <div className="flex items-center justify-between gap-3"><h3 className="font-bold">영화 #{rating.movieId}</h3><span aria-label={`5점 만점에 ${rating.score}점`} className="whitespace-nowrap text-[#c78a15]">{"★".repeat(rating.score)}{"☆".repeat(5 - rating.score)} <span className="text-sm font-semibold">{rating.score}/5</span></span></div>
            <p className="mt-3 text-sm leading-relaxed text-[#525c6e]">{rating.comment || "코멘트가 없어요."}</p>
            <p className="mt-3 text-xs text-[#9299a5]">등록 {rating.createdAt.replace("T", " ")} · 평점 #{rating.ratingId}</p>
          </article>
        ))}
      </div>
      <RequestDetails result={result} />
    </section>
  );
}

export function MemberPage() {
  return (
    <main className="mx-auto w-full max-w-[1440px] flex-1 px-5 pt-8 pb-16 min-[768px]:px-10 min-[1200px]:px-20">
      <div className="mb-8"><p className="mb-2 text-xs font-bold tracking-[2px] text-[#3861e9]">MY UMCINE</p><h1 className="text-[30px] font-bold tracking-tight">내 정보</h1><p className="mt-3 text-sm text-[#747c8a]">새로운 영화 취향을 발견하기 전에, 나만의 프로필을 준비해요.</p></div>
      <div className="grid items-start gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-[#e2e6ed] bg-white p-6 sm:p-8" aria-labelledby="profile-heading">
          <div className="mb-7 flex items-start gap-3"><div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#edf2ff]"><img className="h-6 w-6" src="/icons/person.svg" alt="" /></div><div><h2 id="profile-heading" className="text-xl font-bold">회원가입 준비</h2><p className="mt-1 text-sm text-[#747c8a]">사용할 닉네임과 이메일의 중복을 확인해요.</p></div></div>
          <div className="space-y-7"><AvailabilityField kind="nickname" /><AvailabilityField kind="email" /></div>
          <p className="mt-7 border-t border-[#edf0f5] pt-5 text-xs leading-relaxed text-[#8991a0]">현재는 중복 확인과 회원별 평점 조회를 제공해요. 회원가입과 로그인은 다음 단계에서 연결할 예정이에요.</p>
        </section>
        <RatingList />
      </div>
    </main>
  );
}
