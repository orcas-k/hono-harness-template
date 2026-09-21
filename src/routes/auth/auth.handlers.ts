import { and, eq } from "drizzle-orm";
import { deleteCookie, getCookie, setCookie } from "hono/cookie";
import { verify } from "node-argon2";
import db from "@/db";
import { users } from "@/db/schema/system/index";
import env from "@/env";
import * as HttpStatusCodes from "@/lib/http-status-codes";
import { generateAccessToken, generateRefreshToken, revokeRefreshToken, verifyRefreshToken } from "@/lib/jwt-utils";
import { authenticateWithUPN, buildUPN } from "@/lib/ldap-utils";
import type { AppRouteHandler } from "@/lib/types";
import type { LoginRoute, LogoutRoute, RefreshRoute } from "./auth.routes";

export const login: AppRouteHandler<LoginRoute> = async (c) => {
  const { username, password } = await c.req.json();

  const [user] = await db
    .select()
    .from(users)
    .where(and(eq(users.username, username), eq(users.status, "ENABLED")));

  if (!user) {
    return c.json({ message: "用户名或密码错误" }, HttpStatusCodes.UNAUTHORIZED);
  }

  if (!user.isActive) {
    return c.json({ message: "账户未激活" }, HttpStatusCodes.FORBIDDEN);
  }

  if (user.accountType === "LOCAL") {
    if (!user.password) {
      return c.json({ message: "本地账户没有设置密码" }, HttpStatusCodes.UNAUTHORIZED);
    }
    const valid = await verify({ hash: user.password, password });
    if (!valid) {
      return c.json({ message: "用户名或密码错误" }, HttpStatusCodes.UNAUTHORIZED);
    }
  } else {
    const upn = buildUPN(user.username);
    const authenticated = await authenticateWithUPN(upn, password);
    if (!authenticated) {
      return c.json({ message: "用户名或密码错误" }, HttpStatusCodes.UNAUTHORIZED);
    }
  }

  const payload = {
    sub: user.id,
    accountType: user.accountType,
  };

  const { token: accessToken } = await generateAccessToken(payload);
  const { token: refreshToken } = await generateRefreshToken(payload);

  setCookie(c, "refreshToken", refreshToken, {
    httpOnly: true,
    secure: env.COOKIE_SECURE,
    sameSite: env.COOKIE_SAME_SITE,
    maxAge: env.COOKIE_MAX_AGE,
    path: "/",
  });

  return c.json({ accessToken }, HttpStatusCodes.OK);
};

export const refresh: AppRouteHandler<RefreshRoute> = async (c) => {
  const refreshToken = getCookie(c, "refreshToken");
  if (!refreshToken) {
    return c.json({ message: "刷新令牌缺失" }, HttpStatusCodes.UNAUTHORIZED);
  }

  try {
    const oldPayload = await verifyRefreshToken(refreshToken);

    await revokeRefreshToken(refreshToken);

    const payload = {
      sub: oldPayload.sub,
      accountType: oldPayload.accountType,
    };

    const { token: accessToken } = await generateAccessToken(payload);
    const { token: newRefreshToken } = await generateRefreshToken(payload);

    setCookie(c, "refreshToken", newRefreshToken, {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      maxAge: env.COOKIE_MAX_AGE,
      path: "/",
    });

    return c.json({ accessToken }, HttpStatusCodes.OK);
  } catch (error) {
    console.error("刷新令牌验证失败:", error);
    deleteCookie(c, "refreshToken", {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      path: "/",
    });

    return c.json({ message: "刷新令牌无效" }, HttpStatusCodes.UNAUTHORIZED);
  }
};

export const logout: AppRouteHandler<LogoutRoute> = async (c) => {
  const refreshToken = getCookie(c, "refreshToken");
  if (refreshToken) {
    await revokeRefreshToken(refreshToken);
    deleteCookie(c, "refreshToken", {
      httpOnly: true,
      secure: env.COOKIE_SECURE,
      sameSite: env.COOKIE_SAME_SITE,
      path: "/",
    });
  }
  return c.json({ message: "已成功登出" }, HttpStatusCodes.OK);
};
