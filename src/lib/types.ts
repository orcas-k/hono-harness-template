import type { OpenAPIHono, RouteConfig, RouteHandler } from "@hono/zod-openapi";
import type { Schema } from "hono";
import type { JWTPayload } from "hono/utils/jwt/types";
import type { PinoLogger } from "hono-pino";

// ── Base Variables (shared across all tiers) / 基础变量 ──
export type BaseVariables = {
  /** Logger / 日志记录器 */
  logger: PinoLogger;
  /** Request ID / 请求 ID */
  requestId: string;
};

// ── JWT Payload types / JWT 载荷类型 ──

/** Base JWT payload (shared by all authenticated tiers) / 基础 JWT 载荷（所有认证 tier 共享） */
export type BaseJwtPayload = JWTPayload & {
  /** User ID / 用户 ID */
  sub: string;
  /** Account type / 账户类型 */
  accountType: "LOCAL" | "LDAP";
};

export type BaseBindings = {
  Variables: BaseVariables;
};

export type JwtBindings<TPayload extends BaseJwtPayload = BaseJwtPayload> = {
  Variables: BaseVariables & { jwtPayload: TPayload };
};

export type AppBindings = BaseBindings | JwtBindings;

export type AppOpenAPI<S extends Schema = {}> = OpenAPIHono<AppBindings, S>;

export type AppRouteHandler<R extends RouteConfig> = RouteHandler<R, AppBindings>;
