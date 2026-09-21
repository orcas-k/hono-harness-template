import Redis from "ioredis";
import env from "@/env";
import { decryptIfNeeded } from "./crypto";

const redis = new Redis({
  host: env.REDIS_HOST,
  port: env.REDIS_PORT,
  password: decryptIfNeeded(env.REDIS_PASSWORD),
});

const REVOKE_PREFIX = "revoked:jti:";
/**
 * Revoke a JWT ID by storing it in Redis with a time-to-live / 通过在Redis中存储带有生存时间的JWT ID来撤销它
 * @param jti The JWT ID to revoke / 要撤销的JWT ID
 * @param ttlSeconds The time-to-live in seconds for the revoked JTI / 被撤销的JWT ID的生存时间（秒）
 */
export async function revokeJti(jti: string, ttlSeconds: number) {
  await redis.set(`${REVOKE_PREFIX}${jti}`, "revoked", "EX", ttlSeconds);
}
/**
 * Check if a JWT ID is revoked by looking it up in Redis / 通过在Redis中查找来检查JWT ID是否被撤销
 * @param jti The JWT ID to check / 要检查的JWT ID
 * @returns True if the JWT ID is revoked, false otherwise / 如果JWT ID被撤销则返回true，否则返回false
 */
export async function isJtiRevoked(jti: string) {
  const result = await redis.get(`${REVOKE_PREFIX}${jti}`);
  return result === "revoked";
}

export default redis;
