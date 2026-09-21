import path from "node:path";
import { config } from "@dotenvx/dotenvx";
import { z } from "zod";

config({
  path: path.resolve(
    process.cwd(),
    process.env.NODE_ENV === "test"
      ? ".env.test"
      : process.env.NODE_ENV === "development"
        ? ".env.local"
        : ".env.example",
  ),
});

const EnvSchema = z.object({
  /** Environment variable / 环境变量 */
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  /** Port / 端口 */
  PORT: z.coerce.number().default(9999),
  /** Log level / 日志级别 */
  LOG_LEVEL: z.enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"]).default("info"),

  /** Database connection string / 数据库连接字符串 */
  DATABASE_URL: z.string().refine((val) => process.env.NODE_ENV !== "production" || val !== "", {
    message: "生产环境下数据库连接字符串不能为空",
  }),
  /** Database connection pool size / 数据库连接池大小 */
  DB_POOL_SIZE: z.coerce.number().int().positive().default(10),

  /** JWT access secret / 接口访问JWT密钥 */
  JWT_ACCESS_SECRET: z.string().min(32, "JWT密钥长度至少32字符,建议使用强随机字符串"),
  /** JWT refresh secret / 刷新JWT密钥 */
  JWT_REFRESH_SECRET: z.string().min(32, "JWT密钥长度至少32字符,建议使用强随机字符串"),
  /** JWT access token expiration time / 接口访问JWT过期时间 */
  JWT_ACCESS_EXPIRES_IN: z.string().default("15m"),
  /** JWT refresh token expiration time / 刷新JWT过期时间 */
  JWT_REFRESH_EXPIRES_IN: z.string().default("7d"),

  /** Cookie secure flag / Cookie安全标志 */
  COOKIE_SECURE: z
    .boolean()
    .default(false)
    .refine((val) => (process.env.NODE_ENV === "production" ? val === true : true), {
      message: "生产环境下Cookie必须为安全模式",
    }),
  /** Cookie same site policy / Cookie同站策略 */
  COOKIE_SAME_SITE: z
    .enum(["strict", "lax", "none"])
    .default("lax")
    .refine((val) => (process.env.NODE_ENV === "production" ? val === "strict" : true), {
      message: "生产环境下Cookie同站策略必须为strict",
    }),
  /** Cookie max age / Cookie最大存活时间 */
  COOKIE_MAX_AGE: z.coerce
    .number()
    .int()
    .positive()
    .default(7 * 24 * 60 * 60), // 7 days in seconds

  /** Redis host / Redis主机 */
  REDIS_HOST: z.string().default("localhost"),
  /** Redis port / Redis端口 */
  REDIS_PORT: z.coerce.number().default(6379),
  /** Redis password / Redis密码 */
  REDIS_PASSWORD: z.string().refine((val) => process.env.NODE_ENV !== "production" || val !== "", {
    message: "生产环境下Redis密码不能为空",
  }),

  /** LDAP server URL / LDAP服务器地址 */
  LDAP_URL: z.url().default("ldap://localhost:389"),
  /** LDAP bind DN / LDAP绑定DN */
  LDAP_BIND_DN: z.string().default("cn=admin,dc=example,dc=org"),
  /** LDAP bind password / LDAP绑定密码 */
  LDAP_BIND_PASSWORD: z.string().default("admin"),
  /** LDAP search base / LDAP搜索基础 */
  LDAP_SEARCH_BASE: z.string().default("dc=example,dc=org"),
  /** LDAP username attribute / LDAP用户名属性 */
  LDAP_USERNAME_ATTRIBUTE: z.string().default("uid"),
  /** LDAP domain / LDAP域 */
  LDAP_DOMAIN: z.string().default("example.org"),

  /** Encryption key / 加密密钥 */
  ENCRYPTION_KEY: z.string().min(32, "加密密钥长度至少32字符,建议使用强随机字符串"),
});

export type env = z.infer<typeof EnvSchema>;

const { data: env, error } = EnvSchema.safeParse(process.env);

if (error) {
  console.error("❌ Invalid env:");
  console.error(JSON.stringify(z.treeifyError(error), null, 2));
  process.exit(1);
}

// biome-ignore lint/style/noNonNullAssertion: process.exit(1) ensures env is not null
export default env!;
