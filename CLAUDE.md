# CLAUDE.md

## Commands

```bash
pnpm install
pnpm dev
pnpm build
pnpm start
pnpm test
pnpm lint
pnpm format
pnpm db:generate/db:migrate/db:push/db:seed/db:studio  # Database commands
pnpm crypto
pnpm argon2
```

## Stack

Hono + Node.js 25 + PostgreSQL(Drizzle) + Redis(ioredis) + JWT(jose) + LDAP(ldapts) + RBAC + Zod + OpenAPI 3.1.0(Scalar) + Vitest + Biome

## Architecture

**CRUD 模块开发详见 `/crud` skill**

**数据库 Schema 开发详见 `/db-schema` skill**

**OpenSpec 变更实施详见 `/openspec-apply-change` skill**

## Code Tour

Base Hono app is exported from [app.ts](./src/app.ts). It configures OpenAPI and mounts the route groups from [src/routes](./src/routes/). Local development uses [@hono/node-server](https://hono.dev/docs/getting-started/nodejs) in [index.ts](./src/index.ts).

Typed environment variables are defined and validated in [env.ts](./src/env.ts). Add required configuration there; the application exits when validation fails. Local development loads `.env.local`, tests load `.env.test`, and other environments load `.env.example`.

Use [src/routes/users](./src/routes/users/) as the CRUD OpenAPI group example and [src/routes/auth](./src/routes/auth/) as the authentication example.

- Application middleware and error handling are assembled in [create-app.ts](./src/lib/create-app.ts).
- The route index is defined in [index.route.ts](./src/routes/index.route.ts), authentication is assembled in [auth.index.ts](./src/routes/auth/auth.index.ts), and users CRUD is assembled in [users.index.ts](./src/routes/users/users.index.ts).
- Route definitions live in each group's `*.routes.ts`; request handlers live in each group's `*.handlers.ts`.
- Shared OpenAPI helpers and schemas live under [src/lib/open-api](./src/lib/open-api/); shared middleware lives under [src/middlewares](./src/middlewares/).
- Database access is initialized in [db/index.ts](./src/db/index.ts). Drizzle schema and relations are under [src/db/schema](./src/db/schema/), with system tables exported by [system/index.ts](./src/db/schema/system/index.ts).
- Group tests live under each route group's `__tests__/` directory, currently [users.test.ts](./src/routes/users/__tests__/users.test.ts).

## Endpoints

| Path               | Description              |
| ------------------ | ------------------------ |
| GET /              | API index                |
| GET /doc           | Open API Specification   |
| GET /reference     | Scalar API Documentation |
| POST /auth/login   | Log in and issue tokens  |
| POST /auth/refresh | Refresh an access token  |
| POST /auth/logout  | Logout                   |
| GET /users         | List all users           |
| POST /users        | Create a user            |
| GET /users/{id}    | Get one user by id       |
| PATCH /users/{id}  | Patch one user by id     |
| DELETE /users/{id} | Delete one user by id    |

## Other Rules

- Status codes: `HttpStatusCodes` constants
- Dates: `date-fns` library
- Timestamps: `timestamp({ mode: "string", precision: 0 })`（秒级精度，匹配 `yyyy-MM-dd HH:mm:ss` 写入格式）
- 时区：DB 写入时间一律用 `format(new Date(), "yyyy-MM-dd HH:mm:ss")`（date-fns，跟随系统时区，服务器默认 +8）；**禁止用 `new Date().toISOString()` 写 DB**（永远 UTC，会差 8 小时）。API 响应里给前端的时间戳不受此限制
- UUID params: `IdUUIDParamsSchema`
- Naming: PascalCase (classes/types), UPPER_SNAKE_CASE (enum values), kebab-case (files)
- Folder grouping: When multiple files of same type exist (e.g., `*.helpers.ts`), create a folder (e.g., `helpers/`)
- Queries: Use enums `eq(table.status, Status.ENABLED)` not magic values
- Helpers: Route-level (`{feature}.helpers.ts`) for complex business logic or reuse within module; simple DB operations stay inline in handlers; global (`src/services/`) for cross-tier shared logic
- Types: Prefer inferring from Zod schemas (`z.infer<typeof schema>`) over manual definitions
- Simple guard clauses: `if (!x) return null;` 单行无花括号（适用于 return 单个值、单个变量、单个函数调用等简短表达式，如 `return fallbackPath;`、`return Promise.resolve();`）

## Dev Workflow

1. Write code (schema, routes, handlers, types)
2. Run `pnpm lint` and `pnpm format` for static checks and formatting
3. Write unit tests (ref: `src/routes/users/__tests__/`)
4. Run `pnpm test` and `pnpm build`
5. Commit (no manual API testing needed)

**DB Schema Changes**: modify schema → `pnpm run db:push` (dev) → `pnpm run db:generate` (migration)

## Workflow Orchestration

### Plan-First Default
- Non-trivial tasks (3+ steps or architectural decisions) must enter plan mode
- If deviating from plan, stop immediately and re-plan — never push through
- Use plan mode for verification steps too, not just building
- Write detailed specs upfront to reduce ambiguity

### Sub-Agent Strategy
- Use sub-agents liberally to keep the main context window clean
- Offload research, exploration, and parallel analysis to sub-agents
- For complex problems, throw more compute at it via sub-agents
- Each sub-agent handles one focused task only

### Self-Improvement Loop
- After every user correction: record the pattern in `tasks/lessons.md`
- Write rules to prevent the same class of mistakes
- Iterate on these lessons until error rate drops
- Review relevant project lessons at the start of each session

### Pre-Completion Verification
- Never mark a task as done until proven working
- Compare behavior against main branch when relevant
- Ask: "Would a senior engineer approve this?"
- Run tests, check logs, prove correctness

### Pursue Elegance (Moderately)
- For non-trivial changes: pause and ask "Is there a more elegant way?"
- If a fix feels hacky: "With everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before committing

### Autonomous Bug Fixing
- On bug reports: go fix it directly, don't wait for hand-holding
- Read logs, errors, failing tests — then resolve them
- No context-switching required from the user
- Fix failing CI tests on your own without being told how

## Task Management

- **Plan first**: Write plan to `tasks/todo.md` with checkable items
- **Validate plan**: Confirm before starting implementation
- **Track progress**: Mark completed items as done in real time
- **Explain changes**: Provide high-level summary for each step
- **Record results**: Add retrospective section to `tasks/todo.md`
- **Capture lessons**: Update `tasks/lessons.md` after every correction

## Core Principles

- **Simplicity first**: Make every change as simple as possible, touching minimal code
- **No shortcuts**: Find root causes, no temporary fixes, hold to senior developer standards
- **Minimal blast radius**: Only touch what's necessary, avoid introducing new bugs


## References

- [What is Open API?](https://swagger.io/docs/specification/v3_0/about/)
- [Hono](https://hono.dev/)
  - [Zod OpenAPI Example](https://hono.dev/examples/zod-openapi)
  - [Testing](https://hono.dev/docs/guides/testing)
  - [Testing Helper](https://hono.dev/docs/helpers/testing)
- [@hono/zod-openapi](https://github.com/honojs/middleware/tree/main/packages/zod-openapi)
- [Scalar Documentation](https://github.com/scalar/scalar/tree/main/?tab=readme-ov-file#documentation)
  - [Themes / Layout](https://github.com/scalar/scalar/blob/main/documentation/themes.md)
  - [Configuration](https://github.com/scalar/scalar/blob/main/documentation/configuration.md)