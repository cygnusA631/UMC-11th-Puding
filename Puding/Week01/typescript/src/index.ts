export type MemberRole = "leader" | "member";

export interface StudyMember {
  id: number;
  name: string;
  role: MemberRole;
  githubId?: string;
}

// 학습용 예시 회원: 리더는 GitHub 아이디가 있고, 멤버는 없어요.
export const members: StudyMember[] = [
  { id: 1, name: "광수", role: "leader", githubId: "gwangsoo" },
  { id: 2, name: "지수", role: "member" },
];

// 반환 타입은 StudyMember | undefined로 추론돼요.
export function findMemberById(memberId: number) {
  return members.find((member) => member.id === memberId);
}

export function getRoleMessage(role: MemberRole) {
  if (role === "leader") {
    return "스터디를 이끌어요.";
  }

  return "스터디에 참여해요.";
}

// 모든 분기에서 문자열을 반환하므로 반환 타입은 string으로 추론돼요.
export function getMemberMessage(memberId: number) {
  const member = findMemberById(memberId);

  // find()가 undefined를 반환할 수 있으므로 프로퍼티를 읽기 전에 확인해요.
  if (member === undefined) {
    return `ID ${memberId}: 회원을 찾을 수 없어요.`;
  }

  const github = member.githubId ?? "등록하지 않았어요.";
  return `${member.name}님, ${getRoleMessage(member.role)} GitHub: ${github}`;
}

for (const memberId of [1, 2, 999]) {
  console.log(getMemberMessage(memberId));
}
