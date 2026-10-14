# point-payment

Local scenario: a Zeropay member buys Keepay insurance with Zeropay sports vouchers.
Screens and flow are fixed by `~/Downloads/261014 KSPO 튼튼머니 스포츠상품권 결제 - 시나리오.html`.
Package layout and coding style follow the private repo `EPIGEXE/ouhve-cognitive-ai` (read it with `gh api`).

## Layout

| Path | What |
|---|---|
| `apps/keepay` | Keepay server + web, port 5200. Code meant to move into the real Keepay later. |
| `apps/zeropay` | Zeropay stand-in server + web, port 5100. Deleted when the real integration opens. Screens must say 「제로페이 모의」. |
| `packages/contract` | zod schemas and paths for the calls between the two companies. The only shared package. |
| `contracts/v0.md` | Human-readable spec of the same calls. Change it together with `packages/contract`. |

Port 5000 is taken by macOS AirPlay (ControlCenter); do not move Keepay back to it.

## How files are split

1. One folder per domain module: `src/modules/<module>/`.
2. Inside a module, one file per layer:
   `route` registers paths → `controller` validates input, calls the service, replies → `service` holds business rules → `repository` stores only → `type` holds shapes.
   Skip a layer that has nothing to do (no repository for a module that stores nothing, no controller for health).
3. Calls to another system go only through `src/infrastructure/` (Keepay → Zeropay, Keepay → PG). A test double for it lives next to it (`memory.ts`).
4. `packages/` holds only what the two companies agree on. App-internal helpers (session, error table, web attach) are duplicated per app, so deleting one app never breaks the other. Keepay never imports Zeropay app code, tests included.
5. Long-lived business data (members, ledger, orders) lives in a repository. Runtime switches (failure toggles) live in the service or client that owns them.
6. Web: one file per screen under `web/src/pages/` (the join steps are one file per proposal example under `pages/join/`). A piece moves to `web/src/components/` only when two or more screens use it. Every server call goes through `web/src/api.ts`.
7. Split a file when it gains a second responsibility, not when it gets long.

## How a service is written

1. Public methods read as a list of steps. Every check that throws is its own named private function:
   `validateXxx(...)` for a rule, `getXxx(...)` for a lookup that throws when missing.
2. Private functions are function declarations placed after the `return { ... }` of the factory, so a file reads public first, private after.
3. The interface stays in the same file as its factory (`createXxxService`). Split an interface into its own file only when it has two or more implementations (as `ZeropayClient` does: `index.ts` + `memory.ts`).

## How errors are thrown

1. Every error lives in the app's table `src/utils/error-code.ts`: key = error name, `status` = the contract's `code`, `message` = Korean text.
2. Throw only with `new AppError(ErrorCode.XXX)` (optionally `, detail`). Never write an error message inline.
3. The response is `{ code, error, message }`: `code` is the contract category, `error` is the table key. Screens branch on the key (`failure.name`), never on message text.
4. Tests check the error name, not the message.

## How comments are written (Korean)

Write a comment only for one of these:

1. A reason the code cannot show (why a duplicate request returns the first result).
2. An ordering constraint or something that must not be done (no `await` between the balance check and the deduction).
3. A deliberate shortcut: a `ponytail:` comment naming its ceiling and the upgrade path.

Do not write:

- What the code, a function name or a type already says (「로그인 → 세션 시작」, 「견적」, 「회원 확인」).
- A comment before every step.
- JSDoc that repeats parameter names.
- A header that repeats the file's role (route · controller · repository · type · middleware files have none). Only a file that holds rules gets a header, 2–4 lines.
- Outside sources (Stripe, Adyen, RFCs, ministry posts). Design references belong in `contracts/v0.md` and the shared write-up, not in code.

Screen files keep one first line naming the proposal example they implement (예시 1~7) or 「제안서에 없음」, because the scenario document is checked against them.

## Scripts

`pnpm dev` (both servers) · `pnpm check` (tsc, server and web) · `pnpm test` (vitest) · `<app>:dev|check|test` per app.
App test scripts pass `--root .` because `vite.config.ts` sets the Vite root to `web/`.

## Local accounts

Members hong / 1234 and kim / 1234 (payment PIN 123456). Operators admin / admin1234 on both apps.
