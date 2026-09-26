# 1주차 — TypeScript 회원 관리 프로그램

필수 미션과 선택 미션 3개의 코드 및 실행 기록이다.

## 실행

Node.js 22 이상과 pnpm이 필요하다. 검증 환경은 Node.js 22.19.0, pnpm 11.19.0, TypeScript 7.0.2다.

```sh
cd /Users/moongawon/MY_Work/Puding/Week01/typescript
pnpm install --frozen-lockfile
pnpm exec tsc --noEmit
pnpm exec tsc
node dist/index.js
node dist/optional.js
```

설치 이후에는 `pnpm check`로 타입 검사, 컴파일, 필수·선택 미션 실행을 한 번에 진행할 수 있다.

## 파일

- [src/index.ts](src/index.ts): 회원 타입, 회원 조회, 역할 안내, ID 1·2·999 실행.
- [src/optional.ts](src/optional.ts): type과 interface 호환, 0의 기본값 비교, unknown ID 처리.
- [mission-record.md](mission-record.md): 핵심 코드, 개념 설명, 최종 확인 결과.
- [results/execution.txt](results/execution.txt): 실제 실행 결과.

회원 정보는 메모리에 저장한 학습용 예제이며, 프로그램을 다시 실행하면 초기 예제 데이터로 시작한다.
