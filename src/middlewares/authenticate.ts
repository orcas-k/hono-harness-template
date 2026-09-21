import { createMiddleware } from "hono/factory";
import * as HttpStatusCodes from "@/lib/http-status-codes";
import * as HttpStatusPhrases from "@/lib/http-status-phrases";
import type { JwtPayload } from "@/lib/jwt-utils";
import { checkPermission } from "@/lib/permission-utils";

const authenticate = (resource: string, permission: string) => {
  return createMiddleware<{ Variables: { authUser: JwtPayload } }>(async (c, next) => {
    const authUser = c.get("authUser") as JwtPayload;
    console.log("authUser:", authUser, resource, permission);

    if (!authUser) {
      return c.json({ message: HttpStatusPhrases.UNAUTHORIZED }, HttpStatusCodes.UNAUTHORIZED);
    }

    const hasPermission = await checkPermission(authUser.sub, resource, permission);

    if (!hasPermission) {
      return c.json({ message: HttpStatusPhrases.FORBIDDEN }, HttpStatusCodes.FORBIDDEN);
    }

    await next();
  });
};

export default authenticate;
