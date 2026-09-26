import type { MemberRole, StudyMember } from "./index.js";

// 선택 1: interface StudyMember와 같은 모양을 type으로 표현해요.
export type StudyMemberAlias = {
  id: number;
  name: string;
  role: MemberRole;
  githubId?: string;
};

const aliasMember: StudyMemberAlias = { id: 3, name: "현우", role: "member" };
const interfaceMember: StudyMember = aliasMember;
const memberAgain: StudyMemberAlias = interfaceMember;
console.log("type ↔ interface:", memberAgain.name);

// 선택 2: 0은 falsy지만 null 또는 undefined는 아니에요.
const studyHour: number | undefined = 0;
console.log("studyHour || 1:", studyHour || 1);
console.log("studyHour ?? 1:", studyHour ?? 1);

// 선택 3: unknown을 typeof로 좁힌 뒤 해당 타입의 기능을 사용해요.
export function formatMemberId(input: unknown) {
  if (typeof input === "number") {
    return Number.isFinite(input)
      ? `숫자 ID: ${input}`
      : "유효하지 않은 숫자 ID예요.";
  }

  if (typeof input === "string") {
    const memberId = input.trim();
    return memberId.length > 0
      ? `문자열 ID: ${memberId.toUpperCase()}`
      : "비어 있는 문자열 ID예요.";
  }

  return "지원하지 않는 ID 형식이에요.";
}

for (const input of [1, " member-02 ", true, null, undefined, {}, 0, "", NaN]) {
  console.log(`formatMemberId(${String(input)}): ${formatMemberId(input)}`);
}
