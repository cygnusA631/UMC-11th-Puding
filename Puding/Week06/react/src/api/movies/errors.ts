export class TmdbHttpError extends Error {
  readonly status: number;

  constructor(status: number) {
    super(`영화 목록 요청에 실패했어요: ${status}`);
    this.name = "TmdbHttpError";
    this.status = status;
  }
}

export function validatePage(page: number) {
  if (!Number.isInteger(page) || page < 1 || page > 500) {
    throw new RangeError("페이지 번호는 1~500 사이의 정수여야 해요.");
  }
}
