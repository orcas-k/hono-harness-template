import { jwtVerify, SignJWT } from "jose";
import { v4 as uuidv4 } from "uuid";
import env from "@/env";
import { isJtiRevoked, revokeJti } from "./redis-utils";

export type JwtPayload = {
  jti: string;
  exp: number;
  sub: string;
  accountType: "LOCAL" | "LDAP";
};

/**
 * This function generates an access token with a unique JTI and expiration time.
 * / 生成带有唯一 JTI 和过期时间的访问令牌。
 * @param payload The payload for the access token, excluding the JTI
 * @returns An object containing the generated token and its JTI
 */
export async function generateAccessToken(payload: Omit<JwtPayload, "jti" | "exp">) {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const jti = uuidv4();
  const token = await new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(env.JWT_ACCESS_EXPIRES_IN)
    .sign(secret);
  return { token, jti };
}

/**
 * This function generates a refresh token with a unique JTI and expiration time.
 * / 生成带有唯一 JTI 和过期时间的刷新令牌。
 * @param payload The payload for the refresh token, excluding the JTI
 * @returns An object containing the generated token, its JTI, and expiration time
 */
export async function generateRefreshToken(payload: Omit<JwtPayload, "jti" | "exp">) {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  const jti = uuidv4();
  const token = await new SignJWT({ ...payload, jti })
    .setProtectedHeader({ alg: "HS256" })
    .setJti(jti)
    .setIssuedAt()
    .setExpirationTime(env.JWT_REFRESH_EXPIRES_IN)
    .sign(secret);
  const decoded = await jwtVerify(token, secret);
  const exp = Number(decoded.payload.exp);
  return { token, jti, exp };
}
/**
 * This function verifies the given access token and returns its payload.
 *  / 验证给定的访问令牌并返回其负载。
 * @param token The access token to be verified
 * @returns The payload of the verified access token
 */
export async function verifyAccessToken(token: string) {
  const secret = new TextEncoder().encode(env.JWT_ACCESS_SECRET);
  const decoded = await jwtVerify(token, secret, { clockTolerance: 15 });
  return decoded.payload as JwtPayload;
}

/**
 * This function verifies the given refresh token and returns its payload.
 * / 验证给定的刷新令牌并返回其负载。
 * @param token The refresh token to be verified
 * @returns The payload of the verified refresh token
 */
export async function verifyRefreshToken(token: string) {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  const decoded = await jwtVerify(token, secret, { clockTolerance: 15 });
  const payload = decoded.payload as JwtPayload;

  const revoked = await isJtiRevoked(payload.jti);
  if (revoked) {
    throw new Error("Refresh token has been revoked (logout)");
  }
  return payload;
}

/**
 * This function revokes the given refresh token by adding its JTI to the revocation list with a TTL based on its expiration time.
 * / 吊销给定的刷新令牌，通过将其 JTI 添加到吊销列表中，并根据其过期时间设置 TTL。
 * @param token The refresh token to be revoked
 */
export async function revokeRefreshToken(token: string) {
  const secret = new TextEncoder().encode(env.JWT_REFRESH_SECRET);
  const decoded = await jwtVerify(token, secret, { clockTolerance: 15 });
  const payload = decoded.payload as JwtPayload;
  const jti = payload.jti;
  const exp = Number(payload.exp);
  const now = Math.floor(Date.now() / 1000);
  const ttl = Math.max(0, exp - now);
  await revokeJti(jti, ttl);
}
