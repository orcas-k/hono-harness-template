import { OpenAPIHono } from "@hono/zod-openapi";
import type { Schema } from "hono";
import { bodyLimit } from "hono/body-limit";
import { compress } from "hono/compress";
import { cors } from "hono/cors";
import { requestId } from "hono/request-id";
import { secureHeaders } from "hono/secure-headers";
import { timeout } from "hono/timeout";
import { trimTrailingSlash } from "hono/trailing-slash";
import defaultHook from "@/lib/open-api/default-hook";
import notFound from "@/middlewares/not-found";
import onError from "@/middlewares/on-error";
import { pinoLogger } from "@/middlewares/pino-logger";
import serveEmojiFavicon from "@/middlewares/serve-emoji-favicon";
import * as HttpStatusCodes from "./http-status-codes";
import type { AppBindings, AppOpenAPI } from "./types";

export function createRouter() {
  return new OpenAPIHono<AppBindings>({
    strict: false,
    defaultHook,
  });
}

export default function createApp() {
  const app = createRouter();

  /** 1. Request ID - generated first for full chain tracing / 请求ID - 最先生成，用于全链路追踪 */
  app.use(requestId());
  /** 2. Logging - record early, including intercepted requests / 日志记录 - 尽早记录，包括被拦截的请求 */
  const requestLogger = pinoLogger();

  const SKIP_LOG_PATHS = new Set<string>(["/health"]);
  app.use(async (c, next) => {
    const path = c.req.path;
    if (SKIP_LOG_PATHS.has(path)) return next();
    return requestLogger(c as unknown as Parameters<typeof requestLogger>[0], next);
  });

  /** 3. Security headers / 安全头部 */
  app.use(secureHeaders());

  /** 4. Timeout control - set early to control entire request chain / 超时控制 - 尽早设置，控制整个请求链 */
  app.use(timeout(30000));

  /** 5. Basic features / 基础功能 */
  app.use(trimTrailingSlash());
  app.use(cors());

  /** 6. Request body limit - limit before actual parsing / 请求体限制 - 在实际解析前限制 */
  app.on(
    ["POST", "PUT", "PATCH"],
    "*",
    bodyLimit({
      maxSize: 1 * 1024 * 1024,
      onError: (c) => {
        return c.json({ error: "请求体过大（超过 1MB）" }, HttpStatusCodes.REQUEST_TOO_LONG);
      },
    }),
  );

  /** 7. Compression and static resources / 压缩和静态资源 */
  if (process.env.NODE_ENV === "production") {
    app.use(compress());
  }
  app.use(serveEmojiFavicon("😜"));

  /** 8. Error handling / 错误处理 */
  app.notFound(notFound);
  app.onError(onError);
  return app;
}

export function createTestApp<S extends Schema>(router: AppOpenAPI<S>) {
  return createApp().route("/", router);
}
