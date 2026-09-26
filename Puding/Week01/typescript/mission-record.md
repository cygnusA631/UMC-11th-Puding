# 1주차 TypeScript 미션 기록

원문: https://app.notion.com/p/1-TypeScript-3535056fdfa983cba9cc81bfa8a16175

검증일: 2026-09-22. 예제의 회원 이름과 GitHub 아이디는 학습용 데이터다.

## 필수 미션

`StudyMember`에 ID, 이름, 역할, 선택적인 GitHub 아이디를 정의했다. `MemberRole`은 `"leader" | "member"`로 제한하고 두 역할의 회원을 각각 작성했다. `findMemberById`의 반환 타입은 `StudyMember | undefined`로 추론되므로, 조회 실패 여부를 먼저 확인한 다음 프로퍼티에 접근한다. GitHub 아이디가 없으면 `??`로 기본 안내 문구를 사용한다.

### 핵심 코드 — src/index.ts

```typescript
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
```

### 최종 확인

- `strict: true`와 `noEmitOnError: true`를 설정했다.
- `pnpm exec tsc --noEmit`: 성공, 타입 오류 없음.
- `pnpm exec tsc`: 성공, JavaScript 컴파일 완료.
- `node dist/index.js`: 성공, ID 1·2·999를 아래 순서대로 확인했다.

```text
광수님, 스터디를 이끌어요. GitHub: gwangsoo
지수님, 스터디에 참여해요. GitHub: 등록하지 않았어요.
ID 999: 회원을 찾을 수 없어요.
```

컴파일 타임에는 매개변수와 객체 구조가 알맞은지 검사한다. 컴파일된 JavaScript에서는 타입 정보가 사라지므로, 회원 미존재와 GitHub 누락은 실행 중 조건문과 `??`가 처리한다. `getMemberMessage`는 모든 분기에서 문자열을 반환하므로 반환 타입이 `string`으로 추론된다.

## 선택 미션

### 1. type과 interface 비교 — 세 문장

1. `interface`와 `type` 모두 객체의 프로퍼티와 타입, 선택 프로퍼티를 표현할 수 있으므로 같은 모양의 회원 객체를 서로 대입할 수 있다.
2. `interface`는 `extends`로 확장하고 같은 이름의 선언을 병합할 수 있지만, `type`은 같은 이름으로 다시 선언할 수 없으며 교차 타입(`&`)으로 객체 타입을 조합한다.
3. `type`은 객체뿐 아니라 유니언이나 원시 타입에도 이름을 붙일 수 있고, `interface`는 객체의 구조를 정의하는 데 사용한다.

### 2. 0에 대한 ||와 ?? 비교

`const studyHour: number | undefined = 0`일 때 `studyHour || 1`은 1이고, `studyHour ?? 1`은 0이다. `||`는 0, 빈 문자열, false 등 모든 falsy 값을 기본값으로 바꾸지만, `??`는 null 또는 undefined일 때만 기본값을 사용한다. 공부한 시간이 0시간이라는 의미를 보존하려면 `??`가 적합하다.

### 3. unknown 안전 처리 및 선택 미션 코드 — src/optional.ts

`typeof`로 숫자와 문자열을 구분한 뒤 문자열 메서드를 호출한다. 숫자는 유한한지 확인하고, 공백뿐인 문자열은 별도 안내를 반환한다. 나머지 값도 예외 없이 안내 문자열로 반환하며 `any`, 타입 단언, non-null 단언을 사용하지 않는다.

```typescript
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
```

### 선택 미션 실행 결과

```text
type ↔ interface: 현우
studyHour || 1: 1
studyHour ?? 1: 0
formatMemberId(1): 숫자 ID: 1
formatMemberId( member-02 ): 문자열 ID: MEMBER-02
formatMemberId(true): 지원하지 않는 ID 형식이에요.
formatMemberId(null): 지원하지 않는 ID 형식이에요.
formatMemberId(undefined): 지원하지 않는 ID 형식이에요.
formatMemberId([object Object]): 지원하지 않는 ID 형식이에요.
formatMemberId(0): 숫자 ID: 0
formatMemberId(): 비어 있는 문자열 ID예요.
formatMemberId(NaN): 유효하지 않은 숫자 ID예요.
```

`pnpm exec tsc --noEmit`, `pnpm exec tsc`, `node dist/optional.js`가 모두 종료 코드 0으로 완료됐다. 실행 로그는 `results/execution.txt`에 보관했다.

## 확인 자료

- [TypeScript Handbook: Everyday Types](https://www.typescriptlang.org/docs/handbook/2/everyday-types.html)
- [TypeScript strict 설정](https://www.typescriptlang.org/tsconfig/strict.html)
- [MDN: Nullish coalescing operator](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Nullish_coalescing)
