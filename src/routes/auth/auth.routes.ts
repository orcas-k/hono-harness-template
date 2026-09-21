import { createRoute, z } from "@hono/zod-openapi";
import * as HttpStatusCodes from "@/lib/http-status-codes";
import * as HttpStatusPhrases from "@/lib/http-status-phrases";
import { jsonContent, jsonContentRequired } from "@/lib/open-api/helpers";
import createMessageObjectSchema from "@/lib/open-api/schema/create-message-object";

const tags = ["auth"];

export const login = createRoute({
  path: "/auth/login",
  method: "post",
  tags: tags,
  request: {
    body: jsonContentRequired(
      z.object({
        username: z.string().min(1),
        password: z.string().min(1),
      }),
      "The login credentials",
    ),
  },
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        accessToken: z.string().min(1),
      }),
      "Successful login",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.UNAUTHORIZED),
      "Invalid credentials",
    ),
    [HttpStatusCodes.FORBIDDEN]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.FORBIDDEN),
      "Account not active",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: { description: "Validation error(s)" },
  },
});

export const refresh = createRoute({
  path: "/auth/refresh",
  method: "post",
  tags: tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(
      z.object({
        accessToken: z.string().min(1),
      }),
      "Successful login",
    ),
    [HttpStatusCodes.UNAUTHORIZED]: jsonContent(
      createMessageObjectSchema(HttpStatusPhrases.UNAUTHORIZED),
      "Invalid refresh token",
    ),
    [HttpStatusCodes.UNPROCESSABLE_ENTITY]: { description: "Validation error(s)" },
  },
});

export const logout = createRoute({
  path: "/auth/logout",
  method: "post",
  tags: tags,
  responses: {
    [HttpStatusCodes.OK]: jsonContent(createMessageObjectSchema("已成功登出"), "Successful logout"),
  },
});

export type LoginRoute = typeof login;
export type RefreshRoute = typeof refresh;
export type LogoutRoute = typeof logout;
