import { createMiddleware } from "hono/factory";
import { errors } from "jose";
import * as HttpStatusCodes from "@/lib/http-status-codes";
import * as HttpStatusPhrases from "@/lib/http-status-phrases";
import type { JwtPayload } from "@/lib/jwt-utils";
import { verifyAccessToken } from "@/lib/jwt-utils";

const authorize = createMiddleware<{ Variables: { authUser: JwtPayload } }>(async (c, next) => {
  const authHeader = c.req.header("Authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED);
  }
  const token = authHeader.split(" ")[1];

  console.log("token:", token);

  try {
    const payload = await verifyAccessToken(token);
    c.set("authUser", payload);
    await next();
  } catch (error) {
    console.error("Authorization error:", error);
    if (error instanceof errors.JWTExpired) {
      return c.json({ message: "访问令牌已过期" }, HttpStatusCodes.UNAUTHORIZED);
    }
    return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED);
  }
});

export default authorize;
